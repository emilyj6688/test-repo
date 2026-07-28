'use client';

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { MediaItem, UserMediaRecord, MediaType, CastMember } from '@/types/media';
import { searchTMDB, MOCK_MEDIA_ITEMS, getTMDBImageUrl } from '@/lib/tmdb';
import { StorageService } from '@/lib/storage';
import { useLanguage } from '@/context/language-context';
import { MediaCard } from '@/components/media/media-card';
import { MediaDetailModal } from '@/components/media/media-detail-modal';
import { Search, Loader2, Film, Tv, Sparkles, Tag, X, User, Globe, ChevronRight } from 'lucide-react';

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
          (item.cast && item.cast.some((c: CastMember) => c.name.toLowerCase().includes(lower))) ||
          (item.originalLanguage && item.originalLanguage.toLowerCase().includes(lower))
      );

      // Sort tag matches by: 1. Language match, 2. Popularity, 3. Recentness
      instantLocalMatches.sort((a, b) => {
        const langA = (a.originalLanguage || '').toLowerCase().includes(currentLanguage.name.toLowerCase()) ? 1 : 0;
        const langB = (b.originalLanguage || '').toLowerCase().includes(currentLanguage.name.toLowerCase()) ? 1 : 0;
        if (langA !== langB) return langB - langA;

        const popA = (a.voteCount || 0) * (a.voteAverage || 5);
        const popB = (b.voteCount || 0) * (b.voteAverage || 5);
        if (Math.abs(popA - popB) > 500) return popB - popA;

        const yrA = parseInt(a.releaseDate?.substring(0, 4) || '0', 10);
        const yrB = parseInt(b.releaseDate?.substring(0, 4) || '0', 10);
        return yrB - yrA;
      });

      setResults(instantLocalMatches);

      // Asynchronous TMDB lookup for items outside local list
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      setLoading(true);
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const fetched = await searchTMDB(searchTerm, 1, currentLanguage.code);
          setResults(fetched);
        } catch {
          // keep local results on error
        } finally {
          setLoading(false);
        }
      }, 350);
    },
    [currentLanguage]
  );

  const isFirstRenderRef = useRef(true);

  // Re-run search when currentLanguage changes
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (query.trim()) {
      const timer = setTimeout(() => {
        handleSearch(query);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [currentLanguage]);

  // Close autosuggest when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute live autosuggest recommendations with deterministic prefix sorting (starts-with first)
  const suggestions = useMemo(() => {
    const lower = query.toLowerCase().trim();
    if (!lower) return { titles: [], people: [], tags: [] };

    // 1. Title Matches: Filter all catalog items and sort franchise series chronologically by release date
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

      // Main feature films and popular entries come BEFORE obscure shorts/fan edits
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

    // 2. Person Matches (Actors / Directors up to 3)
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

    // 3. Category / Language / Genre Matches (up to 3)
    const tagSet = new Set<string>();
    MOCK_MEDIA_ITEMS.forEach((item) => {
      (item.genres || []).forEach((g) => {
        if (g.toLowerCase().includes(lower)) tagSet.add(g);
      });
      if (item.originalLanguage && item.originalLanguage.toLowerCase().includes(lower)) {
        tagSet.add(item.originalLanguage);
      }
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

  return (
    <div className="space-y-8">
      {/* Hero Search Section */}
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

          {/* Search Input Box with Interactive Autosuggest */}
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

            {/* Floating Autosuggest / Autocomplete Dropdown */}
            {showSuggestions && query.trim().length >= 1 && hasSuggestions && (
              <div className="absolute left-0 right-0 mt-2 z-[9999] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[420px] overflow-y-auto divide-y divide-slate-800/80 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* 1. Title Suggestions */}
                {suggestions.titles.length > 0 && (
                  <div className="p-2 space-y-1">
                    <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Matching Titles ({suggestions.titles.length})
                    </span>
                    {suggestions.titles.map((item) => (
                      <div
                        key={`${item.mediaType}_${item.tmdbId}`}
                        onClick={() => {
                          setSelectedItem(item);
                          setShowSuggestions(false);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/90 cursor-pointer transition group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getTMDBImageUrl(item.posterPath, 'poster', item.title, item.mediaType)}
                            alt={item.title}
                            className="w-8 h-11 object-cover rounded-lg bg-slate-950 border border-slate-800 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition truncate">
                              {item.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {item.mediaType.toUpperCase()} • {item.releaseDate ? item.releaseDate.substring(0, 4) : 'N/A'}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. People Suggestions (Actors / Directors) */}
                {suggestions.people.length > 0 && (
                  <div className="p-2 space-y-1">
                    <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 block">
                      Actors &amp; Directors
                    </span>
                    {suggestions.people.map((person) => (
                      <div
                        key={person}
                        onClick={() => {
                          handleSearch(person);
                          setShowSuggestions(false);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-cyan-500/10 cursor-pointer transition text-xs font-bold text-cyan-300 group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <User className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          <span className="truncate">{person}</span>
                        </div>
                        <span className="text-[10px] text-cyan-400/70 font-normal">Filter by Person &rarr;</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. Category / Language Suggestions */}
                {suggestions.tags.length > 0 && (
                  <div className="p-2 space-y-1">
                    <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                      Genres &amp; Languages
                    </span>
                    {suggestions.tags.map((tag) => (
                      <div
                        key={tag}
                        onClick={() => {
                          handleSearch(tag);
                          setShowSuggestions(false);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-500/10 cursor-pointer transition text-xs font-bold text-emerald-300 group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Globe className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="truncate">{tag}</span>
                        </div>
                        <span className="text-[10px] text-emerald-400/70 font-normal">Filter Tag &rarr;</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-200">
              {query.trim() ? `Filtered by Tag / Search "${query}"` : 'Top Featured Media'}
            </h2>
            {query.trim() && (
              <button
                onClick={() => handleSearch('')}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300 transition"
                title="Click to clear tag filter"
              >
                <Tag className="w-3 h-3" /> {query} <X className="w-3 h-3 ml-0.5" />
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Showing {displayedResults.length} of {filteredResults.length} title{filteredResults.length === 1 ? '' : 's'}
          </p>
        </div>

        {/* Media Type Filter Chips */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => {
              setFilterType('all');
              setVisibleCount(PAGE_SIZE);
            }}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterType === 'all'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Media
          </button>
          <button
            onClick={() => {
              setFilterType('movie');
              setVisibleCount(PAGE_SIZE);
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
              filterType === 'movie'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" /> Movies
          </button>
          <button
            onClick={() => {
              setFilterType('tv');
              setVisibleCount(PAGE_SIZE);
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
              filterType === 'tv'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5" /> TV Shows
          </button>
        </div>
      </div>

      {/* Media Items Grid */}
      {displayedResults.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6">
            {displayedResults.map((item) => {
              const recordKey = `${item.mediaType}_${item.tmdbId}`;
              const userRecord = userRecordsMap.get(recordKey);

              return (
                <MediaCard
                  key={recordKey}
                  item={item}
                  record={userRecord}
                  onSelect={(itm) => setSelectedItem(itm)}
                  onMarkWatched={handleMarkWatched}
                  onAddToWatchlist={handleAddToWatchlist}
                  onRemoveRecord={handleRemoveRecord}
                  onRatingChange={handleRatingChange}
                />
              );
            })}
          </div>

          {visibleCount < filteredResults.length && (
            <div className="text-center pt-6">
              <button
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="px-6 py-3 rounded-2xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-cyan-400 font-bold text-xs shadow-lg transition"
              >
                Load More Titles ({filteredResults.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3">
          <Film className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No media titles found</h3>
          <p className="text-xs text-slate-400">
            Try adjusting your search query or clear existing tag filters.
          </p>
          <button
            onClick={() => handleSearch('')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg transition mt-2"
          >
            Reset Search Filter
          </button>
        </div>
      )}

      {/* Media Detail Modal */}
      {selectedItem && (
        <MediaDetailModal
          item={selectedItem}
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
          onRecordChange={() => {
            refreshUserRecords();
            onRecordsChanged();
          }}
          onPersonClick={(personName) => {
            setSelectedItem(null);
            handleSearch(personName);
          }}
          onTagClick={(tag) => {
            setSelectedItem(null);
            handleSearch(tag);
          }}
        />
      )}
    </div>
  );
};
