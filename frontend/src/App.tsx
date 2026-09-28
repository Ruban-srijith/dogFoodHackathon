import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Server, 
  Database, 
  Layout, 
  Activity, 
  ShieldCheck, 
  Radio,
  Key,
  Trophy,
  Calendar,
  Lock,
  Unlock,
  UserCheck
} from 'lucide-react';

interface HealthResponse {
  status: string;
  [key: string]: any;
}

interface OverviewData {
  counts: {
    users: number;
    events: number;
    tracks: number;
    prizes: number;
    teams: number;
    projects: number;
  };
  event: any;
  tracks: any[];
  prizes: any[];
  teams: any[];
  projects: any[];
  testCredentials: {
    role: string;
    email: string;
    password: string;
    name: string;
  }[];
}

interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: string;
  full_name: string;
}

export const App: React.FC = () => {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [activeUrl, setActiveUrl] = useState<string>('/api/health');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Authentication State
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [rbacTestResult, setRbacTestResult] = useState<{
    route: string;
    status: number;
    statusText: string;
    payload: any;
  } | null>(null);
  const [testingRoute, setTestingRoute] = useState<boolean>(false);

  const getBaseApiUrl = () => {
    return import.meta.env.VITE_API_URL || '';
  };

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    const start = performance.now();

    const envUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/health` : null;
    const candidates = [
      envUrl,
      '/api/health',
      'http://localhost:5000/api/health',
    ].filter(Boolean) as string[];

    let success = false;
    let lastErrorMsg = '';

    for (const url of candidates) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (response.ok) {
          const json = await response.json();
          const elapsed = Math.round(performance.now() - start);
          setData(json);
          setLatency(elapsed);
          setLastUpdated(new Date().toLocaleTimeString());
          setActiveUrl(url);
          success = true;
          break;
        } else {
          lastErrorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
        }
      } catch (err: any) {
        lastErrorMsg = err?.message || 'Failed to connect to backend';
      }
    }

    if (!success) {
      setError(lastErrorMsg || 'Backend healthcheck unreachable');
      setData(null);
      setLatency(null);
    }
    setLoading(false);
  }, []);

  const fetchOverview = useCallback(async () => {
    const envUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/overview` : null;
    const candidates = [
      envUrl,
      '/api/overview',
      'http://localhost:5000/api/overview'
    ].filter(Boolean) as string[];

    for (const url of candidates) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          setOverview(json);
          break;
        }
      } catch {
        // continue
      }
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    fetchOverview();
  }, [fetchHealth, fetchOverview]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchHealth();
      fetchOverview();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchHealth, fetchOverview]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Quick Login Handler
  const handleLogin = async (email: string, password: string) => {
    setTestingRoute(true);
    try {
      const base = getBaseApiUrl();
      const res = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const resData = await res.json();
      if (res.ok && resData.token) {
        setAuthToken(resData.token);
        setAuthUser(resData.user);
        localStorage.setItem('auth_token', resData.token);
        localStorage.setItem('auth_user', JSON.stringify(resData.user));
        setRbacTestResult({
          route: '/api/auth/login',
          status: res.status,
          statusText: '200 OK',
          payload: resData
        });
      } else {
        setRbacTestResult({
          route: '/api/auth/login',
          status: res.status,
          statusText: `${res.status} ${res.statusText}`,
          payload: resData
        });
      }
    } catch (err: any) {
      setRbacTestResult({
        route: '/api/auth/login',
        status: 500,
        statusText: 'Network Error',
        payload: { error: err.message }
      });
    } finally {
      setTestingRoute(false);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      const base = getBaseApiUrl();
      await fetch(`${base}/api/auth/logout`, { method: 'POST' });
    } catch {
      // ignore
    }
    setAuthToken(null);
    setAuthUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setRbacTestResult({
      route: '/api/auth/logout',
      status: 200,
      statusText: '200 OK',
      payload: { message: 'Logged out successfully' }
    });
  };

  // Test Role Route Handler (Verifies 200, 401, or 403)
  const testRoleRoute = async (endpoint: string) => {
    setTestingRoute(true);
    try {
      const base = getBaseApiUrl();
      const headers: Record<string, string> = {
        'Accept': 'application/json'
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`${base}${endpoint}`, {
        method: 'GET',
        headers
      });

      const resData = await res.json().catch(() => ({}));
      setRbacTestResult({
        route: endpoint,
        status: res.status,
        statusText: `${res.status} ${res.statusText || (res.status === 200 ? 'OK' : res.status === 401 ? 'Unauthorized' : 'Forbidden')}`,
        payload: resData
      });
    } catch (err: any) {
      setRbacTestResult({
        route: endpoint,
        status: 500,
        statusText: 'Fetch Error',
        payload: { error: err.message }
      });
    } finally {
      setTestingRoute(false);
    }
  };

  const isHealthy = data?.status === 'ok';

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black">
      {/* Background ambient gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-emerald-500/10 via-cyan-500/5 to-transparent blur-3xl rounded-full" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">Full-Stack Compose</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">v1.0</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded accent-emerald-500 cursor-pointer"
              />
              <span>Auto-poll (5s)</span>
            </label>

            <button
              onClick={() => { fetchHealth(); fetchOverview(); }}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Pinging...' : 'Ping Now'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Banner Section */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            Zero-Manual-Step Docker Compose Architecture
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Service Health Status
          </h1>
          <p className="text-slate-400 text-sm">
            Continuous health monitoring across React + Vite, Node + Express, and MongoDB.
          </p>
        </div>

        {/* Primary Health Status Card */}
        <div className={`rounded-2xl border p-6 sm:p-8 backdrop-blur-xl transition-all duration-300 ${
          isHealthy
            ? 'bg-slate-900/60 border-emerald-500/30 shadow-xl shadow-emerald-500/5'
            : 'bg-slate-900/60 border-rose-500/30 shadow-xl shadow-rose-500/5'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="flex items-start sm:items-center gap-4">
              <div className={`p-3 rounded-2xl ${
                isHealthy
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {isHealthy ? (
                  <CheckCircle2 className="w-8 h-8" />
                ) : (
                  <XCircle className="w-8 h-8" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                    GET /api/health
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    isHealthy
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {isHealthy ? 'ONLINE' : 'UNREACHABLE'}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white mt-1">
                  {isHealthy ? 'All Systems Operational' : 'Health Check Alert'}
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="bg-slate-950/70 border border-slate-800 px-3.5 py-2 rounded-xl">
                <span className="text-slate-400 block">Response Latency</span>
                <span className="font-mono font-bold text-slate-200 text-sm">
                  {latency !== null ? `${latency} ms` : '—'}
                </span>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 px-3.5 py-2 rounded-xl">
                <span className="text-slate-400 block">Last Check</span>
                <span className="font-mono font-bold text-slate-200 text-sm">
                  {lastUpdated || 'Initial check...'}
                </span>
              </div>
            </div>
          </div>

          {/* Details & Payload */}
          <div className="pt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Endpoint Diagnostics
              </h3>
              <div className="bg-slate-950/70 rounded-xl border border-slate-800 p-4 space-y-2.5 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Target URL</span>
                  <span className="text-emerald-400 font-medium">{activeUrl}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">HTTP Status</span>
                  <span className={isHealthy ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {isHealthy ? '200 OK' : 'Connection Failed'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Offline Isolation</span>
                  <span className="text-cyan-400">Strict Localhost (Zero Cloud APIs)</span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
                  <strong>Error detail:</strong> {error}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Live Response Payload
              </h3>
              <div className="bg-slate-950/70 rounded-xl border border-slate-800 p-4 font-mono text-xs">
                {data ? (
                  <pre className="text-emerald-400 overflow-x-auto">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                ) : (
                  <div className="text-slate-400 py-3">No payload received</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE AUTH & ROLE-BASED ACCESS CONTROL (RBAC) TEST PANEL */}
        {/* ========================================================================= */}
        <div className="border border-slate-800 bg-slate-900/50 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-cyan-400" />
                Backend Authentication & RBAC Middleware Tester
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Verify 401 Unauthorized (unauthenticated) and 403 Forbidden (wrong role) on backend routes.
              </p>
            </div>

            {authUser ? (
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <UserCheck className="w-3.5 h-3.5" />
                  {authUser.email} ({authUser.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                <Unlock className="w-3.5 h-3.5 text-amber-400" />
                Not Logged In (Unauthenticated)
              </span>
            )}
          </div>

          {/* Quick Login Bar */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Quick Login as Seeded Role:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => handleLogin('admin@dogfood.local', 'AdminPassword123!')}
                className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-left transition"
              >
                <div className="text-[11px] font-bold text-rose-300">ADMIN</div>
                <div className="text-[10px] text-slate-400 truncate">admin@dogfood.local</div>
              </button>

              <button
                onClick={() => handleLogin('organizer@dogfood.local', 'OrganizerPassword123!')}
                className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-left transition"
              >
                <div className="text-[11px] font-bold text-amber-300">ORGANIZER</div>
                <div className="text-[10px] text-slate-400 truncate">organizer@dogfood.local</div>
              </button>

              <button
                onClick={() => handleLogin('judge1@dogfood.local', 'JudgeOnePassword123!')}
                className="p-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-left transition"
              >
                <div className="text-[11px] font-bold text-purple-300">JUDGE</div>
                <div className="text-[10px] text-slate-400 truncate">judge1@dogfood.local</div>
              </button>

              <button
                onClick={() => handleLogin('alice@dogfood.local', 'AlicePassword123!')}
                className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-left transition"
              >
                <div className="text-[11px] font-bold text-emerald-300">PARTICIPANT</div>
                <div className="text-[10px] text-slate-400 truncate">alice@dogfood.local</div>
              </button>
            </div>
          </div>

          {/* Test Role-Protected Route Buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Test Role Enforcement on Backend Endpoints:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => testRoleRoute('/api/participant/dashboard')}
                disabled={testingRoute}
                className="p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-emerald-500/40 text-left transition group"
              >
                <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400">/api/participant/dashboard</div>
                <div className="text-[10px] text-slate-500 mt-1">Requires: PARTICIPANT or ADMIN</div>
              </button>

              <button
                onClick={() => testRoleRoute('/api/judge/evaluations')}
                disabled={testingRoute}
                className="p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-purple-500/40 text-left transition group"
              >
                <div className="text-xs font-semibold text-slate-200 group-hover:text-purple-400">/api/judge/evaluations</div>
                <div className="text-[10px] text-slate-500 mt-1">Requires: JUDGE or ADMIN</div>
              </button>

              <button
                onClick={() => testRoleRoute('/api/organizer/events')}
                disabled={testingRoute}
                className="p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-amber-500/40 text-left transition group"
              >
                <div className="text-xs font-semibold text-slate-200 group-hover:text-amber-400">/api/organizer/events</div>
                <div className="text-[10px] text-slate-500 mt-1">Requires: ORGANIZER or ADMIN</div>
              </button>

              <button
                onClick={() => testRoleRoute('/api/admin/system')}
                disabled={testingRoute}
                className="p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-rose-500/40 text-left transition group"
              >
                <div className="text-xs font-semibold text-slate-200 group-hover:text-rose-400">/api/admin/system</div>
                <div className="text-[10px] text-slate-500 mt-1">Requires: ADMIN exclusively</div>
              </button>
            </div>
          </div>

          {/* Test Result Display */}
          {rbacTestResult && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-slate-900">
                <span className="text-slate-400">Tested Route: <strong className="text-white">{rbacTestResult.route}</strong></span>
                <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                  rbacTestResult.status === 200 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  rbacTestResult.status === 403 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  HTTP {rbacTestResult.statusText}
                </span>
              </div>
              <pre className="text-slate-300 overflow-x-auto text-[11px] pt-1">
                {JSON.stringify(rbacTestResult.payload, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* 3 Services Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Microservice Topology (3 Services)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Service 1: Frontend */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Layout className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">frontend</h4>
                <p className="text-slate-400 text-xs mt-0.5">React + Vite (SPA)</p>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Port:</span>
                  <span className="font-mono text-slate-300">5173 / 80</span>
                </div>
                <div className="flex justify-between">
                  <span>Environment:</span>
                  <span className="text-slate-300">Client-Side</span>
                </div>
              </div>
            </div>

            {/* Service 2: Backend */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Server className="w-5 h-5" />
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  isHealthy
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {isHealthy ? 'Healthy' : 'Waiting...'}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">backend</h4>
                <p className="text-slate-400 text-xs mt-0.5">Node + Express (API + RBAC)</p>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Port:</span>
                  <span className="font-mono text-slate-300">5000</span>
                </div>
                <div className="flex justify-between">
                  <span>Health Route:</span>
                  <span className="font-mono text-emerald-400">/api/health</span>
                </div>
              </div>
            </div>

            {/* Service 3: Database */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Database className="w-5 h-5" />
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  isHealthy
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {isHealthy ? 'Connected' : 'Initializing'}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">database</h4>
                <p className="text-slate-400 text-xs mt-0.5">MongoDB 6.0</p>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Port:</span>
                  <span className="font-mono text-slate-300">27017</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage:</span>
                  <span className="text-slate-300">Named Volume</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seeded Data Statistics & Test Credentials */}
        {overview && (
          <div className="space-y-6 pt-4">
            <div className="border border-slate-800 bg-slate-900/40 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    Seeded Hackathon Database Overview
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Automatically populated on initial Docker startup if the database is empty.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
                  Auto-Seeded
                </span>
              </div>

              {/* Seed Counts */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl text-center">
                  <span className="text-slate-400 text-xs block">Users</span>
                  <span className="text-xl font-extrabold text-white">{overview.counts.users}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">1 Admin, 1 Org, 3 J, 10 P</span>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl text-center">
                  <span className="text-slate-400 text-xs block">Events</span>
                  <span className="text-xl font-extrabold text-emerald-400">{overview.counts.events}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Active with dates</span>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl text-center">
                  <span className="text-slate-400 text-xs block">Tracks</span>
                  <span className="text-xl font-extrabold text-cyan-400">{overview.counts.tracks}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Thematic tracks</span>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl text-center">
                  <span className="text-slate-400 text-xs block">Prizes</span>
                  <span className="text-xl font-extrabold text-amber-400">{overview.counts.prizes}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">$17,500 total pool</span>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl text-center">
                  <span className="text-slate-400 text-xs block">Teams</span>
                  <span className="text-xl font-extrabold text-purple-400">{overview.counts.teams}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Competing teams</span>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl text-center">
                  <span className="text-slate-400 text-xs block">Projects</span>
                  <span className="text-xl font-extrabold text-pink-400">{overview.counts.projects}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Submitted entries</span>
                </div>
              </div>

              {/* Event Details Card */}
              {overview.event && (
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      {overview.event.title}
                    </h4>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      Status: {overview.event.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{overview.event.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono pt-1 text-slate-400">
                    <div>Start: <span className="text-slate-300">{new Date(overview.event.start_date).toLocaleDateString()}</span></div>
                    <div>Deadline: <span className="text-amber-300">{new Date(overview.event.submission_deadline).toLocaleDateString()}</span></div>
                    <div>End: <span className="text-slate-300">{new Date(overview.event.end_date).toLocaleDateString()}</span></div>
                  </div>
                </div>
              )}

              {/* Test Credentials Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    Test Login Accounts (Logged in Backend Output)
                  </h4>
                  <span className="text-[11px] text-slate-400">Click any row to copy credentials</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2.5 px-4">Role</th>
                        <th className="py-2.5 px-4">Name</th>
                        <th className="py-2.5 px-4">Email</th>
                        <th className="py-2.5 px-4">Password</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {overview.testCredentials.map((cred, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40 transition">
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              cred.role === 'ADMIN' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                              cred.role === 'ORGANIZER' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              cred.role === 'JUDGE' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                              'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {cred.role}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-sans text-slate-200">{cred.name}</td>
                          <td className="py-2.5 px-4 text-slate-300">{cred.email}</td>
                          <td className="py-2.5 px-4 text-emerald-400">{cred.password}</td>
                          <td className="py-2.5 px-4 text-right font-sans">
                            <button
                              onClick={() => copyToClipboard(`${cred.email}:${cred.password}`, cred.email)}
                              className="px-2.5 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            >
                              {copiedKey === cred.email ? 'Copied!' : 'Copy'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/40 py-5 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Three-Service Microservices Stack: Frontend, Backend, Database</span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            100% Offline Verified
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
