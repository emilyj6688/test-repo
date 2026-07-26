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
 * Selects the optimal next pair of items to compare within a specific rating tier.
 * Prioritizes items with close Elo scores to maximize ranking efficiency.
 */
export function selectNextMatchup(
  records: UserMediaRecord[],
  tier: RatingTier
): PairwiseMatchup | null {
  // Only watched items in the specified rating tier can be ranked against each other
  const eligible = records.filter((r) => r.status === 'watched' && r.ratingTier === tier);

  if (eligible.length < 2) return null;

  // Sort by Elo to find closely matched items
  const sorted = [...eligible].sort((a, b) => b.eloRating - a.eloRating);

  // Pick a random index and pair with an adjacent neighbor
  const randomIndex = Math.floor(Math.random() * (sorted.length - 1));
  const itemA = sorted[randomIndex];
  const itemB = sorted[randomIndex + 1];

  // Randomize left/right presentation
  const swap = Math.random() > 0.5;
  return {
    itemA: swap ? itemB : itemA,
    itemB: swap ? itemA : itemB,
    tier,
  };
}

/**
 * Re-indexes rankIndex across all records based on Elo rating and ratingTier.
 * Tier 3 (Liked) > Tier 2 (Neutral) > Tier 1 (Didn't Like).
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
