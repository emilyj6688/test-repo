'use client';

import React, { useState } from 'react';
import { StorageService } from '@/lib/storage';
import { UserProfile } from '@/types/media';
import { X, UserPlus, Check, User } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUserChanged: (user: UserProfile) => void;
}

const AVATAR_OPTIONS = ['🎬', '🍿', '👾', '🎭', '🎥', '⭐', '🚀', '🔥'];

export const UserProfileModal: React.FC<Props> = ({ isOpen, onClose, onUserChanged }) => {
  const [users, setUsers] = useState<UserProfile[]>(() => StorageService.getUsers());
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => StorageService.getCurrentUser());
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🎬');

  if (!isOpen) return null;

  const handleSelectUser = (user: UserProfile) => {
    StorageService.setCurrentUser(user.id);
    setCurrentUser(user);
    onUserChanged(user);
    onClose();
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const created = StorageService.createUserProfile(newName, selectedAvatar);
    setUsers(StorageService.getUsers());
    setCurrentUser(created);
    onUserChanged(created);
    setNewName('');
    setIsCreating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-cyan-400" /> Switch User Profile
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          Your watchlists, ratings, and pairwise rankings are locally saved per profile.
        </p>

        {!isCreating ? (
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {users.map((user) => {
              const isActive = user.id === currentUser.id;
              return (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition ${
                    isActive
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                      : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{user.avatarUrl || '👤'}</span>
                    <span className="font-semibold">{user.name}</span>
                  </div>
                  {isActive && <Check className="w-5 h-5 text-cyan-400" />}
                </button>
              );
            })}

            <button
              onClick={() => setIsCreating(true)}
              className="w-full mt-4 py-3 px-4 border border-dashed border-slate-700 hover:border-slate-500 rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition"
            >
              <UserPlus className="w-4 h-4" /> Create New Local Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Profile Name</label>
              <input
                type="text"
                placeholder="e.g. Cinephile, Sam"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Choose Avatar Emoji</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    type="button"
                    key={emoji}
                    onClick={() => setSelectedAvatar(emoji)}
                    className={`w-10 h-10 text-xl rounded-xl flex items-center justify-center border transition ${
                      selectedAvatar === emoji
                        ? 'bg-cyan-500/20 border-cyan-400 scale-105'
                        : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-xl text-sm transition"
              >
                Create Profile
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
