import React, { useState, useRef, useEffect } from 'react';
import { useMotion } from '../motion/motionSystem';
import { useApp, SYSTEM_DEMO_USERS } from '../context/AppContext';
import { AnimatedBackground } from './motion-primitives/animated-background';
import { MotionControlBadge } from './motion/MotionControlBadge';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { isFull, tokens } = useMotion();
  const {
    currentTab,
    setTab,
    startGuidedDemo,
    setArchitectureModalOpen,
    currentUser,
    switchUserPersona,
    logout,
    setLoginModalOpen,
  } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'protected-chat', label: 'Protected Chat' },
    { id: 'access-control', label: 'Access Control' },
    { id: 'documents', label: 'Documents' },
    { id: 'audit-log', label: 'Audit Log' },
    { id: 'testing-center', label: 'Testing Center' },
    { id: 'settings', label: 'Settings' },
  ];

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none px-3 sm:px-4">
      <div className="pointer-events-auto h-20 max-w-[1280px] mx-auto mt-4 px-4 sm:px-6 flex items-center justify-between bg-[#1b1f2e] rounded-[20px] shadow-[8px_8px_16px_#11141F,-8px_-8px_16px_#262C42] border border-[#2a3044]/40">
        
        {/* Brand & Logo */}
        <div 
          onClick={() => setTab('dashboard')} 
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group shrink-0"
        >
          <div className="relative flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-[#00E5FF] transition-transform group-hover:scale-105" 
              viewBox="0 0 64 64" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="64" height="64" rx="16" fill="#111827"/>
              <path d="M32 10 49 17v13c0 11-7 20-17 25C22 50 15 41 15 30V17z" fill="none" stroke="#00E5FF" strokeWidth="5"/>
              <path d="M26 31l4 5 8-10" fill="none" stroke="#a78bfa" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-headline text-[18px] sm:text-[20px] tracking-tight font-bold text-[#dfe1f6] group-hover:text-[#a78bfa] transition-colors">
            KAVACH
          </span>
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1b1f2e] shadow-[2px_2px_4px_#11141F,-2px_-2px_4px_#262C42]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#45dfa4] animate-pulse"></span>
            <span className="font-mono-code text-[10px] text-[#45dfa4] uppercase tracking-wider font-semibold">
              Gateway Active
            </span>
          </div>
        </div>

        {/* Desktop Navigation for all 7 items */}
        <nav className="hidden xl:flex items-center gap-1 p-1 relative rounded-xl">
          <AnimatedBackground
            defaultValue={currentTab}
            value={currentTab}
            onValueChange={(id) => id && setTab(id)}
            className="rounded-xl bg-[#171b29] shadow-[inset_4px_4px_8px_#11141F,inset_-4px_-4px_8px_#262C42]"
            transition={{
              duration: isFull ? tokens.duration.normal : 0,
              ease: tokens.ease,
            }}
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                data-id={item.id}
                type="button"
                className={`px-3 py-1.5 rounded-xl text-[13px] font-medium transition-colors ${
                  currentTab === item.id
                    ? 'text-[#a78bfa] font-bold'
                    : 'text-[#cac4d4] hover:text-[#dfe1f6]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </AnimatedBackground>
        </nav>

        {/* Medium Screen Navigation */}
        <nav className="hidden md:flex xl:hidden items-center gap-1 p-1 relative rounded-xl">
          <AnimatedBackground
            defaultValue={currentTab}
            value={currentTab}
            onValueChange={(id) => id && setTab(id)}
            className="rounded-xl bg-[#171b29] shadow-[inset_4px_4px_8px_#11141F,inset_-4px_-4px_8px_#262C42]"
            transition={{
              duration: isFull ? tokens.duration.normal : 0,
              ease: tokens.ease,
            }}
          >
            {navItems.slice(0, 5).map((item) => (
              <button
                key={item.id}
                data-id={item.id}
                type="button"
                className={`px-2.5 py-1.5 rounded-xl text-[12px] font-medium transition-colors ${
                  currentTab === item.id
                    ? 'text-[#a78bfa] font-bold'
                    : 'text-[#cac4d4] hover:text-[#dfe1f6]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </AnimatedBackground>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Guided Demo Button */}
          <button
            onClick={startGuidedDemo}
            type="button"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1b1f2e] shadow-[2px_2px_4px_#11141F,-2px_-2px_4px_#262C42] hover:shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42] text-[11px] font-mono-code text-[#44e2cd] font-semibold transition-all active:scale-95"
            title="Start Interactive 6-Step Tour"
          >
            <span className="material-symbols-outlined text-[15px]">tour</span>
            <span>Tour</span>
          </button>

          {/* Architecture Modal Trigger */}
          <button
            onClick={() => setArchitectureModalOpen(true)}
            type="button"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1b1f2e] shadow-[2px_2px_4px_#11141F,-2px_-2px_4px_#262C42] hover:text-[#a78bfa] text-[11px] font-mono-code text-[#cac4d4] transition-all"
            title="View Kavach Bi-Directional Flow Diagram"
          >
            <span className="material-symbols-outlined text-[15px]">account_tree</span>
            <span>Arch</span>
          </button>

          {/* Login / User Profile Dropdown */}
          {currentUser ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-[#1b1f2e] shadow-[2px_2px_5px_#11141F,-2px_-2px_5px_#262C42] hover:shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42] border border-[#2a3044]/70 transition-all text-left"
                aria-label="User Profile and Session Options"
                title={`${currentUser.name} (${currentUser.title})`}
              >
                <div className="w-6 h-6 rounded-full bg-[#171b29] border border-[#a78bfa]/50 flex items-center justify-center font-headline text-[10px] font-bold text-[#a78bfa] shadow-[inset_1px_1px_2px_#11141F] relative">
                  {currentUser.initials}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#45dfa4] border border-[#1b1f2e]"></span>
                </div>
                <div className="hidden md:flex flex-col">
                  <span className="font-mono-code text-[11px] text-[#dfe1f6] font-semibold leading-tight max-w-[100px] truncate">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <span className="font-mono-code text-[9px] text-[#00E5FF] leading-tight font-bold uppercase">
                    {currentUser.role}
                  </span>
                </div>
                <span className="material-symbols-outlined text-[15px] text-[#948e9d]">
                  {userMenuOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {/* Profile Dropdown Menu with 1-Click Role Switcher */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 p-4 rounded-2xl bg-[#1b1f2e] shadow-[12px_12px_28px_#0b0e17,-12px_-12px_28px_#272d43] border border-[#2a3044] z-50 space-y-3 animate-fade-in">
                  {/* User Info Header */}
                  <div className="flex items-start gap-2.5 pb-2.5 border-b border-[#252a3b]">
                    <div className="w-9 h-9 rounded-full bg-[#171b29] border border-[#a78bfa]/60 flex items-center justify-center font-headline text-[12px] font-bold text-[#a78bfa] shrink-0 shadow-[inset_1px_1px_3px_#11141F]">
                      {currentUser.initials}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-[13px] font-bold text-[#dfe1f6] truncate">
                        {currentUser.name}
                      </div>
                      <div className="text-[11px] text-[#948e9d] font-mono-code truncate">
                        {currentUser.email}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] font-mono-code font-bold uppercase border border-[#00E5FF]/30">
                          Role: {currentUser.role}
                        </span>
                        <span className="text-[9px] text-[#948e9d] font-mono-code">
                          ({currentUser.department})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Persona Switcher for Quick RBAC Verification */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono-code uppercase tracking-wider text-[#948e9d]">
                      Switch Persona (Live RBAC Test):
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SYSTEM_DEMO_USERS.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            switchUserPersona(u);
                            setUserMenuOpen(false);
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono-code text-left transition-all ${
                            currentUser.id === u.id
                              ? 'bg-[#00E5FF] text-[#11141F] font-bold shadow'
                              : 'bg-[#171b29] text-[#cac4d4] hover:text-[#dfe1f6] border border-[#2a3044]'
                          }`}
                        >
                          <div className="font-bold">{u.name.split(' ')[0]}</div>
                          <div className="text-[9px] uppercase opacity-75">{u.role}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-1 pt-2 border-t border-[#252a3b]">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setTab('access-control');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-medium text-[#cac4d4] hover:text-[#dfe1f6] hover:bg-[#1f2438] transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px] text-[#a78bfa]">
                        shield_person
                      </span>
                      <span>Access Control Matrix</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-medium text-[#fb7185] hover:bg-[#fb7185]/10 border border-transparent hover:border-[#fb7185]/20 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">logout</span>
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setLoginModalOpen(true)}
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#a78bfa] to-[#00E5FF] text-[#11141F] font-bold text-[11px] font-headline shadow-md hover:opacity-95 transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">login</span>
              <span>Sign In</span>
            </button>
          )}

          {/* Motion Control Badge */}
          <MotionControlBadge />

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            className="md:hidden p-2 rounded-xl text-[#cac4d4] hover:text-[#dfe1f6] hover:bg-[#171b29] transition-all"
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined text-[20px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden pointer-events-auto max-w-[1280px] mx-auto mt-2 p-4 rounded-2xl bg-[#1b1f2e] border border-[#2a3044] shadow-2xl space-y-2 animate-fade-in">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full px-3 py-2 rounded-xl text-left text-[13px] font-medium font-mono-code transition-all ${
                currentTab === item.id
                  ? 'bg-[#a78bfa] text-[#11141F] font-bold'
                  : 'text-[#cac4d4] hover:bg-[#171b29]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
