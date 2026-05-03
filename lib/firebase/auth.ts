import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import { auth, googleProvider, db } from './client';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  await ensureUserDocument(result.user, 'google');
  return result.user;
}

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(result.user);
  await ensureUserDocument(result.user, 'email', displayName);
  return result.user;
}

export async function signInWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

async function ensureUserDocument(user: User, provider: 'google' | 'email', displayName?: string) {
  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.displayName || user.email?.split('@')[0],
      photoURL: user.photoURL || null,
      provider,
      createdAt: serverTimestamp(),
      plan: 'free',
      usage: {
        blogPostsThisMonth: 0,
        diaryEntriesThisMonth: 0,
        videosThisMonth: 0,
        monthResetAt: serverTimestamp(),
      },
    });
  }
}
