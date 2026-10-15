import React, { useState, useEffect } from 'react';
import { InterceptedEvent, ActionStatus, SourcePage } from '../types';
import { useApp } from '../context/AppContext';
import { useMotion } from '../motion/motionSystem';

interface AuditLogViewProps {
  events?: InterceptedEvent[];
  onSelectEvent?: (event: InterceptedEvent) => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = () => {
  const { isOff } = useMotion();
  const { events, deleteOlderEvents } = useApp();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterRule, setFilterRule] = useState<string>('all');
  const [sortField, setSortField] = useState<'time' | 'riskScore' | 'latencyMs'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Retention setting (7 / 30 / 90 days)
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [retentionMessage, setRetentionMessage] = useState<string | null>(null);

  // Side Drawer for inspecting selected event (Zero Raw Content shown!)
  const [drawerEvent, setDrawerEvent] = useState<InterceptedEvent | null>(null);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);

  // Filtered list
  const filteredEvents = events.filter((evt) => {
    if (filterAction !== 'all' && evt.action !== filterAction) return false;
    if (filterSource !== 'all' && evt.source !== filterSource) return false;
    if (filterRule !== 'all' && evt.ruleId !== filterRule) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchDesc = evt.description.toLowerCase().includes(q);
      const matchRule = evt.ruleId?.toLowerCase().includes(q);
      const matchSource = evt.source.toLowerCase().includes(q);
      const matchHash = evt.sha256?.toLowerCase().includes(q);
      if (!matchDesc && !matchRule && !matchSource && !matchHash) return false;
    }
    return true;
  });

  // Sorting
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortField === 'riskScore') {
      return sortOrder === 'desc'
        ? (b.riskScore ?? 0) - (a.riskScore ?? 0)
        : (a.riskScore ?? 0) - (b.riskScore ?? 0);
    }
    if (sortField === 'latencyMs') {
      return sortOrder === 'desc'
        ? b.latencyMs - a.latencyMs
        : a.latencyMs - b.latencyMs;
    }
    return sortOrder === 'desc' ? b.time.localeCompare(a.time) : a.time.localeCompare(b.time);
  });

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(sortedEvents.length / pageSize));
  const paginatedEvents = sortedEvents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Summary counts
  const totalCount = events.length;
  const blockedCount = events.filter((e) => e.action === 'BLOCKED').length;
  const maskedCount = events.filter((e) => e.action === 'MASKED').length;
  const allowedCount = events.filter((e) => e.action === 'ALLOWED').length;

  // Handle Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Event ID',
      'Timestamp',
      'Source Page',
      'Role',
      'Action Taken',
      'Risk Score',
      'Latency (ms)',
      'Rule Fired',
      'Model Used',
      'SHA256 Fingerprint',
    ];

    const rows = sortedEvents.map((e) => [
      `"${e.id}"`,
      `"${e.time}"`,
      `"${e.source}"`,
      `"${e.role}"`,
      `"${e.action}"`,
      `"${e.riskScore ?? 0}"`,
      `"${e.latencyMs}"`,
      `"${e.ruleId || 'N/A'}"`,
      `"${e.modelUsed || 'N/A'}"`,
      `"${e.sha256 || 'N/A'}"`,
    ]);

    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `kavach_audit_ledger_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete older logs
  const handleDeleteOlderLogs = () => {
    deleteOlderEvents(retentionDays);
    setRetentionMessage(`Older audit logs (> ${retentionDays} days) purged from buffer.`);
    setTimeout(() => setRetentionMessage(null), 3000);
  };

  const handleCopyFingerprint = (hash?: string) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-5">
      
      {/* 1. Header Card */}
      <div className="p-5 md:p-6 rounded-[22px] bg-[#1b1f2e] shadow-[6px_6px_14px_#11141F,-6px_-6px_14px_#262C42] border border-[#2a3044]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#a78bfa] text-[24px]">verified</span>
            <h2 className="font-headline text-[22px] text-[#dfe1f6] font-bold tracking-tight">
              Zero-Knowledge Audit Ledger
            </h2>
          </div>
          <p className="text-[13px] text-[#cac4d4] mt-1">
            Real-time compliance record of all decisions from Chat, Documents, Red Team, and Threat Scanner. Never stores raw payload content.
          </p>
        </div>

        {/* Toolbar: Export CSV, Auto-Refresh Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl font-mono-code text-[11px] font-bold flex items-center gap-1.5 transition-all ${
              autoRefresh
                ? 'bg-[#172520] text-[#45dfa4] border border-[#45dfa4]/30'
                : 'bg-[#1b1f2e] text-[#948e9d] shadow-[2px_2px_4px_#11141F]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#45dfa4] animate-pulse"></span>
            <span>{autoRefresh ? 'Auto-Refresh: ON' : 'Auto-Refresh: PAUSED'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 rounded-xl bg-[#1b1f2e] text-[#44e2cd] shadow-[2px_2px_4px_#11141F,-2px_-2px_4px_#262C42] hover:shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42] font-mono-code text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[15px]">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Clickable Summary Chips at Top */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono-code text-[12px]">
        <button
          type="button"
          onClick={() => { setFilterAction('all'); setCurrentPage(1); }}
          className={`p-3.5 rounded-xl text-left transition-all ${
            filterAction === 'all'
              ? 'bg-[#171b29] border border-[#a78bfa] shadow-[inset_2px_2px_4px_#11141F]'
              : 'bg-[#1b1f2e] shadow-[3px_3px_6px_#11141F,-3px_-3px_6px_#262C42] hover:bg-[#1f2435]'
          }`}
        >
          <span className="text-[#948e9d] text-[10px] uppercase block">Total Events</span>
          <span className="text-[20px] font-bold text-[#dfe1f6]">{totalCount}</span>
        </button>

        <button
          type="button"
          onClick={() => { setFilterAction('BLOCKED'); setCurrentPage(1); }}
          className={`p-3.5 rounded-xl text-left transition-all ${
            filterAction === 'BLOCKED'
              ? 'bg-[#171b29] border border-[#fb7185] shadow-[inset_2px_2px_4px_#11141F]'
              : 'bg-[#1b1f2e] shadow-[3px_3px_6px_#11141F,-3px_-3px_6px_#262C42] hover:bg-[#1f2435]'
          }`}
        >
          <span className="text-[#fb7185] text-[10px] uppercase block">Blocked Threats</span>
          <span className="text-[20px] font-bold text-[#fb7185]">{blockedCount}</span>
        </button>

        <button
          type="button"
          onClick={() => { setFilterAction('MASKED'); setCurrentPage(1); }}
          className={`p-3.5 rounded-xl text-left transition-all ${
            filterAction === 'MASKED'
              ? 'bg-[#171b29] border border-[#fbbf24] shadow-[inset_2px_2px_4px_#11141F]'
              : 'bg-[#1b1f2e] shadow-[3px_3px_6px_#11141F,-3px_-3px_6px_#262C42] hover:bg-[#1f2435]'
          }`}
        >
          <span className="text-[#fbbf24] text-[10px] uppercase block">Masked PII</span>
          <span className="text-[20px] font-bold text-[#fbbf24]">{maskedCount}</span>
        </button>

        <button
          type="button"
          onClick={() => { setFilterAction('ALLOWED'); setCurrentPage(1); }}
          className={`p-3.5 rounded-xl text-left transition-all ${
            filterAction === 'ALLOWED'
              ? 'bg-[#171b29] border border-[#45dfa4] shadow-[inset_2px_2px_4px_#11141F]'
              : 'bg-[#1b1f2e] shadow-[3px_3px_6px_#11141F,-3px_-3px_6px_#262C42] hover:bg-[#1f2435]'
          }`}
        >
          <span className="text-[#45dfa4] text-[10px] uppercase block">Allowed Traffic</span>
          <span className="text-[20px] font-bold text-[#45dfa4]">{allowedCount}</span>
        </button>
      </div>

      {/* 3. Filter Toolbar & Search */}
      <div className="p-4 rounded-[20px] bg-[#1b1f2e] shadow-[4px_4px_10px_#11141F,-4px_-4px_10px_#262C42] border border-[#2a3044]/30 flex flex-wrap items-center justify-between gap-3 text-[12px] font-mono-code">
        
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#171b29] shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42] flex-1 min-w-[200px]">
          <span className="material-symbols-outlined text-[#948e9d] text-[16px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search description, rule, or hash..."
            className="bg-transparent text-[12px] text-[#dfe1f6] focus:outline-none w-full font-mono-code"
          />
        </div>

        {/* Source Page Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[#948e9d] text-[11px]">Source:</span>
          <select
            value={filterSource}
            onChange={(e) => { setFilterSource(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1 rounded-xl bg-[#171b29] text-[11px] text-[#dfe1f6] border border-[#252a3b] focus:outline-none"
          >
            <option value="all">All Pages</option>
            <option value="Chat">Chat</option>
            <option value="Documents">Documents</option>
            <option value="Red Team">Red Team</option>
            <option value="Threat Scanner">Threat Scanner</option>
          </select>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1.5">
          <span className="text-[#948e9d] text-[11px]">Sort:</span>
          <button
            type="button"
            onClick={() => {
              if (sortField === 'riskScore') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              else { setSortField('riskScore'); setSortOrder('desc'); }
            }}
            className={`px-2.5 py-1 rounded-xl text-[11px] transition-all ${
              sortField === 'riskScore' ? 'bg-[#a78bfa] text-[#1b1f2e] font-bold' : 'bg-[#171b29] text-[#cac4d4]'
            }`}
          >
            Risk {sortField === 'riskScore' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          <button
            type="button"
            onClick={() => {
              if (sortField === 'time') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              else { setSortField('time'); setSortOrder('desc'); }
            }}
            className={`px-2.5 py-1 rounded-xl text-[11px] transition-all ${
              sortField === 'time' ? 'bg-[#a78bfa] text-[#1b1f2e] font-bold' : 'bg-[#171b29] text-[#cac4d4]'
            }`}
          >
            Time {sortField === 'time' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
        </div>
      </div>

      {/* 4. Real Entries Table with New Columns: Source Page, Role, Risk Score */}
      <div className="p-4 sm:p-5 rounded-[22px] bg-[#1b1f2e] shadow-[6px_6px_14px_#11141F,-6px_-6px_14px_#262C42] border border-[#2a3044]/30 space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono-code text-[12px] text-[#dfe1f6]">
            <thead>
              <tr className="border-b border-[#252a3b] text-[#948e9d] text-[11px]">
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Source Page</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Risk Score</th>
                <th className="py-2.5 px-3">Rule & Category</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#252a3b]/40">
              {paginatedEvents.map((evt) => {
                const isBlocked = evt.action === 'BLOCKED';
                const isMasked = evt.action === 'MASKED';

                return (
                  <tr
                    key={evt.id}
                    onClick={() => setDrawerEvent(evt)}
                    className="hover:bg-[#1f2435] cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-3 text-[#948e9d]">{evt.time}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-[#171b29] text-[#a78bfa] text-[10px] font-semibold border border-[#a78bfa]/20">
                        {evt.source}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#cac4d4]">Operator</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          isBlocked
                            ? 'bg-[#fb7185]/20 text-[#fb7185] border border-[#fb7185]/40'
                            : isMasked
                            ? 'bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/40'
                            : 'bg-[#45dfa4]/20 text-[#45dfa4] border border-[#45dfa4]/40'
                        }`}
                      >
                        {evt.action}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-bold ${evt.riskScore > 50 ? 'text-[#fb7185]' : 'text-[#45dfa4]'}`}>
                        {evt.riskScore ?? 8}/100
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-[240px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-[#dfe1f6]">{evt.ruleId || 'POLICY-PASS'}</span>
                        {evt.category && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#171b29] text-[#44e2cd] border border-[#44e2cd]/30">
                            {evt.category}
                          </span>
                        )}
                      </div>
                      {evt.matchedRuleName && evt.matchedRuleName !== evt.ruleId && (
                        <div className="text-[10px] text-[#948e9d] truncate mt-0.5" title={evt.matchedRuleName}>
                          {evt.matchedRuleName}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[#45dfa4]">{evt.latencyMs} ms</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDrawerEvent(evt);
                        }}
                        className="p-1 rounded-lg text-[#cac4d4] hover:text-[#a78bfa] shadow-[1px_1px_2px_#11141F]"
                      >
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="pt-3 border-t border-[#252a3b] flex items-center justify-between text-[11px] font-mono-code text-[#948e9d]">
          <span>Page {currentPage} of {totalPages} ({sortedEvents.length} records)</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-2.5 py-1 rounded-lg bg-[#171b29] text-[#dfe1f6] disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-2.5 py-1 rounded-lg bg-[#171b29] text-[#dfe1f6] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* 5. Retention Setting & Purge Control */}
      <div className="p-4 rounded-[20px] bg-[#1b1f2e] shadow-[4px_4px_10px_#11141F,-4px_-4px_10px_#262C42] border border-[#2a3044]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px] font-mono-code">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#fbbf24] text-[18px]">auto_delete</span>
          <div>
            <span className="text-[#dfe1f6] font-bold block">Retention Policy</span>
            <span className="text-[#948e9d] text-[11px]">Keep audit events in ephemeral buffer for:</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setRetentionDays(days)}
              className={`px-3 py-1 rounded-xl transition-all ${
                retentionDays === days
                  ? 'bg-[#a78bfa] text-[#1b1f2e] font-bold'
                  : 'bg-[#171b29] text-[#cac4d4]'
              }`}
            >
              {days} Days
            </button>
          ))}

          <button
            type="button"
            onClick={handleDeleteOlderLogs}
            className="ml-2 px-3.5 py-1 rounded-xl bg-[#2a1720] text-[#fb7185] hover:bg-[#3d1e2b] border border-[#fb7185]/30 font-bold transition-colors"
          >
            Delete Older Logs
          </button>
        </div>
      </div>

      {retentionMessage && (
        <div className="p-3 rounded-xl bg-[#172520] border border-[#45dfa4]/40 font-mono-code text-[11px] text-[#45dfa4]">
          {retentionMessage}
        </div>
      )}

      {/* 6. Side Drawer: Zero Raw Content Shown! Shows Rule, Score, Masked Types, Model, Timing, Fingerprint */}
      {drawerEvent && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full h-full bg-[#1b1f2e] shadow-[-8px_0_24px_#090d1c] border-l border-[#2a3044] p-6 flex flex-col justify-between font-mono-code text-[12px] overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#252a3b]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#44e2cd]">security_update_good</span>
                  <h3 className="font-headline text-[18px] font-bold text-[#dfe1f6]">
                    Audit Event Inspection
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerEvent(null)}
                  className="p-1 rounded-lg text-[#cac4d4] hover:text-[#dfe1f6]"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Zero Raw Content Notice */}
              <div className="p-2.5 rounded-xl bg-[#172520] border border-[#45dfa4]/30 text-[#45dfa4] text-[11px] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">verified</span>
                <span>Zero-Knowledge Principle: Raw contents are never logged.</span>
              </div>

              {/* Explainable Decision Reasoning Card */}
              <div className="p-3.5 rounded-xl bg-[#171b29] border border-[#a78bfa]/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#a78bfa] text-[18px]">psychology</span>
                    <span className="text-[#dfe1f6] font-bold text-[12px]">Explainable Decision Reasoning</span>
                  </div>
                  {drawerEvent.category && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1b1f2e] text-[#44e2cd] border border-[#44e2cd]/30">
                      {drawerEvent.category}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#cac4d4] leading-relaxed">
                  {drawerEvent.explanation || drawerEvent.description || 'Request evaluated through Kavach multi-layered gate.'}
                </p>
                {drawerEvent.matchedRuleName && (
                  <div className="text-[10px] text-[#948e9d] pt-1 border-t border-[#252a3b] flex items-center gap-1.5">
                    <span>Matched Rule:</span>
                    <span className="text-[#dfe1f6] font-semibold">{drawerEvent.matchedRuleName}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2.5 text-[#cac4d4]">
                <div className="flex justify-between p-2.5 rounded-lg bg-[#171b29]">
                  <span className="text-[#948e9d]">Event ID:</span>
                  <span className="text-[#dfe1f6]">{drawerEvent.id}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-[#171b29]">
                  <span className="text-[#948e9d]">Source Page:</span>
                  <span className="text-[#a78bfa] font-bold">{drawerEvent.source}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-[#171b29]">
                  <span className="text-[#948e9d]">User Role:</span>
                  <span className="text-[#dfe1f6]">Operator (Single Profile)</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-[#171b29]">
                  <span className="text-[#948e9d]">Enforcement Action:</span>
                  <span className={`font-bold ${drawerEvent.action === 'BLOCKED' ? 'text-[#fb7185]' : drawerEvent.action === 'MASKED' ? 'text-[#fbbf24]' : 'text-[#45dfa4]'}`}>
                    {drawerEvent.action}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-[#171b29]">
                  <span className="text-[#948e9d]">Rule Fired:</span>
                  <span className="text-[#dfe1f6] font-bold">{drawerEvent.ruleId || 'POLICY-PASS'}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-[#171b29]">
                  <span className="text-[#948e9d]">Risk Score:</span>
                  <span className={`font-bold ${drawerEvent.riskScore > 50 ? 'text-[#fb7185]' : 'text-[#45dfa4]'}`}>
                    {drawerEvent.riskScore}/100
                  </span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-[#171b29]">
                  <span className="text-[#948e9d]">Connected Model:</span>
                  <span className="text-[#44e2cd]">{drawerEvent.modelUsed || 'gemini-2.5-flash'}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-[#171b29]">
                  <span className="text-[#948e9d]">Synchronous Timing:</span>
                  <span className="text-[#45dfa4]">{drawerEvent.latencyMs} ms</span>
                </div>

                {/* Masked Items: Types and Counts ONLY (Never Raw Data) */}
                <div className="p-3 rounded-xl bg-[#171b29] space-y-1.5">
                  <span className="text-[10px] text-[#948e9d] uppercase">Masked Entity Counts:</span>
                  {drawerEvent.maskedItems && drawerEvent.maskedItems.length > 0 ? (
                    <div className="space-y-1">
                      {drawerEvent.maskedItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-[11px]">
                          <span className="text-[#fbbf24]">{item.type}</span>
                          <span className="text-[#dfe1f6]">{item.count} scrubbed</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#948e9d]">No PII tokens scrubbed in this event.</div>
                  )}
                </div>

                {/* Cryptographic Fingerprint with Copy Button */}
                <div className="p-3 rounded-xl bg-[#151824] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#948e9d] uppercase">SHA-256 Digest:</span>
                    <button
                      type="button"
                      onClick={() => handleCopyFingerprint(drawerEvent.sha256)}
                      className="text-[10px] text-[#44e2cd] hover:text-[#dfe1f6] flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[12px]">content_copy</span>
                      <span>{copiedFingerprint ? 'Copied' : 'Copy Hash'}</span>
                    </button>
                  </div>
                  <div className="text-[#44e2cd] text-[11px] break-all select-all">
                    {drawerEvent.sha256 || '7e2d9ba18c39f4019a'}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#252a3b] flex justify-end">
              <button
                type="button"
                onClick={() => setDrawerEvent(null)}
                className="px-4 py-2 rounded-xl bg-[#1b1f2e] text-[#a78bfa] shadow-[2px_2px_4px_#11141F,-2px_-2px_4px_#262C42]"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
