'use client';

import React, { useState, useEffect } from 'react';
import { MediaItem, RatingTier, SeasonStatus } from '@/types/media';
import { getTMDBDetails, getTMDBImageUrl } from '@/lib/tmdb';
import { StorageService } from '@/lib/storage';
import { RatingSlider } from '@/components/media/rating-slider';
import { getContentRatingStyle } from '@/components/media/media-card';
import { X, Calendar, Star, CheckCircle, Bookmark, Trash2, User, Clock, Tag, Clapperboard } from 'lucide-react';

interface Props {
  item: MediaItem | null;
  isOpen?: boolean;
  onClose: () => void;
  onRecordChange?: () => void;
  onMarkWatched?: (item: MediaItem, tier?: RatingTier) => void;
  onAddToWatchlist?: (item: MediaItem) => void;
  onPersonClick?: (personName: string) => void;
  onTagClick?: (tag: string) => void;
}

export const MediaDetailModal: React.FC<Props> = ({
  item,
  isOpen = true,
  onClose,
  onRecordChange,
  onPersonClick,
  onTagClick,
}) => {
  const [fetchedDetails, setFetchedDetails] = useState<MediaItem | null>(null);
  const [, setRecordRevision] = useState(0);

  useEffect(() => {
    if (!item) return;

    // Fetch full TMDB details (cast, crew, runtime, tagline)
    let isMounted = true;
    getTMDBDetails(item.tmdbId, item.mediaType)
      .then((full) => {
        if (isMounted) setFetchedDetails(full);
      })
      .catch(() => {
        if (isMounted) setFetchedDetails(item);
      });

    return () => {
      isMounted = false;
    };
  }, [item]);

  if (!isOpen || !item) return null;

  const currentDetails = (fetchedDetails && fetchedDetails.tmdbId === item.tmdbId && fetchedDetails.mediaType === item.mediaType) ? fetchedDetails : item;
  const userRecord = StorageService.getRecord(currentDetails.tmdbId, currentDetails.mediaType);
  const year = currentDetails.releaseDate ? currentDetails.releaseDate.substring(0, 4) : 'N/A';

  const handleMarkWatched = (tier: RatingTier = 5.0) => {
    StorageService.saveRecord(currentDetails, 'watched', tier);
    setRecordRevision((prev) => prev + 1);
    if (onRecordChange) onRecordChange();
  };

  const handleAddToWatchlist = () => {
    StorageService.saveRecord(currentDetails, 'want_to_watch', 5.0);
    setRecordRevision((prev) => prev + 1);
    if (onRecordChange) onRecordChange();
  };

  const handleRemove = () => {
    StorageService.removeRecord(currentDetails.tmdbId, currentDetails.mediaType);
    setRecordRevision((prev) => prev + 1);
    if (onRecordChange) onRecordChange();
  };

  const handleRatingChange = (newTier: RatingTier) => {
    StorageService.updateRatingTier(currentDetails.tmdbId, currentDetails.mediaType, newTier);
    setRecordRevision((prev) => prev + 1);
    if (onRecordChange) onRecordChange();
  };

  const handleTagTrigger = (tagValue: string) => {
    if (onTagClick) {
      onTagClick(tagValue);
    }
    if (onPersonClick) {
      onPersonClick(tagValue);
    }
    onClose();
  };

  const handleSeasonStatusChange = (seasonNum: number, newStatus: SeasonStatus) => {
    const currentProgress = { ...(userRecord?.seasonsProgress || {}) };
    currentProgress[seasonNum] = newStatus;

    let newOverallStatus = userRecord?.status || 'watched';
    const watchedCount = Object.values(currentProgress).filter((st) => st === 'watched').length;
    const inProgressCount = Object.values(currentProgress).filter((st) => st === 'in_progress').length;

    if (watchedCount > 0 || inProgressCount > 0) {
      newOverallStatus = 'watched';
    }

    StorageService.saveRecord(
      currentDetails,
      newOverallStatus,
      userRecord?.ratingTier || 5.0,
      undefined,
      currentProgress
    );

    setRecordRevision((prev) => prev + 1);
    if (onRecordChange) onRecordChange();
  };

  const handleMarkAllSeasonsWatched = () => {
    const totalSeasons = currentDetails.numberOfSeasons || 1;
    const updatedProgress: Record<number, SeasonStatus> = {};
    for (let s = 1; s <= totalSeasons; s++) {
      updatedProgress[s] = 'watched';
    }

    StorageService.saveRecord(
      currentDetails,
      'watched',
      userRecord?.ratingTier || 5.0,
      undefined,
      updatedProgress
    );

    setRecordRevision((prev) => prev + 1);
    if (onRecordChange) onRecordChange();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-[#050d11]/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-3xl bg-[#091b22] border-2 border-[#c88e58]/50 rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col text-[#eef4f6]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-[#071318]/80 border border-[#c88e58]/50 text-slate-300 hover:text-white flex items-center justify-center transition shadow-lg"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1">
          {/* Backdrop Banner if available */}
          {currentDetails.backdropPath && (
            <div className="h-48 sm:h-64 w-full relative overflow-hidden bg-[#050d11]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getTMDBImageUrl(currentDetails.backdropPath, 'backdrop')}
                alt={currentDetails.title}
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#091b22] via-[#091b22]/40 to-transparent" />
            </div>
          )}

          {/* Details Container */}
          <div className={`p-6 sm:p-8 space-y-6 ${currentDetails.backdropPath ? '-mt-24 relative z-10' : ''}`}>
            {/* Top Side-by-Side Section */}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Poster Card */}
              <div className="w-36 sm:w-48 flex-shrink-0 mx-auto sm:mx-0 shadow-2xl rounded-2xl border-2 border-[#c88e58]/60 bg-[#050d11] p-1 self-start">
                <div className="w-full relative aspect-[2/3] rounded-xl overflow-hidden bg-[#071318] flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getTMDBImageUrl(currentDetails.posterPath, 'poster', currentDetails.title, currentDetails.mediaType)}
                    alt={currentDetails.title}
                    className="w-full h-full object-contain drop-shadow-xl"
                  />
                </div>
              </div>

              {/* Content Meta & User Rating Controls */}
              <div className="flex-1 space-y-4 w-full">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-cinzel font-bold uppercase tracking-wider bg-[#c88e58]/20 border border-[#c88e58]/50 text-[#f3cb98]">
                      {currentDetails.mediaType === 'movie' ? 'Movie' : 'TV Series'}
                    </span>
                    {(() => {
                      const ratingInfo = getContentRatingStyle(currentDetails.contentRating);
                      if (!ratingInfo.label) return null;
                      return (
                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider border ${ratingInfo.style}`}>
                          {ratingInfo.label}
                        </span>
                      );
                    })()}
                    {year !== 'N/A' && (
                      <span className="flex items-center gap-1 text-xs text-slate-300 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-[#c88e58]" /> {year}
                      </span>
                    )}
                    {currentDetails.runtime && (
                      <span className="flex items-center gap-1 text-xs text-slate-300 font-mono">
                        <Clock className="w-3.5 h-3.5 text-[#c88e58]" /> {currentDetails.runtime} min
                      </span>
                    )}
                    {currentDetails.voteAverage && (
                      <span className="flex items-center gap-1 text-xs text-amber-300 font-semibold bg-[#071318] px-2 py-0.5 rounded-md border border-amber-500/40">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {currentDetails.voteAverage}/10
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-cinzel font-extrabold text-[#f6f3eb] tracking-tight">
                    {currentDetails.title}
                  </h1>
                  {currentDetails.tagline && (
                    <p className="text-xs text-[#f3cb98] italic mt-1 font-serif">
                      &ldquo;{currentDetails.tagline}&rdquo;
                    </p>
                  )}
                </div>

                {/* User Tracking & Rating Controls */}
                <div className="bg-[#050d11] border border-[#c88e58]/40 p-4 rounded-2xl space-y-3">
                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    <span className="text-xs font-cinzel font-bold text-slate-300 uppercase tracking-wider">
                      My Tracking Status
                    </span>

                    {userRecord && (
                      <button
                        onClick={handleRemove}
                        className="text-xs text-rose-300 hover:text-white flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => (userRecord?.status === 'watched' ? handleRemove() : handleMarkWatched(userRecord?.ratingTier || 5.0))}
                      className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition ${
                        userRecord?.status === 'watched'
                          ? 'bg-[#c88e58]/30 border-[#c88e58] text-[#f3cb98]'
                          : 'bg-[#0f262e] hover:bg-[#c88e58]/20 border-[#c88e58]/40 text-slate-200'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4 text-[#c88e58]" />
                      {userRecord?.status === 'watched' ? '✓ Watched (Undo)' : 'Mark as Watched'}
                    </button>

                    <button
                      onClick={() => (userRecord?.status === 'want_to_watch' ? handleRemove() : handleAddToWatchlist())}
                      className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition ${
                        userRecord?.status === 'want_to_watch'
                          ? 'bg-[#c88e58]/30 border-[#c88e58] text-[#f3cb98]'
                          : 'bg-[#0f262e] hover:bg-[#c88e58]/20 border-[#c88e58]/40 text-slate-200'
                      }`}
                    >
                      <Bookmark className="w-4 h-4 text-[#c88e58]" />
                      {userRecord?.status === 'want_to_watch' ? '🔖 In Watchlist' : 'Add to Watchlist'}
                    </button>
                  </div>

                  {userRecord?.status === 'watched' && (
                    <div className="pt-2 border-t border-[#c88e58]/20">
                      <RatingSlider
                        value={userRecord.ratingTier !== undefined ? userRecord.ratingTier : 5.0}
                        onChange={(newTier) => handleRatingChange(newTier)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Overview / Synopsis */}
            {currentDetails.overview && (
              <div className="space-y-2">
                <h3 className="text-xs font-cinzel font-bold text-[#f3cb98] uppercase tracking-wider">Synopsis</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {currentDetails.overview}
                </p>
              </div>
            )}

            {/* Directors & Cast List (Interactive Tag & Actor Clicks) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentDetails.directors && currentDetails.directors.length > 0 && (
                <div className="space-y-1.5 bg-[#050d11] p-3 rounded-xl border border-[#c88e58]/30">
                  <span className="text-[10px] font-cinzel font-bold text-[#f3cb98] uppercase tracking-wider flex items-center gap-1">
                    <Clapperboard className="w-3 h-3 text-[#c88e58]" /> Director(s)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentDetails.directors.map((director) => (
                      <button
                        key={director}
                        onClick={() => handleTagTrigger(director)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#122c37] border border-[#c88e58]/40 text-[#f6f3eb] hover:bg-[#c88e58] hover:text-[#071318] transition flex items-center gap-1"
                        title={`Filter movies directed by ${director}`}
                      >
                        <User className="w-3 h-3" /> {director}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentDetails.genres && currentDetails.genres.length > 0 && (
                <div className="space-y-1.5 bg-[#050d11] p-3 rounded-xl border border-[#c88e58]/30">
                  <span className="text-[10px] font-cinzel font-bold text-[#f3cb98] uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3 h-3 text-[#c88e58]" /> Genres &amp; Categories
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentDetails.genres.map((genre) => (
                      <button
                        key={genre}
                        onClick={() => handleTagTrigger(genre)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#122c37] border border-[#c88e58]/40 text-[#f3cb98] hover:bg-[#c88e58] hover:text-[#071318] transition"
                        title={`Filter by #${genre}`}
                      >
                        #{genre}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cast Cards */}
            {currentDetails.cast && currentDetails.cast.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#c88e58]/20">
                <h3 className="text-xs font-cinzel font-bold text-[#f3cb98] uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#c88e58]" /> Key Cast Members (Click to Search)
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {currentDetails.cast.slice(0, 10).map((castMember) => (
                    <div
                      key={castMember.name}
                      onClick={() => handleTagTrigger(castMember.name)}
                      className="w-24 shrink-0 bg-[#050d11] border border-[#c88e58]/30 hover:border-[#c88e58] rounded-xl p-1.5 text-center cursor-pointer transition group"
                    >
                      <div className="w-full aspect-square rounded-lg bg-[#071318] overflow-hidden mb-1 border border-[#c88e58]/20">
                        {castMember.profilePath ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={getTMDBImageUrl(castMember.profilePath, 'profile')}
                            alt={castMember.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                            👤
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-slate-200 group-hover:text-[#f3cb98] truncate font-cinzel">
                        {castMember.name}
                      </p>
                      {castMember.character && (
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">
                          {castMember.character}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
