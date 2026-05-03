import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getOutputUrl } from '@/lib/video/render';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  let payload: {
    type: 'success' | 'error' | 'timeout';
    renderId: string;
    bucketName: string;
    outputFile?: string;
    errors?: string[];
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const { type, renderId, bucketName } = payload;

  // renderId로 video 도큐먼트 찾기
  const videosQuery = await adminDb
    .collectionGroup('videos')
    .where('renderId', '==', renderId)
    .limit(1)
    .get();

  if (videosQuery.empty) {
    return NextResponse.json({ ok: true }); // 무시
  }

  const videoDoc = videosQuery.docs[0];

  // 사용자가 중지한 영상은 덮어쓰지 않음
  if (videoDoc.data().status === 'cancelled') {
    return NextResponse.json({ ok: true });
  }

  if (type === 'success') {
    const outputUrl = payload.outputFile ?? getOutputUrl(bucketName, renderId);
    await videoDoc.ref.update({
      status: 'completed',
      outputUrl,
      updatedAt: new Date(),
    });

    // post 도큐먼트에도 outputUrl 반영
    const { postId, uid } = videoDoc.data();
    if (uid && postId) {
      await adminDb.collection('users').doc(uid).collection('posts').doc(postId).update({
        videoOutputUrl: outputUrl,
        updatedAt: new Date(),
      });
    }
  } else {
    await videoDoc.ref.update({
      status: 'failed',
      errorMessage: payload.errors?.join(', ') ?? type,
      updatedAt: new Date(),
    });
  }

  return NextResponse.json({ ok: true });
}
