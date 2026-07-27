import { MediaItem } from "@/types/media";
import rawCatalog from "./catalog.json";

// 🏛️ The Cooper Union NYC Core Media Collection & Database
export const COOPER_UNION_NYC_CATALOG: MediaItem[] = rawCatalog as unknown as MediaItem[];
export const POPULAR_AMERICAN_CATALOG: MediaItem[] = COOPER_UNION_NYC_CATALOG;
