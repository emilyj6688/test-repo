'use client';

import React from 'react';
import { MediaItem, UserMediaRecord, RatingTier } from '@/types/media';
import { getTMDBImageUrl } from '@/lib/tmdb';
import { RatingSlider } from '@/components/media/rating-slider';
import { CheckCircle, Bookmark, Star, Calendar } from 'lucide-react';

interface Props {
  item: MediaItem;
  record?: UserMediaRecord | null;
  onSelect: (item: MediaItem) => void;
  onMarkWatched: (item: MediaItem, tier?: RatingTier) => void;
  onAddToWatchlist: (item: MediaItem) => void;
  onRatingChange?: (item: MediaItem, tier: RatingTier) => void;
  rankIndex?: number;
}

export const MediaCard: React.FC<Props> = ({
  item,
  record,
  onSelect,
  onMarkWatched,
  onAddToWatchlist,
  onRatingChange,
  rankIndex,
}) => {
  const year = item.releaseDate ? item.releaseDate.substring(0, 4) : '';
  const isWatched = record?.status === 'watched';
  const isWatchlist = record?.status === 'want_to_watch';

  return (
    <div
      onClick={() => onSelect(item)}
      className="group relative bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl overflow-hidden shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Poster Image & Badges */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getTMDBImageUrl(item.posterPath, 'poster')}
          alt={item.title}
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

        {/* Media Type Badge */}
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
        </div>

        {/* Tracking Actions / Rating Slider */}
        <div className="space-y-2 pt-1 border-t border-slate-800/80" onClick={(e) => e.stopPropagation()}>
          {isWatched ? (
            <RatingSlider
              value={record?.ratingTier || 2}
              onChange={(tier) => onRatingChange && onRatingChange(item, tier)}
              compact
            />
          ) : (
            <div className="flex gap-1.5">
              <button
                onClick={() => onMarkWatched(item, 2)}
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
                onClick={() => onAddToWatchlist(item)}
                className={`py-1.5 px-2.5 rounded-xl text-[11px] font-semibold flex items-center justify-center border transition ${
                  isWatchlist
                    ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300'
                    : 'bg-slate-800/80 hover:bg-cyan-500/20 border-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-300'
                }`}
                title="Add to Want to Watch List"
              >
                <Bookmark className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
