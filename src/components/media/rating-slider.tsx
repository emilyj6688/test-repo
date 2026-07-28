'use client';

import React, { useState } from 'react';
import { RatingTier, getTierCategory } from '@/types/media';
import { ThumbsDown, Minus, ThumbsUp, SlidersHorizontal, ChevronUp } from 'lucide-react';

interface Props {
  value: RatingTier;
  onChange: (val: number) => void;
  compact?: boolean;
}

const toScale = (val: number): number => {
  if (val === 1) return 2;
  if (val === 2) return 5;
  if (val === 3) return 8;
  return Math.min(10, Math.max(1, Math.round(val)));
};

export const RatingSlider: React.FC<Props> = ({ value, onChange, compact = false }) => {
  const [prevValue, setPrevValue] = useState<number>(value);
  const [localValue, setLocalValue] = useState<number>(() => toScale(value));
  const [isExpanded, setIsExpanded] = useState<boolean>(!compact);

  if (prevValue !== value) {
    setPrevValue(value);
    setLocalValue(toScale(value));
  }

  const tierCategory = getTierCategory(localValue);

  const getTierInfo = (cat: 1 | 2 | 3) => {
    if (cat === 1) {
      return {
        label: "Didn't Like",
        icon: <ThumbsDown className="w-3.5 h-3.5 text-rose-400" />,
        colorClass: 'text-rose-400',
        bgClass: 'bg-rose-500/20 border-rose-500/40',
        trackClass: 'accent-rose-500',
      };
    }
    if (cat === 2) {
      return {
        label: 'Neutral',
        icon: <Minus className="w-3.5 h-3.5 text-amber-400" />,
        colorClass: 'text-amber-400',
        bgClass: 'bg-amber-500/20 border-amber-500/40',
        trackClass: 'accent-amber-500',
      };
    }
    return {
      label: 'Liked',
      icon: <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />,
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/20 border-emerald-500/40',
      trackClass: 'accent-emerald-500',
    };
  };

  const info = getTierInfo(tierCategory);

  const handleSliderChange = (newVal: number) => {
    setLocalValue(newVal);
    onChange(newVal);
  };

  // Collapsed View: Just Thumbs Down 👎, Rating Pill, and Thumbs Up 👍
  if (compact && !isExpanded) {
    return (
      <div className="flex items-center gap-1.5 w-full select-none" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => {
            handleSliderChange(2);
            setIsExpanded(true);
          }}
          className={`flex-1 py-1.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1 transition ${
            tierCategory === 1
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-md shadow-rose-500/10'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-900'
          }`}
          title="Didn't Like (Rating 2)"
        >
          <ThumbsDown className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 font-mono text-[11px] font-bold flex items-center gap-1 transition"
          title="Click to expand 1-10 slider & detailed rating labels"
        >
          <span>{localValue}/10</span>
          <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
        </button>

        <button
          type="button"
          onClick={() => {
            handleSliderChange(8);
            setIsExpanded(true);
          }}
          className={`flex-1 py-1.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1 transition ${
            tierCategory === 3
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/10'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-slate-900'
          }`}
          title="Liked (Rating 8)"
        >
          <ThumbsUp className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Expanded View: Full 1-10 Slider + Didn't Like, Neutral, Liked Labels
  return (
    <div className="w-full space-y-2 select-none animate-fade-in" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between items-center text-xs font-semibold">
        <span className="text-slate-400 uppercase tracking-wider text-[10px]">User Rating</span>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1.5 ${info.bgClass} ${info.colorClass}`}>
            {info.icon} {info.label}
          </span>
          <span className="font-mono text-xs text-cyan-300 font-extrabold bg-slate-900 px-2.5 py-0.5 rounded-md border border-cyan-500/30">
            {localValue} / 10
          </span>
          {compact && (
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Collapse Slider"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="relative bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
        {/* Integer Range Track 1 through 10 */}
        <div className="relative flex items-center">
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={localValue}
            onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
            className={`w-full h-2.5 rounded-lg appearance-none cursor-pointer bg-slate-800 ${info.trackClass} transition-all`}
          />
        </div>

        {/* Text Scale Label Ticks */}
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 pt-1">
          <button
            type="button"
            onClick={() => handleSliderChange(2)}
            className={`flex items-center gap-1 transition ${
              tierCategory === 1 ? 'text-rose-400 font-black scale-105' : 'hover:text-slate-200'
            }`}
          >
            <ThumbsDown className="w-3 h-3" /> Didn&apos;t Like
          </button>

          <button
            type="button"
            onClick={() => handleSliderChange(5)}
            className={`flex items-center gap-1 transition ${
              tierCategory === 2 ? 'text-amber-400 font-black scale-105' : 'hover:text-slate-200'
            }`}
          >
            <Minus className="w-3 h-3" /> Neutral
          </button>

          <button
            type="button"
            onClick={() => handleSliderChange(8)}
            className={`flex items-center gap-1 transition ${
              tierCategory === 3 ? 'text-emerald-400 font-black scale-105' : 'hover:text-slate-200'
            }`}
          >
            <ThumbsUp className="w-3 h-3" /> Liked
          </button>
        </div>
      </div>
    </div>
  );
};
