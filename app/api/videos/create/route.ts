import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api/auth';
import { ApiErrors } from '@/lib/api/errors';
import { adminDb } from '@/lib/firebase/admin';
import { generateAndUploadTts } from '@/lib/video/tts-upload';
import { renderVideoOnLambda } from '@/lib/video/render';

import type { VideoFormat, VideoScene } from '@/remotion/types';
import type { BgmKey } from '@/lib/video/bgm';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const { uid, error } = await verifyAuth(request);
  if (error || !uid) return ApiErrors.unauthorized();

  let body: { postId: string; bgm?: BgmKey; format?: VideoFormat; voice?: string };
  try {
    body = await request.json();
  } catch {
    return ApiErrors.badRequest('잘못된 요청 형식이에요.');
  }

  const { postId, bgm = 'a_stroll', format = '9:16', voice = 'Kore' } = body;
  if (!postId) return ApiErrors.badRequest('postId가 필요해요.');

  // 글 데이터 조회
  const postRef = adminDb.collection('users').doc(uid).collection('posts').doc(postId);
  const postSnap = await postRef.get();
  if (!postSnap.exists) return ApiErrors.notFound('글');

  const postData = postSnap.data()!;
  const rawScenes = postData.scenes as Array<{
    id: number; type: string; narration: string; subtitle: string;
    duration: number; location?: { address: string; placeName: string };
    photoIds: string[];
  }>;

  // photos 서브컬렉션에서 downloadUrl 가져오기
  const photosSnap = await postRef.collection('photos').orderBy('order').get();
  const photoMap: Record<string, string> = {};
  photosSnap.docs.forEach((d) => {
    const data = d.data();
    photoMap[data.photoId] = data.downloadUrl;
  });

  // VideoScene 변환
  const scenes: VideoScene[] = rawScenes.map((s) => ({
    id: s.id,
    type: s.type as VideoScene['type'],
    photoUrls: (s.photoIds ?? []).map((id: string) => photoMap[id]).filter(Boolean),
    narration: s.narration,
    subtitle: s.subtitle,
    duration: s.duration,
    location: s.location,
  }));

  // 사용량 체크 — 실패·취소 제외하고 이번 달 실제 활성 영상만 카운트
  const userSnap = await adminDb.collection('users').doc(uid).get();
  const userData = userSnap.data() ?? {};
  const plan = userData.plan ?? 'free';

  if (plan !== 'admin') {
    const videoLimit = plan === 'pro' ? 30 : plan === 'business' ? 100 : 3;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const activeVideosSnap = await adminDb
      .collection('users').doc(uid).collection('videos')
      .where('createdAt', '>=', startOfMonth)
      .get();

    const activeCount = activeVideosSnap.docs.filter((d) => {
      const s = d.data().status as string;
      return s !== 'failed' && s !== 'cancelled';
    }).length;

    if (activeCount >= videoLimit) return ApiErrors.usageExceeded();
  }

  // videos 도큐먼트 생성 (pending)
  const videoRef = adminDb.collection('users').doc(uid).collection('videos').doc();
  const now = new Date();
  await videoRef.set({
    videoId: videoRef.id,
    postId,
    uid,
    status: 'pending',
    bgm,
    format,
    createdAt: now,
    updatedAt: now,
  });

  // TTS 생성 + 업로드 (백그라운드에서 처리하므로 await)
  const ttsUrls = await generateAndUploadTts(
    scenes.map((s) => ({ id: s.id, narration: s.narration })),
    uid,
    postId,
    voice as Parameters<typeof generateAndUploadTts>[3],
  );

  // Lambda 렌더 시작
  try {
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/remotion?uid=${uid}&vid=${videoRef.id}`;
    const { renderId, bucketName } = await renderVideoOnLambda({ scenes, bgm, format, ttsUrls }, webhookUrl);

    await videoRef.update({
      status: 'rendering',
      renderId,
      bucketName,
      updatedAt: new Date(),
    });

    // post에 videoId 연결
    await postRef.update({ videoId: videoRef.id, updatedAt: new Date() });

    return NextResponse.json({ videoId: videoRef.id, renderId, status: 'rendering' });
  } catch (err) {
    console.error('[videos/create] Lambda render failed:', err);
    await videoRef.update({ status: 'failed', updatedAt: new Date() });
    return ApiErrors.serverError();
  }
}
