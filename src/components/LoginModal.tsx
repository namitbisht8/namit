import React, { useState } from 'react';
import { useApp, SYSTEM_DEMO_USERS } from '../context/AppContext';
import { AuthUser, UserRole } from '../types';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setLoginModalOpen, switchUserPersona, login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isLoginModalOpen) return null;

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide a valid enterprise email address.');
      return;
    }
    if (!password.trim() || password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setStatusText('Handshaking with Zero-Trust Enclave...');

    await new Promise((r) => setTimeout(r, 300));
    setStatusText('Validating role permissions and hardware tokens...');
    await new Promise((r) => setTimeout(r, 350));

    // Check if email matches existing demo user
    const existing = SYSTEM_DEMO_USERS.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (existing) {
      await switchUserPersona(existing);
    } else {
      const username = email.split('@')[0];
      const formattedName = username
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      const initials =
        formattedName
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'OP';

      const customUser: AuthUser = {
        id: 'user-' + Date.now().toString(36),
        name: formattedName || 'Enclave Operator',
        email: email.trim(),
        title: `${selectedRole.toUpperCase()} Analyst`,
        role: selectedRole,
        department: selectedRole === 'owner' ? 'Executive Security' : selectedRole === 'hr' ? 'Human Resources' : selectedRole === 'finance' ? 'Finance' : 'Operations',
        status: 'ACTIVE',
        initials,
        lastLogin: 'Just now (UTC)',
        tokenExpiry: '24h remaining',
        sessionToken: `kavach_custom_${Date.now()}`,
        activeSessionsCount: 1,
      };

      login(customUser);
    }

    setIsLoading(false);
    setLoginModalOpen(false);
  };

  const handleQuickLogin = async (user: AuthUser) => {
    setError(null);
    setIsLoading(true);
    setStatusText(`Authenticating as ${user.name} [${user.role.toUpperCase()}]...`);
    await switchUserPersona(user);
    setIsLoading(false);
    setLoginModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="max-w-lg w-full p-6 sm:p-7 rounded-[26px] bg-[#1b1f2e] shadow-[12px_12px_28px_#0b0e17,-12px_-12px_28px_#272d43] border border-[#2a3044] relative space-y-5"
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
          <div className="w-10 h-10 rounded-2xl bg-[#171b29] border border-[#00E5FF]/40 flex items-center justify-center">
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
              Sign In to Kavach Enclave
            </h2>
            <p className="text-[11px] text-[#948e9d] font-mono-code">
              Role-Based Access Control & Threat Gateway Authentication
            </p>
          </div>
        </div>

        {/* 1-Click Role Personas for instant RBAC demonstration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono-code text-[10px] uppercase tracking-wider text-[#948e9d] font-semibold">
              Instant 1-Click Persona Sign-In:
            </span>
            <span className="font-mono-code text-[10px] text-[#45dfa4]">
              Zero-Trust Verification
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {SYSTEM_DEMO_USERS.map((u) => (
              <button
                key={u.id}
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin(u)}
                className="p-2.5 rounded-xl bg-[#171b29] hover:bg-[#1f2438] border border-[#2a3044] hover:border-[#a78bfa]/50 transition-all text-left group disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#1b1f2e] border border-[#a78bfa]/40 flex items-center justify-center font-headline text-[10px] font-bold text-[#a78bfa]">
                    {u.initials}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[12px] font-bold text-[#dfe1f6] truncate group-hover:text-[#a78bfa]">
                      {u.name}
                    </div>
                    <div className="text-[9px] font-mono-code text-[#00E5FF] uppercase font-semibold">
                      {u.role}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[#2a3044]/80"></div>
          <span className="text-[10px] font-mono-code text-[#948e9d] uppercase tracking-wider">
            Or Sign In With Custom Role
          </span>
          <div className="h-px flex-1 bg-[#2a3044]/80"></div>
        </div>

        {/* Custom Login Form */}
        <form onSubmit={handleCustomLogin} className="space-y-3">
          {error && (
            <div className="p-2.5 rounded-xl bg-[#fb7185]/10 border border-[#fb7185]/40 text-[#fb7185] text-[11px] font-mono-code flex items-center gap-2">
              <span className="material-symbols-outlined text-[15px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono-code text-[#cac4d4] mb-1">
                Select Desired Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 rounded-xl bg-[#171b29] border border-[#2a3044] text-[12px] font-mono-code text-[#dfe1f6]"
              >
                <option value="owner">Owner / Super Admin</option>
                <option value="manager">Manager</option>
                <option value="hr">Human Resources</option>
                <option value="intern">Intern (Minimal Access)</option>
                <option value="finance">Finance</option>
                <option value="engineering">Engineering</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono-code text-[#cac4d4] mb-1">
                Operator Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@kavach.ai"
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-xl bg-[#171b29] border border-[#2a3044] text-[#dfe1f6] text-[12px] font-mono-code"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono-code text-[#cac4d4] mb-1">
              Enclave Password / Token
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-xl bg-[#171b29] border border-[#2a3044] text-[#dfe1f6] text-[12px] font-mono-code pr-10"
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
                className="w-3.5 h-3.5 rounded bg-[#171b29] border-[#2a3044] text-[#a78bfa]"
              />
              <span>Remember session</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setEmail('vikram.sharma@defense.kavach.ai');
                setPassword('kavach-master-key-2026');
                setSelectedRole('owner');
              }}
              className="text-[#00E5FF] hover:underline"
            >
              Fill Owner Creds
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#00E5FF] text-[#11141F] font-bold text-[13px] font-headline hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-[#11141F] border-t-transparent animate-spin"></span>
                <span>{statusText || 'Authenticating...'}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[17px]">login</span>
                <span>Authenticate & Enforce Permissions</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-[#252a3b] flex items-center justify-between text-[10px] font-mono-code text-[#948e9d]">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#45dfa4]"></span>
            <span>mTLS 1.3 • Deny-by-default RBAC</span>
          </div>
          <span>Ephemeral Session Tokens</span>
        </div>
      </div>
    </div>
  );
};
