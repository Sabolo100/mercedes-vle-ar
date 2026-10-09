# Mercedes VLE – reptéri AR web demó

Böngészős AR-élmény (nincs app). Technológia: **three.js**, a telefon élő kamerakép, fölötte giroszkóppal vezérelt 3D tér.

## Folyamat
1. QR → nyelvválasztó (HU/EN). Ez a koppintás kéri el a kamera- és a mozgásérzékelő-engedélyt (iOS-en kötelező).
2. Élményválasztó:
   - **Virtuális utazás** – 360°-os videó a VLE utasteréből nézve (műszerfal, oszlopok, tető, ambient fénycsík).
   - **Konfigurátor** – képek érkeznek minden irányból → körülvesznek → fényezés → felni → belső tér → forgatható kocka + gomb a mercedes-benz.hu-ra.

## Futtatás helyben
```bash
node server.mjs
```
→ http://localhost:8080  (asztali gépen egérrel húzva lehet körbenézni)

Fejlesztői gyorsindítás: `?lang=hu&mode=config` vagy `?lang=en&mode=journey`, `&cam=0` = kamera nélkül,
`&video=<url>` = másik 360° videó kipróbálása.

## Telefonon
A kamera és a giroszkóp **csak HTTPS-en** működik. Legegyszerűbb: a teljes mappát feltölteni egy statikus
tárhelyre (pl. Netlify Drop – húzd rá a mappát, GitHub Pages, Vercel), és a kapott HTTPS linkből QR-kódot készíteni.

## Tartalom cseréje
Minden a `js/config.js`-ben van:
- **Fényezések / felnik / belső terek**: név (HU/EN), szín. A nevek jelenleg *helyőrzők* – a hivatalos VLE listával cserélendők.
- **Valódi fotók**: adj meg `img` mezőt (pl. `img: 'assets/photos/paint-black.jpg'`). Fényezésnél `imgFront` a szemből nézethez,
  belső térnél `imgFront` a műszerfalhoz. Ha nincs fotó, a demó generált illusztrációt rajzol.
  Fotók: https://mercedes-benz-media.co.uk/models/vle/photos
- **360° videó**: tedd ide: `assets/video/journey360.mp4` (equirectangular, H.264, ~4K, 30–60 mp loop ajánlott).
  Amíg nincs meg, a demó a YouTube-lejátszóra vált (WDzd1gY9BfA). A YouTube-videót a böngésző nem tudja 3D-gömbre tenni,
  ezért a saját MP4 adja a valódi élményt. Az előre irányt a `JOURNEY.yawOffsetDeg` állítja.
