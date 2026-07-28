'use client';

import React, { useState } from 'react';
import { RatingTier, getTierCategory } from '@/types/media';
import { ThumbsDown, Minus, ThumbsUp } from 'lucide-react';

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

  return (
    <div className="w-full space-y-2 select-none" onClick={(e) => e.stopPropagation()}>
      {!compact && (
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-slate-400 uppercase tracking-wider text-[10px]">User Rating</span>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1.5 ${info.bgClass} ${info.colorClass}`}>
              {info.icon} {info.label}
            </span>
            <span className="font-mono text-xs text-cyan-300 font-extrabold bg-slate-900 px-2.5 py-0.5 rounded-md border border-cyan-500/30">
              {localValue} / 10
            </span>
          </div>
        </div>
      )}

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

        {/* Scale Label Ticks */}
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
