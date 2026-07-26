# CineRank - Media Tracking & Pairwise Ranking Web Application

CineRank is a modern web application built with Next.js (App Router), TypeScript, and Tailwind CSS. It allows users to search movies and TV shows via TMDB, track watched items and watchlists, assign 3-tier semantic ratings, and rank titles contextually through interactive pairwise ("A vs B") comparisons.

## Core Features (Phase 1)
- **Browse & Search:** Real-time debounced TMDB search for movies and TV shows, featuring full cast, crew, overview, and genre details.
- **Watched Log & Watchlist:** Track watched media and titles to watch later.
- **3-Point Semantic Rating Slider:** Rate watched items as **Didn't Like** (1), **Neutral** (2), or **Liked** (3).
- **Pairwise Comparison Game ("A vs B"):** Head-to-head comparison arena powered by Elo scoring ($K=32$) to dynamically rank media, accompanied by a manual fine-tuning master list.
- **Mock User Authentication:** Local profile switcher isolating watchlists and rankings per user.
- **Offline / Mock Mode:** Built-in fallback dataset when `NEXT_PUBLIC_TMDB_API_KEY` is not provided.

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/emilyj6688/test-repo.git
   cd test-repo
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional):**
   Copy `.env.example` to `.env.local` and add your TMDB API Key:
   ```bash
   cp .env.example .env.local
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for Production:**
   ```bash
   npm run build
   ```
