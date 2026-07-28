import { MediaItem } from "@/types/media";
import rawCatalog from "./catalog.json";

// Sort catalog by 30-day rolling windows for US/Domestic releases (English primary default),
// while retaining foreign titles for search queries.
const MS_PER_DAY = 86400000;
const referenceTime = new Date('2026-07-28').getTime();

const allItems: MediaItem[] = rawCatalog as unknown as MediaItem[];

const sortedCatalog: MediaItem[] = allItems
  .slice()
  .sort((a, b) => {
    // 1. Primary filter: Prioritize US / English titles on default Home Page
    const langA = (a.originalLanguage || 'English').toLowerCase();
    const langB = (b.originalLanguage || 'English').toLowerCase();

    const isUsA = langA === 'english' || langA === 'en';
    const isUsB = langB === 'english' || langB === 'en';

    if (isUsA !== isUsB) return isUsB ? 1 : -1;

    // 2. 30-Day Window Bucket Index (0 = Past 30 Days, 1 = 30-60 Days ago, etc.)
    const timeA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
    const timeB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;

    const validA = timeA <= referenceTime && timeA > 0 ? timeA : 0;
    const validB = timeB <= referenceTime && timeB > 0 ? timeB : 0;

    const bucketA = validA > 0 ? Math.floor((referenceTime - validA) / (30 * MS_PER_DAY)) : 9999;
    const bucketB = validB > 0 ? Math.floor((referenceTime - validB) / (30 * MS_PER_DAY)) : 9999;

    if (bucketA !== bucketB) return bucketA - bucketB;

    // 3. Popularity & Rating Score
    const popA = (a.voteCount || 0) * (a.voteAverage || 5);
    const popB = (b.voteCount || 0) * (b.voteAverage || 5);
    return popB - popA;
  });

// 🏛️ The Cooper Union NYC Core Media Collection & Database
export const COOPER_UNION_NYC_CATALOG: MediaItem[] = sortedCatalog;
export const POPULAR_AMERICAN_CATALOG: MediaItem[] = sortedCatalog;
