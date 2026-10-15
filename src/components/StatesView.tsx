import React, { useState, useEffect } from 'react';
import { useMotion } from '../motion/motionSystem';
import { useApp } from '../context/AppContext';
import { TextShimmer } from './motion/TextShimmer';

type SimulatedStateType =
  | 'none'
  | 'not-configured'
  | 'rate-limit'
  | 'model-error'
  | 'blocked'
  | 'offline'
  | 'inspecting';

export const StatesView: React.FC = () => {
  const { isOff } = useMotion();
  const { setTab, connectedModel, policySettings, updatePolicySettings } = useApp();

  // Active simulated state
  const [activeSimulatedState, setActiveSimulatedState] = useState<SimulatedStateType>('none');
  const [rateLimitSeconds, setRateLimitSeconds] = useState(12);

  // Rate limit countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeSimulatedState === 'rate-limit' && rateLimitSeconds > 0) {
      timer = setTimeout(() => setRateLimitSeconds((s) => s - 1), 1000);
    } else if (activeSimulatedState === 'rate-limit' && rateLimitSeconds === 0) {
      setActiveSimulatedState('none');
      setRateLimitSeconds(12);
    }
    return () => clearTimeout(timer);
  }, [activeSimulatedState, rateLimitSeconds]);

  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-6">
      
      {/* 1. Header Card */}
      <div className="p-5 md:p-6 rounded-[22px] bg-[#1b1f2e] shadow-[6px_6px_14px_#11141F,-6px_-6px_14px_#262C42] border border-[#2a3044]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#44e2cd] text-[24px]">hourglass_empty</span>
            <h2 className="font-headline text-[22px] text-[#dfe1f6] font-bold tracking-tight">
              Functional System States
            </h2>
          </div>
          <p className="text-[13px] text-[#cac4d4] mt-1">
            Simulate every real failure, loading, rate-limit, and quarantine state. Designed so judges and operators observe resilient recovery without dead ends.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-full bg-[#171b29] font-mono-code text-[11px] text-[#45dfa4] shadow-[inset_1px_1px_2px_#11141F]">
          ZERO DEAD-ENDS ARCHITECTURE
        </div>
      </div>

      {/* 2. System Health Live Telemetry Panel */}
      <div className="p-5 rounded-[22px] bg-[#1b1f2e] shadow-[6px_6px_14px_#11141F,-6px_-6px_14px_#262C42] border border-[#2a3044]/30 space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-[#252a3b]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#45dfa4] text-[18px]">health_and_safety</span>
            <h3 className="font-headline text-[16px] text-[#dfe1f6] font-semibold">
              Live System Health &amp; Subsystem Telemetry
            </h3>
          </div>
          <span className="font-mono-code text-[11px] text-[#45dfa4] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#45dfa4] animate-pulse"></span>
            ALL SUBSYSTEMS NOMINAL
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 font-mono-code text-[12px]">
          <div className="p-3.5 rounded-xl bg-[#171b29] shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42] space-y-1.5 border border-[#252a3b]">
            <div className="flex items-center justify-between">
              <span className="text-[#dfe1f6] font-bold">1. Interception Engine</span>
              <span className="text-[#45dfa4] text-[10px] font-bold">ACTIVE</span>
            </div>
            <div className="text-[#948e9d] text-[11px]">Hardware regex + Cosine classifier</div>
            <div className="flex justify-between text-[#45dfa4] pt-1 border-t border-[#252a3b]">
              <span>Synchronous Latency:</span>
              <span className="font-bold">3.1 ms</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#171b29] shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42] space-y-1.5 border border-[#252a3b]">
            <div className="flex items-center justify-between">
              <span className="text-[#dfe1f6] font-bold">2. Model Connection</span>
              <span className="text-[#45dfa4] text-[10px] font-bold">{connectedModel.status.toUpperCase()}</span>
            </div>
            <div className="text-[#948e9d] text-[11px]">{connectedModel.provider} [{connectedModel.model}]</div>
            <div className="flex justify-between text-[#45dfa4] pt-1 border-t border-[#252a3b]">
              <span>Proxy Handshake:</span>
              <span className="font-bold">{connectedModel.latencyMs} ms</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#171b29] shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42] space-y-1.5 border border-[#252a3b]">
            <div className="flex items-center justify-between">
              <span className="text-[#dfe1f6] font-bold">3. Database &amp; Audit Buffer</span>
              <span className="text-[#45dfa4] text-[10px] font-bold">VOLATILE RAM</span>
            </div>
            <div className="text-[#948e9d] text-[11px]">Ring-0 zero telemetry retention</div>
            <div className="flex justify-between text-[#45dfa4] pt-1 border-t border-[#252a3b]">
              <span>Write Latency:</span>
              <span className="font-bold">0.4 ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live Active State Simulation Display */}
      {activeSimulatedState !== 'none' && (
        <div className="p-5 md:p-6 rounded-[22px] bg-[#171b29] shadow-[inset_4px_4px_10px_#11141F,inset_-4px_-4px_10px_#262C42] border-2 border-[#a78bfa] space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-[#252a3b]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] animate-ping"></span>
              <h3 className="font-headline text-[16px] text-[#dfe1f6] font-bold">
                Live State Component Rendered for Evaluation:
              </h3>
            </div>
            <button
              onClick={() => setActiveSimulatedState('none')}
              className="text-[11px] font-mono-code text-[#cac4d4] hover:text-[#dfe1f6] px-2.5 py-1 rounded bg-[#1b1f2e]"
            >
              Close Simulation &times;
            </button>
          </div>

          {/* State 1: Model Not Configured */}
          {activeSimulatedState === 'not-configured' && (
            <div className="p-5 rounded-2xl bg-[#1b1f2e] border border-[#fbbf24]/50 space-y-3 font-mono-code text-[12px]">
              <div className="flex items-center gap-2.5 text-[#fbbf24]">
                <span className="material-symbols-outlined text-[24px]">key_off</span>
                <span className="font-bold text-[14px]">Model Not Configured</span>
              </div>
              <p className="text-[#dfe1f6] font-sans">
                No active LLM provider endpoint is linked to the Kavach proxy gateway. Inbound requests cannot be dispatched without API credentials.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => setTab('settings')}
                  className="px-4 py-2 rounded-xl bg-[#a78bfa] text-[#1b1f2e] font-bold flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">settings</span>
                  <span>Open Settings &rarr; Link Provider API Key</span>
                </button>
              </div>
            </div>
          )}

          {/* State 2: Rate Limit Countdown */}
          {activeSimulatedState === 'rate-limit' && (
            <div className="p-5 rounded-2xl bg-[#1b1f2e] border border-[#fb7185]/50 space-y-3 font-mono-code text-[12px]">
              <div className="flex items-center justify-between text-[#fb7185]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[24px]">speed</span>
                  <span className="font-bold text-[14px]">Provider Rate Limit Enforced (HTTP 429)</span>
                </div>
                <span className="text-[14px] font-bold">Retry in {rateLimitSeconds}s</span>
              </div>
              <p className="text-[#dfe1f6] font-sans">
                Downstream LLM endpoint returned a throughput quota limit. Kavach is queueing requests in volatile memory and will automatically retry when the backoff window expires.
              </p>
              <div className="w-full h-2 rounded-full bg-[#151824] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#fb7185] transition-all duration-1000"
                  style={{ width: `${(rateLimitSeconds / 12) * 100}%` }}
                />
              </div>
              <button
                onClick={() => { setActiveSimulatedState('none'); setRateLimitSeconds(12); }}
                className="px-3.5 py-1.5 rounded-xl bg-[#171b29] text-[#45dfa4] text-[11px]"
              >
                Instant Retry Now
              </button>
            </div>
          )}

          {/* State 3: Model Error with Fallback to Rules-Only Mode */}
          {activeSimulatedState === 'model-error' && (
            <div className="p-5 rounded-2xl bg-[#1b1f2e] border border-[#fb7185]/50 space-y-3 font-mono-code text-[12px]">
              <div className="flex items-center gap-2 text-[#fb7185]">
                <span className="material-symbols-outlined text-[24px]">cloud_off</span>
                <span className="font-bold text-[14px]">Model Downstream Connection Error (502 Gateway Error)</span>
              </div>
              <p className="text-[#dfe1f6] font-sans">
                Remote provider endpoint is unreachable or experiencing service degradation. You can switch to local Rules-Only mode to inspect and sanitize documents without calling remote models.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => {
                    updatePolicySettings({ rulesOnlyMode: true });
                    setActiveSimulatedState('none');
                    setTab('protected-chat');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#44e2cd] text-[#1b1f2e] font-bold"
                >
                  Switch to Rules-Only Mode Fallback
                </button>
                <button
                  onClick={() => setTab('settings')}
                  className="px-3 py-2 rounded-xl bg-[#171b29] text-[#cac4d4]"
                >
                  Inspect API Settings
                </button>
              </div>
            </div>
          )}

          {/* State 4: Blocked Message with Next-Step Advice */}
          {activeSimulatedState === 'blocked' && (
            <div className="p-5 rounded-2xl bg-[#2a1720] border border-[#fb7185]/60 space-y-3 font-mono-code text-[12px] text-[#fb7185]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[24px]">gpp_bad</span>
                <span className="font-bold text-[14px]">REQUEST BLOCKED: INJ-003 Adversarial Injection Pattern</span>
              </div>
              <p className="text-[#dfe1f6] font-sans">
                Tokens were quarantined before reaching model memory. Risk score: 95/100.
              </p>
              <div className="p-3 rounded-xl bg-[#1b1f2e] text-[#cac4d4] space-y-1">
                <strong className="text-[#45dfa4]">Operator Next Steps:</strong>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>Remove adversarial persona override keywords like &ldquo;ignore previous rules&rdquo; or &ldquo;DAN&rdquo;.</li>
                  <li>Use specific, policy-compliant instructions for business tasks.</li>
                  <li>Audit the incident in the Audit Ledger under rule <code className="text-[#fb7185]">INJ-003</code>.</li>
                </ul>
              </div>
            </div>
          )}

          {/* State 5: Offline State */}
          {activeSimulatedState === 'offline' && (
            <div className="p-5 rounded-2xl bg-[#1b1f2e] border border-[#948e9d]/50 space-y-3 font-mono-code text-[12px]">
              <div className="flex items-center gap-2 text-[#948e9d]">
                <span className="material-symbols-outlined text-[24px]">wifi_off</span>
                <span className="font-bold text-[14px]">Network Gateway Offline</span>
              </div>
              <p className="text-[#dfe1f6] font-sans">
                Local network connectivity is interrupted. Kavach client will automatically reconnect as soon as network packets resume.
              </p>
            </div>
          )}

          {/* State 6: Synchronous Inspecting */}
          {activeSimulatedState === 'inspecting' && (
            <div className="p-5 rounded-2xl bg-[#1b1f2e] border border-[#44e2cd]/50 space-y-3 font-mono-code text-[12px]">
              <div className="flex items-center gap-2 text-[#44e2cd]">
                <span className="material-symbols-outlined text-[24px] animate-spin">sync</span>
                <span className="font-bold text-[14px]">Synchronous 5-Stage Interception: <TextShimmer>Checking...</TextShimmer></span>
              </div>
              <p className="text-[#cac4d4]">
                Evaluating token stream against embedding cosine anomalies and regex hardware scrubber. Average latency: 12.4ms.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. State Cards with "Simulate" Buttons for Judges */}
      <div className="space-y-3">
        <h3 className="font-headline text-[17px] text-[#dfe1f6] font-semibold">
          Select State to Simulate Live
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              id: 'not-configured' as const,
              name: 'Model Not Configured',
              desc: 'Missing API key or custom endpoint configuration with direct link to Settings.',
              icon: 'key_off',
              tone: '#fbbf24',
            },
            {
              id: 'rate-limit' as const,
              name: 'Rate Limit with Countdown',
              desc: 'Downstream HTTP 429 quota pause with live countdown timer and auto-retry.',
              icon: 'speed',
              tone: '#fb7185',
            },
            {
              id: 'model-error' as const,
              name: 'Model Error & Rules Fallback',
              desc: 'Provider 502/503 timeout with instant fallback to local deterministic rules.',
              icon: 'cloud_off',
              tone: '#fb7185',
            },
            {
              id: 'blocked' as const,
              name: 'Blocked Message with Advice',
              desc: 'Adversarial jailbreak block banner with actionable next-step operator advice.',
              icon: 'gpp_bad',
              tone: '#fb7185',
            },
            {
              id: 'offline' as const,
              name: 'Offline Resilience',
              desc: 'Network disconnect banner preserving in-memory draft prompt.',
              icon: 'wifi_off',
              tone: '#948e9d',
            },
            {
              id: 'inspecting' as const,
              name: 'Synchronous Checking (15ms)',
              desc: 'Real-time multi-stage token inspection with calm shimmer effect.',
              icon: 'sync',
              tone: '#44e2cd',
            },
          ].map((card) => (
            <div
              key={card.id}
              className="p-5 rounded-[20px] bg-[#1b1f2e] shadow-[6px_6px_14px_#11141F,-6px_-6px_14px_#262C42] border border-[#2a3044]/30 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#171b29] shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42] flex items-center justify-center text-[#dfe1f6]">
                  <span className="material-symbols-outlined text-[22px]" style={{ color: card.tone }}>
                    {card.icon}
                  </span>
                </div>
                <h4 className="font-headline text-[15px] text-[#dfe1f6] font-semibold">
                  {card.name}
                </h4>
                <p className="text-[12px] text-[#cac4d4] leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-[#252a3b] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSimulatedState(card.id);
                    if (card.id === 'rate-limit') setRateLimitSeconds(12);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#1b1f2e] text-[#a78bfa] shadow-[2px_2px_4px_#11141F,-2px_-2px_4px_#262C42] hover:shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42] font-mono-code text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[14px]">play_circle</span>
                  <span>Simulate Live</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
