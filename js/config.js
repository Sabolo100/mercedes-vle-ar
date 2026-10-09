// Demo tartalom. A nevek / színek helyőrzők – a végleges VLE specifikáció alapján cserélendők.
// Ha egy elemnél megadod az `img` mezőt (pl. 'assets/photos/paint-black.jpg'), a kártya a valódi fotót
// használja; ha a fájl hiányzik, marad a generált (procedurális) kép.

export const LINKS = {
  official: 'https://www.mercedes-benz.hu/passengercars/models/grand-limousine/vle/overview.html',
};

// Választható 360° videók (equirectangular 2:1 MP4, a kép közepe = menetirány).
// yawOffsetDeg: finomhangolás, ha a videó "előre" iránya nem a kép közepén van.
// cabin: rajzoljunk-e VLE utastér-keretet (műszerfal, oszlopok) – ha a videóban már van utastér, nem kell.
export const JOURNEYS = [
  {
    id: 'highway',
    src: 'assets/video/journey360.mp4',
    poster: 'assets/video/journey360.jpg',
    yawOffsetDeg: 0,
    cabin: false,
    name: { hu: 'Esti autópálya', en: 'Evening highway' },
    sub: { hu: 'Városi száguldás az utastérből', en: 'A city sprint from the cockpit' },
  },
  {
    id: 'coast',
    src: 'assets/video/journey360-2.mp4',
    poster: 'assets/video/journey360-2.jpg',
    yawOffsetDeg: 0,
    cabin: true,
    name: { hu: 'Tengerparti körút', en: 'Coastal drive' },
    sub: { hu: 'Pálmafák és naplemente', en: 'Palm trees and sunset' },
  },
];

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
    videoFail: 'A videó nem tölthető be.',
    pickVideo: 'Válassz utat',
    switchVideo: 'Másik út',
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
    videoFail: 'The video could not be loaded.',
    pickVideo: 'Choose your ride',
    switchVideo: 'Other ride',
    yourVle: 'Your VLE',
    paint: 'Paint', wheel: 'Wheels', interior: 'Interior',
  },
};
