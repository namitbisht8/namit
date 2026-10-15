import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AuthUser } from '../types';

export const DEMO_USERS: AuthUser[] = [
  {
    id: 'user-01',
    name: 'Vikram Sharma',
    email: 'vikram.sharma@defense.kavach.ai',
    title: 'Lead Security Architect',
    role: 'operator',
    initials: 'VS',
    lastLogin: 'Today, 09:30 IST',
    tokenExpiry: '12h 45m remaining',
  },
  {
    id: 'user-02',
    name: 'Aanya Roy',
    email: 'aanya.roy@kavach.security',
    title: 'AI Safety & Compliance Lead',
    role: 'operator',
    initials: 'AR',
    lastLogin: 'Today, 11:15 IST',
    tokenExpiry: '8h 20m remaining',
  },
  {
    id: 'user-03',
    name: 'Alex Rivera',
    email: 'alex.rivera@kavach.ai',
    title: 'SecOps Gateway Operator',
    role: 'operator',
    initials: 'AR',
    lastLogin: 'Just now',
    tokenExpiry: '24h remaining',
  },
];

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setLoginModalOpen, login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isLoginModalOpen) return null;

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide a valid operator email address.');
      return;
    }
    if (!password.trim() || password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setStatusText('Handshaking with Zero-Trust Enclave...');

    await new Promise((r) => setTimeout(r, 400));
    setStatusText('Verifying ephemeral hardware token...');
    await new Promise((r) => setTimeout(r, 450));

    // Extract name from email
    const username = email.split('@')[0];
    const formattedName = username
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const initials = formattedName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'OP';

    const customUser: AuthUser = {
      id: 'user-' + Date.now().toString(36),
      name: formattedName || 'Gateway Operator',
      email: email.trim(),
      title: 'Security Operator',
      role: 'operator',
      initials: initials,
      lastLogin: 'Just now',
      tokenExpiry: '24h remaining',
    };

    setIsLoading(false);
    login(customUser);
    setLoginModalOpen(false);
  };

  const handleQuickLogin = async (user: AuthUser) => {
    setError(null);
    setIsLoading(true);
    setStatusText(`Authenticating as ${user.name}...`);
    await new Promise((r) => setTimeout(r, 400));
    setIsLoading(false);
    login(user);
    setLoginModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div 
        className="max-w-md w-full p-6 sm:p-7 rounded-[24px] bg-[#1b1f2e] shadow-[12px_12px_28px_#0b0e17,-12px_-12px_28px_#272d43] border border-[#2a3044] relative space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setLoginModalOpen(false)}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-[#cac4d4] hover:text-[#dfe1f6] hover:bg-[#171b29] transition-all"
          aria-label="Close modal"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#171b29] shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42] flex items-center justify-center border border-[#00E5FF]/30">
            <svg 
              className="w-5 h-5 text-[#00E5FF]" 
              viewBox="0 0 64 64" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="64" height="64" rx="16" fill="#111827"/>
              <path d="M32 10 49 17v13c0 11-7 20-17 25C22 50 15 41 15 30V17z" fill="none" stroke="#00E5FF" strokeWidth="5"/>
              <path d="M26 31l4 5 8-10" fill="none" stroke="#a78bfa" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h2 className="font-headline text-[18px] sm:text-[20px] font-bold text-[#dfe1f6]">
              Sign In to Kavach
            </h2>
            <p className="text-[11px] text-[#948e9d] font-mono-code">
              Zero-Trust AI Gateway Security Enclave
            </p>
          </div>
        </div>

        {/* One-Click Demo Personas */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono-code text-[10px] uppercase tracking-wider text-[#948e9d] font-semibold">
              Fast 1-Click Sign In
            </span>
            <span className="font-mono-code text-[10px] text-[#45dfa4]">
              Instant Access
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {DEMO_USERS.map((u) => (
              <button
                key={u.id}
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin(u)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#171b29] hover:bg-[#1f2438] shadow-[2px_2px_4px_#11141F,-2px_-2px_4px_#262C42] border border-[#2a3044]/60 hover:border-[#a78bfa]/50 transition-all text-left group disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#1b1f2e] border border-[#a78bfa]/40 flex items-center justify-center font-headline text-[11px] font-bold text-[#a78bfa] shadow-[inset_1px_1px_2px_#11141F]">
                    {u.initials}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[#dfe1f6] group-hover:text-[#a78bfa] transition-colors flex items-center gap-1.5">
                      {u.name}
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#45dfa4]/10 text-[#45dfa4] font-mono-code">
                        Operator
                      </span>
                    </div>
                    <div className="text-[11px] text-[#948e9d] font-mono-code">
                      {u.title}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[#948e9d] group-hover:text-[#44e2cd] transition-colors">
                  <span className="text-[11px] font-mono-code hidden sm:inline">Sign In</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[#2a3044]/80"></div>
          <span className="text-[10px] font-mono-code text-[#948e9d] uppercase tracking-wider">
            Or With Email & Password
          </span>
          <div className="h-px flex-1 bg-[#2a3044]/80"></div>
        </div>

        {/* Custom Login Form */}
        <form onSubmit={handleCustomLogin} className="space-y-3.5">
          {error && (
            <div className="p-2.5 rounded-xl bg-[#e0536c]/10 border border-[#e0536c]/40 text-[#fb7185] text-[11px] font-mono-code flex items-center gap-2">
              <span className="material-symbols-outlined text-[15px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono-code text-[#cac4d4] mb-1">
              Operator Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#171b29] shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42] border border-[#2a3044] text-[#dfe1f6] text-[13px] placeholder-[#948e9d]/60 focus:outline-none focus:border-[#a78bfa] font-mono-code"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono-code text-[#cac4d4] mb-1">
              Access Token / Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#171b29] shadow-[inset_2px_2px_4px_#11141F,inset_-2px_-2px_4px_#262C42] border border-[#2a3044] text-[#dfe1f6] text-[13px] placeholder-[#948e9d]/60 focus:outline-none focus:border-[#a78bfa] font-mono-code pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#948e9d] hover:text-[#dfe1f6]"
                tabIndex={-1}
              >
                <span className="material-symbols-outlined text-[17px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono-code">
            <label className="flex items-center gap-1.5 cursor-pointer text-[#cac4d4]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-[#171b29] border-[#2a3044] text-[#a78bfa] focus:ring-0"
              />
              <span>Remember session</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setEmail('operator@kavach.ai');
                setPassword('kavach-shield-2026');
              }}
              className="text-[#44e2cd] hover:underline"
            >
              Fill demo creds
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#44e2cd] text-[#11141F] font-bold text-[13px] font-headline shadow-[4px_4px_8px_#11141F,-4px_-4px_8px_#262C42] hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-[#11141F] border-t-transparent animate-spin"></span>
                <span>{statusText || 'Authenticating...'}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[17px]">login</span>
                <span>Authenticate & Enter Enclave</span>
              </>
            )}
          </button>
        </form>

        {/* Security Badge Footnote */}
        <div className="pt-2 border-t border-[#252a3b] flex items-center justify-between text-[10px] font-mono-code text-[#948e9d]">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#45dfa4]"></span>
            <span>mTLS 1.3 • AES-256-GCM</span>
          </div>
          <span>Single Operator Policy</span>
        </div>
      </div>
    </div>
  );
};
