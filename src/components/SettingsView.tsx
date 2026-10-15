import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const SettingsView: React.FC = () => {
  const {
    connectedModel,
    testModelConnection,
    policySettings,
    updatePolicySettings,
  } = useApp();

  const [provider, setProvider] = useState(connectedModel.provider);
  const [modelName, setModelName] = useState(connectedModel.model);
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [apiKeyMasked, setApiKeyMasked] = useState('sk-live-••••••••••••••••••••3a9b');
  const [isSaved, setIsSaved] = useState(false);

  // Policy controls state (ALLOW / MASK / BLOCK per data type)
  const [panAction, setPanAction] = useState(policySettings.panAction);
  const [aadhaarAction, setAadhaarAction] = useState(policySettings.aadhaarAction);
  const [phoneAction, setPhoneAction] = useState(policySettings.phoneAction);
  const [emailAction, setEmailAction] = useState(policySettings.emailAction);
  const [apiKeyAction, setApiKeyAction] = useState(policySettings.apiKeyAction);
  const [salaryAction, setSalaryAction] = useState(policySettings.salaryAction);

  // Threshold sliders
  const [blockThreshold, setBlockThreshold] = useState(policySettings.blockThreshold);
  const [maskThreshold, setMaskThreshold] = useState(policySettings.maskThreshold);

  // Rules-only toggle
  const [rulesOnlyMode, setRulesOnlyMode] = useState(policySettings.rulesOnlyMode);

  // Save policy and model configuration
  const handleSaveSettings = () => {
    updatePolicySettings({
      panAction,
      aadhaarAction,
      phoneAction,
      emailAction,
      apiKeyAction,
      salaryAction,
      blockThreshold,
      maskThreshold,
      rulesOnlyMode,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-6">
      
      {/* 1. Header Card */}
      <div className="p-5 md:p-6 rounded-[22px] bg-[#1b1f2e] shadow-[6px_6px_14px_#11141F,-6px_-6px_14px_#262C42] border border-[#2a3044]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#44e2cd] text-[24px]">tune</span>
            <h2 className="font-headline text-[22px] text-[#dfe1f6] font-bold tracking-tight">
              Gateway Configuration &amp; Policy Controls
            </h2>
          </div>
          <p className="text-[13px] text-[#cac4d4] mt-1">
            Configure real-time interception policies per data type, detection sensitivity thresholds, deterministic rules-only mode, and model endpoints.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-5 py-2.5 rounded-xl bg-[#a78bfa] text-[#1b1f2e] font-mono-code font-bold text-[13px] shadow-[4px_4px_8px_#11141F,-4px_-4px_8px_#262C42] hover:bg-[#b89fff] flex items-center gap-1.5 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[17px]">save</span>
            <span>{isSaved ? 'Settings Saved!' : 'Save All Settings'}</span>
          </button>
        </div>
      </div>

      {/* 2. Policy Controls: ALLOW / MASK / BLOCK per Data Type */}
      <div className="p-5 md:p-6 rounded-[22px] bg-[#1b1f2e] shadow-[6px_6px_14px_#11141F,-6px_-6px_14px_#262C42] border border-[#2a3044]/30 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#252a3b]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#a78bfa] text-[20px]">policy</span>
            <h3 className="font-headline text-[17px] text-[#dfe1f6] font-semibold">
              Data Type Enforcement Policies
            </h3>
          </div>
          <span className="font-mono-code text-[11px] text-[#948e9d]">
            GRANULAR ACTIONS (ALLOW / MASK / BLOCK)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[
            { label: 'Income Tax PAN Card', value: panAction, setter: setPanAction, desc: 'Indian 10-char tax identifier' },
            { label: 'National Aadhaar ID', value: aadhaarAction, setter: setAadhaarAction, desc: '12-digit Indian citizen number' },
            { label: 'Mobile / Phone Number', value: phoneAction, setter: setPhoneAction, desc: 'Indian & international contact digits' },
            { label: 'Corporate Email', value: emailAction, setter: setEmailAction, desc: 'Workplace email addresses' },
            { label: 'API Keys & Secrets', value: apiKeyAction, setter: setApiKeyAction, desc: 'Cloud tokens, JWT, AWS credentials' },
            { label: 'Executive Compensation', value: salaryAction, setter: setSalaryAction, desc: 'Confidential executive payroll records' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#171b29] shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42] border border-[#252a3b] space-y-2 font-mono-code text-[12px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[#dfe1f6] font-bold">{item.label}</span>
              </div>
              <p className="text-[11px] text-[#948e9d]">{item.desc}</p>
              
              {/* ALLOW / MASK / BLOCK buttons */}
              <div className="grid grid-cols-3 gap-1 pt-1">
                {(['ALLOW', 'MASK', 'BLOCK'] as const).map((act) => (
                  <button
                    key={act}
                    type="button"
                    onClick={() => item.setter(act)}
                    className={`py-1 text-[11px] font-bold rounded-lg transition-all ${
                      item.value === act
                        ? act === 'BLOCK'
                          ? 'bg-[#fb7185] text-[#1b1f2e]'
                          : act === 'MASK'
                          ? 'bg-[#fbbf24] text-[#1b1f2e]'
                          : 'bg-[#45dfa4] text-[#1b1f2e]'
                        : 'bg-[#1b1f2e] text-[#cac4d4] hover:text-[#dfe1f6]'
                    }`}
                  >
                    {act}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Risk Threshold Sliders & Rules-Only Toggle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Sliders Card */}
        <div className="p-5 md:p-6 rounded-[22px] bg-[#1b1f2e] shadow-[6px_6px_14px_#11141F,-6px_-6px_14px_#262C42] border border-[#2a3044]/30 space-y-4 font-mono-code text-[12px]">
          <div className="flex items-center justify-between pb-3 border-b border-[#252a3b]">
            <h3 className="font-headline text-[17px] text-[#dfe1f6] font-semibold">
              Risk Decision Thresholds
            </h3>
            <span className="text-[#44e2cd] text-[11px]">0 - 100 GAUGE</span>
          </div>

          {/* Block Threshold */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#fb7185] font-bold">Block Threat Threshold:</span>
              <span className="text-[#dfe1f6] font-bold">{blockThreshold}/100</span>
            </div>
            <input
              type="range"
              min="40"
              max="95"
              value={blockThreshold}
              onChange={(e) => setBlockThreshold(Number(e.target.value))}
              className="w-full accent-[#fb7185] cursor-pointer"
            />
            <p className="text-[11px] text-[#948e9d]">
              Prompts scoring above {blockThreshold} will be dropped at the VPC boundary.
            </p>
          </div>

          {/* Mask Threshold */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between">
              <span className="text-[#fbbf24] font-bold">Mask PII Threshold:</span>
              <span className="text-[#dfe1f6] font-bold">{maskThreshold}/100</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              value={maskThreshold}
              onChange={(e) => setMaskThreshold(Number(e.target.value))}
              className="w-full accent-[#fbbf24] cursor-pointer"
            />
            <p className="text-[11px] text-[#948e9d]">
              Prompts scoring above {maskThreshold} undergo regex character scrubbing.
            </p>
          </div>
        </div>

        {/* Rules-Only Toggle & Operational Isolation */}
        <div className="p-5 md:p-6 rounded-[22px] bg-[#1b1f2e] shadow-[6px_6px_14px_#11141F,-6px_-6px_14px_#262C42] border border-[#2a3044]/30 flex flex-col justify-between space-y-4 font-mono-code text-[12px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#252a3b]">
              <h3 className="font-headline text-[17px] text-[#dfe1f6] font-semibold">
                Rules-Only Mode Fallback
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rulesOnlyMode ? 'bg-[#45dfa4]/20 text-[#45dfa4]' : 'bg-[#171b29] text-[#948e9d]'}`}>
                {rulesOnlyMode ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>

            <p className="text-[12px] text-[#cac4d4] mt-3 leading-relaxed font-sans">
              When Rules-Only Mode is enabled, Kavach executes all 5 stages of inspection and document sanitization locally, bypassing outbound LLM calls entirely. Ideal for air-gapped or offline compliance audits.
            </p>

            <div className="mt-4 flex items-center justify-between p-3.5 rounded-xl bg-[#171b29] border border-[#252a3b]">
              <div>
                <span className="text-[#dfe1f6] font-bold block">Enforce Deterministic Rules-Only</span>
                <span className="text-[#948e9d] text-[11px]">Bypasses remote OpenAI / Gemini API calls</span>
              </div>
              <button
                type="button"
                onClick={() => setRulesOnlyMode(!rulesOnlyMode)}
                className={`w-12 h-6 rounded-full transition-colors p-0.5 ${
                  rulesOnlyMode ? 'bg-[#45dfa4]' : 'bg-[#252a3b]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    rulesOnlyMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="text-[11px] text-[#45dfa4]">
            Latency impact: Reduces total inspection overhead to &lt; 8.2ms.
          </div>
        </div>

      </div>

      {/* 4. Connected Model Provider & Working Test Connection with Latency */}
      <div className="p-5 md:p-6 rounded-[22px] bg-[#1b1f2e] shadow-[6px_6px_14px_#11141F,-6px_-6px_14px_#262C42] border border-[#2a3044]/30 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#252a3b]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#44e2cd] text-[20px]">bolt</span>
            <h3 className="font-headline text-[17px] text-[#dfe1f6] font-semibold">
              Downstream Model Connection &amp; Endpoint Test
            </h3>
          </div>
          <span className="font-mono-code text-[11px] text-[#45dfa4]">
            STATUS: {connectedModel.status.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono-code text-[12px]">
          <div className="space-y-1.5">
            <label className="text-[#dfe1f6] font-bold block">Provider</label>
            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value);
                if (e.target.value === 'Google Gemini') {
                  setBaseUrl('https://generativelanguage.googleapis.com/v1beta');
                  setModelName('gemini-2.5-flash');
                } else if (e.target.value === 'OpenAI-compatible') {
                  setBaseUrl('https://api.openai.com/v1');
                  setModelName('gpt-4o-mini');
                } else {
                  setBaseUrl('https://api.anthropic.com/v1');
                  setModelName('claude-3-5-sonnet');
                }
              }}
              className="w-full px-3 py-2 rounded-xl bg-[#171b29] text-[13px] text-[#dfe1f6] border border-[#252a3b] focus:outline-none"
            >
              <option value="OpenAI-compatible">OpenAI-compatible</option>
              <option value="Google Gemini">Google Gemini</option>
              <option value="Anthropic">Anthropic Claude</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[#dfe1f6] font-bold block">Model Identifier</label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#171b29] text-[13px] text-[#dfe1f6] border border-[#252a3b] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[#dfe1f6] font-bold block">Base URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#171b29] text-[13px] text-[#dfe1f6] border border-[#252a3b] focus:outline-none"
            />
          </div>
        </div>

        {/* Working Test Connection with Latency */}
        <div className="pt-3 border-t border-[#252a3b] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 font-mono-code text-[12px]">
            <button
              type="button"
              onClick={() => testModelConnection()}
              disabled={connectedModel.status === 'Testing'}
              className="px-4 py-2 rounded-xl bg-[#1b1f2e] text-[#44e2cd] shadow-[2px_2px_4px_#11141F,-2px_-2px_4px_#262C42] hover:shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42] font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">
                {connectedModel.status === 'Testing' ? 'hourglass_top' : 'bolt'}
              </span>
              <span>{connectedModel.status === 'Testing' ? 'Testing Connection...' : 'Test Connection'}</span>
            </button>

            <span className="text-[#cac4d4]">
              Last Measured Latency: <strong className="text-[#45dfa4]">{connectedModel.latencyMs} ms</strong>
            </span>
          </div>

          <span className="text-[11px] font-mono-code text-[#948e9d]">
            Last verified: {connectedModel.lastTested}
          </span>
        </div>
      </div>

    </div>
  );
};
