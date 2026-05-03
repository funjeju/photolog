import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api/auth';
import { ApiErrors } from '@/lib/api/errors';
import { adminDb } from '@/lib/firebase/admin';

const PLAN_LIMITS = {
  free:     { posts: 5,   videos: 1 },
  pro:      { posts: 999, videos: 30 },
  business: { posts: 999, videos: 100 },
};

export async function GET(request: NextRequest) {
  const { uid, error } = await verifyAuth(request);
  if (error || !uid) return ApiErrors.unauthorized();

  const userSnap = await adminDb.collection('users').doc(uid).get();
  if (!userSnap.exists) return ApiErrors.notFound('사용자');

  const data = userSnap.data()!;
  const plan = (data.plan ?? 'free') as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const usage = data.usage ?? {};

  return NextResponse.json({
    blogPostsThisMonth: usage.blogPostsThisMonth ?? 0,
    diaryEntriesThisMonth: usage.diaryEntriesThisMonth ?? 0,
    videosThisMonth: usage.videosThisMonth ?? 0,
    limits,
    resetAt: usage.monthResetAt?.toDate?.()?.toISOString() ?? null,
  });
}
