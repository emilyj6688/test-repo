import { UserMediaRecord, PairwiseMatchup, getTierCategory } from '@/types/media';

const K_FACTOR = 32;

/**
 * Calculates new Elo ratings for winner and loser.
 */
export function calculateElo(winnerElo: number, loserElo: number): { winnerNewElo: number; loserNewElo: number } {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));

  const winnerNewElo = Math.round(winnerElo + K_FACTOR * (1 - expectedWinner));
  const loserNewElo = Math.round(loserElo + K_FACTOR * (0 - expectedLoser));

  return { winnerNewElo, loserNewElo };
}

/**
 * Selects an uncompared pair of watched items that are in close proximity (e.g. 2 to 15 ranks apart),
 * allowing seamless matchups across rating tier boundaries.
 */
export function selectNextMatchup(
  records: UserMediaRecord[],
  tierParam?: 1 | 2 | 3,
  comparedPairs: Set<string> = new Set()
): PairwiseMatchup | null {
  const watched = records.filter((r) => r.status === 'watched');

  if (watched.length < 2) return null;

  // Sort watched items by rank index / score (rank 1 at top)
  const sortedWatched = [...watched].sort((a, b) => {
    const rankA = typeof a.rankIndex === 'number' ? a.rankIndex : 999;
    const rankB = typeof b.rankIndex === 'number' ? b.rankIndex : 999;
    return rankA - rankB;
  });

  const candidatePairs: { pair: [UserMediaRecord, UserMediaRecord]; rankDiff: number }[] = [];

  // Generate uncompared pairs that are in close proximity (2 to 16 ranks apart)
  for (let i = 0; i < sortedWatched.length; i++) {
    const maxOffset = Math.min(sortedWatched.length, i + 18);
    for (let j = i + 2; j < maxOffset; j++) {
      const pairKey = [sortedWatched[i].id, sortedWatched[j].id].sort().join('::');
      if (!comparedPairs.has(pairKey)) {
        candidatePairs.push({
          pair: [sortedWatched[i], sortedWatched[j]],
          rankDiff: j - i,
        });
      }
    }
  }

  // Fallback: If no pairs in 2-18 range remain uncompared, search adjacent items (1 offset) or any uncompared pair
  if (candidatePairs.length === 0) {
    for (let i = 0; i < sortedWatched.length; i++) {
      for (let j = i + 1; j < sortedWatched.length; j++) {
        const pairKey = [sortedWatched[i].id, sortedWatched[j].id].sort().join('::');
        if (!comparedPairs.has(pairKey)) {
          candidatePairs.push({
            pair: [sortedWatched[i], sortedWatched[j]],
            rankDiff: Math.abs(j - i),
          });
        }
      }
    }
  }

  if (candidatePairs.length === 0) return null;

  // Prefer pairs with close rank difference (sorted by rankDiff)
  candidatePairs.sort((a, b) => a.rankDiff - b.rankDiff);

  // Pick a pair from top 5 closest candidate pairs
  const chosen = candidatePairs[Math.floor(Math.random() * Math.min(5, candidatePairs.length))];
  const swap = Math.random() > 0.5;

  const itemA = swap ? chosen.pair[1] : chosen.pair[0];
  const itemB = swap ? chosen.pair[0] : chosen.pair[1];
  const derivedTier = (tierParam || getTierCategory(itemA.ratingTier)) as 1 | 2 | 3;

  return {
    itemA,
    itemB,
    tier: derivedTier,
  };
}

/**
 * Re-indexes rankIndex across all records based on continuous rating score and Elo rating.
 * Highest score & Elo gets #1 rank.
 */
export function reindexRecords(records: UserMediaRecord[]): UserMediaRecord[] {
  const watched = records.filter((r) => r.status === 'watched');
  const wantToWatch = records.filter((r) => r.status !== 'watched');

  // Sort watched by continuous rating score (descending), then by Elo (descending)
  watched.sort((a, b) => {
    const catA = getTierCategory(a.ratingTier);
    const catB = getTierCategory(b.ratingTier);
    if (catA !== catB) return catB - catA;
    if (a.ratingTier !== b.ratingTier) return b.ratingTier - a.ratingTier;
    return b.eloRating - a.eloRating;
  });

  watched.forEach((r, idx) => {
    r.rankIndex = idx + 1;
  });

  return [...watched, ...wantToWatch];
}
