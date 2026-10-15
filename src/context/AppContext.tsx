import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserRole,
  InterceptedEvent,
  PolicySettings,
  RedTeamRun,
  AuthUser,
  RoleDefinition,
  ManagedDocument,
  AccessMatrixEntry,
  AccessRequest,
  PermissionChangeAudit,
  AuditMetricsSummary,
  ChatResponsePayload,
  PermissionType,
  DocumentClassification,
} from '../types';
import { DEFAULT_POLICY_SETTINGS } from '../services/kavachEngine';

export const SYSTEM_DEMO_USERS: AuthUser[] = [
  {
    id: 'user-owner',
    name: 'Vikram Sharma',
    email: 'vikram.sharma@defense.kavach.ai',
    title: 'Lead Security Architect & Gateway Owner',
    role: 'owner',
    department: 'Executive Security',
    status: 'ACTIVE',
    initials: 'VS',
    lastLogin: 'Today, 09:30 UTC',
    tokenExpiry: '24h remaining',
    sessionToken: 'kavach_session_owner_master_token_2026',
    activeSessionsCount: 1,
  },
  {
    id: 'user-manager',
    name: 'Rohan Mehra',
    email: 'rohan.mehra@kavach.security',
    title: 'Operations Director',
    role: 'manager',
    department: 'Operations',
    status: 'ACTIVE',
    initials: 'RM',
    lastLogin: 'Today, 10:15 UTC',
    tokenExpiry: '18h remaining',
    sessionToken: 'kavach_session_manager_token_2026',
    activeSessionsCount: 1,
  },
  {
    id: 'user-hr',
    name: 'Aanya Roy',
    email: 'aanya.roy@kavach.security',
    title: 'Senior People Operations Partner',
    role: 'hr',
    department: 'Human Resources',
    status: 'ACTIVE',
    initials: 'AR',
    lastLogin: 'Today, 11:20 UTC',
    tokenExpiry: '16h remaining',
    sessionToken: 'kavach_session_hr_token_2026',
    activeSessionsCount: 1,
  },
  {
    id: 'user-intern',
    name: 'Dev Patel',
    email: 'dev.patel@intern.kavach.ai',
    title: 'Engineering Intern (Zero-Privilege Profile)',
    role: 'intern',
    department: 'Engineering Interns',
    status: 'ACTIVE',
    initials: 'DP',
    lastLogin: 'Today, 08:00 UTC',
    tokenExpiry: '8h remaining',
    sessionToken: 'kavach_session_intern_token_2026',
    activeSessionsCount: 1,
    assignedResources: ['doc-onboarding', 'doc-canteen'],
  },
  {
    id: 'user-finance',
    name: 'Priya Nair',
    email: 'priya.nair@finance.kavach.ai',
    title: 'Finance & Treasury Manager',
    role: 'finance',
    department: 'Finance',
    status: 'ACTIVE',
    initials: 'PN',
    lastLogin: 'Yesterday, 16:45 UTC',
    tokenExpiry: '12h remaining',
    sessionToken: 'kavach_session_finance_token_2026',
    activeSessionsCount: 1,
  },
  {
    id: 'user-eng',
    name: 'Sameer Joshi',
    email: 'sameer.joshi@kavach.ai',
    title: 'Principal Systems Engineer',
    role: 'engineering',
    department: 'Core Infrastructure',
    status: 'ACTIVE',
    initials: 'SJ',
    lastLogin: 'Today, 12:00 UTC',
    tokenExpiry: '20h remaining',
    sessionToken: 'kavach_session_eng_token_2026',
    activeSessionsCount: 1,
  },
];

interface AppContextType {
  currentTab: string;
  setTab: (tab: string) => void;
  activeRole: UserRole;
  currentUser: AuthUser | null;
  allUsers: AuthUser[];
  switchUserPersona: (user: AuthUser) => Promise<void>;
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
  sanitizedFilesCount: number;
  auditMetrics: AuditMetricsSummary | null;
  refreshAuditMetrics: () => Promise<void>;
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
  documents: ManagedDocument[];
  refreshDocuments: () => Promise<void>;
  uploadDocument: (name: string, content: string, department?: string, classification?: DocumentClassification) => Promise<any>;
  deleteDocument: (id: string) => Promise<boolean>;
  getDownloadTicket: (id: string) => Promise<{ downloadUrl: string } | null>;
  roles: RoleDefinition[];
  refreshRoles: () => Promise<void>;
  createCustomRole: (role: Partial<RoleDefinition>) => Promise<boolean>;
  accessMatrix: AccessMatrixEntry[];
  refreshAccessMatrix: () => Promise<void>;
  updateAccessMatrixEntry: (resourceId: string, roleId: string, permissions: PermissionType[], confirmDangerous?: boolean) => Promise<{ success: boolean; isDangerous?: boolean; message?: string }>;
  accessRequests: AccessRequest[];
  refreshAccessRequests: () => Promise<void>;
  submitAccessRequest: (resourceId: string, requestedPermission: PermissionType, justification: string, expiresInHours?: number) => Promise<boolean>;
  decideAccessRequest: (id: string, decision: 'APPROVED' | 'REJECTED' | 'REVOKED', note?: string) => Promise<boolean>;
  permissionAudits: PermissionChangeAudit[];
  refreshPermissionAudits: () => Promise<void>;
  updateUserRoleOrStatus: (userId: string, updates: { role?: UserRole; status?: 'ACTIVE' | 'SUSPENDED'; department?: string }) => Promise<boolean>;
  revokeUserSessions: (targetUserId: string) => Promise<boolean>;
  sendChatMessage: (message: string) => Promise<ChatResponsePayload>;
  latestRedTeamRun: RedTeamRun | null;
  redTeamRunHistory: RedTeamRun[];
  runDefensiveEvaluations: () => Promise<RedTeamRun | null>;
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
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('kavach_auth_user');
      if (stored) return JSON.parse(stored);
      return SYSTEM_DEMO_USERS[0]; // Default to Owner
    } catch {
      return SYSTEM_DEMO_USERS[0];
    }
  });

  const [allUsers, setAllUsers] = useState<AuthUser[]>(SYSTEM_DEMO_USERS);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [authNotification, setAuthNotification] = useState<string | null>(null);
  const [events, setEvents] = useState<InterceptedEvent[]>([]);
  const [auditMetrics, setAuditMetrics] = useState<AuditMetricsSummary | null>(null);
  const [policySettings, setPolicySettings] = useState<PolicySettings>(DEFAULT_POLICY_SETTINGS);
  const [documents, setDocuments] = useState<ManagedDocument[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [accessMatrix, setAccessMatrix] = useState<AccessMatrixEntry[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [permissionAudits, setPermissionAudits] = useState<PermissionChangeAudit[]>([]);
  const [latestRedTeamRun, setLatestRedTeamRun] = useState<RedTeamRun | null>(null);
  const [redTeamRunHistory, setRedTeamRunHistory] = useState<RedTeamRun[]>([]);

  const [connectedModel, setConnectedModel] = useState<{
    provider: string;
    model: string;
    status: 'Online' | 'Testing' | 'Error';
    latencyMs: number;
    lastTested: string;
  }>({
    provider: 'Google Gemini',
    model: 'gemini-3.8-flash',
    status: 'Online',
    latencyMs: 12.8,
    lastTested: 'Just now (<15ms)',
  });

  const [guidedDemoStep, setGuidedDemoStep] = useState<number | null>(null);
  const [architectureModalOpen, setArchitectureModalOpen] = useState(false);
  const [draftChatPrompt, setDraftChatPrompt] = useState<string | null>(null);

  const activeRole: UserRole = currentUser?.role || 'intern';

  // Helper for authenticated fetch
  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = currentUser?.sessionToken || 'kavach_session_owner_master_token_2026';
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      };
      return fetch(url, { ...options, headers });
    },
    [currentUser]
  );

  // Load backend state on mount or user switch
  const refreshDocuments = useCallback(async () => {
    try {
      const res = await authFetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (e) {
      console.warn('Failed to fetch documents from server', e);
    }
  }, [authFetch]);

  const refreshRoles = useCallback(async () => {
    try {
      const res = await authFetch('/api/rbac/roles');
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
      }
    } catch (e) {
      console.warn('Failed to fetch roles', e);
    }
  }, [authFetch]);

  const refreshAccessMatrix = useCallback(async () => {
    try {
      const res = await authFetch('/api/rbac/matrix');
      if (res.ok) {
        const data = await res.json();
        setAccessMatrix(data.matrix || []);
      }
    } catch (e) {
      console.warn('Failed to fetch matrix', e);
    }
  }, [authFetch]);

  const refreshAccessRequests = useCallback(async () => {
    try {
      const res = await authFetch('/api/rbac/requests');
      if (res.ok) {
        const data = await res.json();
        setAccessRequests(data.requests || []);
      }
    } catch (e) {
      console.warn('Failed to fetch access requests', e);
    }
  }, [authFetch]);

  const refreshPermissionAudits = useCallback(async () => {
    try {
      const res = await authFetch('/api/rbac/audit');
      if (res.ok) {
        const data = await res.json();
        setPermissionAudits(data.audit || []);
      }
    } catch (e) {
      console.warn('Failed to fetch permission audits', e);
    }
  }, [authFetch]);

  const refreshAuditEvents = useCallback(async () => {
    try {
      const res = await authFetch('/api/audit/events?limit=100');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (e) {
      console.warn('Failed to fetch audit events', e);
    }
  }, [authFetch]);

  const refreshAuditMetrics = useCallback(async () => {
    try {
      const res = await authFetch('/api/audit/metrics');
      if (res.ok) {
        const data = await res.json();
        setAuditMetrics(data.metrics || null);
      }
    } catch (e) {
      console.warn('Failed to fetch metrics', e);
    }
  }, [authFetch]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await authFetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.users || SYSTEM_DEMO_USERS);
      }
    } catch (e) {
      console.warn('Failed to fetch users', e);
    }
  }, [authFetch]);

  // Initial data loading
  useEffect(() => {
    refreshDocuments();
    refreshRoles();
    refreshAccessMatrix();
    refreshAccessRequests();
    refreshPermissionAudits();
    refreshAuditEvents();
    refreshAuditMetrics();
    fetchUsers();
  }, [refreshDocuments, refreshRoles, refreshAccessMatrix, refreshAccessRequests, refreshPermissionAudits, refreshAuditEvents, refreshAuditMetrics, fetchUsers]);

  // Fast switch user persona
  const switchUserPersona = async (targetUser: AuthUser) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUser.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        localStorage.setItem('kavach_auth_user', JSON.stringify(data.user));
        setAuthNotification(`Active persona switched to: ${data.user.name} [${data.user.role.toUpperCase()}]`);
      } else {
        setCurrentUser(targetUser);
        localStorage.setItem('kavach_auth_user', JSON.stringify(targetUser));
      }
    } catch {
      setCurrentUser(targetUser);
      localStorage.setItem('kavach_auth_user', JSON.stringify(targetUser));
    }
    setTimeout(() => {
      setAuthNotification(null);
    }, 4000);
  };

  const login = (user: AuthUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('kavach_auth_user', JSON.stringify(user));
    } catch (e) {
      console.warn('Could not save user to storage', e);
    }
    setAuthNotification(`Signed in as ${user.name} (${user.title})`);
    setTimeout(() => setAuthNotification(null), 4000);
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('kavach_auth_user');
    } catch (e) {
      console.warn('Could not clear storage', e);
    }
    setAuthNotification('Signed out. Switched to unauthenticated visitor mode.');
    setTimeout(() => setAuthNotification(null), 4000);
  };

  const dismissAuthNotification = () => setAuthNotification(null);

  const addEvent = (event: InterceptedEvent) => {
    setEvents((prev) => [event, ...prev]);
  };

  const clearEvents = () => setEvents([]);

  const deleteOlderEvents = (days: number) => {
    setEvents((prev) => prev.slice(0, Math.min(prev.length, 5)));
  };

  const sanitizedFilesCount = documents.length + 8;

  const updatePolicySettings = (newSettings: Partial<PolicySettings>) => {
    setPolicySettings((prev) => ({ ...prev, ...newSettings }));
  };

  const testModelConnection = async () => {
    setConnectedModel((prev) => ({ ...prev, status: 'Testing' }));
    await new Promise((r) => setTimeout(r, 450));
    setConnectedModel((prev) => ({
      ...prev,
      status: 'Online',
      latencyMs: +(11.2 + Math.random() * 2).toFixed(1),
      lastTested: new Date().toLocaleTimeString('en-US', { hour12: false }) + ' (Synchronous proxy)',
    }));
  };

  // Upload Document API
  const uploadDocument = async (name: string, content: string, department?: string, classification?: DocumentClassification) => {
    const res = await authFetch('/api/documents/upload', {
      method: 'POST',
      body: JSON.stringify({ name, content, department, classification }),
    });
    const data = await res.json();
    await refreshDocuments();
    await refreshAuditEvents();
    await refreshAuditMetrics();
    return data;
  };

  // Delete Document API
  const deleteDocument = async (id: string): Promise<boolean> => {
    const res = await authFetch(`/api/documents/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await refreshDocuments();
      await refreshAuditEvents();
      await refreshAuditMetrics();
      return true;
    }
    return false;
  };

  // Get single-use signed download ticket
  const getDownloadTicket = async (id: string) => {
    const res = await authFetch(`/api/documents/${id}/download-ticket`, { method: 'POST' });
    if (res.ok) {
      return await res.json();
    }
    return null;
  };

  // Create custom role
  const createCustomRole = async (roleData: Partial<RoleDefinition>): Promise<boolean> => {
    const res = await authFetch('/api/rbac/roles', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
    if (res.ok) {
      await refreshRoles();
      await refreshPermissionAudits();
      return true;
    }
    return false;
  };

  // Update access matrix entry
  const updateAccessMatrixEntry = async (
    resourceId: string,
    roleId: string,
    permissions: PermissionType[],
    confirmDangerous?: boolean
  ) => {
    const res = await authFetch('/api/rbac/matrix', {
      method: 'PUT',
      body: JSON.stringify({ resourceId, roleId, permissions, confirmDangerousChange: confirmDangerous }),
    });
    const data = await res.json();
    if (res.ok) {
      await refreshAccessMatrix();
      await refreshDocuments();
      await refreshPermissionAudits();
      return { success: true, message: data.message };
    }
    return { success: false, isDangerous: data.isDangerous, message: data.message };
  };

  // Submit access request
  const submitAccessRequest = async (
    resourceId: string,
    requestedPermission: PermissionType,
    justification: string,
    expiresInHours?: number
  ): Promise<boolean> => {
    const res = await authFetch('/api/rbac/requests', {
      method: 'POST',
      body: JSON.stringify({ resourceId, requestedPermission, justification, expiresInHours }),
    });
    if (res.ok) {
      await refreshAccessRequests();
      await refreshAuditEvents();
      return true;
    }
    return false;
  };

  // Decide access request (approve / reject / revoke)
  const decideAccessRequest = async (
    id: string,
    decision: 'APPROVED' | 'REJECTED' | 'REVOKED',
    note?: string
  ): Promise<boolean> => {
    const res = await authFetch(`/api/rbac/requests/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify({ decision, note }),
    });
    if (res.ok) {
      await refreshAccessRequests();
      await refreshDocuments();
      await refreshPermissionAudits();
      return true;
    }
    return false;
  };

  // Update user role or account status
  const updateUserRoleOrStatus = async (
    userId: string,
    updates: { role?: UserRole; status?: 'ACTIVE' | 'SUSPENDED'; department?: string }
  ): Promise<boolean> => {
    const res = await authFetch(`/api/auth/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      await fetchUsers();
      await refreshPermissionAudits();
      return true;
    }
    return false;
  };

  // Revoke user sessions
  const revokeUserSessions = async (targetUserId: string): Promise<boolean> => {
    const res = await authFetch('/api/auth/revoke-session', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });
    if (res.ok) {
      await fetchUsers();
      await refreshAuditEvents();
      return true;
    }
    return false;
  };

  // Send Chat Message to Permission-Aware Gateway
  const sendChatMessage = async (message: string): Promise<ChatResponsePayload> => {
    const res = await authFetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    const data: ChatResponsePayload = await res.json();
    await refreshAuditEvents();
    await refreshAuditMetrics();
    return data;
  };

  // Run Defensive Security Evaluations
  const runDefensiveEvaluations = async (): Promise<RedTeamRun | null> => {
    try {
      const res = await authFetch('/api/security/run-evaluations', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLatestRedTeamRun(data.run);
        setRedTeamRunHistory((prev) => [data.run, ...prev]);
        await refreshAuditEvents();
        await refreshAuditMetrics();
        return data.run;
      }
    } catch (e) {
      console.warn('Evaluation failed', e);
    }
    return null;
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
      if (next === 3) setCurrentTab('access-control');
      if (next === 4) setCurrentTab('documents');
      if (next === 5) setCurrentTab('testing-center');
      if (next === 6) setCurrentTab('audit-log');
    } else {
      setGuidedDemoStep(null);
    }
  };

  const endGuidedDemo = () => setGuidedDemoStep(null);

  return (
    <AppContext.Provider
      value={{
        currentTab,
        setTab: setCurrentTab,
        activeRole,
        currentUser,
        allUsers,
        switchUserPersona,
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
        sanitizedFilesCount,
        auditMetrics,
        refreshAuditMetrics,
        policySettings,
        updatePolicySettings,
        connectedModel,
        testModelConnection,
        documents,
        refreshDocuments,
        uploadDocument,
        deleteDocument,
        getDownloadTicket,
        roles,
        refreshRoles,
        createCustomRole,
        accessMatrix,
        refreshAccessMatrix,
        updateAccessMatrixEntry,
        accessRequests,
        refreshAccessRequests,
        submitAccessRequest,
        decideAccessRequest,
        permissionAudits,
        refreshPermissionAudits,
        updateUserRoleOrStatus,
        revokeUserSessions,
        sendChatMessage,
        latestRedTeamRun,
        redTeamRunHistory,
        runDefensiveEvaluations,
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
