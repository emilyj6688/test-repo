import { MediaItem } from "@/types/media";
import rawCatalog from "./catalog.json";

// Sort catalog by popularity & rating score so iconic top movies and TV shows appear first on Home Page
const sortedCatalog: MediaItem[] = (rawCatalog as unknown as MediaItem[]).slice().sort((a, b) => {
  const popA = (a.voteCount || 0) * (a.voteAverage || 5);
  const popB = (b.voteCount || 0) * (b.voteAverage || 5);
  if (Math.abs(popA - popB) > 500) return popB - popA;
  const yrA = parseInt(a.releaseDate?.substring(0, 4) || '0', 10);
  const yrB = parseInt(b.releaseDate?.substring(0, 4) || '0', 10);
  return yrB - yrA;
});

// 🏛️ The Cooper Union NYC Core Media Collection & Database
export const COOPER_UNION_NYC_CATALOG: MediaItem[] = sortedCatalog;
export const POPULAR_AMERICAN_CATALOG: MediaItem[] = sortedCatalog;
