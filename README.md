# Erdészeti Térkép

Erdészeti térkép alkalmazás cm-pontos GNSS pozícióval.

## Funkciók

- 🌲 Műhold kép (ESRI) és utcakép (OpenStreetMap)
- 🗺️ NÉBIH Erdőtérkép rétegek (erdőrészletek, erdőtagok, helyrajzi számok)
- 📍 Automatikus közigazgatási határok (ország, megye, város)
- 📡 Valós idejű GNSS pozíció cm-pontossággal
- 🛰️ Mock Location támogatás (GNSS Master app)

## Használat

1. Nyisd meg a https://username.github.io/erdészeti-térkép címet (a GitHub username-ddel)
2. Android-on: Kapcsold be a Mock Location-t a GNSS Master app-ban
3. A térkép automatikusan megjeleníti az erdőrészleteket és helyrajzi számokat

## Fejlesztés

```bash
# Szerver indítása
node server.js
# Megnyitás: http://localhost:8080
```

## Licenc

MIT
