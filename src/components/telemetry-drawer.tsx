'use client';

import React, { useState, useEffect } from 'react';
import { Telemetry, LogEntry } from '@/lib/telemetry';
import { StorageService } from '@/lib/storage';
import { useAuth } from '@/context/auth-context';
import { X, Copy, Check, Trash2, Activity, RefreshCw, Cpu, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TelemetryDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>(() => Telemetry.getLogs());
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'status'>('logs');

  const currentUser = StorageService.getCurrentUser();
  const currentRecords = StorageService.getUserRecords();
  const { user: firebaseUser, isFirebaseConfigured } = useAuth();

  useEffect(() => {
    const unsubscribe = Telemetry.subscribe(() => {
      setLogs(Telemetry.getLogs());
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleCopyReport = () => {
    const report = Telemetry.generateReport();
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    Telemetry.clearLogs();
  };

  const watchedCount = currentRecords.filter((r) => r.status === 'watched').length;
  const watchlistCount = currentRecords.filter((r) => r.status === 'want_to_watch').length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Live Deep Telemetry & Diagnostics
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-mono">v2.0</span>
              </h2>
              <p className="text-[11px] text-slate-400">Complete hardware, network, storage & event logger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs & Actions */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'logs' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Event Logs ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'status' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              System & Deep State
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Full Report!' : '📋 Copy Full Telemetry for AI'}</span>
            </button>
            <button
              onClick={handleClear}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
              title="Clear Logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
          {activeTab === 'logs' ? (
            logs.length === 0 ? (
              <div className="text-center py-16 text-slate-500 font-sans">
                <Activity className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-bold">No telemetry events logged yet.</p>
                <p className="text-xs text-slate-600">Events, Firestore syncs, and console warnings appear here live.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-xl border text-[11px] leading-relaxed transition ${
                    log.level === 'error'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : log.level === 'warn'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : log.level === 'sync'
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] opacity-75 mb-1 font-sans">
                    <span className="font-bold uppercase tracking-wider">{log.level}</span>
                    <span>{log.timestamp}</span>
                  </div>
                  <p className="font-semibold break-words">{log.message}</p>
                  {log.details && (
                    <pre className="mt-1.5 p-2 rounded bg-slate-950/90 border border-slate-800 text-[10px] text-slate-400 overflow-x-auto">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )
          ) : (
            <div className="space-y-4 font-sans text-xs">
              {/* User & Database State */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-cyan-400 font-bold border-b border-slate-800 pb-2">
                  <UserIcon className="w-4 h-4" />
                  <span>Active Account & Database Overview</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px]">
                  <div>User Name: <strong className="text-white">{currentUser.name}</strong></div>
                  <div>User ID: <code className="text-cyan-300 font-mono">{currentUser.id.slice(0, 14)}...</code></div>
                  <div>Account Mode: <strong className={currentUser.id.startsWith('user_') ? 'text-amber-400' : 'text-emerald-400'}>{currentUser.id.startsWith('user_') ? 'Local Guest' : 'Authenticated Cloud'}</strong></div>
                  <div>Total Saved Items: <strong className="text-white">{currentRecords.length} records</strong></div>
                  <div>Watched Movies/TV: <strong className="text-emerald-400">{watchedCount}</strong></div>
                  <div>Watchlist Items: <strong className="text-blue-400">{watchlistCount}</strong></div>
                </div>
              </div>

              {/* Firebase Cloud Infrastructure */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-slate-800 pb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Firebase Infrastructure & Security</span>
                </div>
                <div className="space-y-1.5 text-slate-400 text-[11px] font-mono">
                  <div>Firebase Init Status: <strong className={isFirebaseConfigured ? 'text-emerald-400' : 'text-amber-400'}>{isFirebaseConfigured ? 'Active & Configured' : 'Offline / Disabled'}</strong></div>
                  <div>Project ID: <span className="text-slate-200">{process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'cinerank-media-tracker'}</span></div>
                  <div>Auth Domain: <span className="text-slate-200">{process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'cinerank-media-tracker.firebaseapp.com'}</span></div>
                  <div>Auth UID: <span className="text-cyan-300">{firebaseUser ? firebaseUser.uid : 'None (Not Signed In)'}</span></div>
                  <div>Auth Email: <span className="text-slate-200">{firebaseUser?.email || 'N/A'}</span></div>
                </div>
              </div>

              {/* System & Hardware Diagnostics */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-purple-400 font-bold border-b border-slate-800 pb-2">
                  <Cpu className="w-4 h-4" />
                  <span>Browser & Hardware Diagnostics</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px] font-mono">
                  <div>Host Domain: <span className="text-slate-200">{typeof window !== 'undefined' ? window.location.hostname : 'N/A'}</span></div>
                  <div>Online Status: <span className={typeof navigator !== 'undefined' && navigator.onLine ? 'text-emerald-400' : 'text-rose-400'}>{typeof navigator !== 'undefined' && navigator.onLine ? '🌐 Online' : '⚠️ Offline'}</span></div>
                  <div>Screen Size: <span className="text-slate-200">{typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'N/A'}</span></div>
                  <div>Viewport: <span className="text-slate-200">{typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A'}</span></div>
                  <div>CPU Cores: <span className="text-slate-200">{typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 'N/A') : 'N/A'}</span></div>
                  <div>Pixel Ratio: <span className="text-slate-200">{typeof window !== 'undefined' ? window.devicePixelRatio : '1'}x</span></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 text-center text-[11px] text-slate-500 flex items-center justify-between">
          <span className="font-mono text-cyan-400/80">Antigravity Telemetry v2.0</span>
          <button
            onClick={() => Telemetry.log('info', 'Manual Diagnostic Snapshot Triggered')}
            className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-bold hover:underline transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Trigger Diagnostic Log</span>
          </button>
        </div>

      </div>
    </div>
  );
};

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
