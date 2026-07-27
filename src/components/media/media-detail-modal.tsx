'use client';

import React, { useState, useEffect } from 'react';
import { MediaItem, RatingTier, SeasonStatus } from '@/types/media';
import { getTMDBDetails, getTMDBImageUrl } from '@/lib/tmdb';
import { StorageService } from '@/lib/storage';
import { RatingSlider } from '@/components/media/rating-slider';
import { getContentRatingStyle } from '@/components/media/media-card';
import { X, Calendar, Star, CheckCircle, Bookmark, Trash2, User, Clock, Tag, Search, Clapperboard, CheckSquare } from 'lucide-react';

interface Props {
  item: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRecordChange?: () => void;
  onPersonClick?: (personName: string) => void;
  onTagClick?: (tag: string) => void;
}

export const MediaDetailModal: React.FC<Props> = ({ item, isOpen, onClose, onRecordChange, onPersonClick, onTagClick }) => {
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
    } else if (onPersonClick) {
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
      userRecord?.ratingTier || 1.0,
      undefined,
      currentProgress
    );

    setRecordRevision((prev) => prev + 1);
    if (onRecordChange) onRecordChange();
  };

  const handleSelectAllSeasons = () => {
    const totalSeasons = currentDetails.numberOfSeasons || 1;
    const currentProgress = { ...(userRecord?.seasonsProgress || {}) };

    let allWatched = true;
    for (let s = 1; s <= totalSeasons; s++) {
      if (currentProgress[s] !== 'watched') {
        allWatched = false;
        break;
      }
    }

    if (allWatched) {
      // Deselect all seasons -> remove record completely instead of putting in watchlist
      StorageService.removeRecord(currentDetails.tmdbId, currentDetails.mediaType);
    } else {
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
    }

    setRecordRevision((prev) => prev + 1);
    if (onRecordChange) onRecordChange();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-slate-950/70 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition shadow-lg"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1">
          {/* Backdrop Banner if available */}
          {currentDetails.backdropPath && (
            <div className="h-48 sm:h-64 w-full relative overflow-hidden bg-slate-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getTMDBImageUrl(currentDetails.backdropPath, 'backdrop')}
                alt={currentDetails.title}
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
            </div>
          )}

          {/* Details Container */}
          <div className={`p-6 sm:p-8 space-y-6 ${currentDetails.backdropPath ? '-mt-24 relative z-10' : ''}`}>
            {/* Top Side-by-Side Section: Poster on Left, Title & Rating Controls on Right */}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Poster Card */}
              <div className="w-36 sm:w-48 flex-shrink-0 mx-auto sm:mx-0 shadow-2xl rounded-2xl border border-slate-700/80 bg-slate-950/90 p-1 self-start">
                <div className="w-full relative aspect-[2/3] rounded-xl overflow-hidden bg-slate-900/90 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getTMDBImageUrl(currentDetails.posterPath, 'poster', currentDetails.title, currentDetails.mediaType)}
                    alt={currentDetails.title}
                    className="w-full h-full object-contain drop-shadow-xl"
                  />
                </div>
              </div>

              {/* Content Meta & User Rating Controls (Right of Poster) */}
              <div className="flex-1 space-y-4 w-full">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
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
                      <span className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                        <Calendar className="w-3.5 h-3.5" /> {year}
                      </span>
                    )}
                    {currentDetails.runtime && (
                      <span className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                        <Clock className="w-3.5 h-3.5" /> {currentDetails.runtime} min
                      </span>
                    )}
                    {currentDetails.mediaType === 'tv' && (
                      <span className="flex items-center gap-1 text-xs text-purple-300 font-semibold bg-purple-500/20 px-2.5 py-0.5 rounded-md border border-purple-500/40">
                        📺 {currentDetails.numberOfSeasons || 1} {currentDetails.numberOfSeasons === 1 ? 'Season' : 'Seasons'}
                        {currentDetails.numberOfEpisodes ? ` (${currentDetails.numberOfEpisodes} Ep)` : ''}
                      </span>
                    )}
                    {currentDetails.voteAverage && (
                      <span className="flex items-center gap-1 text-xs text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                        <Star className="w-3.5 h-3.5 fill-amber-400" /> {currentDetails.voteAverage}/10
                      </span>
                    )}
                    <span
                      onClick={() => {
                        onClose();
                        if (onTagClick) onTagClick(currentDetails.originalLanguage || 'English');
                      }}
                      className="flex items-center gap-1 text-xs text-emerald-300 font-semibold bg-emerald-500/20 px-2.5 py-0.5 rounded-md border border-emerald-500/40 cursor-pointer hover:bg-emerald-500/30 transition"
                      title="Click to filter search by language"
                    >
                      🌐 {currentDetails.originalLanguage || 'English'}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {currentDetails.title}
                  </h1>
                  {currentDetails.tagline && (
                    <p className="text-xs text-cyan-300/80 italic mt-1 font-medium">
                      &ldquo;{currentDetails.tagline}&rdquo;
                    </p>
                  )}
                </div>

                {/* User Tracking & Rating Controls */}
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      My Tracking Status
                    </span>

                    {userRecord && (
                      <button
                        onClick={handleRemove}
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => (userRecord?.status === 'watched' ? handleRemove() : handleMarkWatched(userRecord?.ratingTier || 1.0))}
                      className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 border transition ${
                        userRecord?.status === 'watched'
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 hover:bg-rose-500/20 hover:border-rose-500/60 hover:text-rose-300'
                          : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                      }`}
                      title={userRecord?.status === 'watched' ? 'Click to Undo / Remove from Watched' : 'Mark as Watched'}
                    >
                      <CheckCircle className="w-4 h-4" />
                      {userRecord?.status === 'watched' ? '✓ Watched (Click to Undo)' : 'Mark as Watched'}
                    </button>

                    <button
                      onClick={() => (userRecord?.status === 'want_to_watch' ? handleRemove() : handleAddToWatchlist())}
                      className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 border transition ${
                        userRecord?.status === 'want_to_watch'
                          ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 hover:bg-rose-500/20 hover:border-rose-500/60 hover:text-rose-300'
                          : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                      }`}
                      title={userRecord?.status === 'want_to_watch' ? 'Click to Undo / Remove from Watchlist' : 'Add to Want to Watch'}
                    >
                      <Bookmark className={`w-4 h-4 ${userRecord?.status === 'want_to_watch' ? 'fill-cyan-400' : ''}`} />
                      {userRecord?.status === 'want_to_watch' ? '✓ In Watchlist (Click to Undo)' : 'Want to Watch'}
                    </button>
                  </div>

                  {userRecord?.status === 'watched' && (
                    <div className="pt-2 border-t border-slate-800">
                      <RatingSlider
                        value={userRecord.ratingTier}
                        onChange={handleRatingChange}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Full-Width Bottom Section Below Poster (Plot Summary Downward Spans 100% Width) */}
            <div className="space-y-6 pt-2 border-t border-slate-800/80">
              {/* Plot Summary Overview */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Plot Summary</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {currentDetails.overview}
                </p>
              </div>

                {/* TV Series Season Progress & Select All Tracker */}
                {currentDetails.mediaType === 'tv' && (
                  <div className="bg-slate-950/80 border border-purple-500/40 p-5 rounded-2xl space-y-4 shadow-lg">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-lg text-purple-300 shadow-inner">
                          📺
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-white">
                            Season Progress Tracker ({currentDetails.numberOfSeasons || 1} {(currentDetails.numberOfSeasons || 1) === 1 ? 'Season' : 'Seasons'})
                          </h4>
                          <p className="text-xs text-purple-300/80">
                            Select individual seasons or mark seasons as In Progress
                          </p>
                        </div>
                      </div>

                      {/* Select All Toggle Button */}
                      <button
                        type="button"
                        onClick={handleSelectAllSeasons}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-300 font-bold text-xs shadow-sm transition"
                      >
                        <CheckSquare className="w-4 h-4 text-purple-400" />
                        {(() => {
                          const total = currentDetails.numberOfSeasons || 1;
                          const progress = userRecord?.seasonsProgress || {};
                          let allW = true;
                          for (let s = 1; s <= total; s++) {
                            if (progress[s] !== 'watched') {
                              allW = false;
                              break;
                            }
                          }
                          return allW ? 'Deselect All Seasons' : 'Select All Seasons';
                        })()}
                      </button>
                    </div>

                    {/* Season List with High-Contrast Season Badges */}
                    <div className="space-y-2.5 pt-2">
                      {Array.from({ length: Math.min(currentDetails.numberOfSeasons || 1, 30) }, (_, i) => i + 1).map((seasonNum) => {
                        const currentSeasonStatus: SeasonStatus = userRecord?.seasonsProgress?.[seasonNum] || 'unwatched';

                        return (
                          <div
                            key={seasonNum}
                            className={`flex flex-wrap sm:flex-nowrap items-center justify-between p-3.5 rounded-2xl border transition gap-3 ${
                              currentSeasonStatus === 'watched'
                                ? 'bg-emerald-950/40 border-emerald-500/60'
                                : currentSeasonStatus === 'in_progress'
                                ? 'bg-amber-950/40 border-amber-500/60'
                                : 'bg-slate-900/90 border-slate-800'
                            }`}
                          >
                            {/* Prominent Season Label & Status Badge */}
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-inner flex-shrink-0 ${
                                currentSeasonStatus === 'watched'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                                  : currentSeasonStatus === 'in_progress'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}>
                                S{seasonNum}
                              </div>
                              <div>
                                <h5 className="text-sm font-black text-white tracking-wide">
                                  Season {seasonNum}
                                </h5>
                                <span className={`text-[11px] font-extrabold ${
                                  currentSeasonStatus === 'watched'
                                    ? 'text-emerald-400'
                                    : currentSeasonStatus === 'in_progress'
                                    ? 'text-amber-400'
                                    : 'text-slate-400'
                                }`}>
                                  {currentSeasonStatus === 'watched'
                                    ? '✓ Watched'
                                    : currentSeasonStatus === 'in_progress'
                                    ? '⏳ In Progress'
                                    : '○ Not Watched Yet'}
                                </span>
                              </div>
                            </div>

                            {/* Clear High-Contrast Action Buttons */}
                            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleSeasonStatusChange(seasonNum, currentSeasonStatus === 'watched' ? 'unwatched' : 'watched')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                                  currentSeasonStatus === 'watched'
                                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                                }`}
                                title="Mark Season as Watched"
                              >
                                {currentSeasonStatus === 'watched' ? '✓ Watched' : 'Mark Watched'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSeasonStatusChange(seasonNum, currentSeasonStatus === 'in_progress' ? 'unwatched' : 'in_progress')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                                  currentSeasonStatus === 'in_progress'
                                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                                }`}
                                title="Mark Season as In Progress"
                              >
                                {currentSeasonStatus === 'in_progress' ? '⏳ In Progress' : 'In Progress'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Clickable Genre Tags */}
                {currentDetails.genres && currentDetails.genres.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-cyan-400" /> Genre Tags (Click to see all matching titles)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentDetails.genres.map((genre) => (
                        <button
                          key={genre}
                          onClick={() => handleTagTrigger(genre)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-cyan-500/20 border border-slate-700/80 hover:border-cyan-500/50 text-xs font-bold text-slate-200 hover:text-cyan-300 transition shadow-sm hover:scale-105"
                          title={`Click to view all ${genre} movies and TV shows`}
                        >
                          <Tag className="w-3 h-3 text-cyan-400" /> {genre}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clickable Directors & Creators Tags */}
                {currentDetails.directors && currentDetails.directors.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Clapperboard className="w-3.5 h-3.5 text-cyan-400" /> {currentDetails.mediaType === 'movie' ? 'Director Tag(s)' : 'Creator Tag(s)'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentDetails.directors.map((director) => (
                        <button
                          key={director}
                          onClick={() => handleTagTrigger(director)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs shadow-sm hover:scale-105 transition"
                          title={`Click to view all movies directed by ${director}`}
                        >
                          <Search className="w-3 h-3 text-cyan-400" /> {director}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            {/* Clickable Top Cast Member Actor Cards (3-10 Actors) */}
            {currentDetails.cast && currentDetails.cast.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-400" /> Main Actor Tags (Click an actor to see all their movies)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Showing top {Math.min(10, currentDetails.cast.length)} actors
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {currentDetails.cast.slice(0, 10).map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleTagTrigger(c.name)}
                      className="group/actor cursor-pointer flex flex-col items-center p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 text-center shadow-lg hover:-translate-y-1"
                      title={`Click to search all movies featuring ${c.name}`}
                    >
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-800 mb-2 border-2 border-slate-700 group-hover/actor:border-cyan-400 transition-colors shadow-md">
                        {c.profilePath ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={getTMDBImageUrl(c.profilePath, 'profile')}
                            alt={c.name}
                            className="w-full h-full object-cover group-hover/actor:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500">
                            <User className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-200 group-hover/actor:text-cyan-300 transition line-clamp-1">
                        {c.name}
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {c.character}
                      </p>
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
