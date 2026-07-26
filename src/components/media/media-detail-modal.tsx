'use client';

import React, { useState, useEffect } from 'react';
import { MediaItem, UserMediaRecord, RatingTier } from '@/types/media';
import { getTMDBDetails, getTMDBImageUrl } from '@/lib/tmdb';
import { StorageService } from '@/lib/storage';
import { RatingSlider } from '@/components/media/rating-slider';
import { X, Calendar, Star, CheckCircle, Bookmark, Trash2, User, Clock, Tag } from 'lucide-react';

interface Props {
  item: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRecordChange?: () => void;
}

export const MediaDetailModal: React.FC<Props> = ({ item, isOpen, onClose, onRecordChange }) => {
  const [details, setDetails] = useState<MediaItem | null>(item);
  const [userRecord, setUserRecord] = useState<UserMediaRecord | null>(null);

  useEffect(() => {
    if (!item || !isOpen) return;

    let isMounted = true;

    // Fetch details asynchronously
    getTMDBDetails(item.tmdbId, item.mediaType).then((fullDetails) => {
      if (isMounted) {
        setDetails(fullDetails);
        setUserRecord(StorageService.getRecordByMediaId(item.tmdbId, item.mediaType));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const currentDetails = details || item;

  const handleMarkWatched = (tier: RatingTier = 2) => {
    const saved = StorageService.saveRecord(currentDetails, 'watched', tier);
    setUserRecord(saved);
    if (onRecordChange) onRecordChange();
  };

  const handleAddToWatchlist = () => {
    const saved = StorageService.saveRecord(currentDetails, 'want_to_watch', 2);
    setUserRecord(saved);
    if (onRecordChange) onRecordChange();
  };

  const handleRemove = () => {
    StorageService.removeRecord(currentDetails.tmdbId, currentDetails.mediaType);
    setUserRecord(null);
    if (onRecordChange) onRecordChange();
  };

  const handleRatingChange = (newTier: RatingTier) => {
    if (userRecord && userRecord.status === 'watched') {
      StorageService.updateRatingTier(currentDetails.tmdbId, currentDetails.mediaType, newTier);
      setUserRecord({ ...userRecord, ratingTier: newTier });
      if (onRecordChange) onRecordChange();
    } else {
      handleMarkWatched(newTier);
    }
  };

  const year = currentDetails.releaseDate ? currentDetails.releaseDate.substring(0, 4) : 'N/A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative text-slate-100 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-slate-950/70 hover:bg-slate-800 text-slate-300 rounded-full backdrop-blur-md transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Backdrop Banner if available */}
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
        <div className={`p-6 sm:p-8 ${currentDetails.backdropPath ? '-mt-24 relative z-10' : ''}`}>
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Poster Card */}
            <div className="w-36 sm:w-48 flex-shrink-0 mx-auto sm:mx-0 shadow-2xl rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getTMDBImageUrl(currentDetails.posterPath, 'poster')}
                alt={currentDetails.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content Meta */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
                    {currentDetails.mediaType === 'movie' ? 'Movie' : 'TV Series'}
                  </span>
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
                  {currentDetails.voteAverage && (
                    <span className="flex items-center gap-1 text-xs text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {currentDetails.voteAverage}/10
                    </span>
                  )}
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

              {/* User Rating & List Action Panel */}
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
                    onClick={handleAddToWatchlist}
                    className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 border transition ${
                      userRecord?.status === 'want_to_watch'
                        ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                    }`}
                  >
                    <Bookmark className="w-4 h-4" />
                    {userRecord?.status === 'want_to_watch' ? 'In Watchlist' : 'Want to Watch'}
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

              {/* Overview */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Plot Summary</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {currentDetails.overview}
                </p>
              </div>

              {/* Genres */}
              {currentDetails.genres && currentDetails.genres.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Genres
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {currentDetails.genres.map((g) => (
                      <span key={g} className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/60 text-xs font-medium text-slate-300">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Directors & Creators */}
              {currentDetails.directors && currentDetails.directors.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    {currentDetails.mediaType === 'movie' ? 'Director(s)' : 'Creator(s)'}
                  </h3>
                  <p className="text-sm font-semibold text-cyan-300">
                    {currentDetails.directors.join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Top Cast Section */}
          {currentDetails.cast && currentDetails.cast.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-800">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" /> Top Cast Members
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {currentDetails.cast.slice(0, 6).map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 flex-shrink-0">
                      {c.profilePath ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={getTMDBImageUrl(c.profilePath, 'profile')}
                          alt={c.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">{c.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{c.character}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
