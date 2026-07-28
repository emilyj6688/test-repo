'use client';

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { MediaItem, UserMediaRecord, MediaType } from '@/types/media';
import { searchTMDB, MOCK_MEDIA_ITEMS, getTMDBImageUrl } from '@/lib/tmdb';
import { StorageService } from '@/lib/storage';
import { useLanguage } from '@/context/language-context';
import { MediaCard } from '@/components/media/media-card';
import { MediaDetailModal } from '@/components/media/media-detail-modal';
import { Search, Loader2, Film, Tv, Sparkles, Tag, X, User, ChevronRight } from 'lucide-react';

interface Props {
  initialSearchQuery?: string;
  onRecordsChanged: () => void;
  onNavigateToTab?: (tab: 'watched' | 'watchlist' | 'ranking') => void;
}

const PAGE_SIZE = 24;

export const SearchView: React.FC<Props> = ({ initialSearchQuery = '', onRecordsChanged }) => {
  const { currentLanguage, t } = useLanguage();
  const [query, setQuery] = useState(initialSearchQuery);
  const [results, setResults] = useState<MediaItem[]>(MOCK_MEDIA_ITEMS);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | MediaType>('all');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // Autosuggest State
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [userRecordsMap, setUserRecordsMap] = useState<Map<string, UserMediaRecord>>(() => {
    if (typeof window === 'undefined') return new Map();
    const records = StorageService.getUserRecords();
    const map = new Map<string, UserMediaRecord>();
    records.forEach((r) => map.set(r.id, r));
    return map;
  });
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  // Click outside listener for autosuggest dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenDetailModal = useCallback((item: MediaItem) => {
    setSelectedItem(item);
    if (typeof window !== 'undefined') {
      const baseHash = window.location.hash.split('&media=')[0] || '#search';
      const newHash = `${baseHash}&media=${item.mediaType}-${item.tmdbId}`;
      if (window.location.hash !== newHash) {
        window.history.pushState({ modalOpen: true }, '', newHash);
      }
    }
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setSelectedItem(null);
    if (typeof window !== 'undefined' && window.location.hash.includes('&media=')) {
      const cleanHash = window.location.hash.split('&media=')[0];
      window.history.pushState(null, '', cleanHash || '#search');
    }
  }, []);

  // Sync modal state from URL Hash & listen to Browser Back/Forward buttons (popstate/hashchange)
  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash;
      const mediaMatch = hash.match(/&media=(movie|tv)-(\d+)/);
      if (mediaMatch) {
        const [, type, id] = mediaMatch;
        const found = MOCK_MEDIA_ITEMS.find((m) => m.mediaType === type && m.tmdbId === parseInt(id, 10));
        if (found) {
          setSelectedItem(found);
          return;
        }
      }
      if (selectedItem) {
        setSelectedItem(null);
      }
    };

    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, [selectedItem]);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const refreshUserRecords = () => {
    const records = StorageService.getUserRecords();
    const map = new Map<string, UserMediaRecord>();
    records.forEach((r) => map.set(r.id, r));
    setUserRecordsMap(map);
  };

  const handleSearch = useCallback(
    (searchTerm: string) => {
      setQuery(searchTerm);
      setVisibleCount(PAGE_SIZE);

      const lower = searchTerm.toLowerCase().trim();

      if (!lower) {
        setResults(MOCK_MEDIA_ITEMS);
        setLoading(false);
        setShowSuggestions(false);
        return;
      }

      setShowSuggestions(true);

      // Instant local filter across title, genres, directors, cast, language
      const instantLocalMatches = MOCK_MEDIA_ITEMS.filter(
        (item) =>
          item.title.toLowerCase().includes(lower) ||
          (item.genres && item.genres.some((g: string) => g.toLowerCase().includes(lower))) ||
          (item.directors && item.directors.some((d: string) => d.toLowerCase().includes(lower))) ||
          (item.cast && item.cast.some((c) => c.name.toLowerCase().includes(lower))) ||
          (item.originalLanguage && item.originalLanguage.toLowerCase().includes(lower))
      );

      setResults(instantLocalMatches);

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      debounceTimerRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const apiResults = await searchTMDB(searchTerm, 1, String(currentLanguage));
          if (apiResults.length > 0) {
            const combinedMap = new Map<string, MediaItem>();
            instantLocalMatches.forEach((m) => combinedMap.set(`${m.mediaType}_${m.tmdbId}`, m));
            apiResults.forEach((m) => {
              const key = `${m.mediaType}_${m.tmdbId}`;
              if (!combinedMap.has(key)) combinedMap.set(key, m);
            });
            setResults(Array.from(combinedMap.values()));
          }
        } catch (err) {
          console.error('TMDB Search Error:', err);
        } finally {
          setLoading(false);
        }
      }, 350);
    },
    [currentLanguage]
  );

  useEffect(() => {
    if (initialSearchQuery) {
      const timer = setTimeout(() => {
        handleSearch(initialSearchQuery);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initialSearchQuery, handleSearch]);

  const handleSelectSuggestionItem = (item: MediaItem) => {
    setSelectedItem(item);
    setShowSuggestions(false);
  };

  const handleSelectPerson = (personName: string) => {
    handleSearch(personName);
    setShowSuggestions(false);
  };

  const handleSelectGenreTag = (genreTag: string) => {
    handleSearch(genreTag);
    setShowSuggestions(false);
  };

  // Compute autosuggest recommendations for title, actors, directors, and genres
  const suggestions = useMemo(() => {
    const lower = query.toLowerCase().trim();
    if (!lower) return { titles: [], people: [], tags: [] };

    // 1. Title Matches
    const matchingTitles = MOCK_MEDIA_ITEMS.filter((item) =>
      item.title.toLowerCase().includes(lower)
    );

    const isFranchiseSeries = matchingTitles.length >= 2;
    const obscureRegex = /repackaged|fireplace|unearthing|making of|behind the scenes|fan edit|tribute|short|promo/i;

    matchingTitles.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const aStarts = aTitle.startsWith(lower);
      const bStarts = bTitle.startsWith(lower);

      const isObscureA = obscureRegex.test(a.title) || (a.voteCount || 0) < 50;
      const isObscureB = obscureRegex.test(b.title) || (b.voteCount || 0) < 50;

      if (!isObscureA && isObscureB) return -1;
      if (isObscureA && !isObscureB) return 1;

      if (isFranchiseSeries) {
        const dateA = a.releaseDate || '9999';
        const dateB = b.releaseDate || '9999';
        if (aStarts && bStarts) return dateA.localeCompare(dateB);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return dateA.localeCompare(dateB);
      }

      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return aTitle.localeCompare(bTitle);
    });

    const titleMatches = matchingTitles.slice(0, 10);

    // 2. Person Matches
    const personSet = new Set<string>();
    MOCK_MEDIA_ITEMS.forEach((item) => {
      (item.cast || []).forEach((c) => {
        if (c.name.toLowerCase().includes(lower)) personSet.add(c.name);
      });
      (item.directors || []).forEach((d) => {
        if (d.toLowerCase().includes(lower)) personSet.add(d);
      });
    });

    const sortedPeople = Array.from(personSet).sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(lower);
      const bStarts = b.toLowerCase().startsWith(lower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    });
    const peopleMatches = sortedPeople.slice(0, 3);

    // 3. Genre / Tag Matches
    const tagSet = new Set<string>();
    MOCK_MEDIA_ITEMS.forEach((item) => {
      (item.genres || []).forEach((g) => {
        if (g.toLowerCase().includes(lower)) tagSet.add(g);
      });
    });

    const sortedTags = Array.from(tagSet).sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(lower);
      const bStarts = b.toLowerCase().startsWith(lower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    });
    const tagMatches = sortedTags.slice(0, 3);

    return { titles: titleMatches, people: peopleMatches, tags: tagMatches };
  }, [query]);

  const hasSuggestions =
    suggestions.titles.length > 0 || suggestions.people.length > 0 || suggestions.tags.length > 0;

  const filteredResults = useMemo(() => {
    if (filterType === 'all') return results;
    return results.filter((item) => item.mediaType === filterType);
  }, [results, filterType]);

  const displayedResults = useMemo(() => {
    return filteredResults.slice(0, visibleCount);
  }, [filteredResults, visibleCount]);

  const handleMarkWatched = (item: MediaItem) => {
    StorageService.saveRecord(item, 'watched', 1.0);
    refreshUserRecords();
    onRecordsChanged();
  };

  const handleAddToWatchlist = (item: MediaItem) => {
    StorageService.saveRecord(item, 'want_to_watch', 1.0);
    refreshUserRecords();
    onRecordsChanged();
  };

  const handleRemoveRecord = (item: MediaItem) => {
    StorageService.removeRecord(item.tmdbId, item.mediaType);
    refreshUserRecords();
    onRecordsChanged();
  };

  const handleRatingChange = (item: MediaItem, tier: number) => {
    StorageService.saveRecord(item, 'watched', tier);
    refreshUserRecords();
    onRecordsChanged();
  };

  const renderAutosuggestContent = () => (
    <div className="p-2 space-y-1 divide-y divide-slate-800/80">
      {/* 1. Title Suggestions */}
      {suggestions.titles.length > 0 && (
        <div className="p-2 space-y-1">
          <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Matching Titles ({suggestions.titles.length})
          </span>
          {suggestions.titles.map((item) => (
            <div
              key={`${item.mediaType}_${item.tmdbId}`}
              onClick={() => handleSelectSuggestionItem(item)}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 cursor-pointer transition group"
            >
              <div className="flex items-center gap-3 truncate">
                <div className="w-8 h-11 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-slate-700/50">
                  {item.posterPath ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={getTMDBImageUrl(item.posterPath, 'poster')}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">
                      N/A
                    </div>
                  )}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-100 group-hover:text-cyan-400 transition truncate">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span className="capitalize font-semibold text-slate-300">{item.mediaType}</span>
                    {item.releaseDate && (
                      <span>• {new Date(item.releaseDate).getFullYear()}</span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* 2. People Suggestions */}
      {suggestions.people.length > 0 && (
        <div className="p-2 space-y-1">
          <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block flex items-center gap-1">
            <User className="w-3 h-3" /> People ({suggestions.people.length})
          </span>
          {suggestions.people.map((person) => (
            <div
              key={person}
              onClick={() => handleSelectPerson(person)}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 cursor-pointer transition group text-xs text-slate-200 font-medium"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                  👤
                </div>
                <span>{person}</span>
              </div>
              <span className="text-[10px] text-cyan-400 group-hover:underline">Search titles</span>
            </div>
          ))}
        </div>
      )}

      {/* 3. Genre Tag Suggestions */}
      {suggestions.tags.length > 0 && (
        <div className="p-2 space-y-1">
          <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 block flex items-center gap-1">
            <Tag className="w-3 h-3" /> Genres &amp; Tags ({suggestions.tags.length})
          </span>
          {suggestions.tags.map((tag) => (
            <div
              key={tag}
              onClick={() => handleSelectGenreTag(tag)}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 cursor-pointer transition group text-xs text-slate-200 font-medium"
            >
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[10px]">
                  #{tag}
                </span>
              </div>
              <span className="text-[10px] text-cyan-400 group-hover:underline">Filter tag</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 relative">


      {/* Hero Centerpiece Search Section */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-slate-800 p-6 sm:p-10 rounded-3xl shadow-2xl relative z-20">
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" /> {t('hero_tag')}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {t('hero_title')}
          </h1>
          <p className="text-sm text-slate-300">
            {t('hero_desc')}
          </p>

          {/* Centerpiece Search Input Box with Interactive Autosuggest */}
          <div className="pt-2 relative z-30" ref={searchContainerRef}>
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onFocus={() => {
                  if (query.trim().length >= 1) setShowSuggestions(true);
                }}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    setShowSuggestions(false);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                placeholder={t('search_placeholder')}
                className="w-full pl-12 pr-12 py-3.5 bg-slate-950/90 border border-slate-700/80 focus:border-cyan-500 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 text-sm shadow-xl transition"
              />
              {loading ? (
                <Loader2 className="absolute right-4 w-5 h-5 text-cyan-400 animate-spin pointer-events-none" />
              ) : (
                query.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSearch('')}
                    className="absolute right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Clear search and stop searching"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )
              )}
            </div>

            {/* Centerpiece Floating Autosuggest Dropdown */}
            {showSuggestions && query.trim().length >= 1 && hasSuggestions && (
              <div className="absolute left-0 right-0 mt-2 z-[9999] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[420px] overflow-y-auto divide-y divide-slate-800/80 animate-in fade-in slide-in-from-top-2 duration-200">
                {renderAutosuggestContent()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Results Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              filterType === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Titles ({results.length})
          </button>
          <button
            onClick={() => setFilterType('movie')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              filterType === 'movie'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" /> Movies ({results.filter((i) => i.mediaType === 'movie').length})
          </button>
          <button
            onClick={() => setFilterType('tv')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              filterType === 'tv'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5" /> TV Shows ({results.filter((i) => i.mediaType === 'tv').length})
          </button>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing <span className="text-cyan-400 font-extrabold">{displayedResults.length}</span> of{' '}
          <span className="text-slate-200 font-bold">{filteredResults.length}</span> titles
        </div>
      </div>

      {/* Grid of Results */}
      {displayedResults.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {displayedResults.map((item) => {
            const userRecord = userRecordsMap.get(`movie_${item.tmdbId}`) || userRecordsMap.get(`tv_${item.tmdbId}`);
            return (
              <MediaCard
                key={`${item.mediaType}_${item.tmdbId}`}
                item={item}
                record={userRecord}
                onSelect={() => handleOpenDetailModal(item)}
                onMarkWatched={(m) => handleMarkWatched(m || item)}
                onAddToWatchlist={() => handleAddToWatchlist(item)}
                onRemoveRecord={() => handleRemoveRecord(item)}
                onRatingChange={(m, tier) => handleRatingChange(m || item, tier)}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-200">No titles found for &quot;{query}&quot;</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try searching for another movie, TV show, actor, or genre tag!
          </p>
        </div>
      )}

      {/* Load More Button */}
      {visibleCount < filteredResults.length && (
        <div className="text-center pt-6">
          <button
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="px-6 py-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-cyan-300 font-bold text-xs shadow-lg transition"
          >
            Load More Titles ({filteredResults.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {/* Media Detail Modal */}
      {selectedItem && (
        <MediaDetailModal
          item={selectedItem}
          isOpen={!!selectedItem}
          onClose={handleCloseDetailModal}
          onRecordChange={() => {
            refreshUserRecords();
            onRecordsChanged();
          }}
        />
      )}
    </div>
  );
};
