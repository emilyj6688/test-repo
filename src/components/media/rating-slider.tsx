'use client';

import React from 'react';
import { RatingTier } from '@/types/media';
import { ThumbsDown, Minus, ThumbsUp } from 'lucide-react';

interface Props {
  value: RatingTier;
  onChange: (tier: RatingTier) => void;
  compact?: boolean;
}

const TIER_CONFIG: Record<RatingTier, { label: string; icon: React.ReactNode; color: string; trackColor: string }> = {
  1: {
    label: "Didn't Like",
    icon: <ThumbsDown className="w-3.5 h-3.5" />,
    color: 'text-rose-400',
    trackColor: 'accent-rose-500',
  },
  2: {
    label: 'Neutral',
    icon: <Minus className="w-3.5 h-3.5" />,
    color: 'text-amber-400',
    trackColor: 'accent-amber-500',
  },
  3: {
    label: 'Liked',
    icon: <ThumbsUp className="w-3.5 h-3.5" />,
    color: 'text-emerald-400',
    trackColor: 'accent-emerald-500',
  },
};

export const RatingSlider: React.FC<Props> = ({ value, onChange, compact = false }) => {
  const currentConfig = TIER_CONFIG[value];

  return (
    <div className="w-full space-y-2 select-none" onClick={(e) => e.stopPropagation()}>
      {!compact && (
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-slate-400 uppercase tracking-wider text-[10px]">Initial Rating</span>
          <span className={`flex items-center gap-1.5 ${currentConfig.color} font-bold`}>
            {currentConfig.icon} {currentConfig.label}
          </span>
        </div>
      )}

      <div className="relative bg-slate-950 p-2.5 rounded-2xl border border-slate-800 space-y-1">
        {/* Step Track background bar */}
        <div className="relative flex items-center">
          <input
            type="range"
            min="1"
            max="3"
            step="1"
            value={value}
            onChange={(e) => onChange(Number(e.target.value) as RatingTier)}
            className={`w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-800 ${currentConfig.trackColor} transition-all`}
          />
        </div>

        {/* 3 Step Tick Labels */}
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 pt-1">
          <button
            type="button"
            onClick={() => onChange(1)}
            className={`flex items-center gap-1 transition ${
              value === 1 ? 'text-rose-400 font-black scale-105' : 'hover:text-slate-200'
            }`}
          >
            <ThumbsDown className="w-3 h-3" /> Didn&apos;t Like
          </button>

          <button
            type="button"
            onClick={() => onChange(2)}
            className={`flex items-center gap-1 transition ${
              value === 2 ? 'text-amber-400 font-black scale-105' : 'hover:text-slate-200'
            }`}
          >
            <Minus className="w-3 h-3" /> Neutral
          </button>

          <button
            type="button"
            onClick={() => onChange(3)}
            className={`flex items-center gap-1 transition ${
              value === 3 ? 'text-emerald-400 font-black scale-105' : 'hover:text-slate-200'
            }`}
          >
            <ThumbsUp className="w-3 h-3" /> Liked
          </button>
        </div>
      </div>
    </div>
  );
};
