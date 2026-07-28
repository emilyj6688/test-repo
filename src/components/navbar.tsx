'use client';

import React, { useState } from 'react';
import { StorageService } from '@/lib/storage';
import { UserProfile } from '@/types/media';
import { isTMDBConfigured } from '@/lib/tmdb';
import { UserProfileModal } from '@/components/auth/user-profile-modal';
import { AuthModal } from '@/components/auth/auth-modal';
import { useAuth } from '@/context/auth-context';
import { LanguageSelector } from '@/components/language-selector';
import { Search, Film, BookmarkCheck, Trophy, Sparkles, User, Database, LogIn, LogOut, Cloud, ShieldCheck } from 'lucide-react';

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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const { user, logout, isFirebaseConfigured } = useAuth();
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

          {/* Right Actions: TMDB Badge & Cloud Auth Profile */}
          <div className="flex items-center gap-3">
            {/* Global Language Selector */}
            <LanguageSelector />

            {/* TMDB API Status */}
            <div
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono ${
                hasTMDB
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
              title={hasTMDB ? 'TMDB API Key active' : 'Running in Offline Mock Demo Mode'}
            >
              <Database className="w-3 h-3" />
              <span>{hasTMDB ? 'TMDB Live' : 'Demo Mode'}</span>
            </div>

            {/* Cloud Sync Status */}
            {isFirebaseConfigured && user && (
              <div
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-[11px] font-mono"
                title="Cloud Sync Active - Data synced across all devices"
              >
                <Cloud className="w-3 h-3" />
                <span>Cloud Sync</span>
              </div>
            )}

            {/* Authenticated User Menu vs Sign In Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-cyan-500 rounded-xl transition text-slate-100 shadow-md"
                >
                  {user.photoURL ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-bold max-w-[110px] truncate">
                    {user.displayName || user.email?.split('@')[0] || 'Cloud User'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in text-slate-200">
                    <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                      <p className="text-xs font-bold text-white truncate">{user.displayName || 'Cloud User'}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <div className="flex items-center gap-1 text-[10px] text-cyan-400 mt-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Cloud Authenticated</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-2 transition"
                    >
                      <User className="w-4 h-4 text-cyan-400" /> Switch Profile / Local Modes
                    </button>

                    <button
                      onClick={async () => {
                        setIsUserMenuOpen(false);
                        await logout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center gap-2 transition mt-1"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-cyan-500/20"
                >
                  <LogIn className="w-3.5 h-3.5" /> Sign In
                </button>

                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 text-xs transition"
                  title="Guest / Switch Profiles"
                >
                  <span>{currentUser.avatarUrl || '👤'}</span>
                </button>
              </div>
            )}
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};
