import { UserMediaRecord, UserProfile, MediaItem, MediaStatus, RatingTier, SeasonStatus } from '@/types/media';
import demoTestRecords from '@/lib/demo-test-records.json';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { doc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';

const USERS_KEY = 'cinetrack_users_v1';
const CURRENT_USER_KEY = 'cinetrack_current_user_v1';
const MEDIA_RECORDS_PREFIX = 'cinetrack_records_v1_';
const COMPARED_PAIRS_PREFIX = 'cinetrack_compared_v1_';

const DEFAULT_USERS: UserProfile[] = [
  { id: 'user_test_critic', name: 'Film Critic Pro (200 Watched)', avatarUrl: '🎬', createdAt: new Date().toISOString() },
  { id: 'user_default', name: 'Demo Movie Buff', avatarUrl: '🍿', createdAt: new Date().toISOString() },
  { id: 'user_alex', name: 'Alex', avatarUrl: '🎥', createdAt: new Date().toISOString() },
];

export class StorageService {
  // --- User Profile Management ---
  public static getUsers(): UserProfile[] {
    if (typeof window === 'undefined') return DEFAULT_USERS;
    try {
      const data = localStorage.getItem(USERS_KEY);
      if (!data) {
        localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
      }
      const stored: UserProfile[] = JSON.parse(data);
      const existingIds = new Set(stored.map((u) => u.id));
      let updated = false;

      DEFAULT_USERS.forEach((defUser) => {
        if (!existingIds.has(defUser.id)) {
          stored.unshift(defUser);
          updated = true;
        }
      });

      if (updated) {
        localStorage.setItem(USERS_KEY, JSON.stringify(stored));
      }
      return stored;
    } catch {
      return DEFAULT_USERS;
    }
  }

  public static getCurrentUser(): UserProfile {
    if (typeof window === 'undefined') return DEFAULT_USERS[0];
    try {
      const currentId = localStorage.getItem(CURRENT_USER_KEY);
      const users = this.getUsers();
      const found = users.find((u) => u.id === currentId);
      if (found) return found;

      // Check if currentId is a Cloud Auth UID
      if (currentId && currentId.length > 10) {
        return {
          id: currentId,
          name: 'Cloud Member',
          avatarUrl: '☁️',
          createdAt: new Date().toISOString(),
        };
      }

      const first = users[0] || DEFAULT_USERS[0];
      localStorage.setItem(CURRENT_USER_KEY, first.id);
      return first;
    } catch {
      return DEFAULT_USERS[0];
    }
  }

  public static setCurrentUser(userId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CURRENT_USER_KEY, userId);
    window.dispatchEvent(new CustomEvent('cinetrack_user_changed', { detail: userId }));
    
    // Automatically trigger cloud fetch if cloud user
    if (isFirebaseConfigured && userId && !userId.startsWith('user_')) {
      this.syncFromCloud(userId);
    }
  }

  public static createUserProfile(name: string, avatarUrl: string = '👤'): UserProfile {
    const users = this.getUsers();
    const newId = `user_${Date.now()}`;
    const newUser: UserProfile = {
      id: newId,
      name: name.trim() || 'New User',
      avatarUrl,
      createdAt: new Date().toISOString(),
    };
    const updated = [...users, newUser];
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));
    this.setCurrentUser(newId);
    return newUser;
  }

  // --- Scoped User Media Records ---
  private static getRecordsKey(userId?: string): string {
    const activeId = userId || this.getCurrentUser().id;
    return `${MEDIA_RECORDS_PREFIX}${activeId}`;
  }

  public static getUserRecords(userId?: string): UserMediaRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const activeId = userId || this.getCurrentUser().id;
      const key = `${MEDIA_RECORDS_PREFIX}${activeId}`;
      const raw = localStorage.getItem(key);
      let records: UserMediaRecord[] = [];

      if (!raw) {
        if (activeId === 'user_test_critic' || activeId === 'user_default') {
          records = demoTestRecords as unknown as UserMediaRecord[];
          localStorage.setItem(key, JSON.stringify(records));
        } else {
          return [];
        }
      } else {
        records = JSON.parse(raw);
      }

      // Sort watched items safely by rankIndex then Elo
      return records.sort((a, b) => {
        const rankA = typeof a.rankIndex === 'number' ? a.rankIndex : Number.MAX_SAFE_INTEGER;
        const rankB = typeof b.rankIndex === 'number' ? b.rankIndex : Number.MAX_SAFE_INTEGER;
        if (rankA !== rankB) return rankA - rankB;
        return (b.eloRating || 1000) - (a.eloRating || 1000);
      });
    } catch {
      return [];
    }
  }

  public static getRecordByMediaId(tmdbId: number, mediaType: 'movie' | 'tv', userId?: string): UserMediaRecord | null {
    const records = this.getUserRecords(userId);
    const id = `${mediaType}_${tmdbId}`;
    return records.find((r) => r.id === id) || null;
  }

  public static getRecord(tmdbId: number, mediaType: 'movie' | 'tv', userId?: string): UserMediaRecord | null {
    return this.getRecordByMediaId(tmdbId, mediaType, userId);
  }

  public static saveRecord(
    item: MediaItem,
    status: MediaStatus,
    ratingTier: RatingTier = 2,
    userId?: string,
    seasonsProgress?: Record<number, SeasonStatus>
  ): UserMediaRecord {
    const activeUserId = userId || this.getCurrentUser().id;
    const records = this.getUserRecords(activeUserId);
    const id = `${item.mediaType}_${item.tmdbId}`;
    const existingIndex = records.findIndex((r) => r.id === id);

    const now = new Date().toISOString();
    let record: UserMediaRecord;

    if (existingIndex >= 0) {
      record = {
        ...records[existingIndex],
        item,
        status,
        ratingTier: status === 'watched' ? ratingTier : records[existingIndex].ratingTier,
        seasonsProgress: seasonsProgress !== undefined ? seasonsProgress : records[existingIndex].seasonsProgress,
        updatedAt: now,
        watchedAt: status === 'watched' ? records[existingIndex].watchedAt || now : undefined,
      };
      records[existingIndex] = record;
    } else {
      const maxRank = records.reduce((max, r) => Math.max(max, r.rankIndex || 0), 0);
      record = {
        id,
        userId: activeUserId,
        item,
        status,
        ratingTier: status === 'watched' ? ratingTier : 2,
        eloRating: 1000,
        rankIndex: maxRank + 1,
        seasonsProgress,
        createdAt: now,
        updatedAt: now,
        watchedAt: status === 'watched' ? now : undefined,
      };
      records.push(record);
    }

    this.persistRecords(records, activeUserId);
    this.syncRecordToCloud(record, activeUserId);
    return record;
  }

  public static updateRatingTier(tmdbId: number, mediaType: 'movie' | 'tv', ratingTier: RatingTier): void {
    const records = this.getUserRecords();
    const id = `${mediaType}_${tmdbId}`;
    const record = records.find((r) => r.id === id);
    if (!record) return;

    record.ratingTier = ratingTier;
    record.updatedAt = new Date().toISOString();
    this.persistRecords(records);
    this.syncRecordToCloud(record, record.userId);
  }

  public static removeRecord(tmdbId: number, mediaType: 'movie' | 'tv'): void {
    const activeUserId = this.getCurrentUser().id;
    const records = this.getUserRecords(activeUserId);
    const id = `${mediaType}_${tmdbId}`;
    const filtered = records.filter((r) => r.id !== id);
    this.persistRecords(filtered, activeUserId);
    this.removeRecordFromCloud(id, activeUserId);
  }

  public static updateRecordsList(updatedRecords: UserMediaRecord[], userId?: string): void {
    const activeUserId = userId || this.getCurrentUser().id;
    this.persistRecords(updatedRecords, activeUserId);
    updatedRecords.forEach((r) => this.syncRecordToCloud(r, activeUserId));
  }

  private static persistRecords(records: UserMediaRecord[], userId?: string): void {
    if (typeof window === 'undefined') return;
    const key = this.getRecordsKey(userId);
    localStorage.setItem(key, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent('cinetrack_records_updated'));
  }

  // --- Cloud Firestore Persistence & Synchronization ---
  public static async syncRecordToCloud(record: UserMediaRecord, userId: string): Promise<void> {
    if (!isFirebaseConfigured || !userId || userId.startsWith('user_')) return;
    try {
      const docRef = doc(db, 'users', userId, 'records', record.id);
      await setDoc(docRef, record, { merge: true });
    } catch (err) {
      console.warn('Firestore Sync Record Error:', err);
    }
  }

  public static async removeRecordFromCloud(recordId: string, userId: string): Promise<void> {
    if (!isFirebaseConfigured || !userId || userId.startsWith('user_')) return;
    try {
      const docRef = doc(db, 'users', userId, 'records', recordId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore Delete Record Error:', err);
    }
  }

  public static async syncFromCloud(userId: string): Promise<UserMediaRecord[]> {
    if (!isFirebaseConfigured || !userId || userId.startsWith('user_')) return [];
    try {
      const colRef = collection(db, 'users', userId, 'records');
      const snapshot = await getDocs(colRef);
      const cloudRecords: UserMediaRecord[] = [];
      snapshot.forEach((d) => {
        cloudRecords.push(d.data() as UserMediaRecord);
      });

      if (cloudRecords.length > 0) {
        this.persistRecords(cloudRecords, userId);
      }
      return cloudRecords;
    } catch (err) {
      console.warn('Firestore Fetch Records Error:', err);
      return [];
    }
  }

  // --- No Repeat Matchup History Tracking ---
  private static getComparedPairsKey(userId?: string): string {
    const activeId = userId || this.getCurrentUser().id;
    return `${COMPARED_PAIRS_PREFIX}${activeId}`;
  }

  public static getComparedPairs(userId?: string): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem(this.getComparedPairsKey(userId));
      if (!raw) return new Set();
      return new Set(JSON.parse(raw));
    } catch {
      return new Set();
    }
  }

  public static recordComparedPair(idA: string, idB: string, userId?: string): void {
    if (typeof window === 'undefined') return;
    const key = this.getComparedPairsKey(userId);
    const set = this.getComparedPairs(userId);
    const pairKey = [idA, idB].sort().join('::');
    set.add(pairKey);
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  }

  public static resetComparedPairs(userId?: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.getComparedPairsKey(userId));
  }
}
