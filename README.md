# SaffReady

Tamil-first, mobile-first PWA for comparing the next congregation time across ten Coimbatore masjids.

## Setup

Requires Node.js 20+ and npm. Run `npm install`, then `npm run dev` and open `http://localhost:3000`. Run `npm run typecheck`, `npm test`, and `npm run build` before deployment.

## Data and deployment

The authoritative source is `data/masjids.json`. Preserve `HH:mm` values, observation metadata, and handwritten flags when updating it. Commit the change and redeploy on Vercel; the new JSON is included in the deployment. No backend or database is used.

Set `NEXT_PUBLIC_WHATSAPP` to the WhatsApp number (digits only, with country code) to enable the report link. Without it, reporting remains disabled. Replace the generated/placeholder icons in `public/icons/` when branding assets are available. The deployment URL is a placeholder until configured.

## PWA and offline use

The app can be installed from Android Chrome’s “Add to Home screen” or iOS Safari’s Share → “Add to Home Screen”. The service worker caches the application shell and uses a versioned cache; masjid data is treated as a convenience cache and the repository JSON remains the source of truth. QR codes can point to the deployed placeholder URL and can be generated with any QR generator.

## Preferences and themes

Theme and 12/24-hour preferences are stored in localStorage. The default time display is 12-hour; scheduling always uses canonical 24-hour values. Six themes are available from the settings button. Theme tokens live in `app/globals.css`.
