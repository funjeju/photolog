import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api/auth';
import { ApiErrors } from '@/lib/api/errors';
import { adminDb } from '@/lib/firebase/admin';
import { Query, CollectionReference } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  const { uid, error } = await verifyAuth(request);
  if (error || !uid) return ApiErrors.unauthorized();

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') ?? 'all';
  const limitParam = Math.min(Number(searchParams.get('limit') ?? 20), 50);
  const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

  let q: Query | CollectionReference = adminDb
    .collection('users')
    .doc(uid)
    .collection('posts');

  if (mode !== 'all') {
    q = q.where('mode', '==', mode);
  }

  q = q.orderBy('createdAt', order).limit(limitParam);

  const snap = await q.get();
  const posts = snap.docs.map((d) => ({ postId: d.id, ...d.data() }));

  return NextResponse.json({ posts });
}
