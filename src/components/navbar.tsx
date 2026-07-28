'use client';

import React, { useState } from 'react';
import { StorageService } from '@/lib/storage';
import { UserProfile } from '@/types/media';
import { UserProfileModal } from '@/components/auth/user-profile-modal';
import { AuthModal } from '@/components/auth/auth-modal';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { LanguageSelector } from '@/components/language-selector';
import { Search, Film, BookmarkCheck, Trophy, Sparkles, User, LogIn, LogOut, ShieldCheck, X } from 'lucide-react';

export type ActiveTab = 'search' | 'watched' | 'watchlist' | 'ranking';

interface Props {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  watchedCount: number;
  watchlistCount: number;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  onTabChange,
  watchedCount,
  watchlistCount,
  searchQuery = '',
  onSearchChange,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => StorageService.getCurrentUser());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const { user, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left Brand Logo & Title */}
          <div
            onClick={() => onTabChange('search')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg text-white tracking-tight group-hover:text-cyan-400 transition">
                  CineRank
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-md">
                  PRO
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-400 hidden sm:block">
                Pairwise Ranking &amp; Tracker
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner">
            <button
              onClick={() => onTabChange('search')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'search'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">{t('search_tab')}</span>
            </button>

            <button
              onClick={() => onTabChange('watched')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'watched'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Film className="w-4 h-4" />
              <span className="hidden sm:inline">{t('watched_tab')}</span>
              {watchedCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded-full ${
                    activeTab === 'watched'
                      ? 'bg-slate-950 text-cyan-400'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {watchedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('watchlist')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'watchlist'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookmarkCheck className="w-4 h-4" />
              <span className="hidden sm:inline">{t('watchlist_tab')}</span>
              {watchlistCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded-full ${
                    activeTab === 'watchlist'
                      ? 'bg-slate-950 text-cyan-400'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {watchlistCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('ranking')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'ranking'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 animate-pulse'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <Trophy className="w-4 h-4" /> {t('ranking_tab')}
            </button>
          </nav>

          {/* Right Actions: Top-Right Expanding Search, Language Selector & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Top-Right Compact Expanding Search Bar */}
            {onSearchChange && (
              <div className="relative flex items-center">
                {isSearchExpanded || (searchQuery && searchQuery.trim().length > 0) ? (
                  <div className="relative flex items-center animate-in fade-in zoom-in-95 duration-150">
                    <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      autoFocus
                      value={searchQuery || ''}
                      onChange={(e) => {
                        onSearchChange(e.target.value);
                        if (activeTab !== 'search') onTabChange('search');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setIsSearchExpanded(false);
                          if (!searchQuery) (e.target as HTMLInputElement).blur();
                        }
                      }}
                      placeholder="Search title, actor..."
                      className="w-36 sm:w-56 pl-8 pr-7 py-1.5 bg-slate-900 border border-cyan-500/50 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-inner"
                    />
                    <button
                      onClick={() => {
                        onSearchChange('');
                        setIsSearchExpanded(false);
                      }}
                      className="absolute right-2 p-0.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsSearchExpanded(true);
                      if (activeTab !== 'search') onTabChange('search');
                    }}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 transition"
                    title="Search Titles"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Global Language Selector */}
            <LanguageSelector />

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
                  <span className="text-xs font-bold max-w-[110px] truncate hidden md:inline">
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
                      <User className="w-4 h-4 text-cyan-400" /> {t('switch_profile')}
                    </button>

                    <button
                      onClick={async () => {
                        setIsUserMenuOpen(false);
                        await logout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center gap-2 transition mt-1"
                    >
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-slate-200 hover:text-white text-xs font-bold transition shadow-sm"
              >
                <LogIn className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline font-bold">{currentUser.name}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Profile Management Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUserChanged={(u) => {
          setCurrentUser(u);
        }}
      />

      {/* Cloud Auth Login/Signup Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};
