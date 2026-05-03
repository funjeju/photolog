import { adminStorage } from '@/lib/firebase/admin';
import { generateSpeech, type TtsVoice } from '@/lib/ai/tts';

export async function generateAndUploadTts(
  scenes: Array<{ id: number; narration: string }>,
  uid: string,
  postId: string,
  voice: TtsVoice = 'Kore',
): Promise<string[]> {
  const results: string[] = [];
  for (const scene of scenes) {
    try {
      const tts = await generateSpeech(scene.narration, voice);
      if (!tts) { results.push(''); continue; }

      const wavBuffer = Buffer.from(tts.audioBase64, 'base64');
      const path = `users/${uid}/posts/${postId}/tts/scene_${scene.id}.wav`;
      const bucket = adminStorage.bucket();
      const file = bucket.file(path);

      await file.save(wavBuffer, { metadata: { contentType: 'audio/wav' } });

      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000,
      });
      results.push(url);
    } catch {
      results.push('');
    }
  }

  return results;
}
