import React from 'react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="max-w-2xl w-full p-6 md:p-8 rounded-[24px] bg-[#1b1f2e] shadow-[12px_12px_28px_#090d1c,-12px_-12px_28px_#283049] border border-[#2a3044] space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#252a3b]">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#44e2cd] text-[24px]">account_tree</span>
            <h3 className="font-headline text-[20px] font-bold text-[#dfe1f6]">
              Kavach Bi-Directional Architecture
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#cac4d4] hover:text-[#dfe1f6]"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Visual Flow Diagram: User -> Kavach Inbound -> Model -> Kavach Egress -> User */}
        <div className="p-5 rounded-2xl bg-[#171b29] shadow-[inset_4px_4px_8px_#11141F,inset_-4px_-4px_8px_#262C42] border border-[#252a3b] space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center font-mono-code text-[12px]">
            
            {/* 1. User */}
            <div className="p-3.5 rounded-xl bg-[#1b1f2e] shadow-[2px_2px_4px_#11141F,-2px_-2px_4px_#262C42] border border-[#2a3044] w-full sm:w-28 shrink-0">
              <span className="material-symbols-outlined text-[#a78bfa] text-[22px] block mb-1">person</span>
              <span className="text-[#dfe1f6] font-bold">User</span>
            </div>

            <span className="material-symbols-outlined text-[#44e2cd] rotate-90 sm:rotate-0">east</span>

            {/* 2. Kavach Inbound */}
            <div className="p-3.5 rounded-xl bg-[#1b1f2e] shadow-[2px_2px_4px_#11141F,-2px_-2px_4px_#262C42] border border-[#44e2cd]/40 w-full sm:w-36 shrink-0">
              <span className="text-[#44e2cd] font-bold block text-[11px] uppercase">Kavach Inbound</span>
              <span className="text-[#cac4d4] text-[10px] block mt-1">Attack Check &bull; PII Scrubber</span>
            </div>

            <span className="material-symbols-outlined text-[#45dfa4] rotate-90 sm:rotate-0">east</span>

            {/* 3. Model */}
            <div className="p-3.5 rounded-xl bg-[#1b1f2e] shadow-[2px_2px_4px_#11141F,-2px_-2px_4px_#262C42] border border-[#a78bfa]/40 w-full sm:w-32 shrink-0">
              <span className="material-symbols-outlined text-[#a78bfa] text-[22px] block mb-1">smart_toy</span>
              <span className="text-[#dfe1f6] font-bold text-[11px]">Model (LLM)</span>
              <span className="text-[#948e9d] text-[10px] block">Sanitized tokens</span>
            </div>

            <span className="material-symbols-outlined text-[#44e2cd] rotate-90 sm:rotate-0">east</span>

            {/* 4. Kavach Egress */}
            <div className="p-3.5 rounded-xl bg-[#1b1f2e] shadow-[2px_2px_4px_#11141F,-2px_-2px_4px_#262C42] border border-[#44e2cd]/40 w-full sm:w-36 shrink-0">
              <span className="text-[#44e2cd] font-bold block text-[11px] uppercase">Kavach Egress</span>
              <span className="text-[#cac4d4] text-[10px] block mt-1">Secret Filter &bull; Verification</span>
            </div>

            <span className="material-symbols-outlined text-[#a78bfa] rotate-90 sm:rotate-0">east</span>

            {/* 5. Safe Response back to User */}
            <div className="p-3.5 rounded-xl bg-[#1b1f2e] shadow-[2px_2px_4px_#11141F,-2px_-2px_4px_#262C42] border border-[#2a3044] w-full sm:w-28 shrink-0">
              <span className="material-symbols-outlined text-[#45dfa4] text-[22px] block mb-1">verified_user</span>
              <span className="text-[#45dfa4] font-bold text-[11px]">Safe Reply</span>
            </div>
          </div>
        </div>

        {/* Technical Guarantees */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px] font-mono-code text-[#cac4d4]">
          <div className="p-3 rounded-xl bg-[#171b29] border border-[#252a3b] space-y-1">
            <span className="text-[#45dfa4] font-bold block">15ms Latency Budget</span>
            <p className="text-[11px] text-[#948e9d]">
              Inbound inspection runs synchronously in volatile RAM, adding zero perceptible latency to model completion.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#171b29] border border-[#252a3b] space-y-1">
            <span className="text-[#44e2cd] font-bold block">Zero-Retention Buffer</span>
            <p className="text-[11px] text-[#948e9d]">
              Payloads are discarded immediately upon forward. Only a cryptographic SHA-256 fingerprint is recorded.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#a78bfa] text-[#1b1f2e] font-mono-code font-bold text-[13px] shadow-[4px_4px_8px_#11141F,-4px_-4px_8px_#262C42]"
          >
            Close Architecture
          </button>
        </div>
      </div>
    </div>
  );
};
