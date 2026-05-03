import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { NextRequest } from 'next/server';

export async function verifyAuth(request: NextRequest): Promise<{ uid: string | null; error: string | null }> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Unauthorized', uid: null };
  }

  const token = authHeader.substring(7);
  try {
    const decoded = await getAuth(adminApp).verifyIdToken(token);
    return { uid: decoded.uid, error: null };
  } catch {
    return { error: 'Invalid token', uid: null };
  }
}
