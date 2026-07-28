'use client';

import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from '@/components/navbar';
import { SearchView } from '@/components/search/search-view';
import { WatchedWatchlistView } from '@/components/media/watched-watchlist-view';
import { RankingGame } from '@/components/ranking/ranking-game';
import { TelemetryDrawer } from '@/components/telemetry-drawer';
import { ShareRankingModal } from '@/components/media/share-ranking-modal';
import { StorageService } from '@/lib/storage';
import { Sparkles, Terminal, Download, Trash2, CheckCircle2, Activity, Cloud } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDevMode, setShowDevMode] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [watchedCount, setWatchedCount] = useState(() => {
    if (typeof window === 'undefined') return 0;
    return StorageService.getUserRecords().filter((r) => r.status === 'watched').length;
  });
  const [watchlistCount, setWatchlistCount] = useState(() => {
    if (typeof window === 'undefined') return 0;
    return StorageService.getUserRecords().filter((r) => r.status === 'want_to_watch').length;
  });

  const refreshCounts = () => {
    const records = StorageService.getUserRecords();
    setWatchedCount(records.filter((r) => r.status === 'watched').length);
    setWatchlistCount(records.filter((r) => r.status === 'want_to_watch').length);
  };

  // Sync state from URL Hash on mount & browser Back/Forward (popstate/hashchange)
  useEffect(() => {
    const syncFromHash = () => {
      if (typeof window === 'undefined') return;
      const rawHash = window.location.hash.replace(/^#/, '');

      if (!rawHash) return;

      if (rawHash.includes('share')) {
        setIsShareModalOpen(true);
      }

      if (rawHash.startsWith('watched')) {
        setActiveTab('watched');
      } else if (rawHash.startsWith('watchlist')) {
        setActiveTab('watchlist');
      } else if (rawHash.startsWith('ranking')) {
        setActiveTab('ranking');
      } else if (rawHash.startsWith('search')) {
        setActiveTab('search');
        const qMatch = rawHash.match(/q=([^&]+)/);
        if (qMatch) {
          setSearchQuery(decodeURIComponent(qMatch[1]));
        }
      }
    };

    syncFromHash();

    window.addEventListener('hashchange', syncFromHash);
    window.addEventListener('popstate', syncFromHash);

    return () => {
      window.removeEventListener('hashchange', syncFromHash);
      window.removeEventListener('popstate', syncFromHash);
    };
  }, []);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab !== 'search') setSearchQuery('');
    
    if (typeof window !== 'undefined') {
      const newHash = `#${tab}`;
      if (window.location.hash !== newHash) {
        window.history.pushState(null, '', newHash);
      }
    }
  };

  useEffect(() => {
    const handleRecordsUpdate = () => refreshCounts();
    const handleUserChanged = () => refreshCounts();

    window.addEventListener('cinetrack_records_updated', handleRecordsUpdate);
    window.addEventListener('cinetrack_user_changed', handleUserChanged as EventListener);

    return () => {
      window.removeEventListener('cinetrack_records_updated', handleRecordsUpdate);
      window.removeEventListener('cinetrack_user_changed', handleUserChanged as EventListener);
    };
  }, []);

  const handlePersonSelect = (personName: string) => {
    setSearchQuery(personName);
    setActiveTab('search');
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `#search?q=${encodeURIComponent(personName)}`);
    }
  };

  const handleLoadSampleRecords = () => {
    StorageService.loadDemoCriticRecords();
    refreshCounts();
    setToastMessage('Loaded 200 sample watched movies into your list!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleClearAllRecords = async () => {
    await StorageService.clearAllRecords();
    refreshCounts();
    setToastMessage('Cleared all saved items! Your list is now clean.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        watchedCount={watchedCount}
        watchlistCount={watchlistCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'search' && (
          <SearchView
            key={searchQuery}
            initialSearchQuery={searchQuery}
            onRecordsChanged={refreshCounts}
            onNavigateToTab={handleTabChange}
          />
        )}

        {activeTab === 'watched' && (
          <WatchedWatchlistView
            initialTab="watched"
            onRecordsChanged={refreshCounts}
            onNavigateToTab={handleTabChange}
            onPersonSelect={handlePersonSelect}
            onOpenShareRanking={() => setIsShareModalOpen(true)}
          />
        )}

        {activeTab === 'watchlist' && (
          <WatchedWatchlistView
            initialTab="watchlist"
            onRecordsChanged={refreshCounts}
            onNavigateToTab={handleTabChange}
            onPersonSelect={handlePersonSelect}
            onOpenShareRanking={() => setIsShareModalOpen(true)}
          />
        )}

        {activeTab === 'ranking' && (
          <RankingGame
            onRecordsChanged={refreshCounts}
            onNavigateToTab={handleTabChange}
            onPersonSelect={handlePersonSelect}
            onOpenShareRanking={() => setIsShareModalOpen(true)}
          />
        )}
      </main>

      {/* Developer Mode Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 border border-cyan-500/40 text-cyan-300 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 bg-slate-950/80 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-300">CineRank Premium</span>
            <span className="hidden sm:inline">— Media Tracking &amp; Pairwise Ranking Engine</span>
            
            {/* Version Counter Badge */}
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-mono font-bold text-cyan-400 shadow-sm ml-1"
              title="Current Build: Version 0.1.2 Alpha"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span>v0.1.2-alpha</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400 font-medium">
            {/* Cloud Sync Status Indicator */}
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-cyan-400 text-[11px] font-mono"
              title="Cloud Sync Engine Active"
            >
              <Cloud className="w-3 h-3 text-cyan-400" />
              <span>Cloud Sync Active</span>
            </div>

            <button onClick={() => handleTabChange('search')} className="hover:text-cyan-400 transition">
              Search
            </button>
            <button onClick={() => handleTabChange('watched')} className="hover:text-cyan-400 transition">
              Watched Log ({watchedCount})
            </button>
            <button onClick={() => handleTabChange('ranking')} className="hover:text-amber-400 transition">
              Pairwise Game
            </button>
            
            {/* Live Telemetry Diagnostics Trigger */}
            <button
              onClick={() => setIsTelemetryOpen(true)}
              className="text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition"
              title="View Live System Telemetry & Diagnostics"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>System Telemetry</span>
            </button>

            <button
              onClick={() => setShowDevMode(!showDevMode)}
              className="text-slate-500 hover:text-cyan-400 flex items-center gap-1 transition"
              title="Developer Mode options"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Developer Mode</span>
            </button>
          </div>
        </div>

        {/* Developer Mode Bar */}
        {showDevMode && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 pt-4 border-t border-slate-800/40 flex items-center justify-between gap-4 text-xs bg-slate-900/60 p-3 rounded-2xl">
            <div className="flex items-center gap-2 text-slate-400">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white">Developer Mode:</span>
              <span>Need sample data for testing pairwise rankings or a clean state?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadSampleRecords}
                className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-semibold rounded-xl flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" /> Load 200 Sample Movies
              </button>
              <button
                onClick={handleClearAllRecords}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold rounded-xl flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear All Items (0)
              </button>
            </div>
          </div>
        )}
      </footer>

      {/* Real-Time Telemetry & Diagnostic Logger Drawer */}
      <TelemetryDrawer isOpen={isTelemetryOpen} onClose={() => setIsTelemetryOpen(false)} />

      {/* Share Ranking Modal */}
      <ShareRankingModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
    </div>
  );
}
