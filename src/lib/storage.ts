import { UserMediaRecord, UserProfile, MediaItem, MediaStatus, RatingTier, SeasonStatus } from '@/types/media';
import demoTestRecords from '@/lib/demo-test-records.json';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { doc, setDoc, getDocs, collection, deleteDoc, onSnapshot, writeBatch, Unsubscribe } from 'firebase/firestore';

const USERS_KEY = 'cinetrack_users_v1';
const CURRENT_USER_KEY = 'cinetrack_current_user_v1';
const MEDIA_RECORDS_PREFIX = 'cinetrack_records_v1_';
const COMPARED_PAIRS_PREFIX = 'cinetrack_compared_v1_';

const DEFAULT_USERS: UserProfile[] = [
  { id: 'user_default', name: 'My Media List', avatarUrl: '🍿', createdAt: new Date().toISOString() },
];

export class StorageService {
  private static unsubscribeCloudListener: Unsubscribe | null = null;

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
      if (stored.length === 0) return DEFAULT_USERS;
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
    
    // Automatically trigger cloud fetch & live real-time subscription if cloud user
    if (isFirebaseConfigured && userId && !userId.startsWith('user_')) {
      this.subscribeToCloudSync(userId);
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

      if (!raw) {
        return [];
      }
      const records: UserMediaRecord[] = JSON.parse(raw);

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

  // Developer / Demo Mode Helper: Load 200 sample critic movies on demand
  public static loadDemoCriticRecords(userId?: string): UserMediaRecord[] {
    const activeUserId = userId || this.getCurrentUser().id;
    const sampleRecords = demoTestRecords as unknown as UserMediaRecord[];
    const updated = sampleRecords.map((r) => ({
      ...r,
      userId: activeUserId,
    }));
    this.persistRecords(updated, activeUserId);
    updated.forEach((r) => this.syncRecordToCloud(r, activeUserId));
    return updated;
  }

  // Developer Mode Helper: Clear all saved records for current user locally & from Cloud Firestore
  public static async clearAllRecords(userId?: string): Promise<void> {
    const activeUserId = userId || this.getCurrentUser().id;

    if (typeof window !== 'undefined') {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(MEDIA_RECORDS_PREFIX)) {
          localStorage.removeItem(k);
        }
      }
      this.persistRecords([], activeUserId);
      window.dispatchEvent(new CustomEvent('cinetrack_records_updated'));
    }

    if (isFirebaseConfigured && activeUserId && !activeUserId.startsWith('user_')) {
      try {
        const colRef = collection(db, 'users', activeUserId, 'records');
        const snapshot = await getDocs(colRef);
        
        if (!snapshot.empty) {
          const batch = writeBatch(db);
          snapshot.forEach((docSnap) => {
            batch.delete(docSnap.ref);
          });
          await batch.commit();
        }

        if (typeof window !== 'undefined') {
          this.persistRecords([], activeUserId);
          window.dispatchEvent(new CustomEvent('cinetrack_records_updated'));
        }
      } catch (err) {
        console.warn('Firestore Clear All Records Error:', err);
      }
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

  // --- Cloud Firestore Persistence & Real-Time Synchronization ---
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

  public static subscribeToCloudSync(userId: string): void {
    if (!isFirebaseConfigured || !userId || userId.startsWith('user_')) return;

    if (this.unsubscribeCloudListener) {
      this.unsubscribeCloudListener();
      this.unsubscribeCloudListener = null;
    }

    // Perform initial fetch & merge
    this.syncFromCloud(userId);

    // Subscribe to live Firestore changes across tabs and devices
    try {
      const colRef = collection(db, 'users', userId, 'records');
      this.unsubscribeCloudListener = onSnapshot(
        colRef,
        (snapshot) => {
          const cloudRecords: UserMediaRecord[] = [];
          snapshot.forEach((d) => {
            cloudRecords.push(d.data() as UserMediaRecord);
          });

          // Always persist cloud state (even if empty) so wipe/deletions sync live
          this.persistRecords(cloudRecords, userId);
        },
        (err) => {
          console.warn('Firestore Real-Time Listener Error:', err);
        }
      );
    } catch (err) {
      console.warn('Failed to attach Firestore Real-Time Listener:', err);
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

      // Gather ALL local records stored across any local keys
      const allLocalRecords: UserMediaRecord[] = [];
      if (typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(MEDIA_RECORDS_PREFIX)) {
            try {
              const raw = localStorage.getItem(k);
              if (raw) {
                const parsed: UserMediaRecord[] = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                  allLocalRecords.push(...parsed);
                }
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }

      const mergedMap = new Map<string, UserMediaRecord>();

      // Add cloud records first
      cloudRecords.forEach((r) => mergedMap.set(r.id, { ...r, userId }));

      // Merge any local/guest records missing in cloud and sync them immediately to Cloud Firestore
      allLocalRecords.forEach((r) => {
        const updatedRecord = { ...r, userId };
        if (!mergedMap.has(r.id)) {
          mergedMap.set(r.id, updatedRecord);
          this.syncRecordToCloud(updatedRecord, userId);
        }
      });

      const mergedList = Array.from(mergedMap.values());
      this.persistRecords(mergedList, userId);
      return mergedList;
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
