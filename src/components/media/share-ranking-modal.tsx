'use client';

import React, { useState } from 'react';
import { StorageService } from '@/lib/storage';
import { X, Share2, Copy, Check, Sparkles, Trophy, Link as LinkIcon, Download } from 'lucide-react';
import { MOCK_MEDIA_ITEMS } from '@/lib/tmdb';
import { MediaItem } from '@/types/media';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface SharedItem {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  ratingTier: number;
}

export const ShareRankingModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [imported, setImported] = useState(false);

  const currentUser = StorageService.getCurrentUser();
  const localRecords = StorageService.getUserRecords().filter((r) => r.status === 'watched');
  localRecords.sort((a, b) => (a.rankIndex || 999) - (b.rankIndex || 999));

  // Parse incoming shared payload from URL hash (if opened from a friend's link)
  const parseSharedHash = (): { userName: string; items: SharedItem[] } => {
    if (typeof window === 'undefined') return { userName: '', items: [] };
    const hash = window.location.hash;
    const match = hash.match(/#share=([^&]+)/);
    if (!match || !match[1]) return { userName: '', items: [] };

    try {
      const raw = match[1];
      let decoded = '';
      try {
        decoded = decodeURIComponent(escape(atob(raw)));
      } catch {
        decoded = decodeURIComponent(raw);
      }

      let userName = 'Friend';
      let itemsStr = decoded;
      if (decoded.includes('|')) {
        const parts = decoded.split('|');
        if (parts[0].startsWith('u:')) {
          userName = parts[0].replace('u:', '');
          itemsStr = parts.slice(1).join('|');
        }
      }

      const items: SharedItem[] = [];
      itemsStr.split(';').forEach((entry) => {
        const [idStr, type, titleEnc, scoreStr] = entry.split(':');
        if (idStr && type) {
          items.push({
            tmdbId: parseInt(idStr, 10),
            mediaType: type as 'movie' | 'tv',
            title: titleEnc ? decodeURIComponent(titleEnc) : 'Title',
            ratingTier: scoreStr ? parseFloat(scoreStr) : 8.0,
          });
        }
      });

      return { userName, items };
    } catch {
      return { userName: '', items: [] };
    }
  };

  const sharedData = parseSharedHash();
  const isIncomingShare = sharedData.items.length > 0;

  const activeName = isIncomingShare ? sharedData.userName : currentUser.name;
  const activeItems: { title: string; ratingTier: number; tmdbId: number; mediaType: 'movie' | 'tv' }[] = isIncomingShare
    ? sharedData.items
    : localRecords.slice(0, 10).map((r) => ({
        title: r.item.title,
        ratingTier: r.ratingTier,
        tmdbId: r.item.tmdbId,
        mediaType: r.item.mediaType,
      }));

  // Encoding helper
  const safeEncode = (str: string): string => {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch {
      return encodeURIComponent(str);
    }
  };

  // Build outgoing payload link from local user records
  const topLocal = localRecords.slice(0, 10);
  const outgoingPayload = `u:${currentUser.name}|` + topLocal.map((r) => `${r.item.tmdbId}:${r.item.mediaType}:${encodeURIComponent(r.item.title)}:${r.ratingTier}`).join(';');
  const shareableUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#share=${safeEncode(outgoingPayload)}`
    : 'https://jcpapernik.github.io/cinerank-media-tracker/';

  const generateTextSummary = () => {
    let text = `🎬 ${activeName}'s Top Movie & TV Rankings on CineRank:\n\n`;
    activeItems.forEach((r, idx) => {
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
      text += `${medal} ${r.title} (${r.ratingTier}/10)\n`;
    });
    text += `\nTrack & rank your favorite movies at:\n${shareableUrl}`;
    return text;
  };

  // Robust Clipboard Copy function with execCommand fallback
  const copyToClipboard = async (textToCopy: string): Promise<boolean> => {
    if (!textToCopy) return false;

    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        return true;
      } catch {
        // Fallback
      }
    }

    try {
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch {
      return false;
    }
  };

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(shareableUrl);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyText = async () => {
    const ok = await copyToClipboard(generateTextSummary());
    if (ok) {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${activeName}'s Movie Rankings`,
          text: generateTextSummary(),
          url: shareableUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await handleCopyLink();
    }
  };

  const handleImportSharedItems = () => {
    sharedData.items.forEach((item) => {
      const matchedCatalogItem = MOCK_MEDIA_ITEMS.find((m) => m.tmdbId === item.tmdbId && m.mediaType === item.mediaType);
      const mediaItemToSave: MediaItem = matchedCatalogItem || {
        id: item.tmdbId,
        tmdbId: item.tmdbId,
        title: item.title,
        mediaType: item.mediaType,
        posterPath: null,
        backdropPath: null,
        releaseDate: '2026',
        overview: 'Shared title from friend.',
        genres: ['Featured'],
        originalLanguage: 'English',
        directors: [],
        cast: [],
      };

      StorageService.saveRecord(mediaItemToSave, 'watched', item.ratingTier);
    });

    setImported(true);
    setTimeout(() => setImported(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Trophy className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {isIncomingShare ? `${activeName}'s Shared Ranking` : 'Share Your Movie Ranking'}
          </h2>
          <p className="text-xs text-slate-400">
            {isIncomingShare
              ? `Viewing top ranked movie choices shared by ${activeName}!`
              : 'Share your custom Top 10 list with friends, social media, or iMessage!'}
          </p>
        </div>

        {/* Top Ranked Preview Card */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2 max-h-56 overflow-y-auto">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
            <span>{activeName}&apos;s Top Titles ({activeItems.length} items)</span>
            <span className="text-amber-400">Master Rank</span>
          </div>

          {activeItems.length > 0 ? (
            activeItems.map((r, idx) => (
              <div key={`${r.tmdbId}_${idx}`} className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2 font-medium text-slate-200 truncate">
                  <span className="font-mono text-[11px] font-extrabold w-5 text-amber-400">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </span>
                  <span className="truncate">{r.title}</span>
                </div>
                <span className="font-mono font-extrabold text-[11px] text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-cyan-500/20">
                  {r.ratingTier}/10
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 text-center py-4">
              No watched movies logged yet! Mark titles as watched to generate your shareable link.
            </p>
          )}
        </div>

        {/* Incoming Share: Import Button */}
        {isIncomingShare && (
          <button
            onClick={handleImportSharedItems}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition border ${
              imported
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
            }`}
          >
            {imported ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {imported ? `Added ${activeName}'s list to your watched log!` : `Add ${activeName}'s Top Titles to My List`}
          </button>
        )}

        {/* Interactive Share Link Input Box */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <LinkIcon className="w-3 h-3 text-cyan-400" /> Shareable URL Link
          </label>
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <input
              type="text"
              readOnly
              value={shareableUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 bg-transparent px-2.5 py-1 font-mono text-xs text-cyan-300 focus:outline-none truncate selection:bg-cyan-500/30"
            />
            <button
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                copiedLink ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition"
            >
              <Share2 className="w-4 h-4" /> Share via System (Messages / AirDrop / Apps)
            </button>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handleCopyLink}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              {copiedLink ? 'Link Copied!' : 'Copy Share Link'}
            </button>

            <button
              onClick={handleCopyText}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Sparkles className="w-4 h-4 text-purple-400" />}
              {copiedText ? 'Text Copied!' : 'Copy Text List'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
