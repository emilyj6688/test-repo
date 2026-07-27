'use client';

import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from '@/components/navbar';
import { SearchView } from '@/components/search/search-view';
import { WatchedWatchlistView } from '@/components/media/watched-watchlist-view';
import { RankingGame } from '@/components/ranking/ranking-game';
import { StorageService } from '@/lib/storage';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('search');
  const [searchQuery, setSearchQuery] = useState('');
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
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'search') setSearchQuery('');
        }}
        watchedCount={watchedCount}
        watchlistCount={watchlistCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'search' && (
          <SearchView
            key={searchQuery}
            initialSearchQuery={searchQuery}
            onRecordsChanged={refreshCounts}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'watched' && (
          <WatchedWatchlistView
            initialTab="watched"
            onRecordsChanged={refreshCounts}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onPersonSelect={handlePersonSelect}
          />
        )}

        {activeTab === 'watchlist' && (
          <WatchedWatchlistView
            initialTab="watchlist"
            onRecordsChanged={refreshCounts}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onPersonSelect={handlePersonSelect}
          />
        )}

        {activeTab === 'ranking' && (
          <RankingGame
            onRecordsChanged={refreshCounts}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onPersonSelect={handlePersonSelect}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 bg-slate-950/80 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-300">CineRank Premium</span>
            <span>— Media Tracking & Pairwise Ranking Engine</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-medium">
            <button onClick={() => setActiveTab('search')} className="hover:text-cyan-400 transition">
              Search
            </button>
            <button onClick={() => setActiveTab('watched')} className="hover:text-cyan-400 transition">
              Watched Log
            </button>
            <button onClick={() => setActiveTab('ranking')} className="hover:text-amber-400 transition">
              Pairwise Game
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
