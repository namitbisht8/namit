import React from 'react';
import { useApp } from '../context/AppContext';

export const GuidedDemoModal: React.FC = () => {
  const { guidedDemoStep, nextGuidedDemoStep, endGuidedDemo } = useApp();

  if (guidedDemoStep === null) return null;

  const steps = [
    {
      step: 1,
      title: 'Step 1/6: Safe Request Verification',
      page: 'Protected Chat',
      instruction: 'Click the "Safe prompt" button below in Protected Chat. Observe how clean business queries pass through with zero delay (<15ms).',
      badge: 'ALLOW FLOW',
    },
    {
      step: 2,
      title: 'Step 2/6: Real-time PII & Identity Masking',
      page: 'Protected Chat',
      instruction: 'Click "Masked PAN" to test Indian tax ID handling. Notice how characters scramble briefly into [PAN_HIDDEN] and how "What the model received" lets you audit the sanitized diff.',
      badge: 'MASK FLOW',
    },
    {
      step: 3,
      title: 'Step 3/6: Adversarial Prompt Injection Block',
      page: 'Protected Chat',
      instruction: 'Click "Blocked injection" (DAN jailbreak attempt). Kavach stops the token stream at the boundary, flags rule INJ-003, and suggests a "Rewrite safely" alternative.',
      badge: 'BLOCK FLOW',
    },
    {
      step: 4,
      title: 'Step 4/6: File Scanner & Credential Redaction',
      page: 'Documents',
      instruction: 'In Documents, drag-and-drop or select a file containing AWS tokens or PAN numbers. Watch the findings report highlight locations while values remain strictly [HIDDEN].',
      badge: 'DOCUMENT SANITIZER',
    },
    {
      step: 5,
      title: 'Step 5/6: Document Sensitivity Policies',
      page: 'Documents',
      instruction: 'Review the document policy matrix below. Notice Public, Internal, and Confidential labels, and click "Preview" on accessible items.',
      badge: 'POLICY GATE',
    },
    {
      step: 6,
      title: 'Step 6/6: 40-Scenario Red Team Benchmark',
      page: 'Red Team',
      instruction: 'Click "Run Red Team Suite". Watch the smooth progress bar evaluate all 40 scenarios across 7 suites with live KPI detection rates and per-suite metrics.',
      badge: 'RED TEAM BENCHMARK',
    },
  ];

  const current = steps[guidedDemoStep - 1] || steps[0];

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full p-5 rounded-[22px] bg-[#1b1f2e] shadow-[8px_8px_20px_#090d1c,-8px_-8px_20px_#283049] border-2 border-[#a78bfa] space-y-3 font-mono-code text-[12px] animate-bounce-slight">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#44e2cd] animate-pulse"></span>
          <span className="font-bold text-[#a78bfa]">{current.title}</span>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-[#171b29] text-[#45dfa4] text-[10px] font-bold">
          {current.badge}
        </span>
      </div>

      <p className="text-[#dfe1f6] text-[13px] font-sans leading-relaxed">
        {current.instruction}
      </p>

      <div className="pt-2 flex items-center justify-between border-t border-[#252a3b]">
        <button
          onClick={endGuidedDemo}
          className="text-[#948e9d] hover:text-[#dfe1f6] text-[11px]"
        >
          Exit Tour
        </button>
        <button
          onClick={nextGuidedDemoStep}
          className="px-4 py-2 rounded-xl bg-[#a78bfa] text-[#1b1f2e] font-bold hover:bg-[#b89fff] shadow-[2px_2px_4px_#11141F,-2px_-2px_4px_#262C42] flex items-center gap-1.5 transition-all active:scale-95"
        >
          <span>{guidedDemoStep === 6 ? 'Complete Tour' : 'Next Step'}</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
