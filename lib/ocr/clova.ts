import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export type OcrResult = {
  text: string;
  items: Array<{ text: string; confidence: number }>;
};

const OCR_PROMPT = `이 이미지에서 보이는 모든 텍스트를 정확히 추출해줘.
간판, 메뉴판, 영수증, 표지판, 라벨 등 어떤 형태든 포함해.
JSON 형식으로만 응답해: { "lines": ["텍스트1", "텍스트2", ...] }
텍스트가 없으면: { "lines": [] }`;

async function fetchImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

export async function extractOCR(imageUrl: string): Promise<OcrResult | null> {
  if (!process.env.GEMINI_API_KEY) return null;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const imageData = await fetchImageAsBase64(imageUrl);
    const result = await model.generateContent([
      OCR_PROMPT,
      { inlineData: { mimeType: 'image/jpeg', data: imageData } },
    ]);

    const parsed = JSON.parse(result.response.text()) as { lines: string[] };
    const lines: string[] = parsed.lines ?? [];

    const items = lines.map((t) => ({ text: t, confidence: 0.95 }));
    const text = lines.join(' ');

    return { text, items };
  } catch {
    return null;
  }
}
