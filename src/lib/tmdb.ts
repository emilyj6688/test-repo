import { MediaItem, TMDBRawSearchResult } from '@/types/media';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

export function getTMDBImageUrl(
  path: string | null,
  size: 'poster' | 'backdrop' | 'profile' = 'poster'
): string {
  if (!path) {
    if (size === 'profile') return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
    return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';
  }
  const sizePath = size === 'backdrop' ? 'w780' : size === 'profile' ? 'w185' : 'w500';
  return `${TMDB_IMAGE_BASE}${sizePath}${path}`;
}

export function isTMDBConfigured(): boolean {
  return Boolean(TMDB_API_KEY && TMDB_API_KEY !== 'your_tmdb_api_key_here');
}

// Built-in high quality mock data for demo mode or offline testing
export const MOCK_MEDIA_ITEMS: MediaItem[] = [
  {
    id: 27205,
    tmdbId: 27205,
    title: 'Inception',
    mediaType: 'movie',
    posterPath: '/oYuLEW9WAFUh1yCxyStv2Mse92E.jpg',
    backdropPath: '/8ZTVqvKDQ8emSGUEMjsS4yHAiKQ.jpg',
    releaseDate: '2010-07-15',
    overview: 'Cobb, a skilled thief who steals corporate secrets through dream-sharing technology, is given the inverse task of planting an idea into the mind of a C.E.O.',
    genres: ['Action', 'Science Fiction', 'Adventure'],
    directors: ['Christopher Nolan'],
    cast: [
      { id: 6193, name: 'Leonardo DiCaprio', character: 'Dom Cobb', profilePath: '/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg' },
      { id: 24045, name: 'Joseph Gordon-Levitt', character: 'Arthur', profilePath: '/dhvHh2Z6vS10LqM8t5Zk1G9f.jpg' },
      { id: 27578, name: 'Elliot Page', character: 'Ariadne', profilePath: '/t3j9d6V9V.jpg' },
      { id: 2524, name: 'Tom Hardy', character: 'Eames', profilePath: '/yVpi1d34.jpg' },
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
    posterPath: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdropPath: '/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
    releaseDate: '2008-07-16',
    overview: 'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.',
    genres: ['Drama', 'Action', 'Crime', 'Thriller'],
    directors: ['Christopher Nolan'],
    cast: [
      { id: 3894, name: 'Christian Bale', character: 'Bruce Wayne / Batman', profilePath: '/p83F2f.jpg' },
      { id: 1810, name: 'Heath Ledger', character: 'Joker', profilePath: '/5Y9H.jpg' },
      { id: 64, name: 'Gary Oldman', character: 'James Gordon', profilePath: '/2v.jpg' },
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
    posterPath: '/zt2WvHUi5xZKOzUd32j3P3p.jpg',
    backdropPath: '/tsRy63Mu5cu8etL1X7ZLyf7up1M.jpg',
    releaseDate: '2008-01-20',
    overview: 'Walter White, a chemistry teacher diagnosed with inoperable lung cancer, turns to manufacturing and selling methamphetamine with a former student in order to secure his family\'s future.',
    genres: ['Drama', 'Crime'],
    directors: ['Vince Gilligan'],
    cast: [
      { id: 17419, name: 'Bryan Cranston', character: 'Walter White', profilePath: '/7JHY.jpg' },
      { id: 84497, name: 'Aaron Paul', character: 'Jesse Pinkman', profilePath: '/uC.jpg' },
    ],
    voteAverage: 8.9,
    tagline: 'Change the equation.',
  },
  {
    id: 95396,
    tmdbId: 95396,
    title: 'Severance',
    mediaType: 'tv',
    posterPath: '/lT0xJ1K3.jpg',
    backdropPath: '/9xx.jpg',
    releaseDate: '2022-02-17',
    overview: 'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives. When a mysterious colleague appears outside of work, it begins a journey to discover the truth about their jobs.',
    genres: ['Sci-Fi & Fantasy', 'Drama', 'Mystery'],
    directors: ['Dan Erickson', 'Ben Stiller'],
    cast: [
      { id: 20580, name: 'Adam Scott', character: 'Mark Scout', profilePath: '/adam.jpg' },
      { id: 7159, name: 'Patricia Arquette', character: 'Harmony Cobel', profilePath: '/patricia.jpg' },
      { id: 4785, name: 'John Turturro', character: 'Irving Bailiff', profilePath: '/john.jpg' },
    ],
    voteAverage: 8.6,
    tagline: 'Please enjoy each choice equally.',
  },
  {
    id: 157336,
    tmdbId: 157336,
    title: 'Interstellar',
    mediaType: 'movie',
    posterPath: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdropPath: '/xJHokMbljvjADYdit5f6UrDxev.jpg',
    releaseDate: '2014-11-05',
    overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.',
    genres: ['Adventure', 'Drama', 'Science Fiction'],
    directors: ['Christopher Nolan'],
    cast: [
      { id: 10296, name: 'Matthew McConaughey', character: 'Cooper', profilePath: '/matt.jpg' },
      { id: 1813, name: 'Anne Hathaway', character: 'Brand', profilePath: '/anne.jpg' },
      { id: 83002, name: 'Jessica Chastain', character: 'Murph', profilePath: '/jessica.jpg' },
    ],
    voteAverage: 8.4,
    tagline: 'Mankind was born on Earth. It was never meant to die here.',
    runtime: 169,
  },
  {
    id: 76331,
    tmdbId: 76331,
    title: 'Succession',
    mediaType: 'tv',
    posterPath: '/7t7.jpg',
    backdropPath: '/succ.jpg',
    releaseDate: '2018-06-03',
    overview: 'The Roy family is known for controlling the biggest media and entertainment company in the world. However, their world changes when their father steps down from the company.',
    genres: ['Drama'],
    directors: ['Jesse Armstrong'],
    cast: [
      { id: 3267, name: 'Brian Cox', character: 'Logan Roy', profilePath: '/brian.jpg' },
      { id: 56734, name: 'Jeremy Strong', character: 'Kendall Roy', profilePath: '/jeremy.jpg' },
      { id: 1224856, name: 'Sarah Snook', character: 'Shiv Roy', profilePath: '/sarah.jpg' },
    ],
    voteAverage: 8.5,
    tagline: 'Make your play.',
  },
  {
    id: 438631,
    tmdbId: 438631,
    title: 'Dune',
    mediaType: 'movie',
    posterPath: '/d5NGo2F.jpg',
    backdropPath: '/ee.jpg',
    releaseDate: '2021-09-15',
    overview: 'Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding, must travel to the most dangerous planet in the universe to ensure the future of his family and his people.',
    genres: ['Science Fiction', 'Adventure'],
    directors: ['Denis Villeneuve'],
    cast: [
      { id: 1190668, name: 'Timothée Chalamet', character: 'Paul Atreides', profilePath: '/timo.jpg' },
      { id: 505710, name: 'Zendaya', character: 'Chani', profilePath: '/zendaya.jpg' },
      { id: 2524, name: 'Rebecca Ferguson', character: 'Lady Jessica Atreides', profilePath: '/rebecca.jpg' },
    ],
    voteAverage: 7.8,
    tagline: 'It begins.',
    runtime: 155,
  },
  {
    id: 66732,
    tmdbId: 66732,
    title: 'Stranger Things',
    mediaType: 'tv',
    posterPath: '/49W.jpg',
    backdropPath: '/st.jpg',
    releaseDate: '2016-07-15',
    overview: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
    genres: ['Sci-Fi & Fantasy', 'Drama', 'Mystery'],
    directors: ['The Duffer Brothers'],
    cast: [
      { id: 1356210, name: 'Millie Bobby Brown', character: 'Eleven', profilePath: '/millie.jpg' },
      { id: 62846, name: 'Winona Ryder', character: 'Joyce Byers', profilePath: '/winona.jpg' },
      { id: 55638, name: 'David Harbour', character: 'Jim Hopper', profilePath: '/david.jpg' },
    ],
    voteAverage: 8.6,
    tagline: 'One summer can change everything.',
  },
];

export async function searchTMDB(query: string, page = 1): Promise<MediaItem[]> {
  if (!query.trim()) return [];

  if (!isTMDBConfigured()) {
    // Fallback search against mock items
    const lower = query.toLowerCase();
    return MOCK_MEDIA_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(lower) ||
        item.genres.some((g) => g.toLowerCase().includes(lower)) ||
        item.directors.some((d) => d.toLowerCase().includes(lower))
    );
  }

  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
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
        genres: [], // Enriched on detail fetch
        directors: [],
        cast: [],
        voteAverage: r.vote_average ? Math.round(r.vote_average * 10) / 10 : undefined,
      });
    }

    return items;
  } catch (err) {
    console.warn('TMDB search failed, falling back to mock data:', err);
    return MOCK_MEDIA_ITEMS;
  }
}

export async function getTMDBDetails(id: number, mediaType: 'movie' | 'tv'): Promise<MediaItem> {
  if (!isTMDBConfigured()) {
    const mock = MOCK_MEDIA_ITEMS.find((m) => m.id === id && m.mediaType === mediaType);
    if (mock) return mock;
    // Generic fallback mock
    return {
      id,
      tmdbId: id,
      title: `Sample ${mediaType === 'movie' ? 'Movie' : 'TV Show'} #${id}`,
      mediaType,
      posterPath: null,
      releaseDate: '2024-01-01',
      overview: 'This is a sample media item loaded in offline demo mode.',
      genres: ['Drama', 'Cinema'],
      directors: ['Featured Director'],
      cast: [{ id: 1, name: 'Lead Actor', character: 'Main Role', profilePath: null }],
    };
  }

  try {
    const appendParam = mediaType === 'movie' ? 'credits' : 'credits,aggregate_credits';
    const res = await fetch(`${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${TMDB_API_KEY}&append_to_response=${appendParam}`, {
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
    console.warn(`TMDB details failed for ${mediaType} ${id}, falling back to mock:`, err);
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
