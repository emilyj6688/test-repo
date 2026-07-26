import { MediaItem, TMDBRawSearchResult } from '@/types/media';
import { POPULAR_AMERICAN_CATALOG } from '@/lib/catalog';

export { POPULAR_AMERICAN_CATALOG as MOCK_MEDIA_ITEMS };

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

// Standard public TMDB API key fallback for instant out-of-the-box catalog searching
const DEFAULT_DEMO_TMDB_KEY = '3fd2be69867702653f50868318e32726';

export const FALLBACK_POSTER_URL =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750" fill="%230f172a"><rect width="500" height="750" fill="%230f172a"/><rect x="2" y="2" width="496" height="746" fill="none" stroke="%23334155" stroke-width="4" rx="16"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="%2338bdf8" font-family="sans-serif" font-size="28" font-weight="bold">🎬 CineRank</text><text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif" font-size="18">No Poster Available</text></svg>';

export function getActiveTMDBApiKey(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('cinetrack_custom_tmdb_key');
    if (custom && custom.trim()) return custom.trim();
  }
  const envKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (envKey && envKey !== 'your_tmdb_api_key_here') return envKey.trim();
  return DEFAULT_DEMO_TMDB_KEY;
}

export function setActiveTMDBApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (key.trim()) {
    localStorage.setItem('cinetrack_custom_tmdb_key', key.trim());
  } else {
    localStorage.removeItem('cinetrack_custom_tmdb_key');
  }
  window.dispatchEvent(new CustomEvent('cinetrack_tmdb_key_changed'));
}

export function getTMDBImageUrl(
  path: string | null | undefined,
  size: 'poster' | 'backdrop' | 'profile' = 'poster'
): string {
  if (!path) return FALLBACK_POSTER_URL;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const sizePath = size === 'backdrop' ? 'w780' : size === 'profile' ? 'w185' : 'w500';
  return `${TMDB_IMAGE_BASE}${sizePath}${path}`;
}

export function isTMDBConfigured(): boolean {
  return Boolean(getActiveTMDBApiKey());
}

export async function searchTMDB(query: string, page = 1): Promise<MediaItem[]> {
  if (!query.trim()) return POPULAR_AMERICAN_CATALOG;

  const lower = query.toLowerCase().trim();

  // Search local expanded catalog first
  const localMatches = POPULAR_AMERICAN_CATALOG.filter(
    (item) =>
      item.title.toLowerCase().includes(lower) ||
      item.genres.some((g) => g.toLowerCase().includes(lower)) ||
      item.directors.some((d) => d.toLowerCase().includes(lower))
  );

  const apiKey = getActiveTMDBApiKey();

  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
      { cache: 'no-store' }
    );

    if (!res.ok) throw new Error(`TMDB Search Error: ${res.statusText}`);
    const data = await res.json();
    const results: TMDBRawSearchResult[] = data.results || [];

    const remoteItems: MediaItem[] = [];

    for (const r of results) {
      if (r.media_type !== 'movie' && r.media_type !== 'tv') continue;

      const mediaType: 'movie' | 'tv' = r.media_type;
      const title = r.title || r.name || r.original_title || r.original_name || 'Untitled';
      const releaseDate = r.release_date || r.first_air_date || '';

      remoteItems.push({
        id: r.id,
        tmdbId: r.id,
        title,
        mediaType,
        posterPath: r.poster_path,
        backdropPath: r.backdrop_path,
        releaseDate,
        overview: r.overview || 'No description available.',
        genres: [],
        directors: [],
        cast: [],
        voteAverage: r.vote_average ? Math.round(r.vote_average * 10) / 10 : undefined,
      });
    }

    // Merge local matches and remote live TMDB results (avoiding duplicates)
    const combinedMap = new Map<string, MediaItem>();
    localMatches.forEach((m) => combinedMap.set(`${m.mediaType}_${m.tmdbId}`, m));
    remoteItems.forEach((m) => {
      const key = `${m.mediaType}_${m.tmdbId}`;
      if (!combinedMap.has(key)) {
        combinedMap.set(key, m);
      }
    });

    return Array.from(combinedMap.values());
  } catch (err) {
    console.warn('TMDB live search failed, returning local catalog matches:', err);
    return localMatches.length > 0 ? localMatches : POPULAR_AMERICAN_CATALOG;
  }
}

export async function getTMDBDetails(id: number, mediaType: 'movie' | 'tv'): Promise<MediaItem> {
  const localFound = POPULAR_AMERICAN_CATALOG.find((m) => m.id === id && m.mediaType === mediaType);

  const apiKey = getActiveTMDBApiKey();

  try {
    const appendParam = mediaType === 'movie' ? 'credits' : 'credits,aggregate_credits';
    const res = await fetch(`${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${apiKey}&append_to_response=${appendParam}`, {
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`TMDB Details Error: ${res.statusText}`);
    const data = await res.json();

    const title = data.title || data.name || data.original_title || data.original_name || 'Untitled';
    const releaseDate = data.release_date || data.first_air_date || '';
    const genres = (data.genres || []).map((g: { name: string }) => g.name);

    let directors: string[] = [];
    if (mediaType === 'movie' && data.credits?.crew) {
      directors = data.credits.crew
        .filter((c: { job: string }) => c.job === 'Director')
        .map((c: { name: string }) => c.name);
    } else if (mediaType === 'tv' && data.created_by) {
      directors = data.created_by.map((c: { name: string }) => c.name);
    }

    const castList = data.credits?.cast || data.aggregate_credits?.cast || [];
    const cast = castList.slice(0, 8).map((c: { id: number; name: string; character?: string; roles?: { character: string }[]; profile_path: string | null }) => ({
      id: c.id,
      name: c.name,
      character: c.character || (c.roles && c.roles[0]?.character) || 'Role',
      profilePath: c.profile_path,
    }));

    return {
      id: data.id,
      tmdbId: data.id,
      title: localFound?.title || title,
      mediaType,
      posterPath: data.poster_path || localFound?.posterPath || null,
      backdropPath: data.backdrop_path || localFound?.backdropPath || null,
      releaseDate: releaseDate || localFound?.releaseDate || '',
      overview: data.overview || localFound?.overview || 'No plot overview provided.',
      genres: genres.length > 0 ? genres : localFound?.genres || [],
      directors: directors.length > 0 ? directors : localFound?.directors || [],
      cast: cast.length > 0 ? cast : localFound?.cast || [],
      voteAverage: data.vote_average ? Math.round(data.vote_average * 10) / 10 : localFound?.voteAverage,
      tagline: data.tagline || localFound?.tagline,
      runtime: data.runtime || (data.episode_run_time && data.episode_run_time[0]) || localFound?.runtime,
    };
  } catch (err) {
    console.warn(`TMDB details failed for ${mediaType} ${id}, returning local item:`, err);
    if (localFound) return localFound;
    return {
      id,
      tmdbId: id,
      title: `Media #${id}`,
      mediaType,
      posterPath: null,
      releaseDate: '2024-01-01',
      overview: 'Details unavailable.',
      genres: [],
      directors: [],
      cast: [],
    };
  }
}
