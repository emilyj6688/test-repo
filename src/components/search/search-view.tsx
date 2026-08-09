'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MediaItem, UserMediaRecord, RatingTier } from '@/types/media';
import { StorageService } from '@/lib/storage';
import { searchTMDB, fetchLiveTrendingTMDB, getTMDBImageUrl } from '@/lib/tmdb';
import { MediaCard } from '@/components/media/media-card';
import { MediaDetailModal } from '@/components/media/media-detail-modal';
import { useLanguage } from '@/context/language-context';
import { Search, Film, Tv, SlidersHorizontal, Loader2, Star, X, User, Tag, ChevronRight, Sparkles } from 'lucide-react';

interface Props {
  onMarkWatched: (item: MediaItem, tier?: RatingTier) => void;
  onAddToWatchlist: (item: MediaItem) => void;
  initialQuery?: string;
  onPersonClick?: (person: string) => void;
  onTagClick?: (tag: string) => void;
}

export const SearchView: React.FC<Props> = ({
  onMarkWatched,
  onAddToWatchlist,
  initialQuery = '',
  onPersonClick,
  onTagClick,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [mediaType, setMediaType] = useState<'all' | 'movie' | 'tv'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [allMasterItems, setAllMasterItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [userRecords, setUserRecords] = useState<Record<string, UserMediaRecord>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const { t } = useLanguage();

  // Load live trending & master catalog on mount
  useEffect(() => {
    let isMounted = true;
    fetchLiveTrendingTMDB()
      .then((items) => {
        if (isMounted) {
          setAllMasterItems(items);
          setResults(items);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync initialQuery prop changes
  const prevInitialQueryRef = useRef(initialQuery);
  useEffect(() => {
    if (prevInitialQueryRef.current !== initialQuery) {
      prevInitialQueryRef.current = initialQuery;
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Helper to load user records as a map
  const loadUserRecordsMap = () => {
    const map: Record<string, UserMediaRecord> = {};
    StorageService.getUserRecords().forEach((r) => {
      map[`${r.item.mediaType}_${r.item.tmdbId}`] = r;
    });
    return map;
  };

  // Load user watched/watchlist records
  useEffect(() => {
    const refreshRecords = () => {
      setUserRecords(loadUserRecordsMap());
    };
    refreshRecords();
    window.addEventListener('storage', refreshRecords);
    return () => window.removeEventListener('storage', refreshRecords);
  }, []);

  // Close autosuggest dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Perform search (TMDB Live API + local catalog)
  useEffect(() => {
    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) {
      const timer = setTimeout(() => {
        let filtered = [...allMasterItems];
        if (mediaType !== 'all') {
          filtered = filtered.filter((item) => item.mediaType === mediaType);
        }
        if (selectedGenre !== 'all') {
          filtered = filtered.filter((item) =>
            (item.genres || []).some((g) => g.toLowerCase() === selectedGenre.toLowerCase())
          );
        }
        setResults(filtered);
        setIsLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);

      const liveResults = await searchTMDB(lowerQuery);

      const localMatches = allMasterItems.filter((item) => {
        if (mediaType !== 'all' && item.mediaType !== mediaType) return false;

        const titleMatch = item.title.toLowerCase().includes(lowerQuery);
        const castMatch = (item.cast || []).some((c) => c.name.toLowerCase().includes(lowerQuery));
        const directorMatch = (item.directors || []).some((d) => d.toLowerCase().includes(lowerQuery));
        const genreMatch = (item.genres || []).some((g) => g.toLowerCase().includes(lowerQuery));

        return titleMatch || castMatch || directorMatch || genreMatch;
      });

      const seenIds = new Set<string>();
      const merged: MediaItem[] = [];

      for (const item of liveResults) {
        const key = `${item.mediaType}_${item.tmdbId}`;
        if (!seenIds.has(key)) {
          seenIds.add(key);
          merged.push(item);
        }
      }

      for (const item of localMatches) {
        const key = `${item.mediaType}_${item.tmdbId}`;
        if (!seenIds.has(key)) {
          seenIds.add(key);
          merged.push(item);
        }
      }

      let finalFiltered = merged;
      if (selectedGenre !== 'all') {
        finalFiltered = finalFiltered.filter((item) =>
          (item.genres || []).some((g) => g.toLowerCase() === selectedGenre.toLowerCase())
        );
      }

      setResults(finalFiltered);
      setIsLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, mediaType, selectedGenre, allMasterItems]);

  // Compute Autosuggest Recommendations
  const suggestions = useMemo(() => {
    const lower = query.toLowerCase().trim();
    if (!lower) return { titles: [], people: [], tags: [] };

    const matchingTitles = allMasterItems.filter((item) =>
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

    const personSet = new Set<string>();
    allMasterItems.forEach((item) => {
      (item.cast || []).forEach((c) => {
        if (c.name.toLowerCase().includes(lower)) personSet.add(c.name);
      });
      (item.directors || []).forEach((d) => {
        if (d.toLowerCase().includes(lower)) personSet.add(d);
      });
    });
    const peopleMatches = Array.from(personSet).slice(0, 3);

    const tagSet = new Set<string>();
    allMasterItems.forEach((item) => {
      (item.genres || []).forEach((g) => {
        if (g.toLowerCase().includes(lower)) tagSet.add(g);
      });
    });
    const tagMatches = Array.from(tagSet).slice(0, 3);

    return { titles: titleMatches, people: peopleMatches, tags: tagMatches };
  }, [query, allMasterItems]);

  const hasSuggestions =
    suggestions.titles.length > 0 ||
    suggestions.people.length > 0 ||
    suggestions.tags.length > 0;

  const handleSelectTitleItem = (item: MediaItem) => {
    setSelectedItem(item);
    setShowSuggestions(false);
  };

  const handleSelectPerson = (person: string) => {
    setQuery(person);
    setShowSuggestions(false);
    if (onPersonClick) onPersonClick(person);
  };

  const handleSelectGenreTag = (tag: string) => {
    setQuery(tag);
    setShowSuggestions(false);
    if (onTagClick) onTagClick(tag);
  };

  // Muted Gray/Bronze Genre Buttons
  const availableGenres = [
    'all',
    'Action',
    'Drama',
    'Sci-Fi',
    'Comedy',
    'Thriller',
    'Documentary',
    'Animation',
    'Crime',
    'Romance',
  ];

  return (
    <div className="space-y-6 relative">
      {/* 🏛️ MASSIVE ART DECO MOSAIC HERO DISPLAY */}
      <div className="relative rounded-3xl overflow-hidden border-4 border-[#c88e58]/50 shadow-2xl bg-[#091b22] group">
        {/* Intricate Mosaic Graphic Image Background */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden bg-[#071318]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="images/art_deco_hero.jpg"
            alt="Aperture Art Deco Geometric Stained Glass Mosaic Hero Display"
            className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-102"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#091b22] via-[#091b22]/20 to-transparent" />
        </div>

        {/* FUNCTIONAL BRONZE-ACCENTED SEARCH BAR (INTEGRATED AT LOWER CENTER IN DECORATIVE FRAME) */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-30" ref={searchContainerRef}>
          <div className="relative p-1 bg-[#091b22]/90 backdrop-blur-md rounded-2xl border-2 border-[#c88e58] shadow-2xl">
            {/* Geometric Diamond Frame Accents */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 bg-[#c88e58] rotate-45 border border-[#f6f3eb] flex items-center justify-center shadow-md">
              <div className="w-2 h-2 bg-[#091b22] rotate-45" />
            </div>

            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-[#c88e58] pointer-events-none" />
              <input
                type="text"
                value={query}
                onFocus={() => {
                  if (query.trim().length >= 1) setShowSuggestions(true);
                }}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (e.target.value.trim().length >= 1) setShowSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    setShowSuggestions(false);
                  }
                }}
                placeholder="Search movies, genres, or directors..."
                className="w-full pl-12 pr-10 py-3 bg-[#050d11]/90 border border-[#c88e58]/50 rounded-xl text-sm font-cinzel text-[#f6f3eb] placeholder-slate-400 focus:outline-none focus:border-[#c88e58] transition shadow-inner"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    setShowSuggestions(false);
                  }}
                  className="absolute right-4 p-1 rounded-full text-slate-400 hover:text-white transition"
                  title="Clear search query"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Interactive Autosuggest Dropdown */}
            {showSuggestions && query.trim().length >= 1 && hasSuggestions && (
              <div className="absolute left-0 right-0 bottom-full mb-3 bg-[#091b22]/98 backdrop-blur-2xl border-2 border-[#c88e58] rounded-2xl shadow-2xl overflow-hidden max-h-[380px] overflow-y-auto divide-y divide-[#c88e58]/20 z-50">
                {/* Title Matches */}
                {suggestions.titles.length > 0 && (
                  <div className="p-2 space-y-1">
                    <span className="px-3 py-1 text-[10px] font-cinzel font-extrabold uppercase tracking-wider text-[#f3cb98] block">
                      Matching Titles ({suggestions.titles.length})
                    </span>
                    {suggestions.titles.map((item) => (
                      <div
                        key={`sug_${item.mediaType}_${item.tmdbId}`}
                        onClick={() => handleSelectTitleItem(item)}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-[#122c37] cursor-pointer transition group"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className="w-8 h-11 rounded-lg bg-[#071318] overflow-hidden shrink-0 border border-[#c88e58]/40">
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
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="capitalize font-semibold text-[#c88e58]">{item.mediaType}</span>
                              {item.releaseDate && (
                                <span>• {new Date(item.releaseDate).getFullYear()}</span>
                              )}
                              {item.voteAverage && (
                                <span className="flex items-center gap-0.5 text-amber-400">
                                  <Star className="w-2.5 h-2.5 fill-amber-400" /> {item.voteAverage}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#c88e58]/60 group-hover:text-[#f3cb98] transition shrink-0" />
                      </div>
                    ))}
                  </div>
                )}

                {/* People Matches */}
                {suggestions.people.length > 0 && (
                  <div className="p-2 space-y-1">
                    <span className="px-3 py-1 text-[10px] font-cinzel font-extrabold uppercase tracking-wider text-amber-400 block flex items-center gap-1">
                      <User className="w-3 h-3" /> People ({suggestions.people.length})
                    </span>
                    {suggestions.people.map((person) => (
                      <div
                        key={person}
                        onClick={() => handleSelectPerson(person)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#122c37] cursor-pointer transition group text-xs text-slate-200 font-medium"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#c88e58]/20 text-[#f3cb98] flex items-center justify-center font-bold text-[10px] border border-[#c88e58]/40">
                            👤
                          </div>
                          <span>{person}</span>
                        </div>
                        <span className="text-[10px] text-[#f3cb98] group-hover:underline">Search titles</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Genre Tag Matches */}
                {suggestions.tags.length > 0 && (
                  <div className="p-2 space-y-1">
                    <span className="px-3 py-1 text-[10px] font-cinzel font-extrabold uppercase tracking-wider text-[#c88e58] block flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Genres &amp; Tags ({suggestions.tags.length})
                    </span>
                    {suggestions.tags.map((tag) => (
                      <div
                        key={tag}
                        onClick={() => handleSelectGenreTag(tag)}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-[#122c37] cursor-pointer transition group text-xs text-slate-200 font-medium"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#122c37] border border-[#c88e58]/40 text-[#f3cb98] text-[10px] font-bold">
                            #{tag}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#f3cb98] group-hover:underline">Filter tag</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MUTED SLATE GRAY & ANTIQUE BRONZE GENRE BUTTONS */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 py-2">
        {availableGenres.map((genre) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`px-5 py-2 rounded-xl text-xs font-cinzel font-bold tracking-wider transition-all duration-200 border ${
              selectedGenre === genre
                ? 'bg-[#8c5023] border-[#c88e58] text-[#f6f3eb] shadow-lg scale-105'
                : 'bg-slate-700/60 border-slate-600/60 text-slate-300 hover:bg-[#8c5023]/60 hover:text-[#f6f3eb] hover:border-[#c88e58]/50'
            }`}
          >
            {genre === 'all' ? 'All Genres' : genre}
          </button>
        ))}
      </div>

      {/* Media Type Filter Tabs */}
      <div className="flex items-center justify-between border-b border-[#c88e58]/20 pb-3">
        <div className="flex items-center gap-2 bg-[#050d11] p-1 rounded-xl border border-[#c88e58]/30">
          <button
            onClick={() => setMediaType('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold transition ${
              mediaType === 'all'
                ? 'bg-[#c88e58] text-[#091b22] font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> All Types
          </button>

          <button
            onClick={() => setMediaType('movie')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold transition ${
              mediaType === 'movie'
                ? 'bg-[#c88e58] text-[#091b22] font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" /> Movies
          </button>

          <button
            onClick={() => setMediaType('tv')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold transition ${
              mediaType === 'tv'
                ? 'bg-[#c88e58] text-[#091b22] font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" /> TV Shows
          </button>
        </div>

        <span className="text-xs font-cinzel font-bold text-slate-400">
          Catalog: <span className="text-[#f3cb98] font-extrabold">{results.length}</span> titles
        </span>
      </div>

      {/* Catalog Search Results Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <Loader2 className="w-8 h-8 text-[#c88e58] animate-spin" />
          <p className="text-xs font-cinzel font-bold text-[#f3cb98]">Searching Aperture Art Deco Catalog...</p>
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {results.map((item) => {
            const recordKey = `${item.mediaType}_${item.tmdbId}`;
            const record = userRecords[recordKey] || null;

            return (
              <MediaCard
                key={recordKey}
                item={item}
                record={record}
                onSelect={(selected) => setSelectedItem(selected)}
                onMarkWatched={(m, tier) => onMarkWatched(m, tier)}
                onAddToWatchlist={(m) => onAddToWatchlist(m)}
                onRemoveRecord={() => setUserRecords(loadUserRecordsMap())}
                onRatingChange={(m, tier) => {
                  StorageService.saveRecord(m, 'watched', tier);
                  setUserRecords(loadUserRecordsMap());
                }}
              />
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center space-y-3 bg-[#091b22] border border-[#c88e58]/30 rounded-3xl p-8">
          <Film className="w-10 h-10 text-[#c88e58] mx-auto opacity-60" />
          <h3 className="font-cinzel font-bold text-lg text-slate-100">No Titles Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try refining your search query or genre filters.
          </p>
          <button
            onClick={() => {
              setQuery('');
              setMediaType('all');
              setSelectedGenre('all');
            }}
            className="px-4 py-2 bg-[#c88e58] text-[#091b22] font-bold rounded-xl text-xs hover:bg-[#e5a875] transition shadow-md"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Media Detail Modal */}
      {selectedItem && (
        <MediaDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onMarkWatched={(item, tier) => {
            onMarkWatched(item, tier);
            setUserRecords(loadUserRecordsMap());
          }}
          onAddToWatchlist={(item) => {
            onAddToWatchlist(item);
            setUserRecords(loadUserRecordsMap());
          }}
          onPersonClick={(person) => {
            setSelectedItem(null);
            handleSelectPerson(person);
          }}
          onTagClick={(tag) => {
            setSelectedItem(null);
            handleSelectGenreTag(tag);
          }}
        />
      )}
    </div>
  );
};
