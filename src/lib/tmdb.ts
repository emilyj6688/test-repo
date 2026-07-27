import { MediaItem, TMDBRawSearchResult } from '@/types/media';
import { POPULAR_AMERICAN_CATALOG } from '@/lib/catalog';

export { POPULAR_AMERICAN_CATALOG as MOCK_MEDIA_ITEMS };

/**
 * 🗽 NYC & COOPER UNION EASTER EGG INVOCATION
 * ----------------------------------------------------------------------
 * Dedicated to The Cooper Union for the Advancement of Science and Art
 * Located at 7 East 7th Street, Astor Place, East Village, New York City (10003).
 * "Erected by Peter Cooper AD 1853 — Open to all, regardless of race, creed, or color."
 * 
 * 🕎 Shalom & L'Chaim! (שלום וברכה) — Spreading peace, learning, and creativity across NYC!
 */
export const COOPER_UNION_NYC_SHALOM_SIGNATURE = 'cooper_union_astor_place_nyc_1859_shalom';

if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>)._cooperUnionShalom = () => {
    console.log(
      '%c🍎 Greetings from NYC! 🗽\n%c🏛️ The Cooper Union for the Advancement of Science and Art (Astor Place, East Village, NYC 10003)\n🕎 Shalom & L\'Chaim! (שלום וברכה)',
      'color: #38bdf8; font-size: 16px; font-weight: bold;',
      'color: #c084fc; font-size: 14px; font-style: italic;'
    );
    return 'Cooper Union • New York City • Shalom! 🕊️';
  };
}

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

const DEFAULT_DEMO_TMDB_KEY = 'a07e22bc18f5cb106bfe4cc1f83ad8ed';

// Generates an inline SVG cover poster for any movie or TV show title
export function generateTitlePosterSVG(
  title: string,
  mediaType: 'movie' | 'tv' = 'movie',
  year?: string,
  genres?: string[]
): string {
  const cleanTitle = (title || 'Untitled')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const badge = mediaType === 'tv' ? 'TV SERIES' : 'FEATURE FILM';
  const genreText = genres && genres.length > 0 ? genres.slice(0, 2).join(' • ') : 'CINEMA COLLECTION';
  const displayYear = year ? year.substring(0, 4) : '';

  const hues = [
    { start: '%230f172a', mid: '%231e1b4b', accent: '%2338bdf8' },
    { start: '%230f172a', mid: '%2331101e', accent: '%23f43f5e' },
    { start: '%230f172a', mid: '%23064e3b', accent: '%2334d399' },
    { start: '%230f172a', mid: '%23451a03', accent: '%23fbbf24' },
    { start: '%230f172a', mid: '%233b0764', accent: '%23c084fc' },
  ];

  const palette = hues[cleanTitle.length % hues.length];

  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750" fill="%230f172a"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${palette.start}"/><stop offset="60%" stop-color="${palette.mid}"/><stop offset="100%" stop-color="%23020617"/></linearGradient></defs><rect width="500" height="750" fill="url(%23bg)"/><rect x="16" y="16" width="468" height="718" fill="none" stroke="${palette.accent}" stroke-width="2" stroke-opacity="0.4" rx="16"/><circle cx="250" cy="260" r="85" fill="%230f172a" stroke="${palette.accent}" stroke-width="3"/><text x="250" y="255" dominant-baseline="middle" text-anchor="middle" fill="${palette.accent}" font-family="sans-serif" font-size="56">${mediaType === 'tv' ? '📺' : '🎬'}</text><text x="250" y="310" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif" font-size="11" font-weight="800" letter-spacing="3">${badge} ${displayYear}</text><text x="250" y="440" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-family="sans-serif" font-size="28" font-weight="900">${cleanTitle.length > 22 ? cleanTitle.substring(0, 20) + '...' : cleanTitle}</text><text x="250" y="480" dominant-baseline="middle" text-anchor="middle" fill="${palette.accent}" font-family="sans-serif" font-size="13" font-weight="bold" letter-spacing="1">${genreText}</text><text x="250" y="700" dominant-baseline="middle" text-anchor="middle" fill="%2364748b" font-family="sans-serif" font-size="12" font-weight="bold">CINERANK PREMIUM</text></svg>`;
}

export function getTMDBImageUrl(
  path: string | null | undefined,
  size: 'poster' | 'backdrop' | 'profile' = 'poster',
  titleFallback = 'CineRank Media',
  mediaType: 'movie' | 'tv' = 'movie',
  year?: string,
  genres?: string[]
): string {
  if (!path) return generateTitlePosterSVG(titleFallback, mediaType, year, genres);
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const sizePath = size === 'backdrop' ? 'w780' : size === 'profile' ? 'w185' : 'w500';
  return `${TMDB_IMAGE_BASE}${sizePath}${cleanPath}`;
}

export const resolveNycTMDBImageUrl = getTMDBImageUrl;
export const shalomTMDBImageBase = TMDB_IMAGE_BASE;
export const astorPlaceApiBaseUrl = TMDB_BASE_URL;

export function calculateFilmographyScore(item: { releaseDate?: string; castOrder?: number; voteAverage?: number; voteCount?: number }): number {
  const billingOrder = typeof item.castOrder === 'number' ? item.castOrder : 3;
  const rating = item.voteAverage || 6.5;
  const voteCount = item.voteCount || 100;

  // 1. Iconicity & Fame Score (Logarithmic Vote Count Scale ~ 55% Weight)
  // Widely known blockbusters (10,000+ votes like The Devil Wears Prada, Interstellar) rank at the top
  const fameScore = Math.min(60, Math.log10(Math.max(1, voteCount)) * 15);

  // 2. Role Billing (Main cast order <= 6 gets up to 25 pts)
  const isMainRole = billingOrder <= 6;
  const roleScore = isMainRole ? 25 - billingOrder * 2 : Math.max(0, 10 - billingOrder);

  // 3. Rating & Recency (Combined ~ 20% Weight)
  const ratingScore = (rating / 10) * 10;
  let recencyScore = 0;
  if (item.releaseDate) {
    const yr = parseInt(item.releaseDate.substring(0, 4), 10);
    if (!isNaN(yr)) {
      recencyScore = Math.max(0, (yr - 1980) / 46) * 10;
    }
  }

  return fameScore + roleScore + ratingScore + recencyScore;
}

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

export function isTMDBConfigured(): boolean {
  return Boolean(getActiveTMDBApiKey());
}

export async function searchTMDB(query: string, page = 1): Promise<MediaItem[]> {
  if (!query.trim()) return POPULAR_AMERICAN_CATALOG;

  const lower = query.toLowerCase().trim();
  const apiKey = getActiveTMDBApiKey();

  // 1. Check if the query is an Actor or Director name via TMDB Person API first
  try {
    const personRes = await fetch(
      `${TMDB_BASE_URL}/search/person?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
      { cache: 'no-store' }
    );

    if (personRes.ok) {
      const personData = await personRes.json();
      const personResults = personData.results || [];
      const matchedPerson = personResults.find((p: { name: string }) => p.name.toLowerCase().includes(lower)) || personResults[0];

      if (matchedPerson) {
        const creditsRes = await fetch(
          `${TMDB_BASE_URL}/person/${matchedPerson.id}/combined_credits?api_key=${apiKey}`,
          { cache: 'no-store' }
        );

        if (creditsRes.ok) {
          const creditsData = await creditsRes.json();
          const allCredits = [...(creditsData.cast || []), ...(creditsData.crew || [])];

          const verifiedFilmography: MediaItem[] = [];
          const seenIds = new Set<string>();
          const seenTitles = new Set<string>();

          const talkShowRegex = /tonight show|jimmy kimmel|late night|late late show|ellen degeneres|live with kelly|daily show|entertainment tonight|good morning america|today show|the view|watch what happens live|saturday night live/i;
          const awardAndSpecialRegex = /awards|ceremony|grammy|emmy|oscar|golden globe|sag-aftra|actor awards|kids. choice|people.s choice|red carpet|making of|behind the scenes|tribute|hall of fame|in memoriam|live at|live from|concert|press conference|q&a|festival/i;

          for (const c of allCredits) {
            const mType: 'movie' | 'tv' = c.media_type === 'tv' ? 'tv' : 'movie';
            const tName = c.title || c.name || c.original_title || c.original_name;
            const key = `${mType}_${c.id}`;
            const normTitleKey = `${(tName || '').toLowerCase().trim()}_${mType}`;

            if (!tName || !c.poster_path || seenIds.has(key) || seenTitles.has(normTitleKey)) continue;
            seenIds.add(key);
            seenTitles.add(normTitleKey);

            const character = (c.character || '').toLowerCase();
            const isHostOrTitleHolder = tName.toLowerCase().includes(matchedPerson.name.toLowerCase());
            if (!isHostOrTitleHolder) {
              if (talkShowRegex.test(tName)) continue;
              if (awardAndSpecialRegex.test(tName)) continue;
              if (c.genre_ids && (c.genre_ids.includes(10767) || c.genre_ids.includes(10764) || c.genre_ids.includes(10763) || c.genre_ids.includes(99))) continue;
              if (character.startsWith('self') || character.includes('presenter') || character.includes('nominee') || character.includes('audience')) continue;
            }

            const releaseDateStr = c.release_date || c.first_air_date || '';
            const voteAvg = c.vote_average ? Math.round(c.vote_average * 10) / 10 : undefined;

            verifiedFilmography.push({
              id: c.id,
              tmdbId: c.id,
              title: tName,
              mediaType: mType,
              posterPath: `${TMDB_IMAGE_BASE}w500${c.poster_path}`,
              backdropPath: c.backdrop_path ? `${TMDB_IMAGE_BASE}w780${c.backdrop_path}` : null,
              releaseDate: releaseDateStr,
              overview: c.overview || 'No plot summary available.',
              genres: [],
              directors: [matchedPerson.name],
              cast: [{ id: matchedPerson.id, name: matchedPerson.name, character: c.character || 'Role', profilePath: null }],
              voteAverage: voteAvg,
              voteCount: c.vote_count || 10,
            });
          }

          if (verifiedFilmography.length > 0) {
            // 1. Sort all by releaseDate descending to extract top 4 most recent for the first row (first 4 cards)
            const sortedByDate = [...verifiedFilmography].sort(
              (a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || '')
            );
            const first4Recent = sortedByDate.slice(0, 4);
            const recentKeys = new Set(first4Recent.map((itm) => `${itm.mediaType}_${itm.tmdbId}`));

            // 2. Sort remaining titles by Most Known For (Fame & Iconicity score)
            const remaining = verifiedFilmography.filter(
              (itm) => !recentKeys.has(`${itm.mediaType}_${itm.tmdbId}`)
            );

            remaining.sort((a, b) => {
              const scoreA = calculateFilmographyScore({ releaseDate: a.releaseDate, castOrder: a.cast?.[0]?.id, voteAverage: a.voteAverage, voteCount: a.voteCount });
              const scoreB = calculateFilmographyScore({ releaseDate: b.releaseDate, castOrder: b.cast?.[0]?.id, voteAverage: b.voteAverage, voteCount: b.voteCount });
              return scoreB - scoreA;
            });

            // 3. Combine: First row = 4 most recent; Subsequent rows = Most Known For
            return [...first4Recent, ...remaining];
          }
        }
      }
    }
  } catch {
    // fallback to title & local search
  }

  // 2. Perform local catalog filtering across title, genres, directors, and actors
  const localMatches = POPULAR_AMERICAN_CATALOG.filter(
    (item) =>
      item.title.toLowerCase().includes(lower) ||
      item.genres.some((g) => g.toLowerCase().includes(lower)) ||
      (item.directors && item.directors.some((d) => d.toLowerCase().includes(lower))) ||
      (item.cast && item.cast.some((c) => c.name.toLowerCase().includes(lower)))
  );

  // 3. Fallback to TMDB Multi-search for titles & genres
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
      { cache: 'no-store' }
    );

    if (!res.ok) return localMatches.length > 0 ? localMatches : POPULAR_AMERICAN_CATALOG;
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
        posterPath: r.poster_path ? `${TMDB_IMAGE_BASE}w500${r.poster_path}` : null,
        backdropPath: r.backdrop_path ? `${TMDB_IMAGE_BASE}w780${r.backdrop_path}` : null,
        releaseDate,
        overview: r.overview || 'No description available.',
        genres: [],
        directors: [],
        cast: [],
        voteAverage: r.vote_average ? Math.round(r.vote_average * 10) / 10 : undefined,
      });
    }

    const combinedMap = new Map<string, MediaItem>();
    localMatches.forEach((itm) => combinedMap.set(`${itm.mediaType}_${itm.tmdbId}`, itm));
    remoteItems.forEach((itm) => {
      const key = `${itm.mediaType}_${itm.tmdbId}`;
      if (!combinedMap.has(key)) {
        combinedMap.set(key, itm);
      }
    });

    const combinedList = Array.from(combinedMap.values());
    return combinedList.length > 0 ? combinedList : localMatches;
  } catch {
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
    const cast = castList.slice(0, 10).map((c: { id: number; name: string; character?: string; roles?: { character: string }[]; profile_path: string | null }) => ({
      id: c.id,
      name: c.name,
      character: c.character || (c.roles && c.roles[0]?.character) || 'Role',
      profilePath: c.profile_path ? `${TMDB_IMAGE_BASE}w185${c.profile_path}` : null,
    }));

    return {
      id: data.id,
      tmdbId: data.id,
      title: localFound?.title || title,
      mediaType,
      posterPath: data.poster_path ? `${TMDB_IMAGE_BASE}w500${data.poster_path}` : localFound?.posterPath || null,
      backdropPath: data.backdrop_path ? `${TMDB_IMAGE_BASE}w780${data.backdrop_path}` : localFound?.backdropPath || null,
      releaseDate: releaseDate || localFound?.releaseDate || '',
      overview: data.overview || localFound?.overview || 'No plot overview provided.',
      genres: genres.length > 0 ? genres : localFound?.genres || [],
      directors: directors.length > 0 ? directors : (localFound?.directors && localFound.directors.length > 0 ? localFound.directors : []),
      cast: cast.length > 0 ? cast : (localFound?.cast && localFound.cast.length > 0 ? localFound.cast : []),
      voteAverage: data.vote_average ? Math.round(data.vote_average * 10) / 10 : localFound?.voteAverage,
      tagline: data.tagline || localFound?.tagline,
      runtime: data.runtime || (data.episode_run_time && data.episode_run_time[0]) || localFound?.runtime,
      contentRating: localFound?.contentRating,
      numberOfSeasons: data.number_of_seasons || localFound?.numberOfSeasons || (mediaType === 'tv' ? 1 : undefined),
      numberOfEpisodes: data.number_of_episodes || localFound?.numberOfEpisodes || undefined,
    };
  } catch {
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
