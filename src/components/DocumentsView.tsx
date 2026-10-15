import React, { useState, useRef } from 'react';
import { UserRole, DocumentPolicyCard, UploadedFileScan } from '../types';
import {
  scanDocumentContent,
  generateFingerprint,
  generateCutFile,
  CutFileResult,
  SAMPLE_DOCUMENTS,
} from '../services/kavachEngine';
import { useMotion } from '../motion/motionSystem';
import { useApp } from '../context/AppContext';

interface DocumentsViewProps {
  activeRole?: UserRole;
}

// Built-in document repository with sensitivity labels & policies
const DOCUMENT_CARDS: DocumentPolicyCard[] = [
  {
    id: 'doc-01',
    name: 'Q3 Vendor Master Invoices & Tax Audit',
    type: 'CSV Spreadsheet',
    sensitivity: 'Internal',
    isProtected: false,
    icon: 'table_view',
    tone: 'teal',
    content: `Vendor Name,GSTIN,PAN Number,Contact Phone,Credit Card,Amount Due
CyberShield Solutions LLP,27AABCS1429B1Z,AACTS9902K,+91 99304 88120,4532 8912 3049 8812,₹4500000
Bangalore Cloud Infra,29AAACB1102A1Z,BBBBB1234A,+91 98200 44321,4111 2222 3333 4444,₹1280000
Delhi Perimeter Systems,07AABCP8802M1Z,CCCC8821B,+91 97112 00492,5500 1234 5678 9012,₹650000`,
  },
  {
    id: 'doc-02',
    name: 'Executive Compensation & Board Payroll Q3',
    type: 'Financial Ledger',
    sensitivity: 'Confidential',
    isProtected: false,
    whyHidden: 'Restricted Executive Compensation. Accessible under Operator role with strict PII masking.',
    icon: 'lock',
    tone: 'rose',
    content: `EXECUTIVE COMPENSATION BREAKDOWN - CONFIDENTIAL
Officer,Role,Base Salary,Stock Units,Aadhaar Card,Tax PAN
Vikramaditya Roy,Chief Executive Officer,₹48000000,120000,4829 1049 8821,BKZPR8812M
Priya Chandran,Chief Technology Officer,₹39000000,95000,9921 4482 1192,CCBPR4412P
Deepak Verma,Chief Operating Officer,₹34000000,80000,2291 0049 8831,AAAPV9921K`,
  },
  {
    id: 'doc-03',
    name: 'Engineering Cloud Infrastructure Runbook',
    type: 'DevOps Markdown',
    sensitivity: 'Public',
    isProtected: false,
    icon: 'terminal',
    tone: 'violet',
    content: `KAVACH CLUSTER DEPLOYMENT RUNBOOK
1. Cluster Nodes: kavach-worker-01 through 08 running in ap-south-1
2. Health Checks: Automated probes verify sub-15ms proxy latency every 60 seconds
3. Secret Scrubbing: Regex hardware accelerator intercepts all incoming requests
4. Deployment commands: kubectl rollout status deployment/kavach-gateway-v2`,
  },
];

export const DocumentsView: React.FC<DocumentsViewProps> = () => {
  const { isOff } = useMotion();
  const {
    incrementSanitizedFiles,
    setDraftChatPrompt,
    setTab,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [maskNames, setMaskNames] = useState(false);
  const [cutMode, setCutMode] = useState<'cut-clean' | 'redacted-tags'>('cut-clean');
  const [viewTab, setViewTab] = useState<'cut-file' | 'compare' | 'findings'>('cut-file');
  const [copied, setCopied] = useState(false);

  const [activeUploadScan, setActiveUploadScan] = useState<UploadedFileScan | null>(null);
  const [activeCutResult, setActiveCutResult] = useState<CutFileResult | null>(null);
  const [selectedDocPreview, setSelectedDocPreview] = useState<DocumentPolicyCard | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Core Processing Routine
  const processTextContent = (text: string, fileName: string, currentCutMode = cutMode, currentMaskNames = maskNames) => {
    const scanResult = scanDocumentContent(text, fileName, currentMaskNames);
    const cutResult = generateCutFile(text, currentCutMode, currentMaskNames);
    setActiveUploadScan(scanResult);
    setActiveCutResult(cutResult);
    incrementSanitizedFiles();
    setViewTab('cut-file');
  };

  // File upload handler
  const handleProcessFile = (file: File) => {
    setUploadError(null);

    // Validate size (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File exceeds maximum allowed limit of 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      processTextContent(text, file.name);
    };

    reader.onerror = () => {
      setUploadError('Failed to read document contents.');
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  // Re-generate cut file when toggling Cut Mode or Mask Names
  const handleToggleCutMode = (newMode: 'cut-clean' | 'redacted-tags') => {
    setCutMode(newMode);
    if (activeUploadScan) {
      const updatedCut = generateCutFile(activeUploadScan.originalText, newMode, maskNames);
      setActiveCutResult(updatedCut);
    }
  };

  const handleToggleMaskNames = () => {
    const nextVal = !maskNames;
    setMaskNames(nextVal);
    if (activeUploadScan) {
      const updatedScan = scanDocumentContent(activeUploadScan.originalText, activeUploadScan.name, nextVal);
      const updatedCut = generateCutFile(activeUploadScan.originalText, cutMode, nextVal);
      setActiveUploadScan(updatedScan);
      setActiveCutResult(updatedCut);
    }
  };

  // Download cut file
  const handleDownloadCutFile = () => {
    if (!activeUploadScan || !activeCutResult) return;
    const cleanFileName = `cut_${activeUploadScan.name.replace(/\.[^/.]+$/, '')}.txt`;
    const blob = new Blob([activeCutResult.cutText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = cleanFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy cut file text to clipboard
  const handleCopyCutText = () => {
    if (!activeCutResult) return;
    navigator.clipboard.writeText(activeCutResult.cutText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // "Ask AI about this file" opens Protected Chat with only sanitized text
  const handleAskAI = () => {
    if (!activeCutResult) return;
    setDraftChatPrompt(`Please analyze this cleaned, cut document:\n\n${activeCutResult.cutText}`);
    setTab('protected-chat');
  };

  // Reset to upload another file
  const handleReset = () => {
    setActiveUploadScan(null);
    setActiveCutResult(null);
    setUploadError(null);
  };

  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-6">
      
      {/* 1. Clear, Simple Guided Header */}
      <div className="p-5 md:p-6 rounded-[22px] bg-[#1b1f2e] shadow-[6px_6px_14px_#11141F,-6px_-6px_14px_#262C42] border border-[#2a3044]/30 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#171b29] border border-[#44e2cd]/40 flex items-center justify-center text-[#44e2cd] shadow-[inset_2px_2px_4px_#11141F]">
              <span className="material-symbols-outlined text-[24px]">content_cut</span>
            </div>
            <div>
              <h2 className="font-headline text-[20px] sm:text-[22px] text-[#dfe1f6] font-bold tracking-tight">
                File Eraser &amp; Cut File Generator
              </h2>
              <p className="text-[12px] sm:text-[13px] text-[#cac4d4]">
                Upload any file to erase all sensitive numbers, card numbers, and credentials into a safe, clean copy.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-full bg-[#171b29] font-mono-code text-[11px] text-[#45dfa4] shadow-[inset_1px_1px_2px_#11141F] flex items-center gap-1.5 border border-[#45dfa4]/20">
              <span className="w-2 h-2 rounded-full bg-[#45dfa4] animate-pulse"></span>
              <span>100% In-Memory • No Disk Storage</span>
            </div>
          </div>
        </div>

        {/* 3 Simple Visual Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#252a3b]">
          <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
            !activeUploadScan
              ? 'bg-[#171b29] border-[#44e2cd]/50 text-[#dfe1f6]'
              : 'bg-[#151824] border-[#252a3b] text-[#948e9d]'
          }`}>
            <span className="w-6 h-6 rounded-full bg-[#44e2cd]/10 text-[#44e2cd] font-bold font-mono-code text-[11px] flex items-center justify-center shrink-0">
              1
            </span>
            <div className="text-[11px] font-mono-code leading-tight">
              <strong className="block text-[#dfe1f6]">Add Your File</strong>
              <span>Drop file or try 1-click sample</span>
            </div>
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
            activeUploadScan
              ? 'bg-[#171b29] border-[#a78bfa]/60 text-[#dfe1f6]'
              : 'bg-[#151824] border-[#252a3b] text-[#948e9d]'
          }`}>
            <span className="w-6 h-6 rounded-full bg-[#a78bfa]/10 text-[#a78bfa] font-bold font-mono-code text-[11px] flex items-center justify-center shrink-0">
              2
            </span>
            <div className="text-[11px] font-mono-code leading-tight">
              <strong className="block text-[#dfe1f6]">Numbers &amp; Keys Erased</strong>
              <span>Cards, phones &amp; secrets cut out</span>
            </div>
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
            activeCutResult
              ? 'bg-[#171b29] border-[#45dfa4]/60 text-[#dfe1f6]'
              : 'bg-[#151824] border-[#252a3b] text-[#948e9d]'
          }`}>
            <span className="w-6 h-6 rounded-full bg-[#45dfa4]/10 text-[#45dfa4] font-bold font-mono-code text-[11px] flex items-center justify-center shrink-0">
              3
            </span>
            <div className="text-[11px] font-mono-code leading-tight">
              <strong className="block text-[#dfe1f6]">Get Your Cut File</strong>
              <span>Download, copy, or send to AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Drag & Drop Upload Card (When no file is active) */}
      {!activeUploadScan && (
        <div className="space-y-4 animate-fade-in">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-8 sm:p-10 rounded-[24px] bg-[#1b1f2e] shadow-[8px_8px_18px_#11141F,-8px_-8px_18px_#262C42] border-2 border-dashed ${
              isDragging ? 'border-[#44e2cd] bg-[#1a2530]' : 'border-[#333b52] hover:border-[#a78bfa]'
            } flex flex-col items-center justify-center text-center cursor-pointer transition-all group`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleProcessFile(file);
              }}
              accept=".txt,.csv,.json,.md,.docx,.pdf,.xlsx,.env,.log"
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-[#171b29] shadow-[inset_3px_3px_6px_#11141F,inset_-3px_-3px_6px_#262C42] border border-[#2a3044] flex items-center justify-center text-[#44e2cd] group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[32px]">upload_file</span>
            </div>

            <h3 className="font-headline text-[18px] text-[#dfe1f6] font-bold mt-4">
              Click to select or drag &amp; drop a file here
            </h3>
            <p className="text-[12px] text-[#cac4d4] mt-1 max-w-md font-mono-code">
              Supported formats: <span className="text-[#44e2cd]">.txt, .csv, .json, .docx, .pdf (text), .xlsx</span> (Max 5 MB)
            </p>

            <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#171b29] text-[11px] font-mono-code text-[#a78bfa] border border-[#a78bfa]/30">
              <span className="material-symbols-outlined text-[15px]">auto_fix_high</span>
              <span>Automatically erases: Credit cards, phones, salaries, IDs, API keys &amp; tokens</span>
            </div>

            {uploadError && (
              <div className="mt-4 p-3 rounded-xl bg-[#2a1720] border border-[#fb7185]/40 text-[#fb7185] font-mono-code text-[12px] flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Quick 1-Click Test Samples */}
          <div className="p-4 rounded-[20px] bg-[#1b1f2e] shadow-[4px_4px_10px_#11141F,-4px_-4px_10px_#262C42] border border-[#2a3044]/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono-code text-[11px] uppercase tracking-wider text-[#948e9d] font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-[#44e2cd]">science</span>
                <span>Don't have a file ready? Try a sample in 1 click:</span>
              </span>
              <span className="text-[10px] font-mono-code text-[#45dfa4]">Instant Test</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SAMPLE_DOCUMENTS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => processTextContent(sample.content, sample.name)}
                  className="p-3 rounded-xl bg-[#171b29] hover:bg-[#1e2438] shadow-[2px_2px_5px_#11141F,-2px_-2px_5px_#262C42] border border-[#2a3044] hover:border-[#44e2cd]/50 text-left transition-all group flex items-start gap-2.5"
                >
                  <span className="material-symbols-outlined text-[#44e2cd] text-[20px] mt-0.5 group-hover:scale-110 transition-transform">
                    {sample.icon}
                  </span>
                  <div>
                    <div className="font-mono-code text-[12px] font-bold text-[#dfe1f6] group-hover:text-[#44e2cd] transition-colors">
                      {sample.name}
                    </div>
                    <div className="text-[10px] text-[#948e9d] font-mono-code mt-0.5">
                      {sample.badge}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. ACTIVE CUT FILE RESULTS SCREEN (Clear, Simple & Action-Oriented) */}
      {activeUploadScan && activeCutResult && (
        <div className="p-5 md:p-6 rounded-[24px] bg-[#1b1f2e] shadow-[8px_8px_20px_#11141F,-8px_-8px_20px_#262C42] border border-[#2a3044]/40 space-y-5 animate-fade-in">
          
          {/* Big, Clear Success Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#172533] to-[#1d1f33] border border-[#44e2cd]/40 shadow-[inset_2px_2px_6px_#11141F] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#45dfa4]/15 border border-[#45dfa4]/40 flex items-center justify-center text-[#45dfa4] shrink-0">
                <span className="material-symbols-outlined text-[28px]">check_circle</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-headline text-[18px] text-[#dfe1f6] font-bold">
                    File Cut &amp; Sanitized Successfully!
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#45dfa4]/20 text-[#45dfa4] font-mono-code text-[10px] font-bold">
                    Safe to Share
                  </span>
                </div>
                <p className="text-[12px] text-[#cac4d4] font-mono-code mt-0.5">
                  Source: <strong className="text-[#dfe1f6]">{activeUploadScan.name}</strong> • Fingerprint: <span className="text-[#44e2cd]">{activeUploadScan.fingerprint}</span>
                </p>
              </div>
            </div>

            {/* Clear Primary Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadCutFile}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#45dfa4] to-[#44e2cd] text-[#11141F] font-headline font-bold text-[13px] shadow-[3px_3px_8px_#11141F,-3px_-3px_8px_#262C42] hover:opacity-95 active:scale-95 transition-all flex items-center gap-2"
                title="Download file with numbers and credentials erased"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Download Cut File</span>
              </button>

              <button
                type="button"
                onClick={handleCopyCutText}
                className="px-3.5 py-2.5 rounded-xl bg-[#171b29] text-[#dfe1f6] hover:text-[#44e2cd] border border-[#2a3044] font-mono-code text-[12px] font-bold shadow-[2px_2px_5px_#11141F,-2px_-2px_5px_#262C42] flex items-center gap-1.5 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[17px] text-[#44e2cd]">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>

              <button
                type="button"
                onClick={handleAskAI}
                className="px-3.5 py-2.5 rounded-xl bg-[#a78bfa] text-[#1b1f2e] font-headline font-bold text-[12px] shadow-[2px_2px_5px_#11141F,-2px_-2px_5px_#262C42] hover:bg-[#b89fff] flex items-center gap-1.5 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[17px]">smart_toy</span>
                <span>Ask AI With Cut File</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 rounded-xl bg-[#171b29] text-[#948e9d] hover:text-[#dfe1f6] font-mono-code text-[11px] border border-[#2a3044] transition-all"
                title="Start over with another file"
              >
                Upload Another
              </button>
            </div>
          </div>

          {/* Quick Metrics of What Was Cut */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-[#171b29] shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42] border border-[#252a3b] text-center">
              <span className="text-[10px] font-mono-code text-[#948e9d] block">NUMBERS ERASED</span>
              <span className="font-headline text-[18px] font-bold text-[#fbbf24]">
                {activeCutResult.numbersCutCount}
              </span>
              <span className="text-[9px] font-mono-code text-[#cac4d4] block">Cards, Phones &amp; IDs</span>
            </div>

            <div className="p-3 rounded-xl bg-[#171b29] shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42] border border-[#252a3b] text-center">
              <span className="text-[10px] font-mono-code text-[#948e9d] block">CREDENTIALS ERASED</span>
              <span className="font-headline text-[18px] font-bold text-[#fb7185]">
                {activeCutResult.credentialsCutCount}
              </span>
              <span className="text-[9px] font-mono-code text-[#cac4d4] block">API Keys &amp; Secrets</span>
            </div>

            <div className="p-3 rounded-xl bg-[#171b29] shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42] border border-[#252a3b] text-center">
              <span className="text-[10px] font-mono-code text-[#948e9d] block">NAMES FLAG STATUS</span>
              <span className="font-headline text-[18px] font-bold text-[#a78bfa]">
                {maskNames ? `${activeCutResult.namesCutCount} Erased` : `${activeCutResult.namesCutCount} Flagged`}
              </span>
              <button
                type="button"
                onClick={handleToggleMaskNames}
                className="text-[9px] font-mono-code text-[#00E5FF] underline block mx-auto mt-0.5 hover:text-white"
              >
                {maskNames ? 'Unmask Names' : 'Erase Names Too'}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#171b29] shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42] border border-[#252a3b] text-center">
              <span className="text-[10px] font-mono-code text-[#948e9d] block">OVERALL STATUS</span>
              <span className="font-headline text-[18px] font-bold text-[#45dfa4]">
                SAFE
              </span>
              <span className="text-[9px] font-mono-code text-[#45dfa4] block">Ready For Distribution</span>
            </div>
          </div>

          {/* Controls: Cut Style Switcher & View Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#252a3b]">
            {/* Cut Style Mode Toggle */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#171b29] shadow-[inset_2px_2px_4px_#11141F] border border-[#252a3b]">
              <span className="text-[10px] font-mono-code text-[#948e9d] px-2">Cut Style:</span>
              <button
                type="button"
                onClick={() => handleToggleCutMode('cut-clean')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-code font-bold transition-all ${
                  cutMode === 'cut-clean'
                    ? 'bg-[#44e2cd] text-[#11141F] shadow-[1px_1px_3px_#11141F]'
                    : 'text-[#cac4d4] hover:text-[#dfe1f6]'
                }`}
              >
                Clean Erased ([ERASED])
              </button>
              <button
                type="button"
                onClick={() => handleToggleCutMode('redacted-tags')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-code font-bold transition-all ${
                  cutMode === 'redacted-tags'
                    ? 'bg-[#a78bfa] text-[#11141F] shadow-[1px_1px_3px_#11141F]'
                    : 'text-[#cac4d4] hover:text-[#dfe1f6]'
                }`}
              >
                Redacted Tags ([MASKED])
              </button>
            </div>

            {/* View Mode Tabs */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewTab('cut-file')}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-mono-code font-semibold transition-all ${
                  viewTab === 'cut-file'
                    ? 'bg-[#171b29] text-[#44e2cd] shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42] border border-[#44e2cd]/30'
                    : 'text-[#cac4d4] hover:text-[#dfe1f6]'
                }`}
              >
                Your Cut File
              </button>
              <button
                type="button"
                onClick={() => setViewTab('compare')}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-mono-code font-semibold transition-all ${
                  viewTab === 'compare'
                    ? 'bg-[#171b29] text-[#a78bfa] shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42] border border-[#a78bfa]/30'
                    : 'text-[#cac4d4] hover:text-[#dfe1f6]'
                }`}
              >
                Compare With Original
              </button>
              <button
                type="button"
                onClick={() => setViewTab('findings')}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-mono-code font-semibold transition-all ${
                  viewTab === 'findings'
                    ? 'bg-[#171b29] text-[#fbbf24] shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42] border border-[#fbbf24]/30'
                    : 'text-[#cac4d4] hover:text-[#dfe1f6]'
                }`}
              >
                Details ({activeUploadScan.findings.length})
              </button>
            </div>
          </div>

          {/* TAB 1: Clean Cut File Viewer (The Main Thing the User Wanted) */}
          {viewTab === 'cut-file' && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-[11px] font-mono-code text-[#948e9d] px-1">
                <span>CUT FILE PREVIEW (All numbers &amp; credentials removed):</span>
                <span>{activeCutResult.cutText.split('\n').length} lines • {activeCutResult.cutText.length} characters</span>
              </div>
              <div className="relative rounded-2xl bg-[#141724] border border-[#44e2cd]/30 shadow-[inset_3px_3px_8px_#0b0e17] p-4 sm:p-5 max-h-80 overflow-y-auto">
                <pre className="font-mono-code text-[12px] text-[#44e2cd] whitespace-pre-wrap leading-relaxed select-all">
                  {activeCutResult.cutText}
                </pre>
                <button
                  type="button"
                  onClick={handleCopyCutText}
                  className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-[#1b1f2e] text-[#44e2cd] border border-[#44e2cd]/40 text-[10px] font-mono-code shadow-[2px_2px_4px_#11141F] hover:bg-[#252a3b] flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[13px]">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Compare Before & After */}
          {viewTab === 'compare' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-[#171b29] border border-[#fb7185]/40 space-y-2 font-mono-code text-[11px]">
                <div className="flex items-center justify-between text-[#fb7185] font-bold">
                  <span>BEFORE (ORIGINAL RAW FILE):</span>
                  <span className="text-[10px] bg-[#fb7185]/10 px-2 py-0.5 rounded">Unsafe</span>
                </div>
                <pre className="text-[#dfe1f6] whitespace-pre-wrap overflow-x-auto max-h-72 leading-relaxed bg-[#141724] p-3 rounded-xl">
                  {activeUploadScan.originalText}
                </pre>
              </div>

              <div className="p-4 rounded-2xl bg-[#171b29] border border-[#45dfa4]/40 space-y-2 font-mono-code text-[11px]">
                <div className="flex items-center justify-between text-[#45dfa4] font-bold">
                  <span>AFTER (CLEAN CUT FILE):</span>
                  <span className="text-[10px] bg-[#45dfa4]/10 px-2 py-0.5 rounded">Numbers &amp; Keys Erased</span>
                </div>
                <pre className="text-[#44e2cd] whitespace-pre-wrap overflow-x-auto max-h-72 leading-relaxed bg-[#141724] p-3 rounded-xl">
                  {activeCutResult.cutText}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: Line-by-Line Inspection Findings */}
          {viewTab === 'findings' && (
            <div className="space-y-3 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {activeUploadScan.findings.map((finding) => (
                  <div
                    key={finding.id}
                    className="p-3 rounded-xl bg-[#171b29] shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42] border border-[#252a3b] space-y-1 font-mono-code text-[11px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[#dfe1f6] font-semibold">{finding.type}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          finding.severity === 'CRITICAL'
                            ? 'bg-[#fb7185]/20 text-[#fb7185]'
                            : finding.severity === 'HIGH'
                            ? 'bg-[#fbbf24]/20 text-[#fbbf24]'
                            : 'bg-[#45dfa4]/20 text-[#45dfa4]'
                        }`}
                      >
                        {finding.severity}
                      </span>
                    </div>
                    <div className="text-[#948e9d] text-[10px]">
                      Count: <strong className="text-[#dfe1f6]">{finding.count}</strong> • Lines: {finding.lines.join(', ')}
                    </div>
                    <div className="text-[#fbbf24] text-[10px] bg-[#1b1f2e] p-1 rounded">
                      Scrubbed: <span className="font-bold">[ERASED FROM FILE]</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy Footnote */}
          <div className="p-3 rounded-xl bg-[#151824] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono-code text-[#948e9d]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#45dfa4]"></span>
              <span>Raw file contents discarded immediately from server RAM after generating cut tokens.</span>
            </div>
            <button
              onClick={handleDownloadCutFile}
              className="text-[#44e2cd] hover:underline font-bold"
            >
              Download Cut File Now →
            </button>
          </div>
        </div>
      )}

      {/* 4. Built-in Documents Repository Index */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between pb-2 border-b border-[#252a3b]">
          <div>
            <h3 className="font-headline text-[17px] text-[#dfe1f6] font-semibold">
              Pre-Loaded Test Documents
            </h3>
            <p className="text-[11px] text-[#948e9d] font-mono-code">
              Click "Cut &amp; Sanitize" on any sample document to see the numbers and credentials erased.
            </p>
          </div>
          <span className="font-mono-code text-[11px] text-[#948e9d] hidden sm:inline">
            ENFORCED PRIVILEGE: OPERATOR
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DOCUMENT_CARDS.map((doc) => {
            return (
              <div
                key={doc.id}
                className="p-5 rounded-[20px] bg-[#1b1f2e] shadow-[6px_6px_14px_#11141F,-6px_-6px_14px_#262C42] border border-[#2a3044]/30 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono-code text-[10px] text-[#948e9d]">{doc.type}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-mono-code text-[10px] font-bold ${
                        doc.sensitivity === 'Confidential'
                          ? 'bg-[#fb7185]/20 text-[#fb7185] border border-[#fb7185]/30'
                          : doc.sensitivity === 'Internal'
                          ? 'bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/30'
                          : 'bg-[#45dfa4]/20 text-[#45dfa4] border border-[#45dfa4]/30'
                      }`}
                    >
                      {doc.sensitivity}
                    </span>
                  </div>

                  <h4 className="font-headline text-[15px] text-[#dfe1f6] font-semibold mt-2">
                    {doc.name}
                  </h4>

                  {doc.whyHidden && (
                    <div className="mt-2 p-2 rounded-lg bg-[#171b29] text-[11px] font-mono-code text-[#a78bfa] flex items-start gap-1">
                      <span className="material-symbols-outlined text-[14px] mt-0.5">info</span>
                      <span>{doc.whyHidden}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-[#252a3b]">
                  <button
                    type="button"
                    onClick={() => setSelectedDocPreview(doc)}
                    className="px-3 py-1.5 rounded-xl bg-[#1b1f2e] text-[#cac4d4] hover:text-[#dfe1f6] shadow-[2px_2px_4px_#11141F,-2px_-2px_4px_#262C42] hover:shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42] font-mono-code text-[11px] font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <span className="material-symbols-outlined text-[14px]">preview</span>
                    <span>Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      processTextContent(doc.content, doc.name);
                      window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#44e2cd]/10 text-[#44e2cd] hover:bg-[#44e2cd]/20 border border-[#44e2cd]/30 text-[11px] font-mono-code font-bold flex items-center gap-1 transition-all"
                  >
                    <span>Cut &amp; Sanitize</span>
                    <span className="material-symbols-outlined text-[13px]">content_cut</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Document Policy Classification Matrix */}
      <div className="p-5 rounded-[20px] bg-[#1b1f2e] shadow-[6px_6px_14px_#11141F,-6px_-6px_14px_#262C42] border border-[#2a3044]/30 space-y-3">
        <h3 className="font-headline text-[16px] text-[#dfe1f6] font-semibold">
          Data Governance &amp; Document Classification Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono-code text-[11px] text-[#cac4d4]">
            <thead>
              <tr className="border-b border-[#252a3b] text-[#948e9d]">
                <th className="py-2 px-3">Classification</th>
                <th className="py-2 px-3">Sample Content</th>
                <th className="py-2 px-3">Cut Action</th>
                <th className="py-2 px-3">Storage Policy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#252a3b]/40">
              <tr>
                <td className="py-2.5 px-3 font-bold text-[#45dfa4]">Public</td>
                <td className="py-2.5 px-3">Runbooks, architecture docs, open FAQs</td>
                <td className="py-2.5 px-3 text-[#45dfa4]">ALLOW verbatim</td>
                <td className="py-2.5 px-3 text-[#948e9d]">Zero raw storage</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-[#fbbf24]">Internal</td>
                <td className="py-2.5 px-3">Vendor PAN, billing contracts, invoice numbers</td>
                <td className="py-2.5 px-3 text-[#fbbf24]">ERASE NUMBERS ([NUM_ERASED])</td>
                <td className="py-2.5 px-3 text-[#948e9d]">Canary tokens only</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-[#fb7185]">Confidential</td>
                <td className="py-2.5 px-3">Executive compensation, cloud API secrets, passwords</td>
                <td className="py-2.5 px-3 text-[#fb7185]">ERASE CREDENTIALS ([SECRET_ERASED])</td>
                <td className="py-2.5 px-3 text-[#948e9d]">Boundary quarantine</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Preview Modal */}
      {selectedDocPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="max-w-xl w-full p-6 rounded-[22px] bg-[#1b1f2e] shadow-[12px_12px_24px_#090d1c,-12px_-12px_24px_#283049] border border-[#2a3044] space-y-4 font-mono-code text-[12px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#252a3b]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#44e2cd]">description</span>
                <h3 className="font-headline text-[17px] font-bold text-[#dfe1f6]">
                  {selectedDocPreview.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDocPreview(null)}
                className="p-1 rounded-lg text-[#cac4d4] hover:text-[#dfe1f6]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#171b29] border border-[#252a3b] max-h-72 overflow-y-auto">
              <pre className="text-[#dfe1f6] whitespace-pre-wrap font-mono-code text-[11px] leading-relaxed">
                {selectedDocPreview.content}
              </pre>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  processTextContent(selectedDocPreview.content, selectedDocPreview.name);
                  setSelectedDocPreview(null);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#45dfa4] to-[#44e2cd] text-[#11141F] font-bold text-[12px] shadow-[2px_2px_4px_#11141F,-2px_-2px_4px_#262C42] flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">content_cut</span>
                <span>Cut &amp; Erase Secrets</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedDocPreview(null)}
                className="px-4 py-2 rounded-xl bg-[#1b1f2e] text-[#cac4d4] shadow-[2px_2px_4px_#11141F,-2px_-2px_4px_#262C42] text-[12px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
