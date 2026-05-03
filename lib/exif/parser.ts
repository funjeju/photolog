import exifr from 'exifr';
import type { GPS } from '@/types/post';

export type ExifData = {
  capturedAt: Date | null;
  gps: GPS | null;
  cameraInfo: { make: string; model: string } | null;
  imageSize: { width: number; height: number } | null;
};

export async function extractExif(imageUrl: string): Promise<ExifData> {
  try {
    const res = await fetch(imageUrl);
    const buffer = await res.arrayBuffer();

    const exif = await exifr.parse(Buffer.from(buffer), {
      pick: ['DateTimeOriginal', 'GPSLatitude', 'GPSLongitude', 'Make', 'Model', 'ImageWidth', 'ImageHeight'],
    });

    if (!exif) return { capturedAt: null, gps: null, cameraInfo: null, imageSize: null };

    return {
      capturedAt: exif.DateTimeOriginal ? new Date(exif.DateTimeOriginal) : null,
      gps: exif.GPSLatitude && exif.GPSLongitude
        ? { lat: exif.GPSLatitude, lng: exif.GPSLongitude }
        : null,
      cameraInfo: exif.Make ? { make: exif.Make, model: exif.Model ?? '' } : null,
      imageSize: exif.ImageWidth ? { width: exif.ImageWidth, height: exif.ImageHeight ?? 0 } : null,
    };
  } catch {
    return { capturedAt: null, gps: null, cameraInfo: null, imageSize: null };
  }
}
