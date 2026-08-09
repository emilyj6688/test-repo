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
  const [showNavbarSuggestions, setShowNavbarSuggestions] = useState(false);

  const navbarSearchRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { t } = useLanguage();

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

  // Autosuggest recommendations for header search bar
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
      <header className="sticky top-0 z-40 bg-[#0e242a]/95 backdrop-blur-xl border-b border-[#c88e58]/30 shadow-2xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
          
          {/* ART DECO ANGULAR APERTURE LOGO & BRAND NAME */}
          <div
            onClick={() => onTabChange('search')}
            className="flex items-center gap-3 cursor-pointer group shrink-0 py-1"
            title="Aperture - Home & Search"
          >
            {/* Stylized Angular Art Deco Aperture Blade Mark SVG */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gradient-to-br from-[#c88e58] via-[#8c5023] to-[#0e242a] p-0.5 shadow-lg shadow-[#c88e58]/20 group-hover:scale-105 transition-transform duration-300 flex items-center justify-center border border-[#e5a875]/40">
              <div className="w-full h-full bg-[#091b22] rounded-[6px] flex items-center justify-center p-1.5 overflow-hidden">
                <svg viewBox="0 0 100 100" className="w-full h-full text-[#c88e58] fill-current">
                  {/* Angular Art Deco Aperture Blade Polygon Pattern */}
                  <polygon points="50,5 65,35 35,35" className="fill-[#e5a875]" />
                  <polygon points="95,50 65,65 65,35" className="fill-[#c88e58]" />
                  <polygon points="50,95 35,65 65,65" className="fill-[#a86c38]" />
                  <polygon points="5,50 35,35 35,65" className="fill-[#8c5023]" />
                  {/* Center Diamond Lens Accent */}
                  <polygon points="50,38 62,50 50,62 38,50" className="fill-[#f6f3eb] opacity-90" />
                </svg>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="font-cinzel font-black text-base sm:text-xl text-[#c88e58] tracking-[0.25em] group-hover:text-[#f3cb98] transition uppercase">
                APERTURE
              </span>
              <span className="text-[9px] font-cinzel font-bold text-[#c88e58]/70 tracking-[0.2em] hidden sm:block">
                ART DECO ARCHIVE
              </span>
            </div>
          </div>

          {/* Center Navigation Links (Bronze Typography & Muted Slate/Bronze Buttons) */}
          <nav className="flex items-center gap-1 sm:gap-2 bg-[#091b22]/90 p-1.5 rounded-xl border border-[#c88e58]/30 shadow-inner">
            <button
              onClick={() => onTabChange('search')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-cinzel font-bold tracking-wider transition ${
                activeTab === 'search'
                  ? 'bg-[#c88e58] text-[#091b22] shadow-md'
                  : 'text-[#c88e58] hover:text-[#f3cb98]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('search_tab')}</span>
            </button>

            <button
              onClick={() => onTabChange('watched')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-cinzel font-bold tracking-wider transition ${
                activeTab === 'watched'
                  ? 'bg-slate-700/80 text-[#f3cb98] border border-[#c88e58]/50 shadow-md'
                  : 'text-[#c88e58] hover:text-[#f3cb98]'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('watched_tab')}</span>
              {watchedCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 text-[10px] font-extrabold rounded-full ${
                    activeTab === 'watched'
                      ? 'bg-[#091b22] text-[#f3cb98]'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {watchedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('watchlist')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-cinzel font-bold tracking-wider transition ${
                activeTab === 'watchlist'
                  ? 'bg-slate-700/80 text-[#f3cb98] border border-[#c88e58]/50 shadow-md'
                  : 'text-[#c88e58] hover:text-[#f3cb98]'
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('watchlist_tab')}</span>
              {watchlistCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 text-[10px] font-extrabold rounded-full ${
                    activeTab === 'watchlist'
                      ? 'bg-[#091b22] text-[#f3cb98]'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {watchlistCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('ranking')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-cinzel font-bold tracking-wider transition ${
                activeTab === 'ranking'
                  ? 'bg-[#8c5023] text-[#f6f3eb] shadow-md border border-[#c88e58]'
                  : 'text-[#c88e58] hover:text-[#f3cb98]'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" /> {t('ranking_tab')}
            </button>
          </nav>

          {/* Clean Global Search Bar Present in Header */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {onSearchChange && (
              <div className="relative flex items-center" ref={navbarSearchRef}>
                <div className="relative flex items-center">
                  <Search className="absolute left-3 w-3.5 h-3.5 text-[#c88e58] pointer-events-none" />
                  <input
                    type="text"
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
                      }
                    }}
                    placeholder="Search search..."
                    className="w-32 sm:w-56 pl-8 pr-7 py-1.5 bg-[#050d11] border border-[#c88e58]/50 rounded-xl text-xs text-[#f6f3eb] placeholder-slate-400 focus:outline-none focus:border-[#c88e58] transition shadow-md"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        onSearchChange('');
                        setShowNavbarSuggestions(false);
                      }}
                      className="absolute right-2 p-0.5 rounded-full text-slate-400 hover:text-white transition"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Top-Right Autosuggest Recommendations Dropdown */}
                {showNavbarSuggestions && searchQuery && searchQuery.trim().length >= 1 && hasNavbarSuggestions && (
                  <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#091b22]/95 backdrop-blur-xl border-2 border-[#c88e58]/50 rounded-2xl shadow-2xl overflow-hidden max-h-[380px] overflow-y-auto divide-y divide-[#c88e58]/20 z-50">
                    {/* 1. Title Matches */}
                    {navbarSuggestions.titles.length > 0 && (
                      <div className="p-2 space-y-1">
                        <span className="px-2 py-1 text-[10px] font-cinzel font-extrabold uppercase tracking-wider text-[#f3cb98] block">
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
                                <div className="text-xs font-bold text-slate-100 group-hover:text-[#f3cb98] transition truncate font-cinzel">
                                  {item.title}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <span className="capitalize font-semibold text-[#c88e58]">{item.mediaType}</span>
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
                        <span className="px-2 py-1 text-[10px] font-cinzel font-extrabold uppercase tracking-wider text-amber-400 block flex items-center gap-1">
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
                        <span className="px-2 py-1 text-[10px] font-cinzel font-extrabold uppercase tracking-wider text-[#c88e58] block flex items-center gap-1">
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
            )}

            {/* Global Language Selector */}
            <LanguageSelector />

            {/* Muted Slate Grey / Antique Bronze User Buttons */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/60 border border-[#c88e58]/50 hover:border-[#c88e58] rounded-xl transition text-[#f6f3eb] shadow-md"
                >
                  {user.photoURL ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-5 h-5 rounded-full object-cover border border-[#c88e58]" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#c88e58]/30 text-[#f3cb98] flex items-center justify-center font-bold text-xs">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-cinzel font-bold max-w-[100px] truncate hidden md:inline">
                    {user.displayName || user.email?.split('@')[0] || 'User'}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#091b22] border border-[#c88e58]/50 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in text-slate-200">
                    <div className="px-3 py-2 border-b border-[#c88e58]/20 mb-1">
                      <p className="text-xs font-bold text-white truncate">{user.displayName || 'User'}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
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
                className="flex items-center gap-2 px-3 py-1.5 bg-[#8c5023]/60 hover:bg-[#8c5023]/80 border border-[#c88e58]/60 rounded-xl text-[#f6f3eb] text-xs font-cinzel font-bold transition shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5 text-[#f3cb98]" />
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
