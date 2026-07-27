'use client';

import React, { useState, useRef, useMemo } from 'react';
import { MediaItem, UserMediaRecord, RatingTier, MediaType } from '@/types/media';
import { searchTMDB, MOCK_MEDIA_ITEMS } from '@/lib/tmdb';
import { StorageService } from '@/lib/storage';
import { MediaCard } from '@/components/media/media-card';
import { MediaDetailModal } from '@/components/media/media-detail-modal';
import { Search, Loader2, Film, Tv, Sparkles, Filter, ChevronDown, Tag, X } from 'lucide-react';

interface Props {
  initialSearchQuery?: string;
  onRecordsChanged: () => void;
  onNavigateToTab?: (tab: 'watched' | 'watchlist' | 'ranking') => void;
}

const PAGE_SIZE = 24;

export const SearchView: React.FC<Props> = ({ initialSearchQuery = '', onRecordsChanged }) => {
  const [query, setQuery] = useState(initialSearchQuery);
  const [results, setResults] = useState<MediaItem[]>(MOCK_MEDIA_ITEMS);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | MediaType>('all');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

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

  const handleSearch = (searchTerm: string) => {
    setQuery(searchTerm);
    setVisibleCount(PAGE_SIZE);

    const lower = searchTerm.toLowerCase().trim();

    if (!lower) {
      setResults(MOCK_MEDIA_ITEMS);
      setLoading(false);
      return;
    }

    // Instant local filter across title, genres, directors, cast
    const instantLocalMatches = MOCK_MEDIA_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(lower) ||
        item.genres.some((g) => g.toLowerCase().includes(lower)) ||
        item.directors.some((d) => d.toLowerCase().includes(lower)) ||
        item.cast.some((c) => c.name.toLowerCase().includes(lower))
    );

    setResults(instantLocalMatches);

    // Asynchronous TMDB lookup for items outside local list
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setLoading(true);

    debounceTimerRef.current = setTimeout(async () => {
      const items = await searchTMDB(searchTerm);
      setResults(items);
      setLoading(false);
    }, 200);
  };

  const handleMarkWatched = (item: MediaItem, tier: RatingTier = 1.0) => {
    StorageService.saveRecord(item, 'watched', tier);
    refreshUserRecords();
    onRecordsChanged();
  };

  const handleAddToWatchlist = (item: MediaItem) => {
    StorageService.saveRecord(item, 'want_to_watch', 1.0);
    refreshUserRecords();
    onRecordsChanged();
  };

  const handleRemoveRecord = () => {
    refreshUserRecords();
    onRecordsChanged();
  };

  const handleRatingChange = (item: MediaItem, tier: RatingTier) => {
    StorageService.updateRatingTier(item.tmdbId, item.mediaType, tier);
    refreshUserRecords();
    onRecordsChanged();
  };

  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      if (filterType === 'all') return true;
      return item.mediaType === filterType;
    });
  }, [results, filterType]);

  const displayedResults = useMemo(() => {
    return filteredResults.slice(0, visibleCount);
  }, [filteredResults, visibleCount]);

  return (
    <div className="space-y-6">
      {/* Hero & Search Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 sm:p-10 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="max-w-2xl space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" /> Instant Live Search
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Discover, Track & Rank Your Favorite Cinema
          </h1>
          <p className="text-sm text-slate-400">
            Search any movie or TV show instantly, log continuous ratings, and rank them through pairwise comparisons.
          </p>

          {/* Search Input Box */}
          <div className="pt-2">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search movies or TV shows by title, genre, director..."
                className="w-full pl-12 pr-12 py-3.5 bg-slate-950/90 border border-slate-700/80 focus:border-cyan-500 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 text-sm shadow-xl transition"
              />
              {loading && (
                <Loader2 className="absolute right-4 w-5 h-5 text-cyan-400 animate-spin" />
              )}
            </div>
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

      {/* Media Results Grid */}
      {displayedResults.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6">
            {displayedResults.map((item) => {
              const key = `${item.mediaType}_${item.tmdbId}`;
              const record = userRecordsMap.get(key) || null;
              return (
                <MediaCard
                  key={key}
                  item={item}
                  record={record}
                  onSelect={(itm) => setSelectedItem(itm)}
                  onMarkWatched={handleMarkWatched}
                  onAddToWatchlist={handleAddToWatchlist}
                  onRemoveRecord={handleRemoveRecord}
                  onRatingChange={handleRatingChange}
                />
              );
            })}
          </div>

          {/* Load More Pagination Button */}
          {visibleCount < filteredResults.length && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-400 font-bold text-xs shadow-lg transition"
              >
                <ChevronDown className="w-4 h-4" /> Load More Titles ({filteredResults.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3">
          <Filter className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No media titles found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try searching for another movie or TV show title!
          </p>
        </div>
      )}

      {/* Media Detail Modal */}
      <MediaDetailModal
        item={selectedItem}
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        onPersonClick={(personName) => handleSearch(personName)}
        onRecordChange={() => {
          refreshUserRecords();
          onRecordsChanged();
        }}
      />
    </div>
  );
};
