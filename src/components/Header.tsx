import React, { useState, useRef, useEffect } from 'react';
import { useMotion } from '../motion/motionSystem';
import { useApp } from '../context/AppContext';
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
    logout,
    setLoginModalOpen,
  } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'protected-chat', label: 'Protected Chat' },
    { id: 'red-team', label: 'Red Team' },
    { id: 'documents', label: 'Documents' },
    { id: 'audit-log', label: 'Audit Log' },
    { id: 'states', label: 'States' },
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
                    ? 'text-[#a78bfa]'
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
                    ? 'text-[#a78bfa]'
                    : 'text-[#cac4d4] hover:text-[#dfe1f6]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </AnimatedBackground>
        </nav>

        {/* Right Controls: Guided Demo, Architecture, Profile/Login, Motion */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Guided Demo Button */}
          <button
            onClick={startGuidedDemo}
            type="button"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1b1f2e] shadow-[2px_2px_4px_#11141F,-2px_-2px_4px_#262C42] hover:shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42] text-[11px] font-mono-code text-[#44e2cd] font-semibold transition-all active:scale-95"
            title="Start Interactive 6-Step Tour"
          >
            <span className="material-symbols-outlined text-[15px]">tour</span>
            <span>Guided Demo</span>
          </button>

          {/* Architecture Modal Trigger */}
          <button
            onClick={() => setArchitectureModalOpen(true)}
            type="button"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1b1f2e] shadow-[2px_2px_4px_#11141F,-2px_-2px_4px_#262C42] hover:text-[#a78bfa] text-[11px] font-mono-code text-[#cac4d4] transition-all"
            title="View Kavach Bi-Directional Flow Diagram"
          >
            <span className="material-symbols-outlined text-[15px]">account_tree</span>
            <span>Architecture</span>
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
                  <span className="font-mono-code text-[9px] text-[#45dfa4] leading-tight">
                    Operator
                  </span>
                </div>
                <span className="material-symbols-outlined text-[15px] text-[#948e9d]">
                  {userMenuOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {/* Profile Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 p-3.5 rounded-2xl bg-[#1b1f2e] shadow-[12px_12px_28px_#0b0e17,-12px_-12px_28px_#272d43] border border-[#2a3044] z-50 space-y-3 animate-fade-in">
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
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#45dfa4]/10 text-[#45dfa4] font-mono-code font-semibold border border-[#45dfa4]/20">
                          Single Operator Role
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Session Status Details */}
                  <div className="p-2.5 rounded-xl bg-[#171b29] space-y-1.5 text-[10px] font-mono-code text-[#948e9d]">
                    <div className="flex justify-between items-center">
                      <span>Gateway Session:</span>
                      <span className="text-[#45dfa4] font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#45dfa4] animate-ping"></span>
                        Active Enclave
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Token Expiry:</span>
                      <span className="text-[#dfe1f6]">{currentUser.tokenExpiry}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Last Verified:</span>
                      <span className="text-[#dfe1f6]">{currentUser.lastLogin}</span>
                    </div>
                  </div>

                  {/* Actions: Switch persona or Log Out */}
                  <div className="space-y-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setLoginModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium text-[#cac4d4] hover:text-[#dfe1f6] hover:bg-[#1f2438] transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px] text-[#44e2cd]">
                        switch_account
                      </span>
                      <span>Switch Operator Persona</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium text-[#fb7185] hover:bg-[#fb7185]/10 border border-transparent hover:border-[#fb7185]/20 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        logout
                      </span>
                      <span>Log Out of Kavach</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Logged Out: Show clear Log In Button */
            <button
              type="button"
              onClick={() => setLoginModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#a78bfa] to-[#44e2cd] text-[#11141F] font-headline font-bold text-[12px] shadow-[2px_2px_6px_#11141F,-2px_-2px_6px_#262C42] hover:opacity-95 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              <span>Log In</span>
            </button>
          )}

          {/* Motion Badge */}
          <MotionControlBadge />

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-xl text-[#cac4d4] hover:text-[#dfe1f6] bg-[#1b1f2e] shadow-[2px_2px_4px_#11141F,-2px_-2px_4px_#262C42]"
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
        <div className="xl:hidden pointer-events-auto max-w-[1280px] mx-auto mt-2 p-4 bg-[#1b1f2e] rounded-[20px] shadow-[8px_8px_16px_#11141F,-8px_-8px_16px_#262C42] border border-[#2a3044]/40 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#252a3b]">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#171b29] border border-[#a78bfa]/50 flex items-center justify-center font-headline text-[10px] font-bold text-[#a78bfa]">
                  {currentUser.initials}
                </div>
                <div className="flex flex-col">
                  <span className="font-mono-code text-[11px] text-[#dfe1f6] font-semibold">
                    {currentUser.name}
                  </span>
                  <span className="font-mono-code text-[9px] text-[#45dfa4]">
                    Single Operator
                  </span>
                </div>
              </div>
            ) : (
              <span className="font-mono-code text-[11px] text-[#948e9d]">
                Guest / Demo Mode
              </span>
            )}

            <div className="flex items-center gap-2">
              {currentUser ? (
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#fb7185]/10 text-[#fb7185] text-[11px] font-mono-code font-semibold border border-[#fb7185]/20"
                >
                  Log Out
                </button>
              ) : (
                <button
                  onClick={() => {
                    setLoginModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1 rounded-lg bg-[#a78bfa] text-[#11141F] text-[11px] font-headline font-bold"
                >
                  Log In
                </button>
              )}
              <button
                onClick={() => {
                  startGuidedDemo();
                  setMobileMenuOpen(false);
                }}
                className="text-[11px] font-mono-code text-[#44e2cd] ml-1"
              >
                Tour
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-xl text-left text-[13px] font-medium transition-all ${
                  currentTab === item.id
                    ? 'bg-[#171b29] text-[#a78bfa] shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42]'
                    : 'text-[#cac4d4] hover:text-[#dfe1f6]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
