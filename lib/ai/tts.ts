const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export type TtsVoice =
  | 'Kore'   // 차분한 한국어 여성
  | 'Charon' // 중후한 남성
  | 'Fenrir' // 활기찬 남성
  | 'Aoede'  // 부드러운 여성
  | 'Puck';  // 밝은 중성

export type TtsResult = {
  audioBase64: string; // 24kHz 16-bit mono PCM, base64
  mimeType: 'audio/wav';
};

export async function generateSpeech(
  text: string,
  voice: TtsVoice = 'Kore',
): Promise<TtsResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `${API_BASE}/models/${TTS_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text }], role: 'user' }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice },
              },
            },
          },
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      console.error('[TTS] API error:', res.status, err);
      return null;
    }

    const data = await res.json();
    const inlineData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inlineData?.data) return null;

    // API는 raw PCM(L16, 24kHz mono)을 반환하므로 WAV 헤더를 붙여줌
    const pcmBase64: string = inlineData.data;
    const wavBase64 = pcmToWav(pcmBase64);

    return { audioBase64: wavBase64, mimeType: 'audio/wav' };
  } catch (e) {
    console.error('[TTS] generateSpeech error:', e);
    return null;
  }
}

// raw PCM(L16 24kHz mono) → WAV (base64)
function pcmToWav(pcmBase64: string): string {
  const pcm = Buffer.from(pcmBase64, 'base64');
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);           // PCM chunk size
  header.writeUInt16LE(1, 20);            // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcm]).toString('base64');
}
