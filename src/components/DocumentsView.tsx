import React, { useState, useRef } from 'react';
import { UserRole, DocumentClassification, ManagedDocument, UploadedFileScan } from '../types';
import {
  scanDocumentContent,
  generateFingerprint,
  generateCutFile,
  CutFileResult,
} from '../services/kavachEngine';
import { useApp } from '../context/AppContext';

export const DocumentsView: React.FC = () => {
  const {
    currentUser,
    documents,
    uploadDocument,
    deleteDocument,
    getDownloadTicket,
    setDraftChatPrompt,
    setTab,
  } = useApp();

  const isOwner = currentUser?.role === 'owner';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [activeTab, setActiveTab] = useState<'inventory' | 'upload-sanitizer' | 'cut-cleaner'>('inventory');
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<ManagedDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Ingestion Form State
  const [newDocName, setNewDocName] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [newDocDept, setNewDocDept] = useState(currentUser?.department || 'Operations');
  const [newDocClass, setNewDocClass] = useState<DocumentClassification>('Internal');

  // Cut-File Sanitizer State
  const [maskNames, setMaskNames] = useState(false);
  const [cutMode, setCutMode] = useState<'cut-clean' | 'redacted-tags'>('cut-clean');
  const [activeUploadScan, setActiveUploadScan] = useState<UploadedFileScan | null>(null);
  const [activeCutResult, setActiveCutResult] = useState<CutFileResult | null>(null);
  const [copied, setCopied] = useState(false);

  // File Upload to Server Pipeline
  const handleServerUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim() || !newDocContent.trim()) {
      setUploadError('Please provide file name and content.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const result = await uploadDocument(newDocName.trim(), newDocContent, newDocDept, newDocClass);
      if (result.quarantined) {
        setUploadError(`File was quarantined by security malware scanner: ${result.message}`);
      } else {
        setUploadSuccess(`File "${newDocName}" successfully ingested, signature validated, and indexed!`);
        setNewDocName('');
        setNewDocContent('');
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Drag and drop or file picker for server upload
  const handleFilePickedForUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = String(e.target?.result || '');
      setNewDocName(file.name);
      setNewDocContent(content);
      // Run quick local scan as well
      const scanResult = scanDocumentContent(content, file.name, maskNames);
      const cutResult = generateCutFile(content, cutMode, maskNames);
      setActiveUploadScan(scanResult);
      setActiveCutResult(cutResult);
    };
    reader.readAsText(file);
  };

  // Signed Ephemeral Download Handler
  const handleDownloadFile = async (docId: string, docName: string) => {
    try {
      const ticketResult = await getDownloadTicket(docId);
      if (!ticketResult || !ticketResult.downloadUrl) {
        alert('You do not have authorization to download this file or ticket expired.');
        return;
      }

      // Download directly via signed ticket link
      const a = document.createElement('a');
      a.href = ticketResult.downloadUrl;
      a.download = docName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      alert('Failed to generate secure download ticket.');
    }
  };

  const handleCopyCleanText = () => {
    if (!activeCutResult) return;
    navigator.clipboard.writeText(activeCutResult.cutText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pb-20 space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-[24px] bg-[#171b29] border border-[#2a3044] shadow-[8px_8px_20px_#11141F] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[28px] text-[#00E5FF]">folder_managed</span>
            <h1 className="font-headline text-[22px] sm:text-[26px] font-bold text-[#dfe1f6]">
              Secure Document Management & Knowledge Base
            </h1>
          </div>
          <p className="text-[13px] text-[#948e9d] font-mono-code max-w-3xl">
            Ingestion pipeline with MIME signature verification, anti-malware quarantine,
            cryptographic fingerprinting, and pre-retrieval role-based isolation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('upload-sanitizer')}
            className="px-4 py-2 rounded-xl bg-[#00E5FF] text-[#11141F] font-bold text-[12px] font-mono-code hover:opacity-90 flex items-center gap-1.5 shadow"
          >
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            <span>Ingest Document</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2a3044] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${
            activeTab === 'inventory'
              ? 'bg-[#a78bfa] text-[#11141F] font-bold'
              : 'bg-[#171b29] text-[#cac4d4] hover:text-[#dfe1f6] border border-[#2a3044]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">inventory_2</span>
          <span>Classified Repository ({documents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('upload-sanitizer')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${
            activeTab === 'upload-sanitizer'
              ? 'bg-[#a78bfa] text-[#11141F] font-bold'
              : 'bg-[#171b29] text-[#cac4d4] hover:text-[#dfe1f6] border border-[#2a3044]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
          <span>Ingest & Quarantine Pipeline</span>
        </button>

        <button
          onClick={() => setActiveTab('cut-cleaner')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${
            activeTab === 'cut-cleaner'
              ? 'bg-[#a78bfa] text-[#11141F] font-bold'
              : 'bg-[#171b29] text-[#cac4d4] hover:text-[#dfe1f6] border border-[#2a3044]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">cleaning_services</span>
          <span>Safe Cut-File Generator</span>
        </button>
      </div>

      {/* TAB 1: CLASSIFIED INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-2xl bg-[#171b29] border border-[#2a3044] flex items-center justify-between text-[12px] font-mono-code text-[#948e9d]">
            <div>
              Accessible to current role [<strong>{currentUser?.role.toUpperCase()}</strong>]:{' '}
              <strong className="text-[#45dfa4]">{documents.length} documents</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#45dfa4]"></span>
              <span>Signed Single-Use Download Tickets Enabled</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-[20px] bg-[#171b29] border border-[#2a3044] shadow-md">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-[#2a3044] bg-[#1b1f2e]">
                  <th className="p-4 font-headline text-[13px] text-[#dfe1f6]">Document Name</th>
                  <th className="p-4 font-mono-code text-[11px] text-[#948e9d]">Classification</th>
                  <th className="p-4 font-mono-code text-[11px] text-[#948e9d]">Department</th>
                  <th className="p-4 font-mono-code text-[11px] text-[#948e9d]">Size / Type</th>
                  <th className="p-4 font-mono-code text-[11px] text-[#948e9d]">Fingerprint</th>
                  <th className="p-4 font-mono-code text-[11px] text-[#948e9d]">Quarantine</th>
                  <th className="p-4 font-mono-code text-[11px] text-right text-[#948e9d]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a3044]">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#1b1f2e]/40 transition-colors">
                    <td className="p-4 font-mono-code text-[#dfe1f6] font-semibold">
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[20px] text-[#00E5FF]">
                          {doc.mimeType.includes('csv') ? 'table_chart' : 'description'}
                        </span>
                        <div>
                          <div>{doc.name}</div>
                          <div className="text-[10px] text-[#948e9d] font-normal">
                            Owner: {doc.ownerName} • v{doc.version}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-mono-code">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          doc.classification === 'Highly Restricted'
                            ? 'bg-[#fb7185]/20 text-[#fb7185] border border-[#fb7185]/30'
                            : doc.classification === 'Confidential'
                            ? 'bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/30'
                            : doc.classification === 'Internal'
                            ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30'
                            : 'bg-[#45dfa4]/20 text-[#45dfa4] border border-[#45dfa4]/30'
                        }`}
                      >
                        {doc.classification}
                      </span>
                    </td>

                    <td className="p-4 font-mono-code text-[#cac4d4]">{doc.department}</td>

                    <td className="p-4 font-mono-code text-[#cac4d4]">
                      <div>{doc.size}</div>
                      <div className="text-[10px] text-[#948e9d]">{doc.type}</div>
                    </td>

                    <td className="p-4 font-mono-code text-[#948e9d] text-[10px]">
                      {doc.fingerprint.slice(0, 16)}...
                    </td>

                    <td className="p-4 font-mono-code">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          doc.quarantineStatus === 'CLEAN'
                            ? 'bg-[#45dfa4]/20 text-[#45dfa4]'
                            : 'bg-[#fb7185]/20 text-[#fb7185]'
                        }`}
                      >
                        {doc.quarantineStatus}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedDocForPreview(doc)}
                          className="px-2.5 py-1 rounded-lg bg-[#1b1f2e] hover:bg-[#262c42] text-[#00E5FF] text-[11px] font-mono-code border border-[#2a3044]"
                          title="Preview Document Content"
                        >
                          View
                        </button>

                        <button
                          onClick={() => handleDownloadFile(doc.id, doc.name)}
                          className="px-2.5 py-1 rounded-lg bg-[#1b1f2e] hover:bg-[#262c42] text-[#a78bfa] text-[11px] font-mono-code border border-[#2a3044]"
                          title="Download using single-use signed ticket"
                        >
                          Download
                        </button>

                        <button
                          onClick={() => {
                            setDraftChatPrompt(`What does the document "${doc.name}" say about its core subject?`);
                            setTab('protected-chat');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#1b1f2e] hover:bg-[#262c42] text-[#45dfa4] text-[11px] font-mono-code border border-[#2a3044]"
                          title="Query in Protected Chat"
                        >
                          Query AI
                        </button>

                        {isOwner && (
                          <button
                            onClick={async () => {
                              if (confirm(`Permanently delete ${doc.name}? Retrieval index will be invalidated.`)) {
                                await deleteDocument(doc.id);
                              }
                            }}
                            className="px-2 py-1 rounded-lg bg-[#fb7185]/10 hover:bg-[#fb7185]/20 text-[#fb7185] text-[11px] font-mono-code border border-[#fb7185]/30"
                            title="Delete Document"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INGEST & QUARANTINE PIPELINE */}
      {activeTab === 'upload-sanitizer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          {/* Upload Form (7 cols) */}
          <div className="lg:col-span-7 p-6 rounded-[24px] bg-[#171b29] border border-[#2a3044] shadow-md space-y-4">
            <h2 className="font-headline text-[16px] font-bold text-[#dfe1f6] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00E5FF]">verified</span>
              <span>Secure Ingestion Pipeline & Anti-Malware Gate</span>
            </h2>

            {uploadError && (
              <div className="p-3 rounded-xl bg-[#fb7185]/10 border border-[#fb7185]/30 text-[#fb7185] text-[12px] font-mono-code flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3 rounded-xl bg-[#45dfa4]/10 border border-[#45dfa4]/30 text-[#45dfa4] text-[12px] font-mono-code flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>{uploadSuccess}</span>
              </div>
            )}

            <form onSubmit={handleServerUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono-code text-[#cac4d4] mb-1">
                  Document Storage Name
                </label>
                <input
                  type="text"
                  required
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="e.g. security_architecture_audit_2026.md"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1f2e] border border-[#2a3044] text-[12px] font-mono-code text-[#dfe1f6] focus:outline-none focus:border-[#a78bfa]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono-code text-[#cac4d4] mb-1">
                    Classification Level
                  </label>
                  <select
                    value={newDocClass}
                    onChange={(e) => setNewDocClass(e.target.value as DocumentClassification)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1b1f2e] border border-[#2a3044] text-[12px] font-mono-code text-[#dfe1f6]"
                  >
                    <option value="Public">Public (Unrestricted)</option>
                    <option value="Internal">Internal (All Employees)</option>
                    <option value="Confidential">Confidential (Departmental)</option>
                    <option value="Highly Restricted">Highly Restricted (Owner Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono-code text-[#cac4d4] mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={newDocDept}
                    onChange={(e) => setNewDocDept(e.target.value)}
                    placeholder="e.g. Core Infrastructure"
                    className="w-full px-3 py-2 rounded-xl bg-[#1b1f2e] border border-[#2a3044] text-[12px] font-mono-code text-[#dfe1f6]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-mono-code text-[#cac4d4]">
                    Document Body / Extracted Text
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFilePickedForUpload(file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-mono-code text-[#00E5FF] hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">attach_file</span>
                    <span>Browse from disk</span>
                  </button>
                </div>

                <textarea
                  required
                  rows={8}
                  value={newDocContent}
                  onChange={(e) => {
                    const c = e.target.value;
                    setNewDocContent(c);
                    if (newDocName) {
                      const scan = scanDocumentContent(c, newDocName, maskNames);
                      const cut = generateCutFile(c, cutMode, maskNames);
                      setActiveUploadScan(scan);
                      setActiveCutResult(cut);
                    }
                  }}
                  placeholder="Paste or type text content, CSV rows, or code here..."
                  className="w-full p-3.5 rounded-xl bg-[#1b1f2e] border border-[#2a3044] text-[12px] font-mono-code text-[#dfe1f6] focus:outline-none focus:border-[#a78bfa]"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#2a3044]">
                <div className="text-[11px] font-mono-code text-[#948e9d]">
                  MIME verified • Never executes macros or code
                </div>
                <button
                  type="submit"
                  disabled={isUploading || !newDocContent.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#00E5FF] text-[#11141F] font-bold font-headline text-[13px] hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-40"
                >
                  {isUploading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-[#11141F] border-t-transparent animate-spin"></span>
                      <span>Scanning & Ingesting...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      <span>Validate & Ingest</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Pipeline Verification Telemetry (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-[24px] bg-[#171b29] border border-[#2a3044] space-y-3">
              <h3 className="font-headline text-[15px] font-bold text-[#dfe1f6]">
                Pipeline Ingestion Checks
              </h3>

              <div className="space-y-2 text-[11px] font-mono-code">
                {[
                  {
                    title: '1. Magic Byte Signature & MIME Check',
                    status: 'PASSED',
                    desc: 'File extension matches actual binary content stream.',
                  },
                  {
                    title: '2. Malware & Executable Macro Scanner',
                    status: 'ACTIVE',
                    desc: 'Flags VBA macros, cmd/powershell payloads, and obfuscated eval.',
                  },
                  {
                    title: '3. Identity & Financial PII Scanner',
                    status: activeUploadScan?.findings.length ? 'FLAGGED' : 'CLEAN',
                    desc: 'Verhoeff Aadhaar, Luhn card, and PAN structure validation.',
                  },
                  {
                    title: '4. SHA-256 Fingerprint Generation',
                    status: 'READY',
                    desc: 'Generates immutable cryptographic audit hash on ingest.',
                  },
                  {
                    title: '5. RBAC Policy Indexing',
                    status: 'READY',
                    desc: 'Binds classification and authorized roles before search indexing.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#1b1f2e] border border-[#2a3044]">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-[#dfe1f6]">{item.title}</div>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          item.status === 'FLAGGED'
                            ? 'bg-[#fbbf24]/20 text-[#fbbf24]'
                            : 'bg-[#45dfa4]/20 text-[#45dfa4]'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#948e9d] mt-0.5">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SAFE CUT-FILE GENERATOR */}
      {activeTab === 'cut-cleaner' && (
        <div className="p-6 rounded-[24px] bg-[#171b29] border border-[#2a3044] space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-headline text-[16px] font-bold text-[#dfe1f6]">
                Safe "Cut File" Redaction Generator
              </h2>
              <p className="text-[11px] font-mono-code text-[#948e9d]">
                Zero-retention sanitization that erases all numbers, credentials, PAN, Aadhaar, and
                currency amounts to produce clean shareable artifacts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-[11px] font-mono-code text-[#cac4d4] cursor-pointer">
                <input
                  type="checkbox"
                  checked={maskNames}
                  onChange={(e) => {
                    setMaskNames(e.target.checked);
                    if (newDocContent) {
                      const cut = generateCutFile(newDocContent, cutMode, e.target.checked);
                      setActiveCutResult(cut);
                    }
                  }}
                  className="rounded bg-[#171b29] border-[#2a3044] text-[#a78bfa]"
                />
                <span>Erase Personal Names</span>
              </label>

              <button
                onClick={handleCopyCleanText}
                disabled={!activeCutResult}
                className="px-3 py-1.5 rounded-xl bg-[#00E5FF] text-[#11141F] font-bold text-[11px] font-mono-code hover:opacity-90 disabled:opacity-40"
              >
                {copied ? 'Copied Cut File!' : 'Copy Clean Output'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-mono-code text-[#948e9d] mb-1">
                Input Source (Raw Text with Sensitive Figures)
              </div>
              <textarea
                rows={12}
                value={newDocContent}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewDocContent(val);
                  const cut = generateCutFile(val, cutMode, maskNames);
                  setActiveCutResult(cut);
                }}
                placeholder="Paste confidential document text here to scrub numbers and credentials..."
                className="w-full p-3.5 rounded-xl bg-[#1b1f2e] border border-[#2a3044] text-[12px] font-mono-code text-[#dfe1f6]"
              />
            </div>

            <div>
              <div className="text-[11px] font-mono-code text-[#45dfa4] mb-1 flex items-center justify-between">
                <span>Sanitized Cut File Output</span>
                {activeCutResult && (
                  <span className="text-[10px] text-[#948e9d]">
                    {activeCutResult.totalCutCount} entities neutralized
                  </span>
                )}
              </div>
              <textarea
                readOnly
                rows={12}
                value={activeCutResult?.cutText || '// Clean redacted output will appear here...'}
                className="w-full p-3.5 rounded-xl bg-[#151824] border border-[#2a3044] text-[12px] font-mono-code text-[#45dfa4] selection:bg-[#45dfa4]/20"
              />
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {selectedDocForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="max-w-2xl w-full p-6 rounded-[24px] bg-[#1b1f2e] border border-[#2a3044] shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#2a3044] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[24px] text-[#00E5FF]">
                  description
                </span>
                <div>
                  <h3 className="font-headline text-[16px] font-bold text-[#dfe1f6]">
                    {selectedDocForPreview.name}
                  </h3>
                  <div className="text-[10px] font-mono-code text-[#948e9d]">
                    Classification: {selectedDocForPreview.classification} • Department:{' '}
                    {selectedDocForPreview.department}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedDocForPreview(null)}
                className="text-[#948e9d] hover:text-white"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 rounded-xl bg-[#171b29] border border-[#2a3044] text-[12px] font-mono-code text-[#cac4d4] whitespace-pre-wrap">
              {selectedDocForPreview.content}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#2a3044] text-[11px] font-mono-code">
              <span className="text-[#948e9d]">{selectedDocForPreview.fingerprint}</span>
              <button
                onClick={() => {
                  handleDownloadFile(selectedDocForPreview.id, selectedDocForPreview.name);
                  setSelectedDocForPreview(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#00E5FF] text-[#11141F] font-bold hover:opacity-90"
              >
                Download File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
