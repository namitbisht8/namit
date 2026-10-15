import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#1b1f2e] py-6 border-t border-[#23283a]/60 mt-12">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left font-mono-code text-[12px] text-[#cac4d4]">
        <span>© 2026 Kavach</span>
        <span className="flex items-center gap-1.5 text-[#dfe1f6]">
          <span className="material-symbols-outlined text-[15px] text-[#44e2cd]">verified</span>
          <span>Trust is a feature.</span>
        </span>
        <span className="text-[#948e9d] text-[11px]">BUILD 0.9.4 · SAMPLE DATA</span>
      </div>
    </footer>
  );
};
