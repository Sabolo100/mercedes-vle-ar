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
`&v=1` = a második videó, `&video=<url>` = tetszőleges 360° videó kipróbálása.

## Telefonon
A kamera és a giroszkóp **csak HTTPS-en** működik. Legegyszerűbb: a teljes mappát feltölteni egy statikus
tárhelyre (pl. Netlify Drop – húzd rá a mappát, GitHub Pages, Vercel), és a kapott HTTPS linkből QR-kódot készíteni.

## Tartalom cseréje
Minden a `js/config.js`-ben van:
- **Fényezések / felnik / belső terek**: név (HU/EN), szín. A nevek jelenleg *helyőrzők* – a hivatalos VLE listával cserélendők.
- **Valódi fotók**: adj meg `img` mezőt (pl. `img: 'assets/photos/paint-black.jpg'`). Fényezésnél `imgFront` a szemből nézethez,
  belső térnél `imgFront` a műszerfalhoz. Ha nincs fotó, a demó generált illusztrációt rajzol.
  Fotók: https://mercedes-benz-media.co.uk/models/vle/photos
- **360° videók**: a `JOURNEYS` lista (név, előnézeti kép, `cabin` = rajzolt utastér-keret, `yawOffsetDeg` = menetirány finomhangolás).
  Formátum: equirectangular 2:1 MP4 (H.264, faststart), mobilra max. 4096 px széles. Átalakítás:
  ```bash
  # YouTube EAC (3x2 kockás) formátumból:
  ffmpeg -i forras.mp4 -vf "v360=eac:e:w=2560:h=1280,fps=30" -c:v libx264 -crf 21 -pix_fmt yuv420p -movflags +faststart journey360.mp4
  # 16:9-re összenyomott equirectangularból:
  ffmpeg -i forras.mp4 -vf "scale=1920:960" -c:v libx264 -crf 25 -pix_fmt yuv420p -movflags +faststart journey360-2.mp4
  # előnézeti kép (a menetirány környéke):
  ffmpeg -ss 12 -i video.mp4 -frames:v 1 -vf "crop=iw*0.4:ih*0.5:iw*0.3:ih*0.25,scale=640:-2" poster.jpg
  ```
