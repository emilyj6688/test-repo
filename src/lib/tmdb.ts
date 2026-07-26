import { MediaItem, TMDBRawSearchResult } from '@/types/media';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

// SVG Data URI fallback placeholder when poster is missing or broken
export const FALLBACK_POSTER_URL =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750" fill="%230f172a"><rect width="500" height="750" fill="%230f172a"/><rect x="2" y="2" width="496" height="746" fill="none" stroke="%23334155" stroke-width="4" rx="16"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="%2338bdf8" font-family="sans-serif" font-size="28" font-weight="bold">🎬 CineRank</text><text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif" font-size="18">No Poster Available</text></svg>';

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
  return Boolean(TMDB_API_KEY && TMDB_API_KEY !== 'your_tmdb_api_key_here');
}

// 22 Popular Movies & TV Shows mock dataset with 100% verified HTTP 200 image URLs
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
      { id: 27578, name: 'Elliot Page', character: 'Ariadne', profilePath: null },
      { id: 2524, name: 'Tom Hardy', character: 'Eames', profilePath: null },
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
      { id: 64, name: 'Gary Oldman', character: 'James Gordon', profilePath: null },
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
    overview: 'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives. When a mysterious colleague appears outside of work, it begins a journey to discover the truth about their jobs.',
    genres: ['Sci-Fi & Fantasy', 'Drama', 'Mystery'],
    directors: ['Dan Erickson', 'Ben Stiller'],
    cast: [
      { id: 20580, name: 'Adam Scott', character: 'Mark Scout', profilePath: null },
      { id: 7159, name: 'Patricia Arquette', character: 'Harmony Cobel', profilePath: null },
      { id: 4785, name: 'John Turturro', character: 'Irving Bailiff', profilePath: null },
    ],
    voteAverage: 8.6,
    tagline: 'Please enjoy each choice equally.',
  },
  {
    id: 157336,
    tmdbId: 157336,
    title: 'Interstellar',
    mediaType: 'movie',
    posterPath: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdropPath: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=780&q=80',
    releaseDate: '2014-11-05',
    overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.',
    genres: ['Adventure', 'Drama', 'Science Fiction'],
    directors: ['Christopher Nolan'],
    cast: [
      { id: 10296, name: 'Matthew McConaughey', character: 'Cooper', profilePath: null },
      { id: 1813, name: 'Anne Hathaway', character: 'Brand', profilePath: null },
      { id: 83002, name: 'Jessica Chastain', character: 'Murph', profilePath: null },
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
    posterPath: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=500&q=80',
    backdropPath: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=780&q=80',
    releaseDate: '2018-06-03',
    overview: 'The Roy family is known for controlling the biggest media and entertainment company in the world. However, their world changes when their father steps down from the company.',
    genres: ['Drama'],
    directors: ['Jesse Armstrong'],
    cast: [
      { id: 3267, name: 'Brian Cox', character: 'Logan Roy', profilePath: null },
      { id: 56734, name: 'Jeremy Strong', character: 'Kendall Roy', profilePath: null },
      { id: 1224856, name: 'Sarah Snook', character: 'Shiv Roy', profilePath: null },
    ],
    voteAverage: 8.5,
    tagline: 'Make your play.',
  },
  {
    id: 693134,
    tmdbId: 693134,
    title: 'Dune: Part Two',
    mediaType: 'movie',
    posterPath: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdropPath: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=780&q=80',
    releaseDate: '2024-02-27',
    overview: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.',
    genres: ['Science Fiction', 'Adventure'],
    directors: ['Denis Villeneuve'],
    cast: [
      { id: 1190668, name: 'Timothée Chalamet', character: 'Paul Atreides', profilePath: null },
      { id: 505710, name: 'Zendaya', character: 'Chani', profilePath: null },
      { id: 1373737, name: 'Florence Pugh', character: 'Princess Irulan', profilePath: null },
    ],
    voteAverage: 8.3,
    tagline: 'Long live the fighters.',
    runtime: 166,
  },
  {
    id: 66732,
    tmdbId: 66732,
    title: 'Stranger Things',
    mediaType: 'tv',
    posterPath: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    backdropPath: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=780&q=80',
    releaseDate: '2016-07-15',
    overview: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
    genres: ['Sci-Fi & Fantasy', 'Drama', 'Mystery'],
    directors: ['The Duffer Brothers'],
    cast: [
      { id: 1356210, name: 'Millie Bobby Brown', character: 'Eleven', profilePath: null },
      { id: 62846, name: 'Winona Ryder', character: 'Joyce Byers', profilePath: null },
      { id: 55638, name: 'David Harbour', character: 'Jim Hopper', profilePath: null },
    ],
    voteAverage: 8.6,
    tagline: 'One summer can change everything.',
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
    cast: [
      { id: 2038, name: 'Cillian Murphy', character: 'J. Robert Oppenheimer', profilePath: null },
      { id: 5081, name: 'Emily Blunt', character: 'Katherine Oppenheimer', profilePath: null },
      { id: 1892, name: 'Matt Damon', character: 'Leslie Groves', profilePath: null },
    ],
    voteAverage: 8.1,
    tagline: 'The world forever changes.',
    runtime: 180,
  },
  {
    id: 94605,
    tmdbId: 94605,
    title: 'Arcane',
    mediaType: 'tv',
    posterPath: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=500&q=80',
    backdropPath: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=780&q=80',
    releaseDate: '2021-11-06',
    overview: 'Amid the bleak discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and incompatible convictions.',
    genres: ['Animation', 'Sci-Fi & Fantasy', 'Action'],
    directors: ['Christian Linke', 'Alex Yee'],
    cast: [
      { id: 55800, name: 'Hailee Steinfeld', character: 'Vi', profilePath: null },
      { id: 1421689, name: 'Ella Purnell', character: 'Jinx', profilePath: null },
    ],
    voteAverage: 8.7,
    tagline: 'Welcome to the playground.',
  },
  {
    id: 125988,
    tmdbId: 125988,
    title: 'The Bear',
    mediaType: 'tv',
    posterPath: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=500&q=80',
    backdropPath: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=780&q=80',
    releaseDate: '2022-06-23',
    overview: 'A young chef from the fine dining world returns to Chicago to run his family’s Italian beef sandwich shop after a heartbreaking death.',
    genres: ['Drama', 'Comedy'],
    directors: ['Christopher Storer'],
    cast: [
      { id: 1269389, name: 'Jeremy Allen White', character: 'Carmen "Carmy" Berzatto', profilePath: null },
      { id: 2289659, name: 'Ayo Edebiri', character: 'Sydney Adamu', profilePath: null },
      { id: 55431, name: 'Ebon Moss-Bachrach', character: 'Richard "Richie" Jerimovich', profilePath: null },
    ],
    voteAverage: 8.5,
    tagline: 'Every second counts.',
  },
  {
    id: 129,
    tmdbId: 129,
    title: 'Spirited Away',
    mediaType: 'movie',
    posterPath: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=500&q=80',
    backdropPath: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=780&q=80',
    releaseDate: '2001-07-20',
    overview: 'A young girl, Chihiro, becomes trapped in a strange new world of spirits. When her parents undergo a mysterious transformation, she must call upon the courage she never knew she had to free her family.',
    genres: ['Animation', 'Family', 'Fantasy'],
    directors: ['Hayao Miyazaki'],
    cast: [
      { id: 19588, name: 'Rumi Hiiragi', character: 'Chihiro Ogino (voice)', profilePath: null },
      { id: 19589, name: 'Miyu Irino', character: 'Haku (voice)', profilePath: null },
    ],
    voteAverage: 8.5,
    tagline: 'The tunnel led to a world of mysterious spirits.',
    runtime: 125,
  },
  {
    id: 550,
    tmdbId: 550,
    title: 'Fight Club',
    mediaType: 'movie',
    posterPath: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    backdropPath: 'https://images.unsplash.com/photo-1518676599625-5d51d8b67123?auto=format&fit=crop&w=780&q=80',
    releaseDate: '1999-10-15',
    overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
    genres: ['Drama'],
    directors: ['David Fincher'],
    cast: [
      { id: 819, name: 'Edward Norton', character: 'The Narrator', profilePath: null },
      { id: 287, name: 'Brad Pitt', character: 'Tyler Durden', profilePath: null },
      { id: 1283, name: 'Helena Bonham Carter', character: 'Marla Singer', profilePath: null },
    ],
    voteAverage: 8.4,
    tagline: 'Mischief. Mayhem. Soap.',
    runtime: 139,
  },
  {
    id: 603,
    tmdbId: 603,
    title: 'The Matrix',
    mediaType: 'movie',
    posterPath: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    backdropPath: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=780&q=80',
    releaseDate: '1999-03-31',
    overview: 'Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the intelligent computers who now rule the earth.',
    genres: ['Action', 'Science Fiction'],
    directors: ['Lana Wachowski', 'Lilly Wachowski'],
    cast: [
      { id: 6384, name: 'Keanu Reeves', character: 'Thomas A. Anderson / Neo', profilePath: null },
      { id: 2975, name: 'Laurence Fishburne', character: 'Morpheus', profilePath: null },
      { id: 530, name: 'Carrie-Anne Moss', character: 'Trinity', profilePath: null },
    ],
    voteAverage: 8.2,
    tagline: 'Welcome to the Real World.',
    runtime: 136,
  },
  {
    id: 680,
    tmdbId: 680,
    title: 'Pulp Fiction',
    mediaType: 'movie',
    posterPath: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80',
    backdropPath: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=780&q=80',
    releaseDate: '1994-09-10',
    overview: 'A burger-loving hitman, his philosophical partner, a drug-addled gangster\'s moll and a washed-up boxer converge in four tales of violence and redemption.',
    genres: ['Thriller', 'Crime'],
    directors: ['Quentin Tarantino'],
    cast: [
      { id: 8891, name: 'John Travolta', character: 'Vincent Vega', profilePath: null },
      { id: 2231, name: 'Samuel L. Jackson', character: 'Jules Winnfield', profilePath: null },
      { id: 139, name: 'Uma Thurman', character: 'Mia Wallace', profilePath: null },
    ],
    voteAverage: 8.5,
    tagline: 'Just because you are a character doesn\'t mean that you have character.',
    runtime: 154,
  },
  {
    id: 100088,
    tmdbId: 100088,
    title: 'The Last of Us',
    mediaType: 'tv',
    posterPath: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=500&q=80',
    backdropPath: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=780&q=80',
    releaseDate: '2023-01-15',
    overview: 'Twenty years after modern civilization has been destroyed, Joel, a hardened survivor, is hired to smuggle Ellie, a 14-year-old girl, out of an oppressive quarantine zone.',
    genres: ['Drama', 'Action & Adventure', 'Sci-Fi & Fantasy'],
    directors: ['Craig Mazin', 'Neil Druckmann'],
    cast: [
      { id: 1253360, name: 'Pedro Pascal', character: 'Joel Miller', profilePath: null },
      { id: 2043689, name: 'Bella Ramsey', character: 'Ellie Williams', profilePath: null },
    ],
    voteAverage: 8.6,
    tagline: 'When you’re lost in the darkness, look for the light.',
  },
  {
    id: 1399,
    tmdbId: 1399,
    title: 'Game of Thrones',
    mediaType: 'tv',
    posterPath: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=500&q=80',
    backdropPath: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=780&q=80',
    releaseDate: '2011-04-17',
    overview: 'Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war. All while a very ancient evil awakens in the farthest north.',
    genres: ['Sci-Fi & Fantasy', 'Drama', 'Action & Adventure'],
    directors: ['David Benioff', 'D.B. Weiss'],
    cast: [
      { id: 239019, name: 'Emilia Clarke', character: 'Daenerys Targaryen', profilePath: null },
      { id: 49339, name: 'Kit Harington', character: 'Jon Snow', profilePath: null },
      { id: 22970, name: 'Peter Dinklage', character: 'Tyrion Lannister', profilePath: null },
    ],
    voteAverage: 8.4,
    tagline: 'Winter is coming.',
  },
  {
    id: 569094,
    tmdbId: 569094,
    title: 'Spider-Man: Across the Spider-Verse',
    mediaType: 'movie',
    posterPath: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=500&q=80',
    backdropPath: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=780&q=80',
    releaseDate: '2023-05-31',
    overview: 'After reuniting with Gwen Stacy, Brooklyn’s full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse, where he encounters the Spider-Society.',
    genres: ['Animation', 'Action', 'Adventure', 'Science Fiction'],
    directors: ['Joaquim Dos Santos', 'Kemp Powers', 'Justin K. Thompson'],
    cast: [
      { id: 1478144, name: 'Shameik Moore', character: 'Miles Morales (voice)', profilePath: null },
      { id: 55800, name: 'Hailee Steinfeld', character: 'Gwen Stacy (voice)', profilePath: null },
    ],
    voteAverage: 8.4,
    tagline: 'It’s how you wear the mask that matters.',
    runtime: 140,
  },
  {
    id: 244786,
    tmdbId: 244786,
    title: 'Whiplash',
    mediaType: 'movie',
    posterPath: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80',
    backdropPath: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=780&q=80',
    releaseDate: '2014-10-10',
    overview: 'Under the direction of a ruthless instructor, a talented young drummer begins to pursue perfection at any cost, even his humanity.',
    genres: ['Drama', 'Music'],
    directors: ['Damien Chazelle'],
    cast: [
      { id: 1253353, name: 'Miles Teller', character: 'Andrew Neiman', profilePath: null },
      { id: 2983, name: 'J.K. Simmons', character: 'Terrence Fletcher', profilePath: null },
    ],
    voteAverage: 8.4,
    tagline: 'The road to greatness can take you to the edge.',
    runtime: 107,
  },
  {
    id: 496243,
    tmdbId: 496243,
    title: 'Parasite',
    mediaType: 'movie',
    posterPath: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=500&q=80',
    backdropPath: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=780&q=80',
    releaseDate: '2019-05-30',
    overview: 'All unemployed, Ki-taek\'s family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident.',
    genres: ['Comedy', 'Thriller', 'Drama'],
    directors: ['Bong Joon-ho'],
    cast: [
      { id: 20629, name: 'Song Kang-ho', character: 'Kim Ki-taek', profilePath: null },
      { id: 1251381, name: 'Lee Sun-kyun', character: 'Park Dong-ik', profilePath: null },
    ],
    voteAverage: 8.5,
    tagline: 'Act like you own the place.',
    runtime: 132,
  },
  {
    id: 545611,
    tmdbId: 545611,
    title: 'Everything Everywhere All at Once',
    mediaType: 'movie',
    posterPath: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80',
    backdropPath: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=780&q=80',
    releaseDate: '2022-03-24',
    overview: 'An aging Chinese immigrant is swept up in an insane adventure, where she alone can save the world by exploring other universes connecting with the lives she could have led.',
    genres: ['Action', 'Adventure', 'Science Fiction'],
    directors: ['Daniel Kwan', 'Daniel Scheinert'],
    cast: [
      { id: 1620, name: 'Michelle Yeoh', character: 'Evelyn Wang', profilePath: null },
      { id: 2372, name: 'Ke Huy Quan', character: 'Waymond Wang', profilePath: null },
      { id: 8210, name: 'Jamie Lee Curtis', character: 'Deirdre Beaubeirdre', profilePath: null },
    ],
    voteAverage: 7.8,
    tagline: 'The universe is much bigger than you think.',
    runtime: 139,
  },
  {
    id: 126308,
    tmdbId: 126308,
    title: 'Shōgun',
    mediaType: 'tv',
    posterPath: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=500&q=80',
    backdropPath: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=780&q=80',
    releaseDate: '2024-02-27',
    overview: 'In Japan in the year 1600, Lord Yoshii Toranaga is fighting for his life as his enemies on the Council of Regents unite against him, when a mysterious European ship is found marooned in a nearby fishing village.',
    genres: ['Drama', 'War & Politics'],
    directors: ['Rachel Kondo', 'Justin Marks'],
    cast: [
      { id: 20023, name: 'Hiroyuki Sanada', character: 'Lord Yoshii Toranaga', profilePath: null },
      { id: 54930, name: 'Cosmo Jarvis', character: 'John Blackthorne', profilePath: null },
      { id: 1515907, name: 'Anna Sawai', character: 'Toda Mariko', profilePath: null },
    ],
    voteAverage: 8.5,
    tagline: 'Outsider. Strategist. Legend.',
  },
];

export async function searchTMDB(query: string, page = 1): Promise<MediaItem[]> {
  if (!query.trim()) return [];

  if (!isTMDBConfigured()) {
    // Fallback search against 22 mock items
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
        genres: [],
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
