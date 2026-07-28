'use client';

import React, { useState } from 'react';
import { MediaItem, UserMediaRecord, RatingTier } from '@/types/media';
import { getTMDBImageUrl, generateTitlePosterSVG } from '@/lib/tmdb';
import { RatingSlider } from '@/components/media/rating-slider';
import { CheckCircle, Bookmark, Star, Calendar, XCircle } from 'lucide-react';
import { StorageService } from '@/lib/storage';

interface Props {
  item: MediaItem;
  record?: UserMediaRecord | null;
  onSelect: (item: MediaItem) => void;
  onMarkWatched: (item: MediaItem, tier?: RatingTier) => void;
  onAddToWatchlist: (item: MediaItem) => void;
  onRemoveRecord?: (item: MediaItem) => void;
  onRatingChange?: (item: MediaItem, tier: RatingTier) => void;
  rankIndex?: number;
}

export function getContentRatingStyle(rating?: string): { label: string; style: string } {
  if (!rating) return { label: '', style: '' };
  const upper = rating.toUpperCase().trim();
  return { label: upper, style: 'bg-slate-800 text-slate-200 border-slate-700 font-extrabold' };
}

export const MediaCard: React.FC<Props> = ({
  item,
  record,
  onSelect,
  onMarkWatched,
  onAddToWatchlist,
  onRemoveRecord,
  onRatingChange,
  rankIndex,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(() =>
    getTMDBImageUrl(item.posterPath, 'poster', item.title, item.mediaType)
  );
  const year = item.releaseDate ? item.releaseDate.substring(0, 4) : '';
  const isWatched = record?.status === 'watched';
  const isWatchlist = record?.status === 'want_to_watch';

  const handleUnwatchToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.removeRecord(item.tmdbId, item.mediaType);
    if (onRemoveRecord) onRemoveRecord(item);
  };

  return (
    <div
      onClick={() => onSelect(item)}
      className="group relative bg-slate-900/90 border border-slate-800 hover:border-cyan-500/60 rounded-2xl overflow-hidden shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Poster Image & Badges */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={item.title}
          onError={() => setImgSrc(generateTitlePosterSVG(item.title, item.mediaType))}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />

        {/* Rank Overlay Badge if provided */}
        {rankIndex !== undefined && (
          <div className="absolute top-2 left-2 z-10 w-8 h-8 rounded-xl bg-cyan-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg shadow-cyan-500/40">
            #{rankIndex}
          </div>
        )}

        {/* Top-Right Badge: Media Type */}
        <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 backdrop-blur-md border border-slate-700 text-slate-300">
          {item.mediaType === 'movie' ? 'Movie' : 'TV'}
        </div>

        {/* Bottom Quick Overlay Info */}
        <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between text-xs text-slate-300">
          {year && (
            <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
              <Calendar className="w-3 h-3" /> {year}
            </span>
          )}
          {item.voteAverage && (
            <span className="flex items-center gap-1 font-bold text-amber-400 text-[11px] bg-slate-950/80 px-1.5 py-0.5 rounded border border-amber-500/30">
              <Star className="w-3 h-3 fill-amber-400" /> {item.voteAverage}
            </span>
          )}
        </div>
      </div>

      {/* Card Content & Rating Controls */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="font-bold text-sm text-slate-100 group-hover:text-cyan-400 transition line-clamp-1">
            {item.title}
          </h3>

          {item.directors && item.directors.length > 0 && (
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {item.directors.join(', ')}
            </p>
          )}

          {item.mediaType === 'tv' && record?.seasonsProgress && (
            <div className="mt-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40">
                📺 {(() => {
                  const progress = record.seasonsProgress || {};
                  const total = item.numberOfSeasons || 1;
                  const watchedCount = Object.values(progress).filter((s) => s === 'watched').length;
                  const inProg = Object.values(progress).filter((s) => s === 'in_progress').length;
                  if (inProg > 0) return `${watchedCount}/${total} Watched • ${inProg} In Progress`;
                  return `${watchedCount}/${total} Seasons Watched`;
                })()}
              </span>
            </div>
          )}
        </div>

        {/* Tracking Actions / Rating Slider */}
        <div className="space-y-2 pt-1 border-t border-slate-800/80" onClick={(e) => e.stopPropagation()}>
          {isWatched ? (
            <div className="space-y-1.5">
              <RatingSlider
                value={record?.ratingTier !== undefined ? record.ratingTier : 5.0}
                onChange={(tier) => onRatingChange && onRatingChange(item, tier)}
                compact
              />
              <button
                onClick={handleUnwatchToggle}
                className="w-full py-1 rounded-lg text-[10px] font-bold text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/50 flex items-center justify-center gap-1 transition"
                title="Undo Watched / Remove from Watched list"
              >
                <XCircle className="w-3 h-3" /> Undo Watched
              </button>
            </div>
          ) : (
            <div className="flex gap-1.5">
              <button
                onClick={() => onMarkWatched(item, 1.0)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 border transition ${
                  isWatched
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-800/80 hover:bg-emerald-500/20 border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-300'
                }`}
                title="Mark as Watched"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Watched
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isWatchlist) {
                    handleUnwatchToggle(e);
                  } else {
                    onAddToWatchlist(item);
                  }
                }}
                className={`py-1.5 px-2.5 rounded-xl text-[11px] font-semibold flex items-center justify-center border transition ${
                  isWatchlist
                    ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 hover:bg-rose-500/20 hover:border-rose-500/60 hover:text-rose-300'
                    : 'bg-slate-800/80 hover:bg-cyan-500/20 border-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-300'
                }`}
                title={isWatchlist ? 'Click to Remove from Watchlist' : 'Add to Watchlist'}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isWatchlist ? 'fill-cyan-400' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
