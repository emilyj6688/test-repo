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
  return { label: upper, style: 'bg-[#0a1c24] text-[#f3cb98] border-[#c88e58]/40 font-extrabold' };
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

  // Generate 5-star rating display (Matching Moodboard bottom-left)
  const starCount = Math.round((item.voteAverage || 7) / 2); // 1-5 stars

  return (
    <div
      onClick={() => onSelect(item)}
      className="group relative bg-[#091b22] border-2 border-[#c88e58]/50 hover:border-[#e5a875] rounded-2xl overflow-hidden shadow-xl hover:shadow-[#c88e58]/20 transition-all duration-300 flex flex-col cursor-pointer hover:-translate-y-1"
    >
      {/* Poster Image & Moodboard Badges */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#050d11]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={item.title}
          onError={() => setImgSrc(generateTitlePosterSVG(item.title, item.mediaType))}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#091b22] via-[#091b22]/30 to-transparent opacity-90" />

        {/* Moodboard Top-Left Star Rating Display (★★★★☆) */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-[#071318]/90 backdrop-blur-md border border-[#c88e58]/50 shadow-md">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`w-3 h-3 ${
                s <= starCount ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Rank Overlay Badge if provided */}
        {rankIndex !== undefined && (
          <div className="absolute top-10 left-2 z-10 w-8 h-8 rounded-xl bg-gradient-to-br from-[#f3cb98] to-[#c88e58] text-[#071318] font-black text-xs flex items-center justify-center shadow-lg shadow-amber-950/60 font-cinzel">
            #{rankIndex}
          </div>
        )}

        {/* Moodboard Top-Right Badge: LOGGED / WATCHLIST / MEDIA TYPE */}
        <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-[#071318]/90 backdrop-blur-md border border-[#c88e58]/60 text-[#f3cb98]">
          {isWatched ? '★ LOGGED' : isWatchlist ? '🔖 WATCHLIST' : item.mediaType === 'movie' ? 'MOVIE' : 'TV'}
        </div>

        {/* Bottom Quick Overlay Info */}
        <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between text-xs text-[#f3cb98]">
          {year && (
            <span className="flex items-center gap-1 font-mono text-[11px] text-slate-300">
              <Calendar className="w-3 h-3 text-[#c88e58]" /> {year}
            </span>
          )}
          {item.voteAverage && (
            <span className="flex items-center gap-1 font-bold text-amber-300 text-[11px] bg-[#071318]/90 px-1.5 py-0.5 rounded border border-amber-500/40">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {item.voteAverage}
            </span>
          )}
        </div>
      </div>

      {/* Card Content & Rating Controls */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3 bg-[#091b22]">
        <div>
          <h3 className="font-cinzel font-bold text-sm text-[#f6f3eb] group-hover:text-[#f3cb98] transition line-clamp-1">
            {item.title}
          </h3>

          {item.directors && item.directors.length > 0 && (
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {item.directors.join(', ')}
            </p>
          )}

          {item.mediaType === 'tv' && record?.seasonsProgress && (
            <div className="mt-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-[#f3cb98] border border-amber-500/40">
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
        <div className="space-y-2 pt-2 border-t border-[#c88e58]/20" onClick={(e) => e.stopPropagation()}>
          {isWatched ? (
            <div className="space-y-1.5">
              <RatingSlider
                value={record?.ratingTier !== undefined ? record.ratingTier : 5}
                onChange={(tier) => onRatingChange && onRatingChange(item, tier)}
                compact
              />
              <button
                onClick={handleUnwatchToggle}
                className="w-full py-1 rounded-lg text-[10px] font-bold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/50 flex items-center justify-center gap-1 transition"
                title="Undo Watched / Remove from Watched list"
              >
                <XCircle className="w-3 h-3" /> Undo Watched
              </button>
            </div>
          ) : (
            <div className="flex gap-1.5">
              <button
                onClick={() => onMarkWatched(item, 1.0)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 border transition ${
                  isWatched
                    ? 'bg-[#c88e58]/30 border-[#c88e58] text-[#f3cb98]'
                    : 'bg-[#0f262e] hover:bg-[#c88e58]/20 border-[#c88e58]/40 hover:border-[#c88e58] text-slate-200 hover:text-[#f3cb98]'
                }`}
                title="Mark as Watched"
              >
                <CheckCircle className="w-3.5 h-3.5 text-[#c88e58]" /> Watched
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
                className={`py-1.5 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center border transition ${
                  isWatchlist
                    ? 'bg-[#c88e58]/30 border-[#c88e58] text-[#f3cb98] hover:bg-rose-500/20 hover:border-rose-500/60 hover:text-rose-300'
                    : 'bg-[#0f262e] hover:bg-[#c88e58]/20 border-[#c88e58]/40 hover:border-[#c88e58] text-slate-400 hover:text-[#f3cb98]'
                }`}
                title={isWatchlist ? 'Click to Remove from Watchlist' : 'Add to Watchlist'}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isWatchlist ? 'fill-[#f3cb98] text-[#c88e58]' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
