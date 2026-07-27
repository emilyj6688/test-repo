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

const ISO_LANGUAGES: Record<string, string> = {
  en: 'English', fr: 'French', es: 'Spanish', ja: 'Japanese', ko: 'Korean', it: 'Italian', de: 'German',
  zh: 'Mandarin', cn: 'Cantonese', hi: 'Hindi', ru: 'Russian', pt: 'Portuguese', nl: 'Dutch', sv: 'Swedish',
  no: 'Norwegian', da: 'Danish', fi: 'Finnish', pl: 'Polish', tr: 'Turkish', ar: 'Arabic', he: 'Hebrew',
  th: 'Thai', vi: 'Vietnamese', id: 'Indonesian', el: 'Greek', hu: 'Hungarian', cs: 'Czech', fa: 'Persian',
  uk: 'Ukrainian', ro: 'Romanian', ta: 'Tamil', te: 'Telugu', ml: 'Malayalam',
};

export function formatLanguageName(code?: string | null): string {
  if (!code) return 'English';
  const clean = code.toLowerCase().trim();
  return ISO_LANGUAGES[clean] || clean.toUpperCase();
}

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

  // 1. Perform local catalog filtering across title, genres, directors, actors, and language
  const localMatches = POPULAR_AMERICAN_CATALOG.filter(
    (item) =>
      item.title.toLowerCase().includes(lower) ||
      item.genres.some((g) => g.toLowerCase().includes(lower)) ||
      (item.directors && item.directors.some((d) => d.toLowerCase().includes(lower))) ||
      (item.cast && item.cast.some((c) => c.name.toLowerCase().includes(lower))) ||
      (item.originalLanguage && item.originalLanguage.toLowerCase().includes(lower))
  );

  // 2. Check if the search query is an Actor or Director name via TMDB Person API
  try {
    const personRes = await fetch(
      `${TMDB_BASE_URL}/search/person?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
      { cache: 'no-store' }
    );

    if (personRes.ok) {
      const personData = await personRes.json();
      const personResults = personData.results || [];
      const matchedPerson = personResults.find(
        (p: { name: string; popularity?: number }) =>
          p.name.toLowerCase().includes(lower) || lower.includes(p.name.toLowerCase())
      ) || (personResults[0] && (personResults[0].popularity || 0) > 5 ? personResults[0] : null);

      if (matchedPerson && (matchedPerson.name.toLowerCase().includes(lower) || lower.includes(matchedPerson.name.toLowerCase()))) {
        const creditsRes = await fetch(
          `${TMDB_BASE_URL}/person/${matchedPerson.id}/combined_credits?api_key=${apiKey}`,
          { cache: 'no-store' }
        );

        if (creditsRes.ok) {
          const creditsData = await creditsRes.json();
          const allCredits = [...(creditsData.cast || []), ...(creditsData.crew || [])];

          const combinedMap = new Map<string, MediaItem>();
          localMatches.forEach((itm) => combinedMap.set(`${itm.mediaType}_${itm.tmdbId}`, itm));

          const EXCLUDE_TALK_SHOW_REGEX = /jimmy fallon|tonight show|late night|saturday night live|jimmy kimmel|james corden|conan|seth meyers|graham norton|kelly clarkson|ellen|view|today show|good morning america|talk show|talkshow|awards|red carpet|ceremony|behind the scenes|making of|repackaged|unearthing|fireplace|fan edit|tribute|promo|interview/i;
          const EXCLUDE_CHARACTER_REGEX = /^himself$|^herself$|^self$|^guest$|^presenter$|^interviewee$|^host$|^co-host$|^cameo$|^musical guest$/i;

          for (const c of allCredits) {
            const mType: 'movie' | 'tv' = c.media_type === 'tv' ? 'tv' : 'movie';
            const tName = c.title || c.name || c.original_title || c.original_name;
            const key = `${mType}_${c.id}`;

            if (!tName || !c.poster_path) continue;

            // Strict Talk Show & Self Appearance Filter
            if (EXCLUDE_TALK_SHOW_REGEX.test(tName) || (c.character && EXCLUDE_CHARACTER_REGEX.test(c.character.trim()))) {
              continue;
            }

            if (!combinedMap.has(key)) {
              combinedMap.set(key, {
                id: c.id,
                tmdbId: c.id,
                title: tName,
                mediaType: mType,
                posterPath: `${TMDB_IMAGE_BASE}w500${c.poster_path}`,
                backdropPath: c.backdrop_path ? `${TMDB_IMAGE_BASE}w780${c.backdrop_path}` : null,
                releaseDate: c.release_date || c.first_air_date || '',
                overview: c.overview || 'Feature film / TV presentation.',
                genres: [],
                directors: c.job === 'Director' ? [matchedPerson.name] : [],
                cast: [{ id: matchedPerson.id, name: matchedPerson.name, character: c.character || 'Role', profilePath: matchedPerson.profile_path ? `${TMDB_IMAGE_BASE}w185${matchedPerson.profile_path}` : null }],
                voteAverage: c.vote_average ? Math.round(c.vote_average * 10) / 10 : undefined,
                voteCount: c.vote_count || 10,
                originalLanguage: formatLanguageName(c.original_language),
              });
            }
          }

          const fullFilmography = Array.from(combinedMap.values()).filter(
            (item) => !EXCLUDE_TALK_SHOW_REGEX.test(item.title)
          );
          if (fullFilmography.length > 0) {
            fullFilmography.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
            return fullFilmography;
          }
        }
      }
    }
  } catch {
    // continue to title search
  }

  // 3. Perform TMDB Multi-search for titles (Movies & TV Shows)
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
      { cache: 'no-store' }
    );

    if (res.ok) {
      const data = await res.json();
      const results: TMDBRawSearchResult[] = data.results || [];
      const remoteItems: MediaItem[] = [];

      for (const r of results) {
        if (r.media_type !== 'movie' && r.media_type !== 'tv') continue;
        if (!r.poster_path || r.poster_path.trim() === '') continue;

        const mediaType: 'movie' | 'tv' = r.media_type;
        const title = r.title || r.name || r.original_title || r.original_name || 'Untitled';
        const releaseDate = r.release_date || r.first_air_date || '';

        remoteItems.push({
          id: r.id,
          tmdbId: r.id,
          title,
          mediaType,
          posterPath: `${TMDB_IMAGE_BASE}w500${r.poster_path}`,
          backdropPath: r.backdrop_path ? `${TMDB_IMAGE_BASE}w780${r.backdrop_path}` : null,
          releaseDate,
          overview: r.overview || 'No description available.',
          genres: [],
          directors: [],
          cast: [],
          voteAverage: r.vote_average ? Math.round(r.vote_average * 10) / 10 : undefined,
          voteCount: r.vote_count || 10,
          originalLanguage: formatLanguageName(r.original_language),
        });
      }

      if (remoteItems.length > 0) {
        const combinedMap = new Map<string, MediaItem>();
        localMatches.forEach((itm) => combinedMap.set(`${itm.mediaType}_${itm.tmdbId}`, itm));
        remoteItems.forEach((itm) => {
          const key = `${itm.mediaType}_${itm.tmdbId}`;
          if (!combinedMap.has(key)) {
            combinedMap.set(key, itm);
          }
        });

        const combinedList = Array.from(combinedMap.values());

        const isFranchiseSeries = combinedList.filter((i) =>
          i.title.toLowerCase().includes(lower)
        ).length >= 2;

        const obscureRegex = /repackaged|fireplace|unearthing|making of|behind the scenes|fan edit|tribute|short|promo/i;

        combinedList.sort((a, b) => {
          const aTitle = a.title.toLowerCase();
          const bTitle = b.title.toLowerCase();
          const aStarts = aTitle.startsWith(lower);
          const bStarts = bTitle.startsWith(lower);

          const isObscureA = obscureRegex.test(a.title) || (a.voteCount || 0) < 50;
          const isObscureB = obscureRegex.test(b.title) || (b.voteCount || 0) < 50;

          // Main feature films and popular entries come BEFORE obscure shorts/fan edits
          if (!isObscureA && isObscureB) return -1;
          if (isObscureA && !isObscureB) return 1;

          if (isFranchiseSeries) {
            const dateA = a.releaseDate || '9999';
            const dateB = b.releaseDate || '9999';
            if (aStarts && bStarts) return dateA.localeCompare(dateB);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return dateA.localeCompare(dateB);
          }

          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return (b.voteCount || 0) - (a.voteCount || 0);
        });

        return combinedList;
      }
    }
  } catch {
    // fallback to person or local
  }

  // 3. Fallback: If no direct titles match, check if search is an Actor or Director name via TMDB Person API
  try {
    const personRes = await fetch(
      `${TMDB_BASE_URL}/search/person?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
      { cache: 'no-store' }
    );

    if (personRes.ok) {
      const personData = await personRes.json();
      const personResults = personData.results || [];
      const matchedPerson = personResults.find((p: { name: string; popularity?: number }) => p.name.toLowerCase().includes(lower)) || personResults[0];

      if (matchedPerson && (matchedPerson.name.toLowerCase() === lower || (matchedPerson.popularity || 0) > 10)) {
        const creditsRes = await fetch(
          `${TMDB_BASE_URL}/person/${matchedPerson.id}/combined_credits?api_key=${apiKey}`,
          { cache: 'no-store' }
        );

        if (creditsRes.ok) {
          const creditsData = await creditsRes.json();
          const allCredits = [...(creditsData.cast || []), ...(creditsData.crew || [])];

          const verifiedFilmography: MediaItem[] = [];
          const seenIds = new Set<string>();

          for (const c of allCredits) {
            const mType: 'movie' | 'tv' = c.media_type === 'tv' ? 'tv' : 'movie';
            const tName = c.title || c.name || c.original_title || c.original_name;
            const key = `${mType}_${c.id}`;

            if (!tName || !c.poster_path || seenIds.has(key)) continue;
            seenIds.add(key);

            verifiedFilmography.push({
              id: c.id,
              tmdbId: c.id,
              title: tName,
              mediaType: mType,
              posterPath: `${TMDB_IMAGE_BASE}w500${c.poster_path}`,
              backdropPath: c.backdrop_path ? `${TMDB_IMAGE_BASE}w780${c.backdrop_path}` : null,
              releaseDate: c.release_date || c.first_air_date || '',
              overview: c.overview || 'No plot summary available.',
              genres: [],
              directors: [matchedPerson.name],
              cast: [{ id: matchedPerson.id, name: matchedPerson.name, character: c.character || 'Role', profilePath: null }],
              voteAverage: c.vote_average ? Math.round(c.vote_average * 10) / 10 : undefined,
              voteCount: c.vote_count || 10,
            });
          }

          if (verifiedFilmography.length > 0) {
            return verifiedFilmography;
          }
        }
      }
    }
  } catch {
    // fallback
  }

  return localMatches.length > 0 ? localMatches : POPULAR_AMERICAN_CATALOG;
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
      originalLanguage: formatLanguageName(data.original_language) || localFound?.originalLanguage || 'English',
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
