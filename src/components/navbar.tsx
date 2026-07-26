'use client';

import React, { useState } from 'react';
import { StorageService } from '@/lib/storage';
import { UserProfile } from '@/types/media';
import { isTMDBConfigured } from '@/lib/tmdb';
import { UserProfileModal } from '@/components/auth/user-profile-modal';
import { Search, Film, BookmarkCheck, Trophy, Sparkles, User, Database } from 'lucide-react';

export type ActiveTab = 'search' | 'watched' | 'watchlist' | 'ranking';

interface Props {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  watchedCount: number;
  watchlistCount: number;
}

export const Navbar: React.FC<Props> = ({ activeTab, onTabChange, watchedCount, watchlistCount }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => StorageService.getCurrentUser());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const hasTMDB = isTMDBConfigured();

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('search')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
                CineRank
              </span>
              <span className="text-[10px] font-semibold text-slate-400 block -mt-1 tracking-widest uppercase">
                Media Ranker & Tracker
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 border border-slate-800 p-1.5 rounded-2xl">
            <button
              onClick={() => onTabChange('search')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'search'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Search className="w-4 h-4" /> Search & Browse
            </button>

            <button
              onClick={() => onTabChange('watched')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'watched'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Film className="w-4 h-4" /> Watched
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-800 text-slate-300 font-mono">
                {watchedCount}
              </span>
            </button>

            <button
              onClick={() => onTabChange('watchlist')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'watchlist'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BookmarkCheck className="w-4 h-4" /> Want to Watch
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-800 text-slate-300 font-mono">
                {watchlistCount}
              </span>
            </button>

            <button
              onClick={() => onTabChange('ranking')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'ranking'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 animate-pulse'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <Trophy className="w-4 h-4" /> Rank My List (A vs B)
            </button>
          </nav>

          {/* Right Actions: TMDB Badge & User Profile */}
          <div className="flex items-center gap-3">
            {/* TMDB API Status */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono ${
                hasTMDB
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
              title={hasTMDB ? 'TMDB API Key active' : 'Running in Offline Mock Demo Mode'}
            >
              <Database className="w-3 h-3" />
              <span>{hasTMDB ? 'TMDB Live' : 'Demo Mode'}</span>
            </div>

            {/* Profile Button */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition text-slate-200"
            >
              <span className="text-lg">{currentUser.avatarUrl || '👤'}</span>
              <span className="text-xs font-semibold hidden sm:inline max-w-[100px] truncate">
                {currentUser.name}
              </span>
              <User className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-between gap-1 border-t border-slate-800/60 py-2 px-3 bg-slate-950 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onTabChange('search')}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium p-1 ${
              activeTab === 'search' ? 'text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Search className="w-4 h-4" /> Search
          </button>

          <button
            onClick={() => onTabChange('watched')}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium p-1 ${
              activeTab === 'watched' ? 'text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Film className="w-4 h-4" /> Watched ({watchedCount})
          </button>

          <button
            onClick={() => onTabChange('watchlist')}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium p-1 ${
              activeTab === 'watchlist' ? 'text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" /> Watchlist ({watchlistCount})
          </button>

          <button
            onClick={() => onTabChange('ranking')}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium p-1 ${
              activeTab === 'ranking' ? 'text-amber-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Trophy className="w-4 h-4" /> Rank (A/B)
          </button>
        </div>
      </header>

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUserChanged={(u) => setCurrentUser(u)}
      />
    </>
  );
};
