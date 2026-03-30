# Erdészeti Térkép App - Specifikáció

## Cél
Android/webes alkalmazás erdészethez:
- cm-pontos GNSS pozíció megjelenítés (Mock Location-nel)
- Közigazgatási határok megjelenítése (OpenStreetMap adatból)
- Település név megjelenítés (reverse geocoding)
- ⚠️ **Helyrajzi számok: MÉG NINCS MEGVALÓSÍTVA** - erre később kerül sor

## Technológia
- **Platform:** PWA (Progressive Web App) - működik Android-on és weben
- **Térkép:** Leaflet.js + OpenStreetMap + ESRI World Imagery (műhold kép)
- **GNSS:** Geolocation API (Mock Location-n keresztül cm-pontos)
- **Határok:** OpenStreetMap Overpass API
- **Helymeghatározás:** Nominatim Reverse Geocoding API

## GNSS Master app beállítás
1. GNSS Master app-ban csatlakoztasd a műszert
2. Menj a **Status** oldalra
3. Kapcsold be a **Mock Location** switch-et
4. Ezután az alkalmazás automatikusan kapja a cm-pontos pozíciót

## Határ rétegek

### Automatikus betöltés zoom alapján:
| Nagyítás | Rétegek |
|---------|---------|
| 1-7x | Országhatár (narancssárga) |
| 8-9x | Országhatár + Megyehatár (lila) |
| 10x+ | Minden határ + Települések (kék) |

### Stílus:
- **Műhold nézetben:** Fehér vonalak (Google Maps stílus)
- **Utcaképben:** Színes vonalak

## Aktuális funkciók

### ✅ Kész:
- [x] Térkép megjelenítés (utca + műhold kép)
- [x] Váltás a rétegek között
- [x] GNSS pozíció megjelenítés
- [x] Pontosság kijelzés (RTK/DGPS/GPS)
- [x] Koordináták DMS formátumban
- [x] Település név automatikus megjelenítés
- [x] Pozíció követés be/ki
- [x] Közigazgatási határok (OSM Overpass API)
- [x] Határ rétegek ki/be kapcsolása

### ❌ Még nincs:
- [ ] Helyrajzi számok automatikus megjelenítése (WMS keresése folyamatban)
- [ ] Manuális parcella hozzáadás
- [ ] GPX export
- [ ] Erdei utak / erdőrészletek

## Fájl struktúra
```
/
├── index.html          # Főoldal
├── styles.css          # Stílusok
├── app.js              # Fő alkalmazás logika
├── manifest.json       # PWA manifest
└── SPEC.md            # Specifikáció
```

## Telepítés
1. Nyisd meg az alkalmazást Chrome-ban Android-on
2. Kattints a menüre → "Hozzáadás a Főképernyőhöz"

## HRSZ funkció
A helyrajzi számok automatikus megjelenítéséhez ingyenes WMS forrást keresünk. 
Amint megtaláljuk, hozzáadjuk ezt a funkciót is.
