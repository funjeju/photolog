export type OcrResult = {
  text: string;
  items: Array<{ text: string; confidence: number }>;
};

export async function extractOCR(imageUrl: string): Promise<OcrResult | null> {
  const secret = process.env.CLOVA_OCR_SECRET;
  const invokeUrl = process.env.CLOVA_OCR_INVOKE_URL;

  if (!secret || !invokeUrl) return null;

  try {
    const body = {
      version: 'V2',
      requestId: `req_${Date.now()}`,
      timestamp: Date.now(),
      images: [{ format: 'jpg', name: 'photo', url: imageUrl }],
    };

    const res = await fetch(invokeUrl, {
      method: 'POST',
      headers: {
        'X-OCR-SECRET': secret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) return null;
    const data = await res.json();

    const fields = data.images?.[0]?.fields ?? [];
    const items = fields.map((f: { inferText: string; confidence: number }) => ({
      text: f.inferText,
      confidence: f.confidence,
    }));

    const text = items.map((i: { text: string }) => i.text).join(' ');
    return { text, items };
  } catch {
    return null;
  }
}
