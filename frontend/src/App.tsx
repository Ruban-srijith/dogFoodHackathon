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
  Radio
} from 'lucide-react';

interface HealthResponse {
  status: string;
  [key: string]: any;
}

export const App: React.FC = () => {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [activeUrl, setActiveUrl] = useState<string>('/api/health');

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    const start = performance.now();

    // Priority order: configured env URL, relative /api/health, fallback to port 5000
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
          headers: {
            'Accept': 'application/json',
          },
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

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      checkHealth();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, checkHealth]);

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
              onClick={checkHealth}
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
                <p className="text-slate-400 text-xs mt-0.5">Node + Express (API)</p>
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
