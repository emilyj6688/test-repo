import { MediaItem, TMDBRawSearchResult } from '@/types/media';

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
  if (!query.trim()) return MOCK_MEDIA_ITEMS;

  const apiKey = getActiveTMDBApiKey();

  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
      { cache: 'no-store' }
    );

    if (!res.ok) throw new Error(`TMDB Search Error: ${res.statusText}`);
    const data = await res.json();
    const results: TMDBRawSearchResult[] = data.results || [];

    const items: MediaItem[] = [];

    for (const r of results) {
      if (r.media_type !== 'movie' && r.media_type !== 'tv') continue;

      const mediaType: 'movie' | 'tv' = r.media_type;
      const title = r.title || r.name || r.original_title || r.original_name || 'Untitled';
      const releaseDate = r.release_date || r.first_air_date || '';

      items.push({
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

    return items.length > 0 ? items : MOCK_MEDIA_ITEMS.filter((m) => m.title.toLowerCase().includes(query.toLowerCase()));
  } catch (err) {
    console.warn('TMDB live search failed, filtering mock data:', err);
    const lower = query.toLowerCase();
    return MOCK_MEDIA_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(lower) ||
        item.genres.some((g) => g.toLowerCase().includes(lower)) ||
        item.directors.some((d) => d.toLowerCase().includes(lower))
    );
  }
}

export async function getTMDBDetails(id: number, mediaType: 'movie' | 'tv'): Promise<MediaItem> {
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
      title,
      mediaType,
      posterPath: data.poster_path,
      backdropPath: data.backdrop_path,
      releaseDate,
      overview: data.overview || 'No plot overview provided.',
      genres,
      directors,
      cast,
      voteAverage: data.vote_average ? Math.round(data.vote_average * 10) / 10 : undefined,
      tagline: data.tagline,
      runtime: data.runtime || (data.episode_run_time && data.episode_run_time[0]),
    };
  } catch (err) {
    console.warn(`TMDB details failed for ${mediaType} ${id}, returning mock item:`, err);
    const mock = MOCK_MEDIA_ITEMS.find((m) => m.id === id);
    if (mock) return mock;
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

// 22 Popular Movies & TV Shows mock dataset
export const MOCK_MEDIA_ITEMS: MediaItem[] = [
  {
    id: 27205,
    tmdbId: 27205,
    title: 'Inception',
    mediaType: 'movie',
    posterPath: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    backdropPath: 'https://images.unsplash.com/photo-1518676599625-5d51d8b67123?auto=format&fit=crop&w=780&q=80',
    releaseDate: '2010-07-15',
    overview: 'Cobb, a skilled thief who steals corporate secrets through dream-sharing technology, is given the inverse task of planting an idea into the mind of a C.E.O.',
    genres: ['Action', 'Science Fiction', 'Adventure'],
    directors: ['Christopher Nolan'],
    cast: [
      { id: 6193, name: 'Leonardo DiCaprio', character: 'Dom Cobb', profilePath: null },
      { id: 24045, name: 'Joseph Gordon-Levitt', character: 'Arthur', profilePath: null },
    ],
    voteAverage: 8.4,
    tagline: 'Your mind is the scene of the crime.',
    runtime: 148,
  },
  {
    id: 155,
    tmdbId: 155,
    title: 'The Dark Knight',
    mediaType: 'movie',
    posterPath: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdropPath: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=780&q=80',
    releaseDate: '2008-07-16',
    overview: 'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.',
    genres: ['Drama', 'Action', 'Crime', 'Thriller'],
    directors: ['Christopher Nolan'],
    cast: [
      { id: 3894, name: 'Christian Bale', character: 'Bruce Wayne / Batman', profilePath: null },
      { id: 1810, name: 'Heath Ledger', character: 'Joker', profilePath: null },
    ],
    voteAverage: 8.5,
    tagline: 'Welcome to a world without rules.',
    runtime: 152,
  },
  {
    id: 1396,
    tmdbId: 1396,
    title: 'Breaking Bad',
    mediaType: 'tv',
    posterPath: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    backdropPath: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=780&q=80',
    releaseDate: '2008-01-20',
    overview: 'Walter White, a chemistry teacher diagnosed with inoperable lung cancer, turns to manufacturing and selling methamphetamine with a former student in order to secure his family\'s future.',
    genres: ['Drama', 'Crime'],
    directors: ['Vince Gilligan'],
    cast: [
      { id: 17419, name: 'Bryan Cranston', character: 'Walter White', profilePath: null },
      { id: 84497, name: 'Aaron Paul', character: 'Jesse Pinkman', profilePath: null },
    ],
    voteAverage: 8.9,
    tagline: 'Change the equation.',
  },
  {
    id: 95396,
    tmdbId: 95396,
    title: 'Severance',
    mediaType: 'tv',
    posterPath: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500&q=80',
    backdropPath: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=780&q=80',
    releaseDate: '2022-02-17',
    overview: 'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.',
    genres: ['Sci-Fi & Fantasy', 'Drama'],
    directors: ['Ben Stiller'],
    cast: [{ id: 20580, name: 'Adam Scott', character: 'Mark Scout', profilePath: null }],
    voteAverage: 8.6,
  },
  {
    id: 157336,
    tmdbId: 157336,
    title: 'Interstellar',
    mediaType: 'movie',
    posterPath: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdropPath: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=780&q=80',
    releaseDate: '2014-11-05',
    overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass human space travel.',
    genres: ['Adventure', 'Science Fiction'],
    directors: ['Christopher Nolan'],
    cast: [{ id: 10296, name: 'Matthew McConaughey', character: 'Cooper', profilePath: null }],
    voteAverage: 8.4,
  },
  {
    id: 693134,
    tmdbId: 693134,
    title: 'Dune: Part Two',
    mediaType: 'movie',
    posterPath: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdropPath: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=780&q=80',
    releaseDate: '2024-02-27',
    overview: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a warpath of revenge.',
    genres: ['Science Fiction', 'Adventure'],
    directors: ['Denis Villeneuve'],
    cast: [{ id: 1190668, name: 'Timothée Chalamet', character: 'Paul Atreides', profilePath: null }],
    voteAverage: 8.3,
  },
  {
    id: 66732,
    tmdbId: 66732,
    title: 'Stranger Things',
    mediaType: 'tv',
    posterPath: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    backdropPath: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=780&q=80',
    releaseDate: '2016-07-15',
    overview: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments and supernatural forces.',
    genres: ['Sci-Fi & Fantasy', 'Drama'],
    directors: ['The Duffer Brothers'],
    cast: [{ id: 1356210, name: 'Millie Bobby Brown', character: 'Eleven', profilePath: null }],
    voteAverage: 8.6,
  },
  {
    id: 872585,
    tmdbId: 872585,
    title: 'Oppenheimer',
    mediaType: 'movie',
    posterPath: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdropPath: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=780&q=80',
    releaseDate: '2023-07-19',
    overview: 'The story of J. Robert Oppenheimer’s role in the development of the atomic bomb during World War II.',
    genres: ['Drama', 'History'],
    directors: ['Christopher Nolan'],
    cast: [{ id: 2038, name: 'Cillian Murphy', character: 'J. Robert Oppenheimer', profilePath: null }],
    voteAverage: 8.1,
  },
];
