import { MediaItem } from "@/types/media";
import rawCatalog from "./catalog.json";

// Sort catalog chronologically starting off NOW (recent theater & TV hits) going back in time
const currentYear = 2026;
const sortedCatalog: MediaItem[] = (rawCatalog as unknown as MediaItem[])
  .slice()
  .sort((a, b) => {
    const yrA = parseInt(a.releaseDate?.substring(0, 4) || '0', 10);
    const yrB = parseInt(b.releaseDate?.substring(0, 4) || '0', 10);

    // Prioritize current/recent releases up to current year, then past years descending
    const validA = yrA <= currentYear ? yrA : 0;
    const validB = yrB <= currentYear ? yrB : 0;

    if (validA !== validB) return validB - validA;

    // Within same year, sort by popularity & rating score
    const popA = (a.voteCount || 0) * (a.voteAverage || 5);
    const popB = (b.voteCount || 0) * (b.voteAverage || 5);
    return popB - popA;
  });

// 🏛️ The Cooper Union NYC Core Media Collection & Database
export const COOPER_UNION_NYC_CATALOG: MediaItem[] = sortedCatalog;
export const POPULAR_AMERICAN_CATALOG: MediaItem[] = sortedCatalog;
