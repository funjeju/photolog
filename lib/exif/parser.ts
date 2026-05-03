import exifr from 'exifr';
import type { GPS } from '@/types/post';

export type ExifData = {
  capturedAt: Date | null;
  gps: GPS | null;
  cameraInfo: { make: string; model: string } | null;
  imageSize: { width: number; height: number } | null;
};

function dmsToDecimal(val: number | number[] | undefined | null): number | null {
  if (val == null) return null;
  if (typeof val === 'number') return val;
  if (Array.isArray(val) && val.length >= 3) return val[0] + val[1] / 60 + val[2] / 3600;
  return null;
}

export async function extractExif(imageUrl: string): Promise<ExifData> {
  try {
    const res = await fetch(imageUrl);
    const buffer = await res.arrayBuffer();

    const exif = await exifr.parse(Buffer.from(buffer), {
      pick: ['DateTimeOriginal', 'GPSLatitude', 'GPSLongitude', 'Make', 'Model', 'ImageWidth', 'ImageHeight'],
    });

    if (!exif) return { capturedAt: null, gps: null, cameraInfo: null, imageSize: null };

    const lat = dmsToDecimal(exif.GPSLatitude);
    const lng = dmsToDecimal(exif.GPSLongitude);

    return {
      capturedAt: exif.DateTimeOriginal ? new Date(exif.DateTimeOriginal) : null,
      gps: lat !== null && lng !== null ? { lat, lng } : null,
      cameraInfo: exif.Make ? { make: exif.Make, model: exif.Model ?? '' } : null,
      imageSize: exif.ImageWidth ? { width: exif.ImageWidth, height: exif.ImageHeight ?? 0 } : null,
    };
  } catch {
    return { capturedAt: null, gps: null, cameraInfo: null, imageSize: null };
  }
}
