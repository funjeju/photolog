import { adminStorage } from '@/lib/firebase/admin';
import { generateSpeech, type TtsVoice } from '@/lib/ai/tts';

export async function generateAndUploadTts(
  scenes: Array<{ id: number; narration: string }>,
  uid: string,
  postId: string,
  voice: TtsVoice = 'Kore',
): Promise<string[]> {
  const results = await Promise.all(
    scenes.map(async (scene) => {
      try {
        const tts = await generateSpeech(scene.narration, voice);
        if (!tts) return '';

        const wavBuffer = Buffer.from(tts.audioBase64, 'base64');
        const path = `users/${uid}/posts/${postId}/tts/scene_${scene.id}.wav`;
        const bucket = adminStorage.bucket();
        const file = bucket.file(path);

        await file.save(wavBuffer, {
          metadata: { contentType: 'audio/wav' },
        });

        // 서명된 URL (1시간) → Lambda 렌더 시간 내 충분
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 60 * 60 * 1000,
        });

        return url;
      } catch {
        return '';
      }
    }),
  );

  return results;
}
