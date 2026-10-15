import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  InterceptedEvent,
  PolicySettings,
  RedTeamRun,
  AuthUser,
} from '../types';
import {
  INITIAL_AUDIT_EVENTS,
  DEFAULT_POLICY_SETTINGS,
} from '../services/kavachEngine';

interface AppContextType {
  currentTab: string;
  setTab: (tab: string) => void;
  activeRole: UserRole;
  currentUser: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  isLoginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
  authNotification: string | null;
  dismissAuthNotification: () => void;
  events: InterceptedEvent[];
  addEvent: (event: InterceptedEvent) => void;
  clearEvents: () => void;
  deleteOlderEvents: (days: number) => void;
  policySettings: PolicySettings;
  updatePolicySettings: (settings: Partial<PolicySettings>) => void;
  connectedModel: {
    provider: string;
    model: string;
    status: 'Online' | 'Testing' | 'Error';
    latencyMs: number;
    lastTested: string;
  };
  testModelConnection: () => Promise<void>;
  sanitizedFilesCount: number;
  incrementSanitizedFiles: () => void;
  latestRedTeamRun: RedTeamRun | null;
  redTeamRunHistory: RedTeamRun[];
  saveRedTeamRun: (run: RedTeamRun) => void;
  guidedDemoStep: number | null;
  startGuidedDemo: () => void;
  nextGuidedDemoStep: () => void;
  endGuidedDemo: () => void;
  architectureModalOpen: boolean;
  setArchitectureModalOpen: (open: boolean) => void;
  draftChatPrompt: string | null;
  setDraftChatPrompt: (prompt: string | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const activeRole: UserRole = 'operator';

  // Auth User State with localStorage persistence
  const defaultInitialUser: AuthUser = {
    id: 'user-01',
    name: 'Vikram Sharma',
    email: 'vikram.sharma@defense.kavach.ai',
    title: 'Lead Security Architect',
    role: 'operator',
    initials: 'VS',
    lastLogin: 'Today, 09:30 IST',
    tokenExpiry: '12h 45m remaining',
  };

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('kavach_auth_user');
      if (stored) {
        return JSON.parse(stored);
      }
      return defaultInitialUser;
    } catch {
      return defaultInitialUser;
    }
  });

  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [authNotification, setAuthNotification] = useState<string | null>(null);

  const login = (user: AuthUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('kavach_auth_user', JSON.stringify(user));
    } catch (e) {
      console.warn('Could not save user to storage', e);
    }
    setAuthNotification(`Signed in as ${user.name} (${user.title})`);
    setTimeout(() => {
      setAuthNotification((prev) => (prev?.includes(user.name) ? null : prev));
    }, 4000);
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('kavach_auth_user');
    } catch (e) {
      console.warn('Could not clear storage', e);
    }
    setAuthNotification('Logged out of Kavach Gateway. Authenticate anytime to manage policies.');
    setTimeout(() => {
      setAuthNotification((prev) => (prev?.includes('Logged out') ? null : prev));
    }, 4500);
  };

  const dismissAuthNotification = () => {
    setAuthNotification(null);
  };

  const [events, setEvents] = useState<InterceptedEvent[]>(INITIAL_AUDIT_EVENTS);
  const [policySettings, setPolicySettings] = useState<PolicySettings>(DEFAULT_POLICY_SETTINGS);
  const [sanitizedFilesCount, setSanitizedFilesCount] = useState<number>(14);

  // Initial synthetic run for Dashboard KPIs
  const initialSyntheticRun: RedTeamRun = {
    id: 'run-init',
    date: 'Today, 14:00',
    timestamp: Date.now() - 3600000,
    total: 40,
    passedCount: 38,
    failedCount: 2,
    detectionRate: 95.0,
    falsePositiveRate: 0.0,
    falseNegativeRate: 5.0,
    fastestBlockMs: 9.8,
    slowestBlockMs: 15.2,
    suiteStats: {
      'Direct injection': { total: 8, passed: 8 },
      'Multi-turn jailbreaks': { total: 5, passed: 5 },
      'Data exfiltration': { total: 6, passed: 6 },
      'Role escalation': { total: 6, passed: 6 },
      'Obfuscated/encoded attacks': { total: 5, passed: 4 },
      'Fake secrets': { total: 4, passed: 4 },
      'Harmless prompts': { total: 6, passed: 5 },
    },
    results: {},
  };

  const [latestRedTeamRun, setLatestRedTeamRun] = useState<RedTeamRun | null>(initialSyntheticRun);
  const [redTeamRunHistory, setRedTeamRunHistory] = useState<RedTeamRun[]>([
    {
      ...initialSyntheticRun,
      id: 'run-prev-2',
      date: 'Yesterday, 18:30',
      timestamp: Date.now() - 86400000,
      detectionRate: 92.5,
      passedCount: 37,
      failedCount: 3,
    },
    {
      ...initialSyntheticRun,
      id: 'run-prev-1',
      date: 'Today, 10:15',
      timestamp: Date.now() - 14400000,
      detectionRate: 95.0,
      passedCount: 38,
      failedCount: 2,
    },
  ]);

  const [connectedModel, setConnectedModel] = useState<{
    provider: string;
    model: string;
    status: 'Online' | 'Testing' | 'Error';
    latencyMs: number;
    lastTested: string;
  }>({
    provider: 'Google Gemini',
    model: 'gemini-2.5-flash',
    status: 'Online',
    latencyMs: 14.2,
    lastTested: 'Just now (T+15ms inline)',
  });

  const [guidedDemoStep, setGuidedDemoStep] = useState<number | null>(null);
  const [architectureModalOpen, setArchitectureModalOpen] = useState(false);
  const [draftChatPrompt, setDraftChatPrompt] = useState<string | null>(null);

  const addEvent = (event: InterceptedEvent) => {
    setEvents((prev) => [event, ...prev]);
  };

  const clearEvents = () => {
    setEvents([]);
  };

  const deleteOlderEvents = (days: number) => {
    const cutoff = Date.now() - days * 86400000;
    setEvents((prev) => prev.slice(0, Math.min(prev.length, 3)));
  };

  const updatePolicySettings = (newSettings: Partial<PolicySettings>) => {
    setPolicySettings((prev) => ({ ...prev, ...newSettings }));
  };

  const testModelConnection = async () => {
    setConnectedModel((prev) => ({ ...prev, status: 'Testing' }));
    await new Promise((r) => setTimeout(r, 600));
    setConnectedModel((prev) => ({
      ...prev,
      status: 'Online',
      latencyMs: +(12.5 + Math.random() * 3).toFixed(1),
      lastTested: new Date().toLocaleTimeString('en-US', { hour12: false }),
    }));
  };

  const incrementSanitizedFiles = () => {
    setSanitizedFilesCount((prev) => prev + 1);
  };

  const saveRedTeamRun = (run: RedTeamRun) => {
    setLatestRedTeamRun(run);
    setRedTeamRunHistory((prev) => [run, ...prev]);
  };

  const startGuidedDemo = () => {
    setGuidedDemoStep(1);
    setCurrentTab('protected-chat');
  };

  const nextGuidedDemoStep = () => {
    if (guidedDemoStep === null) return;
    if (guidedDemoStep < 6) {
      const next = guidedDemoStep + 1;
      setGuidedDemoStep(next);
      if (next === 4) setCurrentTab('documents');
      if (next === 5) setCurrentTab('documents');
      if (next === 6) setCurrentTab('red-team');
    } else {
      setGuidedDemoStep(null);
    }
  };

  const endGuidedDemo = () => {
    setGuidedDemoStep(null);
  };

  return (
    <AppContext.Provider
      value={{
        currentTab,
        setTab: setCurrentTab,
        activeRole,
        currentUser,
        login,
        logout,
        isLoginModalOpen,
        setLoginModalOpen,
        authNotification,
        dismissAuthNotification,
        events,
        addEvent,
        clearEvents,
        deleteOlderEvents,
        policySettings,
        updatePolicySettings,
        connectedModel,
        testModelConnection,
        sanitizedFilesCount,
        incrementSanitizedFiles,
        latestRedTeamRun,
        redTeamRunHistory,
        saveRedTeamRun,
        guidedDemoStep,
        startGuidedDemo,
        nextGuidedDemoStep,
        endGuidedDemo,
        architectureModalOpen,
        setArchitectureModalOpen,
        draftChatPrompt,
        setDraftChatPrompt,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
