import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api/auth';
import { ApiErrors } from '@/lib/api/errors';
import { adminDb } from '@/lib/firebase/admin';
import { extractExif } from '@/lib/exif/parser';
import { reverseGeocode } from '@/lib/maps/kakao';
import { extractOCR } from '@/lib/ocr/clova';
import { describeImage } from '@/lib/ai/gemini-vision';
import { generatePost } from '@/lib/ai/llm';
import { clusterByLocation } from '@/lib/utils/clustering';
import { FieldValue } from 'firebase-admin/firestore';
import type { PostMode } from '@/types/post';

const PLAN_LIMITS = { free: 5, pro: 999, business: 999 };

async function checkAndIncrementUsage(uid: string, mode: PostMode): Promise<boolean> {
  const userRef = adminDb.collection('users').doc(uid);
  const user = await userRef.get();
  if (!user.exists) return false;

  const data = user.data()!;
  const plan = (data.plan ?? 'free') as keyof typeof PLAN_LIMITS;
  const limit = PLAN_LIMITS[plan] ?? 5;

  const field = mode === 'blog' ? 'usage.blogPostsThisMonth' : 'usage.diaryEntriesThisMonth';
  const current = mode === 'blog'
    ? (data.usage?.blogPostsThisMonth ?? 0)
    : (data.usage?.diaryEntriesThisMonth ?? 0);

  if (current >= limit) return false;

  await userRef.update({ [field]: FieldValue.increment(1) });
  return true;
}

export async function POST(request: NextRequest) {
  const { uid, error } = await verifyAuth(request);
  if (error || !uid) return ApiErrors.unauthorized();

  let body: { mode: PostMode; photoUrls: string[]; options: { tone: string; title?: string } };
  try {
    body = await request.json();
  } catch {
    return ApiErrors.badRequest('잘못된 요청 형식이에요.');
  }

  const { mode, photoUrls, options } = body;

  if (!photoUrls || photoUrls.length < 3) {
    return ApiErrors.badRequest('사진을 최소 3장 올려주세요.');
  }

  // 사용량 체크 및 증가
  const allowed = await checkAndIncrementUsage(uid, mode);
  if (!allowed) return ApiErrors.usageExceeded();

  try {
    // 사진별 데이터 추출 (병렬)
    const photosData = await Promise.all(
      photoUrls.map(async (url, i) => {
        const exif = await extractExif(url);
        const [location, ocr, vision] = await Promise.all([
          exif.gps ? reverseGeocode(exif.gps) : null,
          extractOCR(url),
          describeImage(url),
        ]);
        return { url, exif, location, ocr, vision, photoId: `p${i}` };
      })
    );

    // 시간순 정렬 + 위치 클러스터링
    const sorted = photosData.sort(
      (a, b) => (a.exif.capturedAt?.getTime() ?? 0) - (b.exif.capturedAt?.getTime() ?? 0)
    );
    const clusters = clusterByLocation(sorted, 50);

    // LLM 글 생성
    const generated = await generatePost({ mode, tone: options.tone, clusters, title: options.title });

    // Firestore 저장
    const postRef = adminDb.collection('users').doc(uid).collection('posts').doc();
    const now = new Date();

    const primaryLocation = clusters[0]?.photos[0]?.location?.placeName
      || clusters[0]?.photos[0]?.location?.address
      || undefined;

    await postRef.set({
      postId: postRef.id,
      userId: uid,
      mode,
      title: generated.title,
      scenes: generated.scenes,
      status: 'completed',
      totalPhotos: photoUrls.length,
      primaryLocation: primaryLocation ?? null,
      dateRange: {
        start: sorted[0]?.exif.capturedAt ?? now,
        end: sorted[sorted.length - 1]?.exif.capturedAt ?? now,
      },
      tags: generated.tags ?? [],
      generationOptions: { tone: options.tone, titleSource: options.title ? 'user' : 'auto' },
      createdAt: now,
      updatedAt: now,
    });

    // photos 서브컬렉션 저장 (병렬)
    await Promise.all(
      photosData.map((data, i) =>
        postRef.collection('photos').doc(data.photoId).set({
          photoId: data.photoId,
          postId: postRef.id,
          storagePath: data.url,
          downloadUrl: data.url,
          capturedAt: data.exif.capturedAt ?? now,
          gps: data.exif.gps ?? null,
          address: data.location?.address ?? null,
          placeName: data.location?.placeName ?? null,
          ocrText: data.ocr?.text ?? null,
          visionDescription: data.vision?.description ?? null,
          visualMood: data.vision?.mood ?? null,
          order: i,
        })
      )
    );

    return NextResponse.json({ postId: postRef.id, status: 'completed' });
  } catch (err) {
    console.error('[posts/create]', err);
    return ApiErrors.serverError();
  }
}
