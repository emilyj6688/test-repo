'use client';

import React, { useState, useMemo } from 'react';
import { UserMediaRecord, MediaItem, RatingTier, MediaType, getTierCategory } from '@/types/media';
import { StorageService } from '@/lib/storage';
import { MediaCard } from '@/components/media/media-card';
import { MediaDetailModal } from '@/components/media/media-detail-modal';
import { Film, BookmarkCheck, ArrowUpDown, ThumbsUp, ThumbsDown, Minus, ChevronDown } from 'lucide-react';

interface Props {
  initialTab?: 'watched' | 'watchlist';
  onRecordsChanged: () => void;
  onNavigateToTab: (tab: 'search' | 'watched' | 'watchlist' | 'ranking') => void;
}

const PAGE_SIZE = 24;

export const WatchedWatchlistView: React.FC<Props> = ({
  initialTab = 'watched',
  onRecordsChanged,
  onNavigateToTab,
}) => {
  const [activeTab, setActiveTab] = useState<'watched' | 'watchlist'>(initialTab);
  const [records, setRecords] = useState<UserMediaRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    return StorageService.getUserRecords();
  });
  const [tierFilter, setTierFilter] = useState<'all' | 1 | 2 | 3>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | MediaType>('all');
  const [sortBy, setSortBy] = useState<'rank' | 'title' | 'date'>('rank');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  const refreshRecords = () => {
    setRecords(StorageService.getUserRecords());
  };

  const handleMarkWatched = (item: MediaItem, tier: RatingTier = 1.0) => {
    StorageService.saveRecord(item, 'watched', tier);
    refreshRecords();
    onRecordsChanged();
  };

  const handleAddToWatchlist = (item: MediaItem) => {
    StorageService.saveRecord(item, 'want_to_watch', 1.0);
    refreshRecords();
    onRecordsChanged();
  };

  const handleRemoveRecord = () => {
    refreshRecords();
    onRecordsChanged();
  };

  const handleRatingChange = (item: MediaItem, tier: RatingTier) => {
    StorageService.updateRatingTier(item.tmdbId, item.mediaType, tier);
    refreshRecords();
    onRecordsChanged();
  };

  // Filter records by status (watched vs want_to_watch)
  const currentTabRecords = useMemo(() => {
    return records.filter((r) =>
      activeTab === 'watched' ? r.status === 'watched' : r.status === 'want_to_watch'
    );
  }, [records, activeTab]);

  // Apply Tier & Type Filters
  const filteredRecords = useMemo(() => {
    return currentTabRecords.filter((r) => {
      if (typeFilter !== 'all' && r.item.mediaType !== typeFilter) return false;
      if (activeTab === 'watched' && tierFilter !== 'all' && getTierCategory(r.ratingTier) !== tierFilter) return false;
      return true;
    });
  }, [currentTabRecords, typeFilter, activeTab, tierFilter]);

  // Sort Watched items automatically in descending order based on rank / Elo score
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      if (sortBy === 'title') return a.item.title.localeCompare(b.item.title);
      if (sortBy === 'date') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      // Default Master Rank Order: #1 highest Elo at top
      if (a.rankIndex !== b.rankIndex) return a.rankIndex - b.rankIndex;
      return b.eloRating - a.eloRating;
    });
  }, [filteredRecords, sortBy]);

  const displayedRecords = useMemo(() => {
    return sortedRecords.slice(0, visibleCount);
  }, [sortedRecords, visibleCount]);

  return (
    <div className="space-y-6">
      {/* Header & Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 sm:p-6 rounded-3xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            {activeTab === 'watched' ? <Film className="w-6 h-6" /> : <BookmarkCheck className="w-6 h-6" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {activeTab === 'watched' ? 'My Watched Media Log (Ranked Order)' : 'My Watchlist'}
            </h1>
            <p className="text-xs text-slate-400">
              {activeTab === 'watched'
                ? 'Your watched media automatically sorted from highest ranked (#1) down to lowest.'
                : 'Titles you plan to watch soon.'}
            </p>
          </div>
        </div>

        {/* Tab Toggle Buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => {
              setActiveTab('watched');
              setVisibleCount(PAGE_SIZE);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'watched'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-4 h-4" /> Watched ({records.filter((r) => r.status === 'watched').length})
          </button>
          <button
            onClick={() => {
              setActiveTab('watchlist');
              setVisibleCount(PAGE_SIZE);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'watchlist'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" /> Watchlist ({records.filter((r) => r.status === 'want_to_watch').length})
          </button>
        </div>
      </div>

      {/* Filter & Sort Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/30 border border-slate-800/80 p-3 rounded-2xl">
        {/* Tier Filter Chips (Only for Watched) */}
        {activeTab === 'watched' ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Tier:</span>
            <button
              onClick={() => {
                setTierFilter('all');
                setVisibleCount(PAGE_SIZE);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                tierFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              All Tiers
            </button>
            <button
              onClick={() => {
                setTierFilter(3);
                setVisibleCount(PAGE_SIZE);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                tierFilter === 3
                  ? 'bg-emerald-500/30 border border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-950 border border-slate-800 text-emerald-400 hover:bg-slate-800'
              }`}
            >
              <ThumbsUp className="w-3 h-3" /> Liked
            </button>
            <button
              onClick={() => {
                setTierFilter(2);
                setVisibleCount(PAGE_SIZE);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                tierFilter === 2
                  ? 'bg-amber-500/30 border border-amber-500/50 text-amber-300'
                  : 'bg-slate-950 border border-slate-800 text-amber-400 hover:bg-slate-800'
              }`}
            >
              <Minus className="w-3 h-3" /> Neutral
            </button>
            <button
              onClick={() => {
                setTierFilter(1);
                setVisibleCount(PAGE_SIZE);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                tierFilter === 1
                  ? 'bg-rose-500/30 border border-rose-500/50 text-rose-300'
                  : 'bg-slate-950 border border-slate-800 text-rose-400 hover:bg-slate-800'
              }`}
            >
              <ThumbsDown className="w-3 h-3" /> Didn&apos;t Like
            </button>
          </div>
        ) : (
          <div />
        )}

        {/* Media Type & Sort Dropdowns */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Type Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as 'all' | MediaType);
                setVisibleCount(PAGE_SIZE);
              }}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All</option>
              <option value="movie">Movies</option>
              <option value="tv">TV Shows</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rank' | 'title' | 'date')}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-500 font-bold text-cyan-400"
            >
              <option value="rank">⭐ Master Rank Order (#1 Top)</option>
              <option value="title">Title (A-Z)</option>
              <option value="date">Recently Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Media Items Grid */}
      {displayedRecords.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6">
            {displayedRecords.map((record) => (
              <MediaCard
                key={record.id}
                item={record.item}
                record={record}
                rankIndex={activeTab === 'watched' ? record.rankIndex : undefined}
                onSelect={(itm) => setSelectedItem(itm)}
                onMarkWatched={handleMarkWatched}
                onAddToWatchlist={handleAddToWatchlist}
                onRemoveRecord={handleRemoveRecord}
                onRatingChange={handleRatingChange}
              />
            ))}
          </div>

          {visibleCount < sortedRecords.length && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-400 font-bold text-xs shadow-lg transition"
              >
                <ChevronDown className="w-4 h-4" /> Load More ({sortedRecords.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-4">
          <Film className="w-12 h-12 text-slate-600 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-slate-200">
              No {activeTab === 'watched' ? 'watched items' : 'watchlist items'} recorded yet
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {activeTab === 'watched'
                ? 'Search for movies or TV shows and mark them as watched to build your master ranked list!'
                : 'Add titles to your watchlist so you never forget what to watch next.'}
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('search')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition"
          >
            Search & Track Media
          </button>
        </div>
      )}

      {/* Media Detail Modal */}
      <MediaDetailModal
        item={selectedItem}
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        onRecordChange={() => {
          refreshRecords();
          onRecordsChanged();
        }}
      />
    </div>
  );
};
