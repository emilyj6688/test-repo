'use client';

import React from 'react';
import { RatingTier } from '@/types/media';
import { ThumbsDown, Minus, ThumbsUp } from 'lucide-react';

interface Props {
  value: RatingTier;
  onChange: (tier: RatingTier) => void;
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
}

const TIER_LABELS: Record<RatingTier, { label: string; icon: React.ReactNode; color: string; activeBg: string }> = {
  1: {
    label: "Didn't Like",
    icon: <ThumbsDown className="w-4 h-4" />,
    color: 'text-rose-400 border-rose-500/40',
    activeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-lg shadow-rose-500/10',
  },
  2: {
    label: 'Neutral',
    icon: <Minus className="w-4 h-4" />,
    color: 'text-amber-400 border-amber-500/40',
    activeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-lg shadow-amber-500/10',
  },
  3: {
    label: 'Liked',
    icon: <ThumbsUp className="w-4 h-4" />,
    color: 'text-emerald-400 border-emerald-500/40',
    activeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-lg shadow-emerald-500/10',
  },
};

export const RatingSlider: React.FC<Props> = ({ value, onChange, compact = false }) => {
  return (
    <div className="w-full space-y-1.5">
      {!compact && (
        <div className="flex justify-between items-center text-xs text-slate-400 font-medium px-1">
          <span>Initial Rating</span>
          <span className="font-bold text-slate-200">{TIER_LABELS[value].label}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
        {([1, 2, 3] as RatingTier[]).map((tier) => {
          const isActive = value === tier;
          const config = TIER_LABELS[tier];
          return (
            <button
              type="button"
              key={tier}
              onClick={(e) => {
                e.stopPropagation();
                onChange(tier);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                isActive
                  ? config.activeBg
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900'
              }`}
            >
              {config.icon}
              {!compact && <span>{config.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};
