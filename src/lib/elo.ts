import { UserMediaRecord, RatingTier, PairwiseMatchup } from '@/types/media';

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
 * Selects the optimal UNCOMPARED pair of items within a specific rating tier.
 * Skips any pair that has already been compared to guarantee no repeat matchups.
 */
export function selectNextMatchup(
  records: UserMediaRecord[],
  tier: RatingTier,
  comparedPairs: Set<string> = new Set()
): PairwiseMatchup | null {
  const eligible = records.filter((r) => r.status === 'watched' && r.ratingTier === tier);

  if (eligible.length < 2) return null;

  // Generate all possible pair combinations in this tier
  const uncomparedPairs: [UserMediaRecord, UserMediaRecord][] = [];

  for (let i = 0; i < eligible.length; i++) {
    for (let j = i + 1; j < eligible.length; j++) {
      const pairKey = [eligible[i].id, eligible[j].id].sort().join('::');
      if (!comparedPairs.has(pairKey)) {
        uncomparedPairs.push([eligible[i], eligible[j]]);
      }
    }
  }

  if (uncomparedPairs.length === 0) return null;

  // Sort candidate pairs by closest Elo score difference to optimize ranking speed
  uncomparedPairs.sort((a, b) => {
    const diffA = Math.abs(a[0].eloRating - a[1].eloRating);
    const diffB = Math.abs(b[0].eloRating - b[1].eloRating);
    return diffA - diffB;
  });

  // Pick one of the closest Elo pairs
  const chosenPair = uncomparedPairs[Math.floor(Math.random() * Math.min(3, uncomparedPairs.length))];

  const swap = Math.random() > 0.5;
  return {
    itemA: swap ? chosenPair[1] : chosenPair[0],
    itemB: swap ? chosenPair[0] : chosenPair[1],
    tier,
  };
}

/**
 * Re-indexes rankIndex across all records based on Elo rating and ratingTier.
 * Highest Elo score gets #1 rank.
 */
export function reindexRecords(records: UserMediaRecord[]): UserMediaRecord[] {
  const watched = records.filter((r) => r.status === 'watched');
  const wantToWatch = records.filter((r) => r.status !== 'watched');

  // Sort watched by Tier (3 to 1) then by Elo (descending)
  watched.sort((a, b) => {
    if (a.ratingTier !== b.ratingTier) return b.ratingTier - a.ratingTier;
    return b.eloRating - a.eloRating;
  });

  watched.forEach((r, idx) => {
    r.rankIndex = idx + 1;
  });

  return [...watched, ...wantToWatch];
}
