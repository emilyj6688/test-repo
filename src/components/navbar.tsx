'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StorageService } from '@/lib/storage';
import { UserProfile, MediaItem } from '@/types/media';
import { MOCK_MEDIA_ITEMS, getTMDBImageUrl } from '@/lib/tmdb';
import { UserProfileModal } from '@/components/auth/user-profile-modal';
import { AuthModal } from '@/components/auth/auth-modal';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { LanguageSelector } from '@/components/language-selector';
import { Search, Film, BookmarkCheck, Trophy, User, LogIn, LogOut, ShieldCheck, X, ChevronRight, Tag } from 'lucide-react';

export type ActiveTab = 'search' | 'watched' | 'watchlist' | 'ranking';

interface Props {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  watchedCount: number;
  watchlistCount: number;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSelectMediaItem?: (item: MediaItem) => void;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  onTabChange,
  watchedCount,
  watchlistCount,
  searchQuery = '',
  onSearchChange,
  onSelectMediaItem,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => StorageService.getCurrentUser());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [showNavbarSuggestions, setShowNavbarSuggestions] = useState(false);

  const navbarSearchRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  // Monitor scroll position
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolledDown(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click outside listener for top-right search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navbarSearchRef.current && !navbarSearchRef.current.contains(e.target as Node)) {
        setShowNavbarSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autosuggest recommendations for top-right search bar
  const navbarSuggestions = useMemo(() => {
    const lower = (searchQuery || '').toLowerCase().trim();
    if (!lower) return { titles: [], people: [], tags: [] };

    // 1. Title Matches
    const matchingTitles = MOCK_MEDIA_ITEMS.filter((item) =>
      item.title.toLowerCase().includes(lower)
    );

    matchingTitles.sort((a, b) => {
      const aStarts = a.title.toLowerCase().startsWith(lower);
      const bStarts = b.title.toLowerCase().startsWith(lower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.title.localeCompare(b.title);
    });

    const titleMatches = matchingTitles.slice(0, 5);

    // 2. People Matches
    const personSet = new Set<string>();
    MOCK_MEDIA_ITEMS.forEach((item) => {
      (item.cast || []).forEach((c) => {
        if (c.name.toLowerCase().includes(lower)) personSet.add(c.name);
      });
      (item.directors || []).forEach((d) => {
        if (d.toLowerCase().includes(lower)) personSet.add(d);
      });
    });
    const peopleMatches = Array.from(personSet).slice(0, 2);

    // 3. Tag Matches
    const tagSet = new Set<string>();
    MOCK_MEDIA_ITEMS.forEach((item) => {
      (item.genres || []).forEach((g) => {
        if (g.toLowerCase().includes(lower)) tagSet.add(g);
      });
    });
    const tagMatches = Array.from(tagSet).slice(0, 2);

    return { titles: titleMatches, people: peopleMatches, tags: tagMatches };
  }, [searchQuery]);

  const hasNavbarSuggestions =
    navbarSuggestions.titles.length > 0 ||
    navbarSuggestions.people.length > 0 ||
    navbarSuggestions.tags.length > 0;

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#071318]/90 backdrop-blur-xl border-b border-[#c88e58]/30 shadow-2xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          
          {/* APERTURE FILM REEL & FILM STRIP HEADER LOGO (As sketched by user) */}
          <div
            onClick={() => onTabChange('search')}
            className="flex items-center cursor-pointer group shrink-0 relative py-1"
            title="Aperture - Home & Search"
          >
            {/* Circular Film Reel Emblem with Cursive "A" */}
            <div className="relative z-10 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-[#8c5023] via-[#c88e58] to-[#f3cb98] p-0.5 shadow-xl shadow-amber-950/60 group-hover:scale-105 transition-transform duration-300 flex items-center justify-center">
              {/* Inner dark reel container */}
              <div className="w-full h-full bg-[#0a1c24] rounded-full relative flex items-center justify-center border border-[#e5a875]/40 overflow-hidden">
                {/* Film Reel Sprocket Holes */}
                <div className="absolute w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#050d11] top-1" />
                <div className="absolute w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#050d11] bottom-1" />
                <div className="absolute w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#050d11] left-1" />
                <div className="absolute w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#050d11] right-1" />
                
                {/* Center Cream Emblem with Cursive Script "A" */}
                <div className="w-6 h-6 sm:w-7.5 sm:h-7.5 rounded-full bg-gradient-to-br from-[#f6f3eb] via-[#ede6d5] to-[#d9ceb8] border border-[#c88e58] flex items-center justify-center shadow-md z-10">
                  <span className="font-script font-bold text-base sm:text-xl text-[#6e3b13] select-none leading-none pt-0.5">
                    A
                  </span>
                </div>
              </div>
            </div>

            {/* Overlapping Film Strip Box containing "PERTURE" (User Sketch format) */}
            <div className="-ml-3 sm:-ml-4 pl-4 sm:pl-5 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-[#050d11] border border-[#c88e58]/70 rounded-r-xl shadow-lg relative flex flex-col justify-center">
              {/* Top Film Sprocket Holes */}
              <div className="absolute top-0.5 left-4 right-1 flex justify-between gap-1 pointer-events-none">
                <div className="w-1.5 h-0.5 bg-[#c88e58]/70 rounded-xs" />
                <div className="w-1.5 h-0.5 bg-[#c88e58]/70 rounded-xs" />
                <div className="w-1.5 h-0.5 bg-[#c88e58]/70 rounded-xs" />
                <div className="w-1.5 h-0.5 bg-[#c88e58]/70 rounded-xs" />
                <div className="w-1.5 h-0.5 bg-[#c88e58]/70 rounded-xs" />
              </div>
              
              {/* Main Brand Text: PERTURE (forming A-PERTURE) */}
              <div className="flex items-center gap-0.5">
                <span className="font-cinzel font-black text-xs sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-[#f3cb98] via-[#e5a875] to-[#c88e58] tracking-[0.25em] group-hover:text-amber-200 transition uppercase">
                  PERTURE
                </span>
              </div>

              {/* Bottom Film Sprocket Holes */}
              <div className="absolute bottom-0.5 left-4 right-1 flex justify-between gap-1 pointer-events-none">
                <div className="w-1.5 h-0.5 bg-[#c88e58]/70 rounded-xs" />
                <div className="w-1.5 h-0.5 bg-[#c88e58]/70 rounded-xs" />
                <div className="w-1.5 h-0.5 bg-[#c88e58]/70 rounded-xs" />
                <div className="w-1.5 h-0.5 bg-[#c88e58]/70 rounded-xs" />
                <div className="w-1.5 h-0.5 bg-[#c88e58]/70 rounded-xs" />
              </div>
            </div>
          </div>

          {/* Center Navigation Tabs (Aperture Vintage Bronze Theme) */}
          <nav className="flex items-center gap-1 sm:gap-2 bg-[#091b22]/90 p-1.5 rounded-2xl border border-[#c88e58]/30 shadow-inner">
            <button
              onClick={() => onTabChange('search')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'search'
                  ? 'bg-gradient-to-r from-[#d99b66] to-[#c88e58] text-[#071318] font-bold shadow-md shadow-amber-900/30'
                  : 'text-[#eef4f6]/70 hover:text-white'
              }`}
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">{t('search_tab')}</span>
            </button>

            <button
              onClick={() => onTabChange('watched')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'watched'
                  ? 'bg-gradient-to-r from-[#d99b66] to-[#c88e58] text-[#071318] font-bold shadow-md shadow-amber-900/30'
                  : 'text-[#eef4f6]/70 hover:text-white'
              }`}
            >
              <Film className="w-4 h-4" />
              <span className="hidden sm:inline">{t('watched_tab')}</span>
              {watchedCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded-full ${
                    activeTab === 'watched'
                      ? 'bg-[#071318] text-[#f3cb98]'
                      : 'bg-[#122c37] text-slate-300'
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
                  ? 'bg-gradient-to-r from-[#d99b66] to-[#c88e58] text-[#071318] font-bold shadow-md shadow-amber-900/30'
                  : 'text-[#eef4f6]/70 hover:text-white'
              }`}
            >
              <BookmarkCheck className="w-4 h-4" />
              <span className="hidden sm:inline">{t('watchlist_tab')}</span>
              {watchlistCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded-full ${
                    activeTab === 'watchlist'
                      ? 'bg-[#071318] text-[#f3cb98]'
                      : 'bg-[#122c37] text-slate-300'
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
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 animate-pulse'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <Trophy className="w-4 h-4" /> {t('ranking_tab')}
            </button>
          </nav>

          {/* Right Actions: Language Selector, User Profile, & Far-Right Scrolled Search */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Global Language Selector */}
            {!isSearchExpanded && <LanguageSelector />}

            {/* Authenticated User Menu vs Sign In Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#0a1c24] border border-[#c88e58]/40 hover:border-[#c88e58] rounded-xl transition text-slate-100 shadow-md"
                >
                  {user.photoURL ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-6 h-6 rounded-full object-cover border border-[#c88e58]" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#c88e58]/20 text-[#f3cb98] flex items-center justify-center font-bold text-xs border border-[#c88e58]/40">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  {!isSearchExpanded && (
                    <span className="text-xs font-bold max-w-[110px] truncate hidden md:inline text-slate-200">
                      {user.displayName || user.email?.split('@')[0] || 'Cloud User'}
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#0a1c24] border border-[#c88e58]/40 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in text-slate-200">
                    <div className="px-3 py-2 border-b border-[#c88e58]/20 mb-1">
                      <p className="text-xs font-bold text-white truncate">{user.displayName || 'Cloud User'}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <div className="flex items-center gap-1 text-[10px] text-[#f3cb98] mt-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Cloud Authenticated</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#122c37] rounded-xl flex items-center gap-2 transition"
                    >
                      <User className="w-4 h-4 text-[#c88e58]" /> {t('switch_profile')}
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
                className="flex items-center gap-2 px-3 py-1.5 bg-[#0a1c24] border border-[#c88e58]/40 hover:border-[#c88e58] rounded-xl text-slate-200 hover:text-white text-xs font-bold transition shadow-sm"
              >
                <LogIn className="w-4 h-4 text-[#c88e58]" />
                {!isSearchExpanded && <span className="hidden sm:inline font-bold">{currentUser.name}</span>}
              </button>
            )}

            {/* FAR-RIGHT EXPANDING SEARCH */}
            {onSearchChange && (isScrolledDown || (searchQuery && searchQuery.trim().length > 0)) && (
              <div className="relative flex items-center" ref={navbarSearchRef}>
                {isSearchExpanded || (searchQuery && searchQuery.trim().length > 0) ? (
                  <div className="relative flex items-center animate-in fade-in zoom-in-95 duration-150">
                    <Search className="absolute left-2.5 w-3.5 h-3.5 text-[#c88e58] pointer-events-none" />
                    <input
                      type="text"
                      autoFocus
                      value={searchQuery || ''}
                      onFocus={() => {
                        if (searchQuery && searchQuery.trim().length >= 1) setShowNavbarSuggestions(true);
                      }}
                      onChange={(e) => {
                        onSearchChange(e.target.value);
                        if (activeTab !== 'search') onTabChange('search');
                        if (e.target.value.trim().length >= 1) setShowNavbarSuggestions(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape') {
                          setShowNavbarSuggestions(false);
                          if (e.key === 'Escape') {
                            setIsSearchExpanded(false);
                            if (!searchQuery) (e.target as HTMLInputElement).blur();
                          }
                        }
                      }}
                      placeholder="Search title, actor..."
                      className="w-44 sm:w-60 pl-8 pr-7 py-1.5 bg-[#0a1c24] border border-[#c88e58]/70 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#c88e58] transition-all shadow-xl"
                    />
                    <button
                      onClick={() => {
                        onSearchChange('');
                        setIsSearchExpanded(false);
                        setShowNavbarSuggestions(false);
                      }}
                      className="absolute right-2 p-0.5 rounded-full text-slate-400 hover:text-white hover:bg-[#122c37] transition"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    {/* Top-Right Autosuggest Recommendations Dropdown */}
                    {showNavbarSuggestions && searchQuery && searchQuery.trim().length >= 1 && hasNavbarSuggestions && (
                      <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#091b22]/95 backdrop-blur-xl border border-[#c88e58]/50 rounded-2xl shadow-2xl overflow-hidden max-h-[380px] overflow-y-auto divide-y divide-[#c88e58]/20 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                        {/* 1. Title Matches */}
                        {navbarSuggestions.titles.length > 0 && (
                          <div className="p-2 space-y-1">
                            <span className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#f3cb98] block">
                              Matching Titles ({navbarSuggestions.titles.length})
                            </span>
                            {navbarSuggestions.titles.map((item) => (
                              <div
                                key={`nav_${item.mediaType}_${item.tmdbId}`}
                                onClick={() => {
                                  if (onSelectMediaItem) onSelectMediaItem(item);
                                  setShowNavbarSuggestions(false);
                                }}
                                className="flex items-center justify-between p-2 rounded-xl hover:bg-[#122c37] cursor-pointer transition group"
                              >
                                <div className="flex items-center gap-2.5 truncate">
                                  <div className="w-7 h-10 rounded-lg bg-[#071318] overflow-hidden shrink-0 border border-[#c88e58]/30">
                                    {item.posterPath ? (
                                      /* eslint-disable-next-line @next/next/no-img-element */
                                      <img
                                        src={getTMDBImageUrl(item.posterPath, 'poster')}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-500">
                                        N/A
                                      </div>
                                    )}
                                  </div>
                                  <div className="truncate">
                                    <div className="text-xs font-bold text-slate-100 group-hover:text-[#f3cb98] transition truncate">
                                      {item.title}
                                    </div>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                      <span className="capitalize font-semibold text-slate-300">{item.mediaType}</span>
                                      {item.releaseDate && (
                                        <span>• {new Date(item.releaseDate).getFullYear()}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-[#c88e58]/60 group-hover:text-[#f3cb98] transition shrink-0" />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 2. People Matches */}
                        {navbarSuggestions.people.length > 0 && (
                          <div className="p-2 space-y-1">
                            <span className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block flex items-center gap-1">
                              <User className="w-3 h-3" /> People
                            </span>
                            {navbarSuggestions.people.map((person) => (
                              <div
                                key={`nav_person_${person}`}
                                onClick={() => {
                                  onSearchChange(person);
                                  if (activeTab !== 'search') onTabChange('search');
                                  setShowNavbarSuggestions(false);
                                }}
                                className="flex items-center justify-between p-2 rounded-xl hover:bg-[#122c37] cursor-pointer transition group text-xs text-slate-200 font-medium"
                              >
                                <span>👤 {person}</span>
                                <span className="text-[10px] text-[#f3cb98] group-hover:underline">Search</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 3. Genre Tag Matches */}
                        {navbarSuggestions.tags.length > 0 && (
                          <div className="p-2 space-y-1">
                            <span className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#c88e58] block flex items-center gap-1">
                              <Tag className="w-3 h-3" /> Genres
                            </span>
                            {navbarSuggestions.tags.map((tag) => (
                              <div
                                key={`nav_tag_${tag}`}
                                onClick={() => {
                                  onSearchChange(tag);
                                  if (activeTab !== 'search') onTabChange('search');
                                  setShowNavbarSuggestions(false);
                                }}
                                className="flex items-center justify-between p-2 rounded-xl hover:bg-[#122c37] cursor-pointer transition group text-xs text-slate-200 font-medium"
                              >
                                <span className="px-2 py-0.5 rounded-full bg-[#122c37] border border-[#c88e58]/40 text-[#f3cb98] text-[10px]">
                                  #{tag}
                                </span>
                                <span className="text-[10px] text-[#f3cb98] group-hover:underline">Filter</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsSearchExpanded(true);
                      if (activeTab !== 'search') onTabChange('search');
                    }}
                    className="p-2 rounded-xl bg-[#0a1c24] border border-[#c88e58]/40 hover:border-[#c88e58] text-[#c88e58] hover:text-[#f3cb98] transition"
                    title="Search Titles"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                )}
              </div>
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
