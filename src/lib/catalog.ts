import { MediaItem } from "@/types/media";
import rawCatalog from "./catalog.json";

// Dynamic "What People Are Watching Right Now" Trending Score Algorithm
// Blends popularity/viewership with a smooth recency decay so current & recent 30-90 day hits stay on top!
const referenceTime = new Date('2026-07-28').getTime();
const MS_PER_DAY = 86400000;

const allItems: MediaItem[] = rawCatalog as unknown as MediaItem[];

const sortedCatalog: MediaItem[] = allItems
  .slice()
  .sort((a, b) => {
    // 1. Filter US/English primary default for Home Page
    const langA = (a.originalLanguage || 'English').toLowerCase();
    const langB = (b.originalLanguage || 'English').toLowerCase();
    const isUsA = langA === 'english' || langA === 'en';
    const isUsB = langB === 'english' || langB === 'en';

    if (isUsA !== isUsB) return isUsB ? 1 : -1;

    // 2. Calculate Trending Score ("What People Are Watching Right Now")
    const getTrendingScore = (item: MediaItem): number => {
      const time = item.releaseDate ? new Date(item.releaseDate).getTime() : 0;
      if (!time || time > referenceTime) {
        return (item.voteCount || 0) * 0.1;
      }

      const daysAgo = Math.max(0, (referenceTime - time) / MS_PER_DAY);
      const basePop = Math.min(25000, (item.voteCount || 10) * (item.voteAverage || 5));

      // Recency multiplier giving high weight to titles in theaters / airing in past 1-3 months
      const recencyFactor = Math.max(0.1, 1000 / (daysAgo + 10));
      return basePop * recencyFactor;
    };

    const scoreA = getTrendingScore(a);
    const scoreB = getTrendingScore(b);

    return scoreB - scoreA;
  });

// 🏛️ The Cooper Union NYC Core Media Collection & Database
export const COOPER_UNION_NYC_CATALOG: MediaItem[] = sortedCatalog;
export const POPULAR_AMERICAN_CATALOG: MediaItem[] = sortedCatalog;
