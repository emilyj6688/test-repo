import { StorageService } from '@/lib/storage';
import { auth, isFirebaseConfigured } from '@/lib/firebase';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'sync';
  message: string;
  details?: Record<string, unknown> | string;
}

const LOGS_STORAGE_KEY = 'cinetrack_telemetry_logs_v1';
const MAX_LOGS = 200;

class TelemetryService {
  private logs: LogEntry[] = [];
  private listeners: Set<() => void> = new Set();
  private originalConsoleError: typeof console.error | null = null;
  private originalConsoleWarn: typeof console.warn | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(LOGS_STORAGE_KEY);
        if (raw) {
          this.logs = JSON.parse(raw);
        }
      } catch {
        this.logs = [];
      }

      this.interceptConsole();
      this.log('info', `Telemetry logger initialized on ${window.location.hostname}`);
    }
  }

  private interceptConsole() {
    if (typeof window === 'undefined') return;

    if (!this.originalConsoleError) {
      this.originalConsoleError = console.error;
      console.error = (...args: unknown[]) => {
        if (this.originalConsoleError) this.originalConsoleError.apply(console, args);
        const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        this.log('error', `[Console Error] ${msg.slice(0, 300)}`);
      };
    }

    if (!this.originalConsoleWarn) {
      this.originalConsoleWarn = console.warn;
      console.warn = (...args: unknown[]) => {
        if (this.originalConsoleWarn) this.originalConsoleWarn.apply(console, args);
        const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        this.log('warn', `[Console Warn] ${msg.slice(0, 300)}`);
      };
    }
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public log(level: 'info' | 'warn' | 'error' | 'sync', message: string, details?: Record<string, unknown> | string) {
    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }),
      level,
      message,
      details,
    };

    this.logs.unshift(entry);
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(0, MAX_LOGS);
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(this.logs));
      } catch {
        // storage quota safety fallback
      }
    }

    this.notify();
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOGS_STORAGE_KEY);
    }
    this.notify();
  }

  public generateReport(): string {
    if (typeof window === 'undefined') return '{}';

    const currentUser = StorageService.getCurrentUser();
    const records = StorageService.getUserRecords();
    const comparedPairs = StorageService.getComparedPairs();

    // Inspect all localStorage keys & sizes
    const localStorageDump: Record<string, { sizeBytes: number; itemCount?: number }> = {};
    let totalStorageBytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || '';
          const size = val.length * 2;
          totalStorageBytes += size;
          let count: number | undefined;
          if (val.startsWith('[') || val.startsWith('{')) {
            try {
              const parsed = JSON.parse(val);
              if (Array.isArray(parsed)) count = parsed.length;
            } catch {
              // ignore
            }
          }
          localStorageDump[key] = { sizeBytes: size, itemCount: count };
        }
      }
    } catch {
      // ignore
    }

    // Memory info if available in browser
    const memoryInfo = (performance as unknown as { memory?: { jsHeapSizeLimit: number; totalJSHeapSize: number; usedJSHeapSize: number } }).memory;

    // Firebase Auth user snapshot
    const firebaseUser = auth.currentUser ? {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      displayName: auth.currentUser.displayName,
      isAnonymous: auth.currentUser.isAnonymous,
      providerId: auth.currentUser.providerData.map((p) => p.providerId),
    } : null;

    const report = {
      reportVersion: '2.0.0-full-telemetry',
      generatedAt: new Date().toISOString(),
      sessionUptimeSeconds: Math.round(performance.now() / 1000),

      environment: {
        url: window.location.href,
        origin: window.location.origin,
        hostname: window.location.hostname,
        pathname: window.location.pathname,
        langAttr: document.documentElement.lang,
        dirAttr: document.documentElement.dir,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        languages: navigator.languages,
        onLine: navigator.onLine,
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
        devicePixelRatio: window.devicePixelRatio,
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          availWidth: window.screen.availWidth,
          availHeight: window.screen.availHeight,
          colorDepth: window.screen.colorDepth,
        },
        viewport: {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
        },
        memory: memoryInfo ? {
          usedHeapMB: Math.round(memoryInfo.usedJSHeapSize / (1024 * 1024)),
          totalHeapMB: Math.round(memoryInfo.totalJSHeapSize / (1024 * 1024)),
          heapLimitMB: Math.round(memoryInfo.jsHeapSizeLimit / (1024 * 1024)),
        } : 'Not exposed by browser',
      },

      firebaseState: {
        isConfigured: isFirebaseConfigured,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'cinerank-media-tracker.firebaseapp.com',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'cinerank-media-tracker',
        currentUser: firebaseUser,
      },

      appStorageState: {
        activeUserId: currentUser.id,
        activeUserName: currentUser.name,
        activeUserAvatar: currentUser.avatarUrl,
        accountType: currentUser.id.startsWith('user_') ? 'Local Guest Account' : 'Authenticated Cloud User',
        totalLocalRecords: records.length,
        watchedCount: records.filter((r) => r.status === 'watched').length,
        watchlistCount: records.filter((r) => r.status === 'want_to_watch').length,
        comparedPairsCount: comparedPairs.size,
        tierBreakdown: {
          godTier1: records.filter((r) => r.ratingTier === 1).length,
          greatTier2: records.filter((r) => r.ratingTier === 2).length,
          goodTier3: records.filter((r) => r.ratingTier === 3).length,
        },
        sampleRecordsOverview: records.slice(0, 5).map((r) => ({
          id: r.id,
          title: r.item.title,
          mediaType: r.item.mediaType,
          status: r.status,
          tier: r.ratingTier,
          rankIndex: r.rankIndex,
          elo: r.eloRating,
        })),
        totalLocalStorageSizeBytes: totalStorageBytes,
        localStorageKeysDump: localStorageDump,
      },

      telemetryLogsCount: this.logs.length,
      logs: this.logs,
    };

    return JSON.stringify(report, null, 2);
  }
}

export const Telemetry = new TelemetryService();
