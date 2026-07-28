'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { UserMediaRecord, MediaItem, RatingTier, MediaType, getTierCategory } from '@/types/media';
import { StorageService } from '@/lib/storage';
import { useLanguage } from '@/context/language-context';
import { MediaCard } from '@/components/media/media-card';
import { MediaDetailModal } from '@/components/media/media-detail-modal';
import { Film, BookmarkCheck, ArrowUpDown, ThumbsUp, ThumbsDown, Minus, ChevronDown, Search, X } from 'lucide-react';

interface Props {
  initialTab?: 'watched' | 'watchlist';
  onRecordsChanged: () => void;
  onNavigateToTab: (tab: 'search' | 'watched' | 'watchlist' | 'ranking') => void;
  onPersonSelect?: (personName: string) => void;
}

const PAGE_SIZE = 24;

export const WatchedWatchlistView: React.FC<Props> = ({
  initialTab = 'watched',
  onRecordsChanged,
  onNavigateToTab,
  onPersonSelect,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'watched' | 'watchlist'>(initialTab);
  const [records, setRecords] = useState<UserMediaRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    return StorageService.getUserRecords();
  });
  const [tierFilter, setTierFilter] = useState<'all' | 1 | 2 | 3>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | MediaType>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'rank' | 'title' | 'date'>('rank');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  const refreshRecords = () => {
    setRecords(StorageService.getUserRecords());
  };

  useEffect(() => {
    const handleUpdate = () => {
      refreshRecords();
    };
    window.addEventListener('cinetrack_records_updated', handleUpdate);
    window.addEventListener('cinetrack_user_changed', handleUpdate as EventListener);
    return () => {
      window.removeEventListener('cinetrack_records_updated', handleUpdate);
      window.removeEventListener('cinetrack_user_changed', handleUpdate as EventListener);
    };
  }, []);

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

  // Apply Search, Tier & Type Filters
  const filteredRecords = useMemo(() => {
    return currentTabRecords.filter((r) => {
      if (typeFilter !== 'all' && r.item.mediaType !== typeFilter) return false;
      if (activeTab === 'watched' && tierFilter !== 'all' && getTierCategory(r.ratingTier) !== tierFilter) return false;
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase().trim();
        const matchTitle = r.item.title.toLowerCase().includes(q);
        const matchGenre = r.item.genres?.some((g) => g.toLowerCase().includes(q));
        const matchCast = r.item.cast?.some((c) => c.name.toLowerCase().includes(q));
        if (!matchTitle && !matchGenre && !matchCast) return false;
      }
      return true;
    });
  }, [currentTabRecords, typeFilter, activeTab, tierFilter, searchFilter]);

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

  const handleGlobalSearch = (query: string) => {
    if (onPersonSelect) onPersonSelect(query);
    onNavigateToTab('search');
  };

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
              {activeTab === 'watched' ? t('watched_title') : t('watchlist_title')}
            </h1>
            <p className="text-xs text-slate-400">
              {activeTab === 'watched' ? t('watched_desc') : t('watchlist_desc')}
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
            <Film className="w-4 h-4" /> {t('watched_tab')} ({records.filter((r) => r.status === 'watched').length})
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
            <BookmarkCheck className="w-4 h-4" /> {t('watchlist_tab')} ({records.filter((r) => r.status === 'want_to_watch').length})
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/30 border border-slate-800/80 p-3.5 rounded-2xl">
        
        {/* Search Input filter within List */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => {
              setSearchFilter(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder={t('filter_placeholder')}
            className="w-full pl-9 pr-8 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tier Filter Chips (Only for Watched) */}
          {activeTab === 'watched' && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setTierFilter('all');
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  tierFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('all_tiers')}
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
                <ThumbsUp className="w-3 h-3" /> {t('liked')}
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
                <Minus className="w-3 h-3" /> {t('neutral')}
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
                <ThumbsDown className="w-3 h-3" /> {t('disliked')}
              </button>
            </div>
          )}

          {/* Media Type Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400">{t('type_label')}</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as 'all' | MediaType);
                setVisibleCount(PAGE_SIZE);
              }}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">{t('all_type')}</option>
              <option value="movie">{t('movies_type')}</option>
              <option value="tv">{t('tv_type')}</option>
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

      {/* Grid or Empty State */}
      {displayedRecords.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
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
      ) : searchFilter.trim() ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-3xl space-y-4 p-6">
          <Search className="w-12 h-12 text-cyan-400/80 mx-auto animate-pulse" />
          <div>
            <h3 className="text-lg font-bold text-white">
              No titles matching &quot;{searchFilter}&quot; in your {activeTab === 'watched' ? 'watched log' : 'watchlist'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Looking for <span className="text-white font-bold">&quot;{searchFilter}&quot;</span> in the global movie & TV database?
            </p>
          </div>
          <button
            onClick={() => handleGlobalSearch(searchFilter)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-xl shadow-cyan-500/20 transition transform hover:scale-105"
          >
            <Search className="w-4 h-4" /> Search Global TMDB Catalog for &quot;{searchFilter}&quot;
          </button>
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
        onPersonClick={(personName) => {
          if (onPersonSelect) onPersonSelect(personName);
          onNavigateToTab('search');
        }}
        onRecordChange={() => {
          refreshRecords();
          onRecordsChanged();
        }}
      />
    </div>
  );
};
