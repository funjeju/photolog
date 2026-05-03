import type { ExifData } from '@/lib/exif/parser';
import type { GeoLocation } from '@/lib/maps/kakao';
import type { OcrResult } from '@/lib/ocr/clova';
import type { VisionResult } from '@/lib/ai/gemini-vision';
import type { GPS } from '@/types/post';

export type PhotoData = {
  url: string;
  photoId: string;
  exif: ExifData;
  location: GeoLocation | null;
  ocr: OcrResult | null;
  vision: VisionResult | null;
};

export type Cluster = {
  photos: PhotoData[];
  timeRange: { start: string; end: string };
  address: string | null;
  placeName: string | null;
};

function haversineDistance(a: GPS, b: GPS): number {
  const R = 6371000;
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;

  const x =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

export function clusterByLocation(photos: PhotoData[], radiusMeters = 50): Cluster[] {
  const sorted = [...photos].sort(
    (a, b) => (a.exif.capturedAt?.getTime() ?? 0) - (b.exif.capturedAt?.getTime() ?? 0)
  );

  const groups: PhotoData[][] = [];
  let current: PhotoData[] = [];

  for (const photo of sorted) {
    if (current.length === 0) {
      current.push(photo);
      continue;
    }

    const last = current[current.length - 1];
    const timeDiff =
      (photo.exif.capturedAt?.getTime() ?? 0) - (last.exif.capturedAt?.getTime() ?? 0);

    if (photo.exif.gps && last.exif.gps) {
      const dist = haversineDistance(photo.exif.gps, last.exif.gps);
      if (dist < radiusMeters && timeDiff < 30 * 60 * 1000) {
        current.push(photo);
      } else {
        groups.push(current);
        current = [photo];
      }
    } else {
      if (timeDiff < 15 * 60 * 1000) {
        current.push(photo);
      } else {
        groups.push(current);
        current = [photo];
      }
    }
  }
  if (current.length > 0) groups.push(current);

  return groups.map((group) => {
    const first = group[0];
    const last = group[group.length - 1];
    const locationSource = group.find((p) => p.location)?.location ?? null;
    return {
      photos: group,
      timeRange: {
        start: first.exif.capturedAt?.toLocaleString('ko-KR') ?? '',
        end: last.exif.capturedAt?.toLocaleString('ko-KR') ?? '',
      },
      address: locationSource?.address ?? null,
      placeName: locationSource?.placeName ?? null,
    };
  });
}
