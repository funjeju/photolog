import { GoogleGenerativeAI } from '@google/generative-ai';
import { VISION_PROMPT } from './prompts';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export type VisionResult = {
  description: string;
  mood: string;
  category: string;
  details: {
    subjects: string[];
    colors: string[];
    lighting: string;
  };
};

async function fetchImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

export async function describeImage(imageUrl: string): Promise<VisionResult | null> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });

    const imageData = await fetchImageAsBase64(imageUrl);

    const result = await model.generateContent([
      VISION_PROMPT,
      { inlineData: { mimeType: 'image/jpeg', data: imageData } },
    ]);

    return JSON.parse(result.response.text()) as VisionResult;
  } catch {
    return null;
  }
}
