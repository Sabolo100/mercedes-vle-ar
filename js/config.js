// Demo tartalom. A nevek / színek helyőrzők – a végleges VLE specifikáció alapján cserélendők.
// Ha egy elemnél megadod az `img` mezőt (pl. 'assets/photos/paint-black.jpg'), a kártya a valódi fotót
// használja; ha a fájl hiányzik, marad a generált (procedurális) kép.

export const LINKS = {
  official: 'https://www.mercedes-benz.hu/passengercars/models/grand-limousine/vle/overview.html',
};

export const JOURNEY = {
  // Saját tárhelyen lévő equirectangular 360° MP4. Ha nincs meg, YouTube beágyazásra vált.
  videoSrc: 'assets/video/journey360.mp4',
  youtubeId: 'WDzd1gY9BfA',
  // Hány fokkal forgassuk el a videógömböt, hogy a videó "előre" iránya a menetirányba essen.
  yawOffsetDeg: 0,
  place: { hu: 'La Marina', en: 'La Marina' },
};

export const PAINTS = [
  { id: 'black',  color: '#16181c', name: { hu: 'Obszidiánfekete metál', en: 'Obsidian Black metallic' } },
  { id: 'white',  color: '#e9ebec', name: { hu: 'Polárfehér', en: 'Polar White' } },
  { id: 'silver', color: '#a7abb1', name: { hu: 'Hightech-ezüst metál', en: 'High-tech Silver metallic' } },
  { id: 'grey',   color: '#4a4e55', name: { hu: 'Grafitszürke metál', en: 'Graphite Grey metallic' } },
  { id: 'blue',   color: '#1d3350', name: { hu: 'Nautikkék metál', en: 'Nautic Blue metallic' } },
  { id: 'red',    color: '#6a1322', name: { hu: 'Hiacintvörös metál', en: 'Hyacinth Red metallic' } },
];

// style: twin | aero | multi | y | turbine
export const WHEELS = [
  { id: 'w18', size: 18, style: 'twin',    rim: '#c8ccd2', dark: '#22252a', name: { hu: '5-ikerküllős', en: '5-twin-spoke' } },
  { id: 'w19a', size: 19, style: 'aero',   rim: '#b9bec5', dark: '#15171a', name: { hu: 'Aero design', en: 'Aero design' } },
  { id: 'w19y', size: 19, style: 'y',      rim: '#d5d8dc', dark: '#2a2d33', name: { hu: 'Y-küllős', en: 'Y-spoke' } },
  { id: 'w20', size: 20, style: 'multi',   rim: '#e2e4e7', dark: '#101113', name: { hu: 'Többküllős, bicolor', en: 'Multi-spoke, bicolour' } },
  { id: 'w21', size: 21, style: 'turbine', rim: '#2b2e33', dark: '#0b0c0e', name: { hu: 'Turbina, fekete', en: 'Turbine, black' } },
];

export const INTERIORS = [
  { id: 'black',  color: '#1d1d20', ambient: '#4cc3ff', name: { hu: 'Fekete Nappa bőr', en: 'Black Nappa leather' } },
  { id: 'beige',  color: '#cbb596', ambient: '#ffb35c', name: { hu: 'Macchiato bézs Nappa', en: 'Macchiato Beige Nappa' } },
  { id: 'grey',   color: '#8b8c8f', ambient: '#9fa8ff', name: { hu: 'Neva szürke', en: 'Neva Grey' } },
  { id: 'brown',  color: '#7a4728', ambient: '#ff8a4c', name: { hu: 'Nyeregbarna', en: 'Saddle Brown' } },
  { id: 'cream',  color: '#e6dfd1', ambient: '#c48bff', name: { hu: 'Krémfehér / sötétkék', en: 'Cream White / Dark Blue' } },
];

export const TEXT = {
  hu: {
    langPrompt: 'Válassz nyelvet',
    modeTitle: 'Válassz élményt',
    modeConfig: 'Konfigurátor',
    modeConfigSub: 'Állítsd össze a saját VLE-det maga körül a térben',
    modeJourney: 'Virtuális utazás',
    modeJourneySub: '360°-os út a VLE ablakán át',
    introTitle: 'Nézz körül!',
    introHint: 'Mozgasd a telefonod jobbra-balra, fel-le',
    skip: 'Tovább',
    pickPaint: 'Válassz fényezést',
    pickWheel: 'Válassz felnit',
    pickInterior: 'Válassz belső teret',
    pickHint: 'Fordulj körbe, és koppints a kedvencedre',
    step: (i, n) => `${i}. lépés / ${n}`,
    cubeTitle: 'Fedezd fel a VLE-det!',
    cubeHint: 'Forgasd a kockát az ujjaddal',
    cta: 'Tovább a mercedes-benz.hu-ra',
    restart: 'Újrakezdés',
    back: 'Vissza',
    recenter: 'Középre',
    sound: 'Hang be',
    soundOff: 'Hang ki',
    journeyTitle: 'Virtuális utazás',
    journeyHint: 'Nézz körül a telefonoddal',
    camFail: 'A kamera nem érhető el – virtuális háttérrel folytatjuk.',
    ytFallback: 'Demo mód: YouTube lejátszó (a 360°-os MP4 nincs feltöltve)',
    yourVle: 'A te VLE-d',
    paint: 'Fényezés', wheel: 'Felni', interior: 'Belső tér',
  },
  en: {
    langPrompt: 'Choose your language',
    modeTitle: 'Choose your experience',
    modeConfig: 'Configurator',
    modeConfigSub: 'Build your own VLE in the space around you',
    modeJourney: 'Virtual journey',
    modeJourneySub: 'A 360° ride through the VLE windows',
    introTitle: 'Look around!',
    introHint: 'Move your phone left and right, up and down',
    skip: 'Next',
    pickPaint: 'Choose your paint',
    pickWheel: 'Choose your wheels',
    pickInterior: 'Choose your interior',
    pickHint: 'Turn around and tap your favourite',
    step: (i, n) => `Step ${i} of ${n}`,
    cubeTitle: 'Discover your VLE!',
    cubeHint: 'Spin the cube with your finger',
    cta: 'Continue to mercedes-benz.hu',
    restart: 'Start over',
    back: 'Back',
    recenter: 'Recenter',
    sound: 'Sound on',
    soundOff: 'Sound off',
    journeyTitle: 'Virtual journey',
    journeyHint: 'Look around with your phone',
    camFail: 'Camera unavailable – continuing with a virtual backdrop.',
    ytFallback: 'Demo mode: YouTube player (360° MP4 not uploaded)',
    yourVle: 'Your VLE',
    paint: 'Paint', wheel: 'Wheels', interior: 'Interior',
  },
};
