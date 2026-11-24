# SaffReady

**Find your next Jamaat.**

SaffReady is a Tamil-first directory and prayer-time PWA for 15 Coimbatore masjids. The warm paper and dark themes, all six original theme tokens, and locally bundled Noto Sans Tamil, Inter and Amiri fonts are retained.

## Local development

Requires Node.js 20+ and npm.

```sh
npm install
npm run dev
```

Run `npm run test`, `npm run typecheck`, and `npm run build` before deployment.

## Timetable source and phone editing

The live Apps Script feed is the timetable source of truth; the bundled `data/masjids.json` snapshot is only the startup/offline fallback. Before its first sync, that file is a legacy array combined with metadata and additions in `src/lib/data.ts`. After sync, it stores the complete publisher envelope, including publisher version and `publishedAt`, and the loader uses its `masjids` unchanged. For live edits without a SaffReady deployment, configure a private Google spreadsheet and its read-only Apps Script publisher using [`google-sheets/SETUP.md`](google-sheets/SETUP.md) and [`google-sheets/Code.gs`](google-sheets/Code.gs).

Add the Apps Script deployment URL to the hosting environment as `SHEETS_JSON_URL`. The browser calls SaffReady's same-origin `/api/timetable` route; no edit credentials or spreadsheet link is sent to the browser. The API reads a complete valid dataset, and the client retains the most recent successful response for offline use. The app refreshes on load, every five minutes, and when foregrounded. If the published sheet is incomplete or malformed, Apps Script returns its last valid snapshot; if the source is unavailable, SaffReady marks cached data stale.

The sheet is private. Deploy Apps Script as **execute as me** and permit access to **anyone** only for the read-only web app output. The script has no public write action and returns no settings or history tab contents. This makes published timetables public while keeping the spreadsheet itself private. A one-minute timing edit is published on the next refresh and does not require a Vercel deployment.

To refresh the bundled fallback from the existing Apps Script `/exec` URL, set `SHEETS_JSON_URL` in your local environment and run `npm run sync:timetable`. The command validates the entire response with SaffReady's timetable validator, rejects stale feeds, and writes via a same-directory temporary file and atomic rename. It refuses to replace a newer numeric publisher version. A network, JSON, validation, stale-feed, or write failure leaves the current fallback untouched. Review the resulting `data/masjids.json` diff as ordinary source data; synchronization never commits, pushes, or deploys.

## Environment configuration

- `SHEETS_JSON_URL`: Apps Script `/exec` URL, configured server-side.
- `COIMBATORE_LATITUDE` and `COIMBATORE_LONGITUDE`: optional fixed weather service-area coordinates. Defaults are 10.9940, 76.9660. No browser location permission is used for weather.
- `NEXT_PUBLIC_WHATSAPP`: optional report-a-change number, digits with country code.
- `NEXT_PUBLIC_QURAN_APP_URL`: optional Qur'an app link. It is omitted until the real destination is supplied; the promotion copy, name placeholder and enable switch are centralized in `src/constants/app.ts`.

Weather and astronomical sunrise/sunset are requested from the Open-Meteo Forecast API through `/api/weather`, cached separately from timetable data and revalidated every five minutes. Open-Meteo is attributed in the footer. Weather failures stay quiet in the home info line.

The home page shows the oldest recorded noticeboard observation date across all masjids, separately from any API fetch time. Using the Distance tab or **Use my location** requests browser location only after that action. A successful result is reused in the current tab session for up to 20 minutes, held in memory and `sessionStorage`, then cleared; precise coordinates are not written to local storage or sent to the backend. Travel times are estimates based on straight-line distance with a 1.3 street-detour factor. Walking is estimated at 5 km/h, switching to a 15 km/h bicycle estimate when walking would exceed 20 minutes. Reachability includes a one-minute buffer.

## Preferences and PWA

Tamil is the default language. The `தமிழ் | EN` selector and theme/time-format preferences are stored locally. Six themes remain available. The app can be installed from Android Chrome or iOS Safari; the service worker keeps an offline shell and network-first navigation so it does not indefinitely pin old HTML.

The iOS standalone status-bar style is selected from the saved theme before hydration: light themes use `default`, and dark themes use `black-translucent`. iOS may not reread this metadata until the installed app is relaunched. Verify status-bar readability manually on a real iPhone or iPad after changing themes; this behavior has not been verified on a physical device.

## Deployment

Vercel hosts the Next.js app. Configure the environment variables above, then deploy through the project's existing Vercel integration. Do not put spreadsheet edit credentials, service-account keys, or private secrets in `NEXT_PUBLIC_*` variables. Timetable changes made in the private Sheet do not require a code deployment.
