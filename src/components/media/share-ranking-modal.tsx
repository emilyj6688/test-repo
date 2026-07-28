'use client';

import React, { useState } from 'react';
import { StorageService } from '@/lib/storage';
import { X, Share2, Copy, Check, Sparkles, Trophy, Link as LinkIcon } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareRankingModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const user = StorageService.getCurrentUser();
  const records = StorageService.getUserRecords().filter((r) => r.status === 'watched');

  // Sort by master rank index (1 = top)
  records.sort((a, b) => (a.rankIndex || 999) - (b.rankIndex || 999));
  const top10 = records.slice(0, 10);

  // Safe encoding helper that handles UTF-8 / special characters safely
  const safeEncode = (str: string): string => {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch {
      return encodeURIComponent(str);
    }
  };

  // Build lightweight payload
  const payload = top10.map((r) => `${r.item.tmdbId}:${r.item.mediaType}:${r.ratingTier}`).join(';');
  const encodedPayload = safeEncode(payload);

  const shareableUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#share=${encodedPayload}`
    : 'https://jcpapernik.github.io/cinerank-media-tracker/';

  const generateTextSummary = () => {
    let text = `🎬 ${user.name}'s Top Movie & TV Rankings on CineRank:\n\n`;
    top10.forEach((r, idx) => {
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
      text += `${medal} ${r.item.title} (${r.ratingTier}/10)\n`;
    });
    text += `\nTrack & rank your favorite movies at:\n${shareableUrl}`;
    return text;
  };

  // Robust Clipboard Copy function with execCommand fallback
  const copyToClipboard = async (textToCopy: string): Promise<boolean> => {
    if (!textToCopy) return false;

    // Method 1: Modern navigator.clipboard API
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        return true;
      } catch {
        // Continue to fallback
      }
    }

    // Method 2: Fallback textarea execCommand copy (Works on all mobile/desktop browsers)
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
          title: `${user.name}'s Movie Rankings`,
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
            Share Your Movie Ranking
          </h2>
          <p className="text-xs text-slate-400">
            Share your custom Top 10 list with friends, social media, or iMessage!
          </p>
        </div>

        {/* Top Ranked Preview Card */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2 max-h-52 overflow-y-auto">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
            <span>{user.name}&apos;s Top Titles ({records.length} total)</span>
            <span className="text-amber-400">Master Rank</span>
          </div>

          {top10.length > 0 ? (
            top10.map((r, idx) => (
              <div key={r.id} className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2 font-medium text-slate-200 truncate">
                  <span className="font-mono text-[11px] font-extrabold w-5 text-amber-400">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </span>
                  <span className="truncate">{r.item.title}</span>
                </div>
                <span className="font-mono font-extrabold text-[11px] text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-cyan-500/20">
                  {r.ratingTier}/10
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 text-center py-4">No watched movies logged yet!</p>
          )}
        </div>

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
