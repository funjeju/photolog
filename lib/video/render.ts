import type { VideoProps, VideoFormat } from '@/remotion/types';

const COMPOSITION_ID: Record<VideoFormat, string> = {
  '9:16': 'PhotoLogVideo',
  '16:9': 'PhotoLogVideo169',
  '1:1':  'PhotoLogVideo11',
};

export type RenderResult = {
  renderId: string;
  bucketName: string;
};

export async function renderVideoOnLambda(props: VideoProps, webhookUrl?: string): Promise<RenderResult> {
  const { renderMediaOnLambda } = await import('@remotion/lambda/client');

  const region = process.env.REMOTION_AWS_REGION as 'ap-northeast-2';
  const functionName = process.env.REMOTION_LAMBDA_FUNCTION_NAME!;
  const siteName = process.env.REMOTION_SITE_NAME!;
  const bucketName = process.env.REMOTION_S3_BUCKET!;

  const serveUrl = `https://${bucketName}.s3.${region}.amazonaws.com/sites/${siteName}/index.html`;
  const compositionId = COMPOSITION_ID[props.format];

  const { renderId } = await renderMediaOnLambda({
    region,
    functionName,
    serveUrl,
    composition: compositionId,
    inputProps: props,
    codec: 'h264',
    imageFormat: 'jpeg',
    framesPerLambda: 300,
    maxRetries: 1,
    privacy: 'public',
    outName: `render_${Date.now()}.mp4`,
    webhook: webhookUrl ? { url: webhookUrl, secret: null } : undefined,
  });

  return { renderId, bucketName };
}

export function getOutputUrl(bucketName: string, renderId: string): string {
  const region = process.env.REMOTION_AWS_REGION ?? 'ap-northeast-2';
  return `https://s3.${region}.amazonaws.com/${bucketName}/renders/${renderId}/render_${renderId}.mp4`;
}
