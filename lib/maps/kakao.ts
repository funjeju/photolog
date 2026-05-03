import type { GPS } from '@/types/post';

export type GeoLocation = {
  address: string;
  placeName: string;
  lat: number;
  lng: number;
};

export async function reverseGeocode(gps: GPS): Promise<GeoLocation | null> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${gps.lng}&y=${gps.lat}&input_coord=WGS84`,
      { headers: { Authorization: `KakaoAK ${key}` } }
    );

    if (!res.ok) return null;
    const data = await res.json();

    const doc = data.documents?.[0];
    if (!doc) return null;

    const address =
      doc.road_address?.address_name ||
      doc.address?.address_name ||
      '';

    // 주변 장소명 검색
    const placeRes = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?x=${gps.lng}&y=${gps.lat}&radius=50&size=1`,
      { headers: { Authorization: `KakaoAK ${key}` } }
    );

    let placeName = '';
    if (placeRes.ok) {
      const placeData = await placeRes.json();
      placeName = placeData.documents?.[0]?.place_name ?? '';
    }

    return { address, placeName, lat: gps.lat, lng: gps.lng };
  } catch {
    return null;
  }
}
