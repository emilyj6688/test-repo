'use client';

import React, { useState } from 'react';
import { UserMediaRecord, RatingTier, PairwiseMatchup } from '@/types/media';
import { StorageService } from '@/lib/storage';
import { calculateElo, selectNextMatchup, reindexRecords } from '@/lib/elo';
import { getTMDBImageUrl } from '@/lib/tmdb';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Swords,
  ChevronUp,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  Minus,
  CheckCircle2,
  ListOrdered,
  Shuffle,
  Info,
} from 'lucide-react';

interface Props {
  onRecordsChanged: () => void;
  onNavigateToTab: (tab: 'search' | 'watched' | 'watchlist' | 'ranking') => void;
}

export const RankingGame: React.FC<Props> = ({ onRecordsChanged, onNavigateToTab }) => {
  const [selectedTier, setSelectedTier] = useState<RatingTier>(3); // Default to Liked
  const [records, setRecords] = useState<UserMediaRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    return reindexRecords(StorageService.getUserRecords());
  });
  const [matchupOverride, setMatchupOverride] = useState<PairwiseMatchup | null>(null);
  const [comparisonsCount, setComparisonsCount] = useState(0);

  const activeMatchup = matchupOverride || selectNextMatchup(records, selectedTier);

  const handleTierSelect = (tier: RatingTier) => {
    setSelectedTier(tier);
    setMatchupOverride(selectNextMatchup(records, tier));
  };

  const handleSelectWinner = (winner: UserMediaRecord, loser: UserMediaRecord) => {
    const { winnerNewElo, loserNewElo } = calculateElo(winner.eloRating, loser.eloRating);

    const updated = records.map((r) => {
      if (r.id === winner.id) return { ...r, eloRating: winnerNewElo };
      if (r.id === loser.id) return { ...r, eloRating: loserNewElo };
      return r;
    });

    const reindexed = reindexRecords(updated);
    StorageService.updateRecordsList(reindexed);
    setRecords(reindexed);
    onRecordsChanged();

    const newCount = comparisonsCount + 1;
    setComparisonsCount(newCount);

    if (newCount % 5 === 0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    setMatchupOverride(selectNextMatchup(reindexed, selectedTier));
  };

  const handleSkipMatchup = () => {
    setMatchupOverride(selectNextMatchup(records, selectedTier));
  };

  // Manual fine-tuning up/down controls
  const handleMoveRank = (index: number, direction: 'up' | 'down') => {
    const watched = records.filter((r) => r.status === 'watched');
    const targetIdx = direction === 'up' ? index - 1 : index + 1;

    if (targetIdx < 0 || targetIdx >= watched.length) return;

    // Swap position in list
    const temp = watched[index];
    watched[index] = watched[targetIdx];
    watched[targetIdx] = temp;

    // Adjust Elo slightly to preserve relative ordering
    const tempElo = watched[index].eloRating;
    watched[index].eloRating = watched[targetIdx].eloRating + 5;
    watched[targetIdx].eloRating = tempElo - 5;

    const reindexed = reindexRecords([...watched, ...records.filter((r) => r.status !== 'watched')]);
    StorageService.updateRecordsList(reindexed);
    setRecords(reindexed);
    onRecordsChanged();
  };

  const watchedRecords = records.filter((r) => r.status === 'watched');
  const tierEligibleCount = watchedRecords.filter((r) => r.ratingTier === selectedTier).length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 border border-amber-500/40 text-amber-300">
            <Trophy className="w-3.5 h-3.5" /> Pairwise Comparison Engine
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Pairwise Ranking Game (&ldquo;A vs B&rdquo;)
          </h1>
          <p className="text-sm text-slate-300">
            Compare two titles in the same rating tier. Your head-to-head choices generate your definitive master ranked list powered by Elo scoring algorithms.
          </p>
        </div>
      </div>

      {/* Tier Selector Chips */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Select Rating Tier:
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleTierSelect(3)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
              selectedTier === 3
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/10 scale-105'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-emerald-400'
            }`}
          >
            <ThumbsUp className="w-4 h-4" /> Liked Tier
          </button>

          <button
            onClick={() => handleTierSelect(2)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
              selectedTier === 2
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10 scale-105'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-amber-400'
            }`}
          >
            <Minus className="w-4 h-4" /> Neutral Tier
          </button>

          <button
            onClick={() => handleTierSelect(1)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
              selectedTier === 1
                ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-lg shadow-rose-500/10 scale-105'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-rose-400'
            }`}
          >
            <ThumbsDown className="w-4 h-4" /> Didn&apos;t Like Tier
          </button>
        </div>
      </div>

      {/* Arena comparison section */}
      {tierEligibleCount >= 2 && activeMatchup ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-2">
            <span className="flex items-center gap-1">
              <Swords className="w-4 h-4 text-amber-400" /> Head-to-Head Comparison
            </span>
            <span>Comparisons Completed: <strong className="text-amber-400">{comparisonsCount}</strong></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {/* VS Badge Center Overlay */}
            <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-amber-500 text-slate-950 font-black text-sm items-center justify-center border-4 border-slate-950 shadow-2xl animate-bounce">
              VS
            </div>

            {/* Matchup Item A */}
            <div
              onClick={() => handleSelectWinner(activeMatchup.itemA, activeMatchup.itemB)}
              className="group cursor-pointer bg-slate-900 border-2 border-slate-800 hover:border-cyan-500 rounded-3xl p-6 shadow-xl hover:shadow-cyan-500/20 transition-all duration-300 flex flex-col sm:flex-row gap-6 relative overflow-hidden"
            >
              <div className="w-36 sm:w-40 flex-shrink-0 mx-auto sm:mx-0 rounded-2xl overflow-hidden shadow-lg border border-slate-800 bg-slate-950 aspect-[2/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getTMDBImageUrl(activeMatchup.itemA.item.posterPath, 'poster')}
                  alt={activeMatchup.itemA.item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300">
                    {activeMatchup.itemA.item.mediaType === 'movie' ? 'Movie' : 'TV Show'}
                  </span>
                  <h3 className="text-2xl font-black text-white group-hover:text-cyan-400 transition mt-2">
                    {activeMatchup.itemA.item.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-3">
                    {activeMatchup.itemA.item.overview}
                  </p>
                </div>

                <button className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 group-hover:from-cyan-400 group-hover:to-blue-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg transition">
                  <CheckCircle2 className="w-5 h-5" /> I Prefer This Title
                </button>
              </div>
            </div>

            {/* Matchup Item B */}
            <div
              onClick={() => handleSelectWinner(activeMatchup.itemB, activeMatchup.itemA)}
              className="group cursor-pointer bg-slate-900 border-2 border-slate-800 hover:border-purple-500 rounded-3xl p-6 shadow-xl hover:shadow-purple-500/20 transition-all duration-300 flex flex-col sm:flex-row gap-6 relative overflow-hidden"
            >
              <div className="w-36 sm:w-40 flex-shrink-0 mx-auto sm:mx-0 rounded-2xl overflow-hidden shadow-lg border border-slate-800 bg-slate-950 aspect-[2/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getTMDBImageUrl(activeMatchup.itemB.item.posterPath, 'poster')}
                  alt={activeMatchup.itemB.item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300">
                    {activeMatchup.itemB.item.mediaType === 'movie' ? 'Movie' : 'TV Show'}
                  </span>
                  <h3 className="text-2xl font-black text-white group-hover:text-purple-400 transition mt-2">
                    {activeMatchup.itemB.item.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-3">
                    {activeMatchup.itemB.item.overview}
                  </p>
                </div>

                <button className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 group-hover:from-purple-400 group-hover:to-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg transition">
                  <CheckCircle2 className="w-5 h-5" /> I Prefer This Title
                </button>
              </div>
            </div>
          </div>

          {/* Matchup Controls */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleSkipMatchup}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
            >
              <Shuffle className="w-3.5 h-3.5" /> Skip / Get Another Pair
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3">
          <Info className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">
            Need at least 2 watched items in this tier to compare
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You currently have {tierEligibleCount} title{tierEligibleCount === 1 ? '' : 's'} rated in this tier. Add and rate more watched movies or TV shows to unlock pairwise comparisons!
          </p>
          <button
            onClick={() => onNavigateToTab('search')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg transition"
          >
            Search & Add More Media
          </button>
        </div>
      )}

      {/* Manual Fine-Tuning Ordered Master List */}
      <div className="space-y-4 pt-8 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-cyan-400" /> Master Ordered List & Manual Fine-Tuning
            </h2>
            <p className="text-xs text-slate-400">
              Drag or use Up/Down controls to fine-tune your final ranking order manually.
            </p>
          </div>
        </div>

        {watchedRecords.length > 0 ? (
          <div className="space-y-2">
            {watchedRecords.map((record, index) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3.5 bg-slate-900/80 border border-slate-800/90 rounded-2xl hover:border-slate-700 transition gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Rank Index Badge */}
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                    #{record.rankIndex}
                  </div>

                  {/* Thumbnail Poster */}
                  <div className="w-10 h-14 rounded-lg overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getTMDBImageUrl(record.item.posterPath, 'poster')}
                      alt={record.item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Title & Tier Badge */}
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-100 truncate">
                      {record.item.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          record.ratingTier === 3
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : record.ratingTier === 2
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        }`}
                      >
                        {record.ratingTier === 3 ? 'Liked' : record.ratingTier === 2 ? 'Neutral' : "Didn't Like"}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        Elo: {record.eloRating}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Up/Down Manual Swap Controls */}
                <div className="flex items-center gap-1">
                  <button
                    disabled={index === 0}
                    onClick={() => handleMoveRank(index, 'up')}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 disabled:opacity-30 disabled:pointer-events-none transition"
                    title="Move Up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    disabled={index === watchedRecords.length - 1}
                    onClick={() => handleMoveRank(index, 'down')}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 disabled:opacity-30 disabled:pointer-events-none transition"
                    title="Move Down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-500">
            No watched items recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};
