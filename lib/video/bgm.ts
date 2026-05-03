export type BgmKey =
  | 'a_stroll'
  | 'floating_on_fire'
  | 'spatial_entanglement'
  | 'puppy_love'
  | 'magnolia_town'
  | 'morning_folk_song'
  | 'powdered_waltz'
  | 'to_the_end'
  | 'big_sky_elegy'
  | 'sunshine'
  | 'last_cappuccino'
  | 'classic_1985'
  | 'like_it_loud'
  | 'lawrence'
  | 'appearing_nowhere'
  | 'correle_carna'
  | 'esthers_waltz'
  | 'day_i_met_her'
  | 'the_girl'
  | 'a_single_step'
  | 'no9_esthers_waltz';

export type BgmCategory = 'lofi' | 'acoustic' | 'cinematic';

export type BgmTrack = {
  key: BgmKey;
  label: string;
  file: string;
  category: BgmCategory;
};

export const BGM_TRACKS: BgmTrack[] = [
  // ── Lo-Fi / 카페·일상 ────────────────────────────────────────────
  { key: 'a_stroll',           label: 'A Stroll',               file: 'A Stroll - The Grey Room _ Density & Time.mp3',                             category: 'lofi' },
  { key: 'floating_on_fire',   label: 'Floating On Fire',        file: 'Floating On Fire - The Grey Room _ Density & Time.mp3',                     category: 'lofi' },
  { key: 'spatial_entanglement', label: 'Spatial Entanglement',  file: 'Spatial Entaglement - The Grey Room _ Density & Time.mp3',                  category: 'lofi' },
  { key: 'sunshine',           label: 'Sunshine',                file: 'Sunshine - Telecasted.mp3',                                                 category: 'lofi' },
  { key: 'like_it_loud',       label: 'Like It Loud',            file: 'Like It Loud - Dyalla.mp3',                                                 category: 'lofi' },
  { key: 'lawrence',           label: 'Lawrence',                file: 'Lawrence - TrackTribe.mp3',                                                 category: 'lofi' },
  // ── 어쿠스틱 / 따뜻한 다이어리 ──────────────────────────────────
  { key: 'magnolia_town',      label: 'Magnolia Town',           file: 'Magnolia town - Patrick Jordan Patrikios.mp3',                              category: 'acoustic' },
  { key: 'puppy_love',         label: 'Puppy Love',              file: 'Puppy Love - Jeremy Blake.mp3',                                             category: 'acoustic' },
  { key: 'morning_folk_song',  label: 'Morning Folk Song',       file: 'No.3 Morning Folk Song - Esther Abrami.mp3',                                category: 'acoustic' },
  { key: 'powdered_waltz',     label: 'Powdered Waltz',          file: 'Powdered Waltz - The Mini Vandals.mp3',                                     category: 'acoustic' },
  { key: 'the_girl',           label: 'The Girl from Saint-Anne', file: 'The Girl from Saint-Anne-des-Plaines - The Mini Vandals.mp3',              category: 'acoustic' },
  { key: 'esthers_waltz',      label: "Esther's Waltz",          file: "No.9_Esther's Waltz - Esther Abrami.mp3",                                   category: 'acoustic' },
  { key: 'day_i_met_her',      label: 'The Day I Met Her',       file: 'No.5 The Day I Met Her - Esther Abrami.mp3',                                category: 'acoustic' },
  { key: 'last_cappuccino',    label: 'Last Cappuccino in Rio',  file: 'Last Cappuccino in Rio - Chris Haugen.mp3',                                 category: 'acoustic' },
  // ── 시네마틱 / 여행·풍경 ─────────────────────────────────────────
  { key: 'to_the_end',         label: 'To The End Of The World', file: 'To The End Of The World - National Sweetheart.mp3',                         category: 'cinematic' },
  { key: 'big_sky_elegy',      label: 'Big Sky Elegy',           file: 'Big Sky Elegy - National Sweetheart.mp3',                                   category: 'cinematic' },
  { key: 'classic_1985',       label: 'Classic 1985',            file: 'Classic 1985 Movie Soundtrack - Freedom Trail Studio.mp3',                  category: 'cinematic' },
  { key: 'appearing_nowhere',  label: 'Appearing Nowhere',       file: 'Appearing Nowhere (feat. Rusty James Miller) - Zenith Bikini.mp3',          category: 'cinematic' },
  { key: 'correle_carna',      label: 'Correle Carna',           file: 'Correle Carna - Cumbia Deli.mp3',                                           category: 'cinematic' },
  { key: 'a_single_step',      label: 'A Single Step',           file: 'A Single Step - Density & Time.mp3',                                        category: 'cinematic' },
  { key: 'no9_esthers_waltz',  label: "No.9 Esther's Waltz",     file: "No.9_Esther's Waltz - Esther Abrami.mp3",                                   category: 'cinematic' },
];

export const BGM_BY_CATEGORY: Record<BgmCategory, BgmTrack[]> = {
  lofi:      BGM_TRACKS.filter((t) => t.category === 'lofi'),
  acoustic:  BGM_TRACKS.filter((t) => t.category === 'acoustic'),
  cinematic: BGM_TRACKS.filter((t) => t.category === 'cinematic'),
};

export function getBgmFile(key: BgmKey): string {
  return BGM_TRACKS.find((t) => t.key === key)?.file ?? BGM_TRACKS[0].file;
}
