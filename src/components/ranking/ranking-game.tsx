'use client';

import React, { useState, useRef } from 'react';
import { UserMediaRecord, PairwiseMatchup } from '@/types/media';
import { StorageService } from '@/lib/storage';
import { calculateElo, selectNextMatchup, reindexRecords } from '@/lib/elo';
import { getTMDBImageUrl } from '@/lib/tmdb';
import {
  Trophy,
  Swords,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  ListOrdered,
  Shuffle,
  RotateCcw,
  Sparkles,
  GripVertical,
  ArrowDownCircle,
} from 'lucide-react';

interface Props {
  onRecordsChanged: () => void;
  onNavigateToTab: (tab: 'search' | 'watched' | 'watchlist' | 'ranking') => void;
}

export const RankingGame: React.FC<Props> = ({ onRecordsChanged, onNavigateToTab }) => {
  const [records, setRecords] = useState<UserMediaRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    return reindexRecords(StorageService.getUserRecords());
  });

  const [comparedPairs, setComparedPairs] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    return StorageService.getComparedPairs();
  });

  const [matchupOverride, setMatchupOverride] = useState<PairwiseMatchup | null>(null);
  const [comparisonsCount, setComparisonsCount] = useState(0);

  // Drag and Drop state with position indicator (above / below)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<{ index: number; position: 'above' | 'below' } | null>(null);

  const draggedIndexRef = useRef<number | null>(null);

  const activeMatchup = matchupOverride || selectNextMatchup(records, undefined, comparedPairs);

  const handleSelectWinner = (winner: UserMediaRecord, loser: UserMediaRecord) => {
    // Record pair to prevent any repeat matchup
    StorageService.recordComparedPair(winner.id, loser.id);
    const updatedPairs = StorageService.getComparedPairs();
    setComparedPairs(updatedPairs);

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

    setComparisonsCount((prev) => prev + 1);
    setMatchupOverride(selectNextMatchup(reindexed, undefined, updatedPairs));
  };

  const handleSkipMatchup = () => {
    setMatchupOverride(selectNextMatchup(records, undefined, comparedPairs));
  };

  const handleResetMatchupHistory = () => {
    StorageService.resetComparedPairs();
    const resetSet = new Set<string>();
    setComparedPairs(resetSet);
    setMatchupOverride(selectNextMatchup(records, undefined, resetSet));
  };

  // Manual fine-tuning up/down controls with seamless rank swaps
  const handleMoveRank = (index: number, direction: 'up' | 'down') => {
    const watched = records.filter((r) => r.status === 'watched');
    const targetIdx = direction === 'up' ? index - 1 : index + 1;

    if (targetIdx < 0 || targetIdx >= watched.length) return;

    const sourceItem = watched[index];
    const targetItem = watched[targetIdx];

    // Align rating tiers if moving across tier boundaries
    if (sourceItem.ratingTier !== targetItem.ratingTier) {
      sourceItem.ratingTier = targetItem.ratingTier;
    }

    // Swap position & adjust rank score
    const targetElo = targetItem.eloRating;
    const sourceElo = sourceItem.eloRating;

    if (direction === 'up') {
      sourceItem.eloRating = Math.max(targetElo + 10, sourceElo + 10);
    } else {
      sourceItem.eloRating = Math.min(targetElo - 10, sourceElo - 10);
    }

    const reindexed = reindexRecords([...watched, ...records.filter((r) => r.status !== 'watched')]);
    StorageService.updateRecordsList(reindexed);
    setRecords(reindexed);
    onRecordsChanged();
  };

  // HTML5 Drag and Drop handlers for moving titles multiple spots with insertion indicator
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    draggedIndexRef.current = index;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Calculate vertical position relative to target item center line
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position: 'above' | 'below' = e.clientY < midY ? 'above' : 'below';

    if (!dropTarget || dropTarget.index !== index || dropTarget.position !== position) {
      setDropTarget({ index, position });
    }
  };

  const handleDragEnd = () => {
    draggedIndexRef.current = null;
    setDraggedIndex(null);
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number, forcedPosition?: 'above' | 'below') => {
    e.preventDefault();
    e.stopPropagation();

    const rawFrom = e.dataTransfer.getData('text/plain');
    const fromIndex = rawFrom !== '' ? parseInt(rawFrom, 10) : draggedIndexRef.current;

    if (fromIndex === null || isNaN(fromIndex)) {
      handleDragEnd();
      return;
    }

    // Determine position if not forced
    let position: 'above' | 'below' = forcedPosition || 'above';
    if (!forcedPosition) {
      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      position = e.clientY < midY ? 'above' : 'below';
    }

    const watched = records.filter((r) => r.status === 'watched');

    let insertAt = targetIndex;
    if (position === 'below') {
      insertAt = targetIndex + 1;
    }
    if (fromIndex < insertAt) {
      insertAt--;
    }

    if (fromIndex === insertAt) {
      handleDragEnd();
      return;
    }

    const [movedItem] = watched.splice(fromIndex, 1);
    watched.splice(insertAt, 0, movedItem);

    // Update rank index and continuous rating scores smoothly
    watched.forEach((item, idx) => {
      item.rankIndex = idx + 1;
      item.eloRating = 1500 - idx * 5;
    });

    const nonWatched = records.filter((r) => r.status !== 'watched');
    const reindexed = [...watched, ...nonWatched];

    StorageService.updateRecordsList(reindexed);
    setRecords(reindexed);
    onRecordsChanged();

    handleDragEnd();
  };

  const watchedRecords = records.filter((r) => r.status === 'watched');

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 border border-amber-500/40 text-amber-300">
            <Trophy className="w-3.5 h-3.5" /> Head-to-Head Comparison Engine
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Head-to-Head Ranking Game (&ldquo;A vs B&rdquo;)
          </h1>
          <p className="text-sm text-slate-300">
            Compare two titles of close rank proximity head-to-head. Pick your favorite to refine your master ranked list!
          </p>
        </div>
      </div>

      {/* Arena comparison section */}
      {watchedRecords.length >= 2 && activeMatchup ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-2">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Swords className="w-4 h-4 text-amber-400" /> Proximity Matchup (Rank #{activeMatchup.itemA.rankIndex} vs Rank #{activeMatchup.itemB.rankIndex})
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
                  src={getTMDBImageUrl(activeMatchup.itemA.item.posterPath, 'poster', activeMatchup.itemA.item.title, activeMatchup.itemA.item.mediaType)}
                  alt={activeMatchup.itemA.item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300">
                      {activeMatchup.itemA.item.mediaType === 'movie' ? 'Movie' : 'TV Show'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      Rank #{activeMatchup.itemA.rankIndex}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white group-hover:text-cyan-400 transition mt-1">
                    {activeMatchup.itemA.item.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-3">
                    {activeMatchup.itemA.item.overview}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectWinner(activeMatchup.itemA, activeMatchup.itemB);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 group-hover:from-cyan-400 group-hover:to-blue-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg transition"
                >
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
                  src={getTMDBImageUrl(activeMatchup.itemB.item.posterPath, 'poster', activeMatchup.itemB.item.title, activeMatchup.itemB.item.mediaType)}
                  alt={activeMatchup.itemB.item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300">
                      {activeMatchup.itemB.item.mediaType === 'movie' ? 'Movie' : 'TV Show'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      Rank #{activeMatchup.itemB.rankIndex}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white group-hover:text-purple-400 transition mt-1">
                    {activeMatchup.itemB.item.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-3">
                    {activeMatchup.itemB.item.overview}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectWinner(activeMatchup.itemB, activeMatchup.itemA);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 group-hover:from-purple-400 group-hover:to-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <CheckCircle2 className="w-5 h-5" /> I Prefer This Title
                </button>
              </div>
            </div>
          </div>

          {/* Matchup Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <button
              onClick={handleSkipMatchup}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
            >
              <Shuffle className="w-3.5 h-3.5" /> Skip / Get Next Proximity Pair
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-4">
          <Sparkles className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-100">
            {watchedRecords.length < 2
              ? 'Need at least 2 watched items to compare'
              : 'All close proximity matchups have been ranked! 🎉'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {watchedRecords.length < 2
              ? `You currently have ${watchedRecords.length} watched title. Mark more titles as watched to unlock head-to-head comparisons.`
              : `You've compared close proximity pairs across your watched list! Reset matchups below to re-rank or add more titles.`}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {watchedRecords.length >= 2 && (
              <button
                onClick={handleResetMatchupHistory}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition"
              >
                <RotateCcw className="w-4 h-4" /> Reset Matchups & Re-rank
              </button>
            )}

            <button
              onClick={() => onNavigateToTab('search')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg transition"
            >
              Search & Rate More Titles
            </button>
          </div>
        </div>
      )}

      {/* Manual Fine-Tuning Ordered Master List with Drag & Drop */}
      <div className="space-y-4 pt-8 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-cyan-400" /> Master Ordered List & Fine-Tuning
            </h2>
            <p className="text-xs text-slate-400">
              Drag items using the left handle to move titles up or down multiple spots. A glowing cyan insertion line shows exact placement above or below any item.
            </p>
          </div>
        </div>

        {watchedRecords.length > 0 ? (
          <div className="space-y-1.5">
            {watchedRecords.map((record, index) => {
              const isDragging = draggedIndex === index;
              const isDropAbove = dropTarget?.index === index && dropTarget?.position === 'above' && draggedIndex !== index;
              const isDropBelow = dropTarget?.index === index && dropTarget?.position === 'below' && draggedIndex !== index;

              return (
                <React.Fragment key={record.id}>
                  {/* Glowing Cyan Insertion Line (ABOVE) */}
                  {isDropAbove && (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => handleDrop(e, index, 'above')}
                      className="relative py-2 px-4 flex items-center gap-3 animate-pulse bg-cyan-950/40 border border-cyan-500/60 rounded-xl transition-all cursor-pointer"
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400" />
                      <div className="flex-1 h-1.5 bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500 rounded-full shadow-lg shadow-cyan-400/80" />
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-cyan-300 uppercase tracking-widest px-3 py-1 rounded-lg bg-slate-900 border border-cyan-400/80 shadow-lg shadow-cyan-500/30">
                        <ArrowDownCircle className="w-3.5 h-3.5 text-cyan-400" /> Drop Here (Above Rank #{record.rankIndex})
                      </span>
                    </div>
                  )}

                  {/* Main Draggable Item Row */}
                  <div
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`flex items-center justify-between p-3.5 bg-slate-900/80 border rounded-2xl transition gap-4 ${
                      isDragging
                        ? 'opacity-30 border-dashed border-cyan-500 scale-[0.98]'
                        : 'border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Left Drag Handle */}
                      <div
                        className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-slate-800 transition flex-shrink-0"
                        title="Click and drag to re-order position"
                      >
                        <GripVertical className="w-5 h-5" />
                      </div>

                      {/* Rank Index Badge */}
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                        #{record.rankIndex}
                      </div>

                      {/* Thumbnail Poster */}
                      <div className="w-10 h-14 rounded-lg overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getTMDBImageUrl(record.item.posterPath, 'poster', record.item.title, record.item.mediaType)}
                          alt={record.item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Title & Media Info */}
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">
                          {record.item.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                          <span className="capitalize">{record.item.mediaType}</span>
                          <span>•</span>
                          <span>Score: {record.ratingTier.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Fine-Tuning Controls */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        disabled={index === 0}
                        onClick={() => handleMoveRank(index, 'up')}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-300 disabled:opacity-30 text-slate-300 transition"
                        title="Move Up 1 Spot"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        disabled={index === watchedRecords.length - 1}
                        onClick={() => handleMoveRank(index, 'down')}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-300 disabled:opacity-30 text-slate-300 transition"
                        title="Move Down 1 Spot"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Glowing Cyan Insertion Line (BELOW) */}
                  {isDropBelow && (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => handleDrop(e, index, 'below')}
                      className="relative py-2 px-4 flex items-center gap-3 animate-pulse bg-cyan-950/40 border border-cyan-500/60 rounded-xl transition-all cursor-pointer"
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400" />
                      <div className="flex-1 h-1.5 bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500 rounded-full shadow-lg shadow-cyan-400/80" />
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-cyan-300 uppercase tracking-widest px-3 py-1 rounded-lg bg-slate-900 border border-cyan-400/80 shadow-lg shadow-cyan-500/30">
                        <ArrowDownCircle className="w-3.5 h-3.5 text-cyan-400" /> Drop Here (Below Rank #{record.rankIndex})
                      </span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-6">
            No watched items found. Mark titles as watched to start building your master ranked list!
          </p>
        )}
      </div>
    </div>
  );
};
