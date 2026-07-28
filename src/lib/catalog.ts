import { MediaItem } from "@/types/media";
import rawCatalog from "./catalog.json";

// Sort catalog in 30-day rolling chronological windows (Past 30 Days -> Prev 30 Days -> Back in time)
// Within each 30-day window, top-rated big-name titles appear first!
const MS_PER_DAY = 86400000;
const referenceTime = new Date('2026-07-28').getTime();

const sortedCatalog: MediaItem[] = (rawCatalog as unknown as MediaItem[])
  .slice()
  .sort((a, b) => {
    const timeA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
    const timeB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;

    // Releases up to current date
    const validA = timeA <= referenceTime && timeA > 0 ? timeA : 0;
    const validB = timeB <= referenceTime && timeB > 0 ? timeB : 0;

    // 30-Day Window Bucket Index (0 = Past 30 Days, 1 = 30-60 Days ago, etc.)
    const bucketA = validA > 0 ? Math.floor((referenceTime - validA) / (30 * MS_PER_DAY)) : 9999;
    const bucketB = validB > 0 ? Math.floor((referenceTime - validB) / (30 * MS_PER_DAY)) : 9999;

    if (bucketA !== bucketB) return bucketA - bucketB;

    // Within the same 30-day window, sort by Popularity & Rating Score
    const popA = (a.voteCount || 0) * (a.voteAverage || 5);
    const popB = (b.voteCount || 0) * (b.voteAverage || 5);
    return popB - popA;
  });

// 🏛️ The Cooper Union NYC Core Media Collection & Database
export const COOPER_UNION_NYC_CATALOG: MediaItem[] = sortedCatalog;
export const POPULAR_AMERICAN_CATALOG: MediaItem[] = sortedCatalog;
