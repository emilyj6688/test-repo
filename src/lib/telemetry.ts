export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'sync';
  message: string;
  details?: Record<string, unknown> | string;
}

const LOGS_STORAGE_KEY = 'cinetrack_telemetry_logs_v1';
const MAX_LOGS = 100;

class TelemetryService {
  private logs: LogEntry[] = [];
  private listeners: Set<() => void> = new Set();

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

      // Log initial session start
      this.log('info', `Session started on ${window.location.hostname} (${navigator.userAgent.slice(0, 40)}...)`);
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
        // quota limit fallback
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

  public generateReport(currentUserInfo?: { id: string; name: string; recordCount: number }): string {
    const report = {
      generatedAt: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
      userState: currentUserInfo || {},
      logs: this.logs,
    };

    return JSON.stringify(report, null, 2);
  }
}

export const Telemetry = new TelemetryService();
