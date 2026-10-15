import React, { useState, useRef, useEffect } from 'react';
import { useMotion, MotionLevel } from '../../motion/motionSystem';

export const MotionControlBadge: React.FC = () => {
  const { motionLevel, setMotionLevel } = useMotion();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: Array<{ level: MotionLevel; label: string; desc: string }> = [
    { level: 'full', label: 'Full', desc: 'Smooth countups, sliding pills, and masking scramble' },
    { level: 'reduced', label: 'Reduced', desc: 'No background motion or counters, instant results' },
    { level: 'off', label: 'Off', desc: 'All animations disabled completely' },
  ];

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1b1f2e] shadow-[2px_2px_4px_#11141F,-2px_-2px_4px_#262C42] hover:text-[#a78bfa] text-[#cac4d4] font-mono-code text-[11px] transition-all"
        title="Motion Setting (Full / Reduced / Off)"
      >
        <span className="material-symbols-outlined text-[14px] text-[#a78bfa]">motion_photos_on</span>
        <span className="hidden sm:inline capitalize">Motion: {motionLevel}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-2xl bg-[#1b1f2e] shadow-[8px_8px_16px_#11141F,-8px_-8px_16px_#262C42] border border-[#2a3044] z-50">
          <div className="flex items-center justify-between pb-2 border-b border-[#252a3b] mb-2">
            <span className="font-mono-code text-[11px] text-[#dfe1f6] font-semibold uppercase">
              Motion Setting
            </span>
            <span className="font-mono-code text-[10px] text-[#948e9d]">In-Memory</span>
          </div>

          <div className="space-y-1.5">
            {options.map((opt) => {
              const active = motionLevel === opt.level;
              return (
                <button
                  key={opt.level}
                  onClick={() => {
                    setMotionLevel(opt.level);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-xl transition-all ${
                    active
                      ? 'bg-[#171b29] text-[#a78bfa] shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42]'
                      : 'text-[#cac4d4] hover:text-[#dfe1f6] hover:bg-[#202537]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-code text-[12px] font-medium">{opt.label}</span>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa]"></span>}
                  </div>
                  <p className="text-[10px] text-[#948e9d] mt-0.5 leading-snug">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
