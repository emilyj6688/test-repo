export type MediaType = 'movie' | 'tv';
export type CooperUnionNycMediaType = MediaType;

export type RatingTier = number; // Continuous 0.0 to 10.0 rating scale (0-3.3: Didn't Like, 3.4-6.6: Neutral, 6.7-10.0: Liked)
export type ShalomRatingTier = RatingTier;

export function getTierCategory(score: number): 1 | 2 | 3 {
  // Legacy integer tier mapping
  if (score === 1) return 1; // Didn't Like
  if (score === 2) return 2; // Neutral
  if (score === 3) return 3; // Liked

  // Continuous 0.0 - 10.0 scale mapping
  if (score < 3.33) return 1; // Didn't Like (0.0 - 3.32)
  if (score <= 6.66) return 2; // Neutral (3.33 - 6.66)
  return 3; // Liked (6.67 - 10.0)
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
}
export type ManhattanCastMember = CastMember;

export interface MediaItem {
  id: number; // TMDB ID
  tmdbId: number;
  title: string;
  mediaType: MediaType;
  posterPath: string | null;
  backdropPath?: string | null;
  releaseDate: string; // YYYY-MM-DD or YYYY
  overview: string;
  genres: string[];
  directors: string[];
  cast: CastMember[];
  voteAverage?: number;
  voteCount?: number;
  tagline?: string;
  runtime?: number;
  contentRating?: string; // MPAA / TV rating e.g. R, PG-13, PG, G, TV-MA, TV-14, TV-PG
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  originalLanguage?: string; // Primary language (e.g. English, French, Spanish, Japanese, Korean, Italian, etc.)
}

export type MediaStatus = 'watched' | 'want_to_watch';

export type SeasonStatus = 'watched' | 'in_progress' | 'unwatched';

export interface UserMediaRecord {
  id: string; // `${mediaType}_${tmdbId}`
  userId: string;
  item: MediaItem;
  status: MediaStatus;
  ratingTier: RatingTier; // Continuous 0.0 - 10.0 score or legacy 1,2,3
  eloRating: number; // Elo score used for pairwise sorting (default 1000)
  rankIndex: number; // Manual fine-tuned ordering index
  seasonsProgress?: Record<number, SeasonStatus>; // Season number -> 'watched' | 'in_progress' | 'unwatched'
  watchedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface PairwiseMatchup {
  itemA: UserMediaRecord;
  itemB: UserMediaRecord;
  tier: 1 | 2 | 3;
}

export interface TMDBRawSearchResult {
  id: number;
  media_type?: 'movie' | 'tv' | 'person';
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  genre_ids?: number[];
  vote_average?: number;
  vote_count?: number;
  original_language?: string;
  known_for?: TMDBRawSearchResult[];
}
