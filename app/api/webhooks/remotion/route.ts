import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getOutputUrl } from '@/lib/video/render';
import crypto from 'crypto';

function verifyWebhookSignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac('sha512', secret).update(body).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const secret = process.env.REMOTION_WEBHOOK_SECRET;

  if (secret) {
    const sig = request.headers.get('x-remotion-signature');
    if (!verifyWebhookSignature(rawBody, sig, secret)) {
      return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
    }
  }

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
