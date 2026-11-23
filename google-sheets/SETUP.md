# Private timetable Sheet setup

This folder contains the Apps Script JSON publisher. It exposes only the intended masjid and timetable records. The spreadsheet and its edit access stay private. The public web app has one `doGet` path and cannot edit the spreadsheet.

## Create the mobile editing spreadsheet

1. Create a new Google Sheet while signed in to your account. Keep sharing **Restricted**.
2. Import `SaffReady_Timetable.xlsx` with File → Import → Upload, choosing “Replace spreadsheet”. This includes the complete 13-row dataset. The CSV files alongside it are backups.
3. Open Extensions → Apps Script, paste `Code.gs`, save, then run `installTimingTrigger`. Authorize as yourself using the normal Google authorization screen. No password is requested by this project.
4. The workbook already contains all 13 matching masjid and schedule rows. Do not clear or rename headers. Keep an unavailable/unverified Tamil name, affiliation, address, or coordinate blank; the app falls back to the English name. Keep `Masjid Arafa` affiliation blank. Do not invent `effective_from` dates.
5. In **Settings**, keep `schema_version=1`, `data_version=1`, `service_area=Coimbatore`, and `timezone=Asia/Kolkata`. `last_published_at` is maintained by the edit trigger.
6. In Apps Script, open **Triggers** (clock icon), add a trigger for `recordTimingHistory`, event source **From spreadsheet**, event type **On edit**. This records timing changes, increments the dataset version and timestamp, and records the editor where Google supplies it. The trigger is owner-authorized.
7. Check sheet privacy and protect headers, schema/version cells, and the history tab. Only the timetable owner should edit Masjids and Prayer Timings. Keep formula and metadata cells protected from routine phone edits; the `updated_at` and `updated_by` cells are maintained on a timing edit.

## Columns and phone workflow

The first four tabs and all required columns are created in the specified order. `Masjids` has four extra optional fields at the end (`ishraq`, `sunrise`, `solar_noon`, `sunset`) to preserve separately posted observances such as Ummu Kulsum Azim's noticeboard values. `Prayer Timings` has two optional provenance fields at the end: `handwritten_prayers` and `unclear_prayers`, containing comma-separated prayer keys. These preserve the distinction between handwritten and unclear entries when a sheet dataset replaces the bundled snapshot.

Maghrib columns are `maghrib_iqamah_type`, `maghrib_iqamah_time`, and `maghrib_iqamah_offset_min`:

- `fixed`: enter `HH:mm` in `maghrib_iqamah_time`.
- `after_adhan`: leave `maghrib_iqamah_time` blank and set offset to zero. The app displays Immediately/உடன் and calculates Adhan plus offset at runtime. For future offset use `after_adhan` with the integer offset (0–120); never populate fixed time.

All other Adhan/Iqamah values must be canonical 24-hour `HH:mm`. `timing_pattern` is one of `fixed`, `seasonal`, `variable`, `unknown`; start with `unknown` unless a schedule's status is known. An `effective_from` value applies to the current timing row and is independent of `observed_on`. Leave it blank when unknown.

After setup, the phone editing procedure is: open the Google Sheets mobile app → open **Prayer Timings** → find the row by `masjid_id` → edit the relevant time cell by one minute → save. The installable trigger records the change. SaffReady fetches the new published dataset within approximately five minutes (also on foregrounding); no app code edit or deployment is required.

## Deploy the read-only JSON publisher

1. In Apps Script, choose **Deploy → New deployment → Web app**.
2. Set **Execute as** to the spreadsheet owner.
3. Set **Who has access** to **Anyone**. This makes only the timetable JSON returned by `doGet` public. It does not make the spreadsheet public, and no write handler is exposed. Google's account policy may restrict this option; if unavailable, the publisher cannot be used as an anonymous public feed under that account policy.
4. Deploy, authorize as prompted, and copy the `/exec` URL.
5. Add that URL to Vercel as the server-side environment variable `SHEETS_JSON_URL` (never `NEXT_PUBLIC_*`). Add `COIMBATORE_LATITUDE` / `COIMBATORE_LONGITUDE` only if adjusting the fixed forecast service-area coordinate. Redeploy once to configure the endpoint; later timetable edits do not need deployment.
6. Open the `/exec` URL and confirm JSON includes `version`, `publishedAt`, `timezone`, and exactly the active masjids with six prayer records each. Make a test edit and confirm a history row and version increment. Restore the correct time after the check.

The publisher validates every active row before updating its last-valid snapshot. Missing or malformed times, invalid coordinates, duplicate IDs, and missing timing rows reject the entire new dataset. A blank required cell never silently removes a time or masjid. If validation fails after at least one valid publication, the endpoint returns the last valid snapshot. Timing History is append-only for normal sheet users and is never included in the JSON response.

## Manual owner work still needed

This repository cannot create a Google Sheet, authorize an Apps Script project, or configure Vercel without the owner's Google and Vercel accounts. Create the private sheet, seed all 13 rows, add the edit trigger, deploy the web app, then configure `SHEETS_JSON_URL` in Vercel. The repository includes the workbook, CSV backups, Apps Script publisher and setup instructions. It does not contain credentials, a spreadsheet ID or deployment URL.
