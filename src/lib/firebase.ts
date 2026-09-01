import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import type { JournalEntry, WeeklyReflection } from '../types';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || firebaseConfigData?.apiKey,
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData?.authDomain,
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || firebaseConfigData?.projectId,
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData?.storageBucket,
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData?.messagingSenderId,
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || firebaseConfigData?.appId,
};

// Initialize Firebase safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Use specified custom database ID if present, otherwise default
export const db = firebaseConfigData.firestoreDatabaseId && firebaseConfigData.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Strips all undefined properties recursively from an object before Firestore write
 * to prevent serialization errors and ensure high database reliability.
 */
export function sanitizeFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeFirestoreData(item)) as unknown as T;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeFirestoreData(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    // Provide human-friendly error messages
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in cancelled. Please complete the Google sign-in prompt.');
    }
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked by browser. Please allow popups for this site.');
    }
    throw new Error(error.message || 'Failed to authenticate with Google.');
  }
}

/**
 * Sign out current user
 */
export async function logOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const rawMsg = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: rawMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));

  if (rawMsg.includes('permission-denied') || rawMsg.includes('Missing or insufficient permissions')) {
    throw new Error('Permission denied: You do not have permission to access or modify this resource.');
  }
  if (rawMsg.includes('unavailable') || rawMsg.includes('offline')) {
    throw new Error('Network error: Unable to connect to Cloud Firestore. Please check your internet connection.');
  }
  if (rawMsg.includes('quota') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
    throw new Error('Firestore usage quota reached. Please wait a moment and retry.');
  }

  throw new Error(rawMsg || 'An unexpected database error occurred.');
}

/**
 * Save or Update Journal Entry in Firestore
 * Enforces user isolation under /users/{userId}/entries/{entryId}
 */
export async function saveJournalEntry(entry: JournalEntry): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Unauthorized: You must be logged in to save journal entries.');
  }
  if (auth.currentUser.uid !== entry.userId) {
    throw new Error('Security Violation: Cannot write data to another user account.');
  }

  const path = `users/${entry.userId}/entries/${entry.id}`;
  try {
    const entryRef = doc(db, 'users', entry.userId, 'entries', entry.id);
    const sanitized = sanitizeFirestoreData({
      ...entry,
      updatedAt: Date.now()
    });

    await setDoc(entryRef, sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch all journal entries for the authenticated user
 */
export async function fetchUserJournalEntries(userId: string): Promise<JournalEntry[]> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error('Unauthorized: Cannot access journal entries for another user.');
  }

  const path = `users/${userId}/entries`;
  try {
    const entriesRef = collection(db, 'users', userId, 'entries');
    const q = query(entriesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const entries: JournalEntry[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as JournalEntry;
      entries.push({
        ...data,
        id: docSnap.id
      });
    });

    return entries;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Fetch a single journal entry by ID
 */
export async function fetchEntryById(userId: string, entryId: string): Promise<JournalEntry | null> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error('Unauthorized: Cannot access entry.');
  }

  const path = `users/${userId}/entries/${entryId}`;
  try {
    const entryRef = doc(db, 'users', userId, 'entries', entryId);
    const snap = await getDoc(entryRef);
    if (!snap.exists()) {
      return null;
    }
    return { ...snap.data(), id: snap.id } as JournalEntry;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Delete a journal entry
 */
export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error('Unauthorized: Cannot delete entry.');
  }
  const path = `users/${userId}/entries/${entryId}`;
  try {
    const entryRef = doc(db, 'users', userId, 'entries', entryId);
    await deleteDoc(entryRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save Weekly Reflection
 */
export async function saveWeeklyReflection(reflection: WeeklyReflection): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== reflection.userId) {
    throw new Error('Unauthorized: Cannot save reflection for another user.');
  }
  const path = `users/${reflection.userId}/weeklyReflections/${reflection.id}`;
  try {
    const refDoc = doc(db, 'users', reflection.userId, 'weeklyReflections', reflection.id);
    const sanitized = sanitizeFirestoreData(reflection);
    await setDoc(refDoc, sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch Weekly Reflections for user
 */
export async function fetchUserWeeklyReflections(userId: string): Promise<WeeklyReflection[]> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error('Unauthorized: Cannot access reflections.');
  }
  const path = `users/${userId}/weeklyReflections`;
  try {
    const refColl = collection(db, 'users', userId, 'weeklyReflections');
    const q = query(refColl, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const reflections: WeeklyReflection[] = [];
    snapshot.forEach(docSnap => {
      reflections.push({ ...docSnap.data(), id: docSnap.id } as WeeklyReflection);
    });
    return reflections;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
