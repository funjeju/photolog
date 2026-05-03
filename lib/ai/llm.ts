import { GoogleGenerativeAI } from '@google/generative-ai';
import { BLOG_PROMPT, DIARY_PROMPT } from './prompts';
import type { Cluster } from '@/lib/utils/clustering';
import type { PostMode, Scene } from '@/types/post';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

type GeneratedPost = {
  title: string;
  scenes: Scene[];
  tags: string[];
};

export async function generatePost(params: {
  mode: PostMode;
  tone: string;
  clusters: Cluster[];
  title?: string;
}): Promise<GeneratedPost> {
  const prompt =
    params.mode === 'blog'
      ? BLOG_PROMPT({ tone: params.tone, clusters: params.clusters, userTitle: params.title })
      : DIARY_PROMPT({ tone: params.tone, clusters: params.clusters, userTitle: params.title });

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  });

  async function attempt(p: string): Promise<GeneratedPost> {
    const result = await model.generateContent(p);
    const text = result.response.text();
    return JSON.parse(text) as GeneratedPost;
  }

  try {
    return await attempt(prompt);
  } catch {
    // 1회 재시도
    return await attempt(prompt + '\n\n*반드시 JSON만 출력. 코드블록 사용 금지.*');
  }
}
