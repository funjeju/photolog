import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api/auth';
import { ApiErrors } from '@/lib/api/errors';
import { adminDb } from '@/lib/firebase/admin';
import { generatePost } from '@/lib/ai/llm';
import { clusterByLocation } from '@/lib/utils/clustering';
import type { PostMode } from '@/types/post';
import type { PhotoData } from '@/lib/utils/clustering';

export const maxDuration = 120;

type RouteParams = { params: Promise<{ postId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { uid, error } = await verifyAuth(request);
  if (error || !uid) return ApiErrors.unauthorized();

  const { postId } = await params;

  let body: { mode: PostMode; tone?: string };
  try {
    body = await request.json();
  } catch {
    return ApiErrors.badRequest('잘못된 요청 형식이에요.');
  }

  const { mode, tone } = body;
  if (!mode) return ApiErrors.badRequest('mode가 필요해요.');

  const postRef = adminDb.collection('users').doc(uid).collection('posts').doc(postId);
  const postSnap = await postRef.get();
  if (!postSnap.exists) return ApiErrors.notFound('글');

  const postData = postSnap.data()!;

  // photos 서브컬렉션에서 저장된 분석 데이터 복원
  const photosSnap = await postRef.collection('photos').orderBy('order').get();

  const photoDataList: PhotoData[] = photosSnap.docs.map((d) => {
    const p = d.data();
    return {
      url: p.downloadUrl,
      photoId: p.photoId,
      exif: {
        capturedAt: p.capturedAt?.toDate?.() ?? null,
        gps: p.gps ?? null,
        cameraInfo: null,
        imageSize: null,
      },
      location: p.address
        ? {
            address: p.address,
            placeName: p.placeName ?? '',
            lat: p.gps?.lat ?? 0,
            lng: p.gps?.lng ?? 0,
          }
        : null,
      ocr: p.ocrText ? { text: p.ocrText, items: [] } : null,
      vision: p.visionDescription
        ? {
            description: p.visionDescription,
            mood: p.visualMood ?? 'calm',
            category: 'view',
            details: { subjects: [], colors: [], lighting: 'natural_soft' },
          }
        : null,
    };
  });

  const clusters = clusterByLocation(photoDataList, 300);
  const effectiveTone = tone ?? (mode === 'blog' ? '정보형' : '기본');

  const generated = await generatePost({ mode, tone: effectiveTone, clusters });

  await postRef.update({
    mode,
    title: generated.title,
    metaDescription: generated.metaDescription ?? null,
    slug: generated.slug ?? null,
    scenes: generated.scenes,
    tags: generated.tags ?? [],
    generationOptions: { tone: effectiveTone, titleSource: 'auto' },
    updatedAt: new Date(),
  });

  return NextResponse.json({ postId, mode, title: generated.title });
}
