import React, { useState } from 'react';
import { useApp, SYSTEM_DEMO_USERS } from '../context/AppContext';
import {
  UserRole,
  PermissionType,
  DocumentClassification,
  RoleDefinition,
  AuthUser,
} from '../types';

export const AccessControlView: React.FC = () => {
  const {
    currentUser,
    allUsers,
    roles,
    documents,
    accessMatrix,
    accessRequests,
    permissionAudits,
    updateAccessMatrixEntry,
    createCustomRole,
    updateUserRoleOrStatus,
    revokeUserSessions,
    decideAccessRequest,
    submitAccessRequest,
    switchUserPersona,
  } = useApp();

  const isOwner = currentUser?.role === 'owner';

  // Sub-tabs in Access Control
  const [activeSubTab, setActiveSubTab] = useState<
    'matrix' | 'users' | 'requests' | 'user-centric' | 'roles' | 'audit'
  >('matrix');

  // Matrix Filter
  const [selectedClassification, setSelectedClassification] = useState<string>('ALL');
  const [selectedResourceSearch, setSelectedResourceSearch] = useState('');

  // Selected User for User-Centric View
  const [selectedUserCentricId, setSelectedUserCentricId] = useState<string>(
    currentUser?.id || allUsers[0]?.id || 'user-owner'
  );

  // Dangerous Change Modal State
  const [dangerousModalState, setDangerousModalState] = useState<{
    open: boolean;
    resourceId: string;
    resourceName: string;
    roleId: string;
    permissions: PermissionType[];
    classification: DocumentClassification;
  } | null>(null);

  // New Custom Role Modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleId, setNewRoleId] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleDept, setNewRoleDept] = useState('');
  const [newRolePerms, setNewRolePerms] = useState<PermissionType[]>(['view']);

  // Temporary Request Modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestDocId, setRequestDocId] = useState(documents[0]?.id || '');
  const [requestPerm, setRequestPerm] = useState<PermissionType>('view');
  const [requestJustification, setRequestJustification] = useState('');
  const [requestHours, setRequestHours] = useState(24);

  const permissionsList: PermissionType[] = [
    'view',
    'edit',
    'upload',
    'download',
    'delete',
    'share',
    'administer',
  ];

  // Handle toggling permission in matrix
  const handleTogglePermission = async (
    resourceId: string,
    roleId: string,
    permission: PermissionType
  ) => {
    if (!isOwner) return;

    const entry = accessMatrix.find((m) => m.resourceId === resourceId);
    if (!entry) return;

    const currentPerms = entry.rolePermissions[roleId] || [];
    let updatedPerms: PermissionType[];

    if (currentPerms.includes(permission)) {
      updatedPerms = currentPerms.filter((p) => p !== permission);
    } else {
      updatedPerms = [...currentPerms, permission];
    }

    // Check if dangerous change
    const isDangerous =
      (entry.classification === 'Highly Restricted' || entry.classification === 'Confidential') &&
      (roleId === 'intern' || permission === 'administer' || permission === 'delete');

    if (isDangerous && !currentPerms.includes(permission)) {
      // Trigger confirmation modal
      setDangerousModalState({
        open: true,
        resourceId,
        resourceName: entry.resourceName,
        roleId,
        permissions: updatedPerms,
        classification: entry.classification,
      });
      return;
    }

    await updateAccessMatrixEntry(resourceId, roleId, updatedPerms, false);
  };

  const confirmDangerousChangeAction = async () => {
    if (!dangerousModalState) return;
    await updateAccessMatrixEntry(
      dangerousModalState.resourceId,
      dangerousModalState.roleId,
      dangerousModalState.permissions,
      true
    );
    setDangerousModalState(null);
  };

  const handleCreateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim() || !newRoleId.trim()) return;
    await createCustomRole({
      id: newRoleId.trim().toLowerCase(),
      name: newRoleName.trim(),
      description: newRoleDesc.trim(),
      department: newRoleDept.trim() || 'General',
      defaultPermissions: newRolePerms,
      color: '#a78bfa',
      isSystem: false,
    });
    setIsRoleModalOpen(false);
    setNewRoleName('');
    setNewRoleId('');
    setNewRoleDesc('');
    setNewRoleDept('');
  };

  const handleSubmitRequestAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestDocId || !requestJustification.trim()) return;
    await submitAccessRequest(requestDocId, requestPerm, requestJustification, requestHours);
    setIsRequestModalOpen(false);
    setRequestJustification('');
  };

  const selectedCentricUser = allUsers.find((u) => u.id === selectedUserCentricId) || allUsers[0];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pb-20 space-y-6">
      {/* Top Banner & Quick Persona Switcher */}
      <div className="p-6 rounded-[24px] bg-[#171b29] border border-[#2a3044] shadow-[8px_8px_20px_#11141F,-8px_-8px_20px_#262C42] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[28px] text-[#00E5FF]">
              shield_person
            </span>
            <h1 className="font-headline text-[22px] sm:text-[26px] font-bold text-[#dfe1f6]">
              Owner-Controlled Access Control & RBAC Matrix
            </h1>
          </div>
          <p className="text-[13px] text-[#948e9d] font-mono-code max-w-3xl">
            Fine-grained resource-level permission matrix with deny-by-default enforcement,
            dynamic roles, temporary access workflows, and real-time session invalidation.
          </p>
        </div>

        {/* Live Persona Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 p-3 rounded-2xl bg-[#1b1f2e] border border-[#2a3044] shadow-inner">
          <div className="text-left">
            <div className="text-[10px] font-mono-code uppercase tracking-wider text-[#948e9d]">
              Active Persona
            </div>
            <div className="text-[13px] font-bold text-[#a78bfa] flex items-center gap-1.5">
              <span>{currentUser?.name || 'Guest'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#a78bfa]/20 text-[#a78bfa] uppercase font-mono-code">
                {currentUser?.role || 'intern'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {SYSTEM_DEMO_USERS.map((u) => (
              <button
                key={u.id}
                onClick={() => switchUserPersona(u)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono-code transition-all ${
                  currentUser?.id === u.id
                    ? 'bg-[#00E5FF] text-[#11141F] font-bold shadow-md'
                    : 'bg-[#171b29] text-[#cac4d4] hover:text-[#dfe1f6] border border-[#2a3044]'
                }`}
                title={`Switch to ${u.name} (${u.role})`}
              >
                {u.initials}: {u.role.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Role Notice if not owner */}
      {!isOwner && (
        <div className="p-4 rounded-2xl bg-[#fbbf24]/10 border border-[#fbbf24]/30 text-[#fbbf24] flex items-center justify-between gap-3 text-[12px] font-mono-code">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[20px]">policy</span>
            <span>
              You are currently viewing as <strong>{currentUser?.role.toUpperCase()}</strong>. Matrix
              editing is restricted to <strong>OWNER</strong>. You can inspect your accessible
              resources and submit access requests.
            </span>
          </div>
          <button
            onClick={() => {
              const ownerUser = SYSTEM_DEMO_USERS.find((u) => u.role === 'owner');
              if (ownerUser) switchUserPersona(ownerUser);
            }}
            className="px-3 py-1.5 rounded-xl bg-[#fbbf24] text-[#11141F] font-bold hover:opacity-90 shrink-0"
          >
            Switch to Owner
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2a3044] pb-3 overflow-x-auto">
        {[
          { id: 'matrix', label: 'Access Matrix', icon: 'grid_view' },
          { id: 'users', label: 'User Directory', icon: 'group' },
          { id: 'user-centric', label: 'User-Centric Inspector', icon: 'person_search' },
          { id: 'requests', label: 'Access Requests', icon: 'pending_actions', badge: accessRequests.filter((r) => r.status === 'PENDING').length },
          { id: 'roles', label: 'Role Definitions', icon: 'manage_accounts' },
          { id: 'audit', label: 'Permission Audit Ledger', icon: 'history' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all shrink-0 ${
              activeSubTab === tab.id
                ? 'bg-[#a78bfa] text-[#11141F] font-bold shadow-[2px_2px_8px_rgba(167,139,250,0.3)]'
                : 'bg-[#171b29] text-[#cac4d4] hover:text-[#dfe1f6] border border-[#2a3044]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.badge && tab.badge > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full bg-[#fb7185] text-white text-[10px] font-mono-code font-bold">
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {isOwner && (
            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/40 text-[12px] font-mono-code hover:bg-[#00E5FF]/20 transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">add_moderator</span>
              <span>Create Role</span>
            </button>
          )}

          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b1f2e] text-[#45dfa4] border border-[#45dfa4]/40 text-[12px] font-mono-code hover:bg-[#45dfa4]/10 transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">key</span>
            <span>Request Temporary Access</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: ACCESS MATRIX */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-4 animate-fade-in">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#171b29] border border-[#2a3044]">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono-code text-[#948e9d] uppercase">
                Filter Classification:
              </span>
              {['ALL', 'Public', 'Internal', 'Confidential', 'Highly Restricted'].map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedClassification(c)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-mono-code transition-all ${
                    selectedClassification === c
                      ? 'bg-[#a78bfa] text-[#11141F] font-bold'
                      : 'bg-[#1b1f2e] text-[#cac4d4] hover:text-[#dfe1f6] border border-[#2a3044]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search resources..."
                value={selectedResourceSearch}
                onChange={(e) => setSelectedResourceSearch(e.target.value)}
                className="w-full sm:w-64 px-3.5 py-1.5 rounded-xl bg-[#1b1f2e] border border-[#2a3044] text-[12px] font-mono-code text-[#dfe1f6] placeholder-[#948e9d]/60 focus:outline-none focus:border-[#a78bfa]"
              />
            </div>
          </div>

          {/* Interactive Matrix Table */}
          <div className="overflow-x-auto rounded-[20px] bg-[#171b29] border border-[#2a3044] shadow-[8px_8px_16px_#11141F]">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-[#2a3044] bg-[#1b1f2e]/80">
                  <th className="p-4 font-headline text-[13px] text-[#dfe1f6] min-w-[240px]">
                    Resource / File Inventory
                  </th>
                  <th className="p-4 font-mono-code text-[11px] text-[#948e9d] min-w-[130px]">
                    Classification
                  </th>
                  <th className="p-4 font-mono-code text-[11px] text-[#948e9d] min-w-[110px]">
                    Department
                  </th>
                  {roles.map((r) => (
                    <th
                      key={r.id}
                      className="p-4 font-mono-code text-[11px] text-center min-w-[180px] border-l border-[#2a3044]/50"
                      style={{ color: r.color }}
                    >
                      <div className="font-bold">{r.name}</div>
                      <div className="text-[10px] text-[#948e9d] font-normal uppercase tracking-wider">
                        {r.id}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a3044]">
                {accessMatrix
                  .filter(
                    (entry) =>
                      selectedClassification === 'ALL' ||
                      entry.classification === selectedClassification
                  )
                  .filter(
                    (entry) =>
                      !selectedResourceSearch ||
                      entry.resourceName
                        .toLowerCase()
                        .includes(selectedResourceSearch.toLowerCase())
                  )
                  .map((entry) => (
                    <tr
                      key={entry.resourceId}
                      className="hover:bg-[#1b1f2e]/40 transition-colors"
                    >
                      <td className="p-4 font-mono-code text-[#dfe1f6] font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-[#a78bfa]">
                            description
                          </span>
                          <div>
                            <div>{entry.resourceName}</div>
                            <div className="text-[10px] text-[#948e9d] font-normal">
                              ID: {entry.resourceId}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono-code">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            entry.classification === 'Highly Restricted'
                              ? 'bg-[#fb7185]/20 text-[#fb7185] border border-[#fb7185]/30'
                              : entry.classification === 'Confidential'
                              ? 'bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/30'
                              : entry.classification === 'Internal'
                              ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30'
                              : 'bg-[#45dfa4]/20 text-[#45dfa4] border border-[#45dfa4]/30'
                          }`}
                        >
                          {entry.classification}
                        </span>
                      </td>

                      <td className="p-4 font-mono-code text-[#cac4d4]">
                        {entry.department}
                      </td>

                      {/* Role Columns */}
                      {roles.map((r) => {
                        const currentPerms = entry.rolePermissions[r.id] || [];
                        const hasAny = currentPerms.length > 0;

                        return (
                          <td
                            key={r.id}
                            className="p-3 text-center border-l border-[#2a3044]/50"
                          >
                            <div className="flex flex-wrap items-center justify-center gap-1 max-w-[200px] mx-auto">
                              {permissionsList.map((perm) => {
                                const isGranted = currentPerms.includes(perm);

                                return (
                                  <button
                                    key={perm}
                                    type="button"
                                    disabled={!isOwner}
                                    onClick={() =>
                                      handleTogglePermission(entry.resourceId, r.id, perm)
                                    }
                                    title={`${
                                      isGranted ? 'Revoke' : 'Grant'
                                    } ${perm} on ${entry.resourceName} for ${r.name}`}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono-code transition-all ${
                                      isGranted
                                        ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 font-bold hover:bg-[#00E5FF]/30'
                                        : 'bg-[#1b1f2e] text-[#948e9d]/40 border border-[#2a3044]/40 hover:text-[#cac4d4]'
                                    } ${!isOwner ? 'cursor-not-allowed opacity-80' : 'cursor-pointer active:scale-95'}`}
                                  >
                                    {perm[0].toUpperCase()}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="text-[9px] font-mono-code text-[#948e9d] mt-1">
                              {hasAny ? currentPerms.join(', ') : 'DENY_ALL'}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="text-[11px] font-mono-code text-[#948e9d] flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px] text-[#00E5FF]">info</span>
            <span>
              Legend: <strong>V</strong>: View, <strong>E</strong>: Edit, <strong>U</strong>: Upload,{' '}
              <strong>D</strong>: Download, <strong>Del</strong>: Delete, <strong>S</strong>: Share,{' '}
              <strong>A</strong>: Administer. Deny-by-default is strictly enforced.
            </span>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: USER DIRECTORY */}
      {activeSubTab === 'users' && (
        <div className="rounded-[20px] bg-[#171b29] border border-[#2a3044] p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-[16px] font-bold text-[#dfe1f6]">
              Enterprise Identity & Access Directory
            </h2>
            <span className="text-[11px] font-mono-code text-[#45dfa4]">
              {allUsers.length} Enclave Accounts Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allUsers.map((user) => (
              <div
                key={user.id}
                className="p-4 rounded-xl bg-[#1b1f2e] border border-[#2a3044] space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#171b29] border border-[#a78bfa]/40 flex items-center justify-center font-bold font-headline text-[#a78bfa] text-[12px]">
                      {user.initials}
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-[#dfe1f6]">{user.name}</div>
                      <div className="text-[11px] text-[#948e9d] font-mono-code">{user.email}</div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold ${
                      user.status === 'ACTIVE'
                        ? 'bg-[#45dfa4]/20 text-[#45dfa4]'
                        : 'bg-[#fb7185]/20 text-[#fb7185]'
                    }`}
                  >
                    {user.status}
                  </span>
                </div>

                <div className="text-[11px] font-mono-code text-[#cac4d4] space-y-1 pt-2 border-t border-[#2a3044]">
                  <div>Title: {user.title}</div>
                  <div>Department: {user.department}</div>
                  <div>Last Seen: {user.lastLogin}</div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[#948e9d]">Role:</span>
                    <span className="px-2 py-0.5 rounded bg-[#a78bfa]/20 text-[#a78bfa] font-bold uppercase text-[10px]">
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* Owner Actions */}
                {isOwner && (
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#2a3044]/60">
                    <button
                      onClick={() =>
                        updateUserRoleOrStatus(user.id, {
                          status: user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
                        })
                      }
                      className="px-2 py-1 rounded bg-[#171b29] hover:bg-[#262c42] text-[10px] font-mono-code text-[#cac4d4]"
                    >
                      {user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>

                    <button
                      onClick={() => revokeUserSessions(user.id)}
                      className="px-2 py-1 rounded bg-[#fb7185]/10 hover:bg-[#fb7185]/20 text-[10px] font-mono-code text-[#fb7185] border border-[#fb7185]/30"
                    >
                      Revoke Sessions
                    </button>

                    <button
                      onClick={() => switchUserPersona(user)}
                      className="px-2 py-1 rounded bg-[#00E5FF]/10 text-[#00E5FF] hover:bg-[#00E5FF]/20 text-[10px] font-mono-code"
                    >
                      Impersonate
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: USER-CENTRIC INSPECTOR */}
      {activeSubTab === 'user-centric' && (
        <div className="rounded-[20px] bg-[#171b29] border border-[#2a3044] p-5 space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-headline text-[16px] font-bold text-[#dfe1f6]">
                User-Centric Effective Permission Auditor
              </h2>
              <p className="text-[11px] font-mono-code text-[#948e9d]">
                Inspect all effective permissions and accessible files for a specific individual.
              </p>
            </div>

            <select
              value={selectedUserCentricId}
              onChange={(e) => setSelectedUserCentricId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#1b1f2e] border border-[#2a3044] text-[12px] font-mono-code text-[#dfe1f6] focus:outline-none focus:border-[#a78bfa]"
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.toUpperCase()} - {u.department})
                </option>
              ))}
            </select>
          </div>

          {/* User Profile Card */}
          <div className="p-4 rounded-xl bg-[#1b1f2e] border border-[#2a3044] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#171b29] border border-[#00E5FF]/40 flex items-center justify-center font-bold font-headline text-[#00E5FF] text-[16px]">
                {selectedCentricUser.initials}
              </div>
              <div>
                <div className="text-[15px] font-bold text-[#dfe1f6]">
                  {selectedCentricUser.name}
                </div>
                <div className="text-[11px] font-mono-code text-[#948e9d]">
                  {selectedCentricUser.email} • {selectedCentricUser.title}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono-code text-[#948e9d]">Effective Role:</span>
              <span className="px-2.5 py-1 rounded-xl bg-[#a78bfa]/20 text-[#a78bfa] font-bold font-mono-code uppercase text-[11px]">
                {selectedCentricUser.role}
              </span>
            </div>
          </div>

          {/* Accessible Resources List */}
          <div className="space-y-3">
            <h3 className="font-headline text-[14px] font-bold text-[#dfe1f6]">
              Accessible Resources for {selectedCentricUser.name}
            </h3>

            <div className="space-y-2">
              {accessMatrix.map((item) => {
                const rolePerms = item.rolePermissions[selectedCentricUser.role] || [];
                const isExplicit = selectedCentricUser.assignedResources?.includes(item.resourceId);
                const isUniversalOwner = selectedCentricUser.role === 'owner';
                const hasAccess = isUniversalOwner || isExplicit || rolePerms.length > 0;

                return (
                  <div
                    key={item.resourceId}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                      hasAccess
                        ? 'bg-[#1b1f2e] border-[#2a3044]'
                        : 'bg-[#171b29]/40 border-[#2a3044]/40 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`material-symbols-outlined text-[20px] ${
                          hasAccess ? 'text-[#00E5FF]' : 'text-[#948e9d]'
                        }`}
                      >
                        {hasAccess ? 'lock_open' : 'lock'}
                      </span>
                      <div>
                        <div className="text-[13px] font-bold text-[#dfe1f6]">
                          {item.resourceName}
                        </div>
                        <div className="text-[10px] font-mono-code text-[#948e9d]">
                          Classification: {item.classification} • Department: {item.department}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasAccess ? (
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded bg-[#45dfa4]/20 text-[#45dfa4] text-[10px] font-mono-code font-bold">
                            {isUniversalOwner
                              ? 'FULL ADMIN'
                              : isExplicit
                              ? 'EXPLICIT GRANT'
                              : rolePerms.join(', ')}
                          </span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-[#fb7185]/20 text-[#fb7185] text-[10px] font-mono-code font-bold">
                          DENIED BY DEFAULT
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: ACCESS REQUESTS */}
      {activeSubTab === 'requests' && (
        <div className="rounded-[20px] bg-[#171b29] border border-[#2a3044] p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline text-[16px] font-bold text-[#dfe1f6]">
                Access Requests & Temporary Grant Approvals
              </h2>
              <p className="text-[11px] font-mono-code text-[#948e9d]">
                Zero-Trust temporary privilege elevation with defined expiration periods.
              </p>
            </div>

            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-[#00E5FF] text-[#11141F] font-bold text-[12px] font-mono-code hover:opacity-90 transition-all"
            >
              + Submit Request
            </button>
          </div>

          <div className="space-y-3">
            {accessRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl bg-[#1b1f2e] border border-[#2a3044] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[#dfe1f6]">{req.requesterName}</span>
                    <span className="px-2 py-0.5 rounded bg-[#a78bfa]/20 text-[#a78bfa] text-[10px] font-mono-code uppercase font-bold">
                      {req.requesterRole}
                    </span>
                    <span className="text-[11px] font-mono-code text-[#948e9d]">
                      requested <strong>{req.requestedPermission.toUpperCase()}</strong> on{' '}
                      <strong>{req.resourceName}</strong>
                    </span>
                  </div>
                  <div className="text-[11px] font-mono-code text-[#cac4d4]">
                    Justification: "{req.justification}"
                  </div>
                  <div className="text-[10px] font-mono-code text-[#948e9d]">
                    Submitted: {new Date(req.createdAt).toLocaleString()} • Duration:{' '}
                    {req.expiresInHours || 24} hours
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono-code font-bold ${
                      req.status === 'APPROVED'
                        ? 'bg-[#45dfa4]/20 text-[#45dfa4]'
                        : req.status === 'PENDING'
                        ? 'bg-[#fbbf24]/20 text-[#fbbf24]'
                        : 'bg-[#fb7185]/20 text-[#fb7185]'
                    }`}
                  >
                    {req.status}
                  </span>

                  {isOwner && req.status === 'PENDING' && (
                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        onClick={() => decideAccessRequest(req.id, 'APPROVED', 'Owner approved.')}
                        className="px-2.5 py-1 rounded-lg bg-[#45dfa4] text-[#11141F] font-bold text-[11px] font-mono-code hover:opacity-90"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => decideAccessRequest(req.id, 'REJECTED', 'Owner rejected.')}
                        className="px-2.5 py-1 rounded-lg bg-[#fb7185]/20 text-[#fb7185] border border-[#fb7185]/40 font-bold text-[11px] font-mono-code hover:bg-[#fb7185]/30"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {isOwner && req.status === 'APPROVED' && (
                    <button
                      onClick={() => decideAccessRequest(req.id, 'REVOKED', 'Revoked early.')}
                      className="px-2 py-1 rounded bg-[#fb7185]/10 text-[#fb7185] border border-[#fb7185]/30 text-[10px] font-mono-code"
                    >
                      Revoke Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: ROLE DEFINITIONS */}
      {activeSubTab === 'roles' && (
        <div className="rounded-[20px] bg-[#171b29] border border-[#2a3044] p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-[16px] font-bold text-[#dfe1f6]">
              Configured Role Definitions & Defaults
            </h2>
            {isOwner && (
              <button
                onClick={() => setIsRoleModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[#a78bfa] text-[#11141F] font-bold text-[12px] font-mono-code"
              >
                + Create Custom Role
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-xl bg-[#1b1f2e] border border-[#2a3044] space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }}></span>
                    <span className="font-headline text-[14px] font-bold text-[#dfe1f6]">
                      {r.name}
                    </span>
                    <span className="text-[10px] font-mono-code text-[#948e9d] uppercase">
                      [{r.id}]
                    </span>
                  </div>
                  <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-[#171b29] text-[#cac4d4]">
                    {r.isSystem ? 'System Template' : 'Custom Defined'}
                  </span>
                </div>

                <p className="text-[11px] text-[#cac4d4] font-mono-code">{r.description}</p>

                <div className="pt-2 border-t border-[#2a3044] flex items-center justify-between text-[10px] font-mono-code text-[#948e9d]">
                  <div>Department: {r.department}</div>
                  <div>Permissions: {r.defaultPermissions.join(', ')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 6: PERMISSION AUDIT LEDGER */}
      {activeSubTab === 'audit' && (
        <div className="rounded-[20px] bg-[#171b29] border border-[#2a3044] p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-[16px] font-bold text-[#dfe1f6]">
              Permission-Change Tamper-Evident History
            </h2>
            <span className="text-[11px] font-mono-code text-[#00E5FF]">
              ISO-27001 Access Audit Compliant
            </span>
          </div>

          <div className="space-y-2">
            {permissionAudits.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  item.isDangerousChange
                    ? 'bg-[#fb7185]/10 border-[#fb7185]/40'
                    : 'bg-[#1b1f2e] border-[#2a3044]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-[#dfe1f6]">{item.adminName}</span>
                    <span className="px-1.5 py-0.2 rounded bg-[#00E5FF]/20 text-[#00E5FF] text-[9px] font-mono-code font-bold">
                      {item.action}
                    </span>
                    <span className="text-[11px] font-mono-code text-[#cac4d4]">
                      Target: <strong>{item.targetName}</strong>
                    </span>
                  </div>
                  <div className="text-[11px] font-mono-code text-[#948e9d]">{item.details}</div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono-code text-[#948e9d]">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                  {item.isDangerousChange && (
                    <span className="text-[9px] font-mono-code text-[#fb7185] font-bold">
                      ELEVATED RISK FLAG
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: DANGEROUS PERMISSION CHANGE WARNING */}
      {dangerousModalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full p-6 rounded-[24px] bg-[#1b1f2e] border-2 border-[#fb7185] shadow-[0_0_30px_rgba(251,113,133,0.3)] space-y-4">
            <div className="flex items-center gap-3 text-[#fb7185]">
              <span className="material-symbols-outlined text-[32px]">warning</span>
              <div>
                <h3 className="font-headline text-[18px] font-bold text-[#dfe1f6]">
                  Elevated Security Risk Warning
                </h3>
                <p className="text-[11px] font-mono-code text-[#fb7185]">
                  Owner Confirmation Directive
                </p>
              </div>
            </div>

            <p className="text-[12px] font-mono-code text-[#cac4d4] leading-relaxed">
              You are about to grant access to a <strong>{dangerousModalState.classification}</strong>{' '}
              resource (<strong>{dangerousModalState.resourceName}</strong>) for role [
              <strong>{dangerousModalState.roleId.toUpperCase()}</strong>].
            </p>

            <div className="p-3 rounded-xl bg-[#fb7185]/10 border border-[#fb7185]/30 text-[11px] font-mono-code text-[#fb7185]">
              🚨 Corporate policy requires explicit confirmation before exposing confidential files
              to restricted roles to prevent accidental organizational data leakage.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDangerousModalState(null)}
                className="px-4 py-2 rounded-xl bg-[#171b29] text-[#cac4d4] hover:text-[#dfe1f6] text-[12px] font-mono-code"
              >
                Cancel
              </button>
              <button
                onClick={confirmDangerousChangeAction}
                className="px-4 py-2 rounded-xl bg-[#fb7185] text-[#11141F] font-bold text-[12px] font-mono-code hover:opacity-90"
              >
                Confirm & Apply Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE CUSTOM ROLE */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full p-6 rounded-[24px] bg-[#1b1f2e] border border-[#2a3044] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-[18px] font-bold text-[#dfe1f6]">
                Create Custom Enterprise Role
              </h3>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="text-[#948e9d] hover:text-white"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateRoleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono-code text-[#cac4d4] mb-1">
                  Role Name (e.g. Finance Auditor)
                </label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Cloud Security Analyst"
                  className="w-full px-3 py-2 rounded-xl bg-[#171b29] border border-[#2a3044] text-[12px] font-mono-code text-[#dfe1f6]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono-code text-[#cac4d4] mb-1">
                  Role Identifier (e.g. cloud_security)
                </label>
                <input
                  type="text"
                  required
                  value={newRoleId}
                  onChange={(e) => setNewRoleId(e.target.value)}
                  placeholder="e.g. cloud_security"
                  className="w-full px-3 py-2 rounded-xl bg-[#171b29] border border-[#2a3044] text-[12px] font-mono-code text-[#dfe1f6]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono-code text-[#cac4d4] mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={newRoleDept}
                  onChange={(e) => setNewRoleDept(e.target.value)}
                  placeholder="e.g. Infrastructure Security"
                  className="w-full px-3 py-2 rounded-xl bg-[#171b29] border border-[#2a3044] text-[12px] font-mono-code text-[#dfe1f6]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono-code text-[#cac4d4] mb-1">
                  Description
                </label>
                <textarea
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  rows={2}
                  placeholder="Describe scope and boundaries..."
                  className="w-full px-3 py-2 rounded-xl bg-[#171b29] border border-[#2a3044] text-[12px] font-mono-code text-[#dfe1f6]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-[#171b29] text-[#cac4d4] text-[12px] font-mono-code"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#a78bfa] text-[#11141F] font-bold text-[12px] font-mono-code hover:opacity-95"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT ACCESS REQUEST */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full p-6 rounded-[24px] bg-[#1b1f2e] border border-[#2a3044] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-[18px] font-bold text-[#dfe1f6]">
                Request Temporary Resource Access
              </h3>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="text-[#948e9d] hover:text-white"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitRequestAction} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono-code text-[#cac4d4] mb-1">
                  Select Document
                </label>
                <select
                  value={requestDocId}
                  onChange={(e) => setRequestDocId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#171b29] border border-[#2a3044] text-[12px] font-mono-code text-[#dfe1f6]"
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.classification})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono-code text-[#cac4d4] mb-1">
                    Requested Permission
                  </label>
                  <select
                    value={requestPerm}
                    onChange={(e) => setRequestPerm(e.target.value as PermissionType)}
                    className="w-full px-3 py-2 rounded-xl bg-[#171b29] border border-[#2a3044] text-[12px] font-mono-code text-[#dfe1f6]"
                  >
                    {permissionsList.map((p) => (
                      <option key={p} value={p}>
                        {p.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono-code text-[#cac4d4] mb-1">
                    Duration (Hours)
                  </label>
                  <select
                    value={requestHours}
                    onChange={(e) => setRequestHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#171b29] border border-[#2a3044] text-[12px] font-mono-code text-[#dfe1f6]"
                  >
                    <option value={8}>8 Hours</option>
                    <option value={24}>24 Hours</option>
                    <option value={48}>48 Hours</option>
                    <option value={72}>72 Hours</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono-code text-[#cac4d4] mb-1">
                  Business Justification (Required)
                </label>
                <textarea
                  required
                  rows={3}
                  value={requestJustification}
                  onChange={(e) => setRequestJustification(e.target.value)}
                  placeholder="Specify task requirement, ticket reference, or manager approval..."
                  className="w-full px-3 py-2 rounded-xl bg-[#171b29] border border-[#2a3044] text-[12px] font-mono-code text-[#dfe1f6]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-[#171b29] text-[#cac4d4] text-[12px] font-mono-code"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#00E5FF] text-[#11141F] font-bold text-[12px] font-mono-code hover:opacity-95"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
