import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

const googleProvider = new GoogleAuthProvider();
const profileSyncInFlight = new Map<string, Promise<void>>();
const profileSyncedUids = new Set<string>();

export async function signInWithGoogle(): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider);
  await ensureUserProfile(credential.user);
  return credential.user;
}

export async function signOutObservatory(): Promise<void> {
  profileSyncedUids.clear();
  profileSyncInFlight.clear();
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, async user => {
    if (user) {
      try {
        await ensureUserProfile(user);
      } catch (e) {
        console.warn('User profile sync note:', e);
      }
    } else {
      profileSyncedUids.clear();
    }
    callback(user);
  });
}

export async function ensureUserProfile(user: User): Promise<void> {
  if (!user?.uid) return;
  if (profileSyncedUids.has(user.uid)) return;

  const existingPromise = profileSyncInFlight.get(user.uid);
  if (existingPromise) {
    return existingPromise;
  }

  const syncTask = (async () => {
    const path = `users/${user.uid}`;
    const userRef = doc(db, 'users', user.uid);

    let exists = false;
    try {
      const existing = await getDoc(userRef);
      exists = existing.exists();
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }

    if (!exists) {
      try {
        await setDoc(userRef, {
          uid: user.uid.slice(0, 128),
          email: (user.email?.trim() || 'researcher@observatory.org').slice(0, 254),
          displayName: (user.displayName?.trim() || 'Cosmic Researcher').slice(0, 120),
          photoURL: (user.photoURL?.trim() || '').slice(0, 1024),
          role: 'researcher',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }

    profileSyncedUids.add(user.uid);
  })();

  profileSyncInFlight.set(user.uid, syncTask);
  try {
    await syncTask;
  } finally {
    profileSyncInFlight.delete(user.uid);
  }
}

export interface StoredDiscovery {
  id: string;
  ownerId: string;
  ownerName: string;
  label: string;
  scaleRegime: string;
  clusterId: string;
  coordinatesRaDec: string;
  distanceLabel: string;
  biosignatureNotes: string;
  pubchemCid?: number;
  uniprotId?: string;
  pdbId?: string;
  confidence: number;
  isPublic: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface StoredExpedition {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  clusterId: string;
  lens: string;
  notes: string;
  lyriaModel: string;
  lyriaPrompt: string;
  lyriaLyrics?: string;
  coherenceScore: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface StoredChatSession {
  id: string;
  ownerId: string;
  title: string;
  model: string;
  persona: string;
  messagesJson: string;
  messageCount: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface StoredSharedMap {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  summary: string;
  nodeCount: number;
  clusterCount: number;
  graphSnapshotJson: string;
  isPublic: boolean;
  starCount: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export async function saveCelestialDiscovery(
  payload: Omit<StoredDiscovery, 'id' | 'ownerId' | 'ownerName' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be signed in to save a celestial discovery.');
  const id = `disc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `celestialDiscoveries/${id}`;
  try {
    const docData: Record<string, unknown> = {
      ownerId: user.uid,
      ownerName: user.displayName || user.email || 'Observatory Researcher',
      label: payload.label.slice(0, 180),
      scaleRegime: payload.scaleRegime.slice(0, 80),
      clusterId: payload.clusterId.slice(0, 100),
      coordinatesRaDec: payload.coordinatesRaDec.slice(0, 120),
      distanceLabel: payload.distanceLabel.slice(0, 120),
      biosignatureNotes: payload.biosignatureNotes.slice(0, 4000),
      confidence: Math.max(0, Math.min(1, payload.confidence)),
      isPublic: Boolean(payload.isPublic),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    if (payload.pubchemCid) docData.pubchemCid = Math.round(payload.pubchemCid);
    if (payload.uniprotId) docData.uniprotId = payload.uniprotId.slice(0, 40);
    if (payload.pdbId) docData.pdbId = payload.pdbId.slice(0, 20);
    await setDoc(doc(db, 'celestialDiscoveries', id), docData);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteCelestialDiscovery(id: string): Promise<void> {
  const path = `celestialDiscoveries/${id}`;
  try {
    await deleteDoc(doc(db, 'celestialDiscoveries', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCosmicExpedition(
  payload: Omit<StoredExpedition, 'id' | 'ownerId' | 'ownerName' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be signed in to save an expedition.');
  const id = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `expeditions/${id}`;
  try {
    const docData: Record<string, unknown> = {
      ownerId: user.uid,
      ownerName: user.displayName || user.email || 'Observatory Researcher',
      title: payload.title.slice(0, 180),
      clusterId: payload.clusterId.slice(0, 100),
      lens: payload.lens.slice(0, 40),
      notes: payload.notes.slice(0, 4000),
      lyriaModel: payload.lyriaModel.slice(0, 80),
      lyriaPrompt: payload.lyriaPrompt.slice(0, 2000),
      coherenceScore: Math.max(0, Math.min(1, payload.coherenceScore)),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    if (payload.lyriaLyrics) docData.lyriaLyrics = payload.lyriaLyrics.slice(0, 6000);
    await setDoc(doc(db, 'expeditions', id), docData);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteCosmicExpedition(id: string): Promise<void> {
  const path = `expeditions/${id}`;
  try {
    await deleteDoc(doc(db, 'expeditions', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveChatSession(
  payload: Omit<StoredChatSession, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be signed in to save a chat session.');
  const id = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `chatSessions/${id}`;
  try {
    await setDoc(doc(db, 'chatSessions', id), {
      ownerId: user.uid,
      title: payload.title.slice(0, 180),
      model: payload.model.slice(0, 80),
      persona: payload.persona.slice(0, 80),
      messagesJson: payload.messagesJson.slice(0, 250000),
      messageCount: Math.round(payload.messageCount),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteChatSession(id: string): Promise<void> {
  const path = `chatSessions/${id}`;
  try {
    await deleteDoc(doc(db, 'chatSessions', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function publishSharedUniverseMap(
  payload: Omit<StoredSharedMap, 'id' | 'ownerId' | 'ownerName' | 'starCount' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be signed in to publish a universe map.');
  const id = `map_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `sharedMaps/${id}`;
  try {
    await setDoc(doc(db, 'sharedMaps', id), {
      ownerId: user.uid,
      ownerName: user.displayName || user.email || 'Observatory Researcher',
      title: payload.title.slice(0, 180),
      summary: payload.summary.slice(0, 4000),
      nodeCount: Math.round(payload.nodeCount),
      clusterCount: Math.round(payload.clusterCount),
      graphSnapshotJson: payload.graphSnapshotJson.slice(0, 500000),
      isPublic: Boolean(payload.isPublic),
      starCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function starSharedUniverseMap(mapId: string, currentStars: number): Promise<void> {
  const path = `sharedMaps/${mapId}`;
  try {
    await updateDoc(doc(db, 'sharedMaps', mapId), {
      starCount: currentStars + 1,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteSharedUniverseMap(mapId: string): Promise<void> {
  const path = `sharedMaps/${mapId}`;
  try {
    await deleteDoc(doc(db, 'sharedMaps', mapId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeUserObservatoryVault(
  uid: string,
  callbacks: {
    onDiscoveries: (items: StoredDiscovery[]) => void;
    onExpeditions: (items: StoredExpedition[]) => void;
    onChatSessions: (items: StoredChatSession[]) => void;
    onSharedMaps: (items: StoredSharedMap[]) => void;
  }
) {
  const qDisc = query(collection(db, 'celestialDiscoveries'), where('ownerId', '==', uid));
  const qExp = query(collection(db, 'expeditions'), where('ownerId', '==', uid));
  const qChat = query(collection(db, 'chatSessions'), where('ownerId', '==', uid));
  const qMaps = query(collection(db, 'sharedMaps'), where('isPublic', '==', true));

  const unsub1 = onSnapshot(
    qDisc,
    snap => {
      callbacks.onDiscoveries(
        snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<StoredDiscovery, 'id'>) }))
      );
    },
    err => handleFirestoreError(err, OperationType.LIST, 'celestialDiscoveries')
  );

  const unsub2 = onSnapshot(
    qExp,
    snap => {
      callbacks.onExpeditions(
        snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<StoredExpedition, 'id'>) }))
      );
    },
    err => handleFirestoreError(err, OperationType.LIST, 'expeditions')
  );

  const unsub3 = onSnapshot(
    qChat,
    snap => {
      callbacks.onChatSessions(
        snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<StoredChatSession, 'id'>) }))
      );
    },
    err => handleFirestoreError(err, OperationType.LIST, 'chatSessions')
  );

  const unsub4 = onSnapshot(
    qMaps,
    snap => {
      callbacks.onSharedMaps(
        snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<StoredSharedMap, 'id'>) }))
      );
    },
    err => handleFirestoreError(err, OperationType.LIST, 'sharedMaps')
  );

  return () => {
    unsub1();
    unsub2();
    unsub3();
    unsub4();
  };
}
