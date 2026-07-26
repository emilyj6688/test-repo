'use client';

import React, { useState, useRef } from 'react';
import { MediaItem, UserMediaRecord, RatingTier, MediaType } from '@/types/media';
import { searchTMDB, MOCK_MEDIA_ITEMS } from '@/lib/tmdb';
import { StorageService } from '@/lib/storage';
import { MediaCard } from '@/components/media/media-card';
import { MediaDetailModal } from '@/components/media/media-detail-modal';
import { Search, Loader2, Film, Tv, Sparkles, Filter } from 'lucide-react';

interface Props {
  onRecordsChanged: () => void;
  onNavigateToTab?: (tab: 'watched' | 'watchlist' | 'ranking') => void;
}

export const SearchView: React.FC<Props> = ({ onRecordsChanged }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>(MOCK_MEDIA_ITEMS);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | MediaType>('all');
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

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!searchTerm.trim()) {
      setResults(MOCK_MEDIA_ITEMS);
      setLoading(false);
      return;
    }

    setLoading(true);

    debounceTimerRef.current = setTimeout(async () => {
      const items = await searchTMDB(searchTerm);
      setResults(items);
      setLoading(false);
    }, 350);
  };

  const handleMarkWatched = (item: MediaItem, tier: RatingTier = 2) => {
    StorageService.saveRecord(item, 'watched', tier);
    refreshUserRecords();
    onRecordsChanged();
  };

  const handleAddToWatchlist = (item: MediaItem) => {
    StorageService.saveRecord(item, 'want_to_watch', 2);
    refreshUserRecords();
    onRecordsChanged();
  };

  const handleRatingChange = (item: MediaItem, tier: RatingTier) => {
    StorageService.updateRatingTier(item.tmdbId, item.mediaType, tier);
    refreshUserRecords();
    onRecordsChanged();
  };

  const filteredResults = results.filter((item) => {
    if (filterType === 'all') return true;
    return item.mediaType === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Hero & Search Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 sm:p-10 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="max-w-2xl space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" /> Real-time TMDB Integration
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Discover, Track & Rank Your Favorite Cinema
          </h1>
          <p className="text-sm text-slate-400">
            Search movies and TV shows from TMDB, log what you&apos;ve watched with 3-tier ratings, and rank them through pairwise A vs B comparisons.
          </p>

          {/* Search Bar Input */}
          <div className="relative pt-2">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search movies, TV shows, actors, directors..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
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
        <div>
          <h2 className="text-lg font-bold text-slate-200">
            {query.trim() ? `Search Results for "${query}"` : 'Trending & Popular Media'}
          </h2>
          <p className="text-xs text-slate-400">
            Showing {filteredResults.length} title{filteredResults.length === 1 ? '' : 's'}
          </p>
        </div>

        {/* Media Type Filter Chips */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterType === 'all'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Media
          </button>
          <button
            onClick={() => setFilterType('movie')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
              filterType === 'movie'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" /> Movies
          </button>
          <button
            onClick={() => setFilterType('tv')}
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
      {filteredResults.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredResults.map((item) => {
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
                onRatingChange={handleRatingChange}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3">
          <Filter className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No media titles found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords or switching filters between Movies and TV Shows.
          </p>
        </div>
      )}

      {/* Media Detail Modal */}
      <MediaDetailModal
        item={selectedItem}
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        onRecordChange={() => {
          refreshUserRecords();
          onRecordsChanged();
        }}
      />
    </div>
  );
};
