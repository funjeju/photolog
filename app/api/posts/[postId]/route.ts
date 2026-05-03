import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api/auth';
import { ApiErrors } from '@/lib/api/errors';
import { adminDb, adminStorage } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

type RouteParams = { params: { postId: string } };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { uid, error } = await verifyAuth(request);
  if (error || !uid) return ApiErrors.unauthorized();

  const postRef = adminDb.collection('users').doc(uid).collection('posts').doc(params.postId);
  const postSnap = await postRef.get();
  if (!postSnap.exists) return ApiErrors.notFound('글');

  const photosSnap = await postRef.collection('photos').orderBy('order').get();
  const photos = photosSnap.docs.map((d) => d.data());

  return NextResponse.json({ post: { postId: postSnap.id, ...postSnap.data() }, photos });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { uid, error } = await verifyAuth(request);
  if (error || !uid) return ApiErrors.unauthorized();

  const body = await request.json();
  const { title, scenes, tags } = body;

  const postRef = adminDb.collection('users').doc(uid).collection('posts').doc(params.postId);
  const postSnap = await postRef.get();
  if (!postSnap.exists) return ApiErrors.notFound('글');

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (title !== undefined) updates.title = String(title).slice(0, 200);
  if (scenes !== undefined) updates.scenes = scenes;
  if (tags !== undefined) updates.tags = tags;

  await postRef.update(updates);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { uid, error } = await verifyAuth(request);
  if (error || !uid) return ApiErrors.unauthorized();

  const postRef = adminDb.collection('users').doc(uid).collection('posts').doc(params.postId);
  const postSnap = await postRef.get();
  if (!postSnap.exists) return ApiErrors.notFound('글');

  // photos 서브컬렉션 삭제
  const photosSnap = await postRef.collection('photos').get();
  await Promise.all(photosSnap.docs.map((d) => d.ref.delete()));

  await postRef.delete();
  return NextResponse.json({ success: true });
}
