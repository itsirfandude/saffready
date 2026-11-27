# Private timetable Sheet setup

## Fixed-time confirmation columns

In **Prayer Timings**, retain every existing column in its current order, including `handwritten_prayers` and `unclear_prayers`. Append the following 18 columns in this exact order, after those existing notes/provenance columns. Use the canonical repository spelling `dhuhr` for the prayer key (the user-facing prayer label remains unchanged); do not add `zuhr` columns or duplicate Dhuhr metadata columns. Leave every new metadata cell blank for existing rows:

`fajr_fixed`, `fajr_fixed_basis`, `fajr_fixed_checked_on`, `dhuhr_fixed`, `dhuhr_fixed_basis`, `dhuhr_fixed_checked_on`, `asr_fixed`, `asr_fixed_basis`, `asr_fixed_checked_on`, `maghrib_fixed`, `maghrib_fixed_basis`, `maghrib_fixed_checked_on`, `isha_fixed`, `isha_fixed_basis`, `isha_fixed_checked_on`, `jumuah_fixed`, `jumuah_fixed_basis`, `jumuah_fixed_checked_on`.

`fixed` accepts TRUE, FALSE, or blank. TRUE requires a written confirmation source in `fixed_basis` and a real `YYYY-MM-DD` verification date in `fixed_checked_on`. Never infer TRUE from repeated times or a photograph alone. A metadata-only edit publishes a new feed version but does not change `observed_on`, `updated_at`, or physical timing history. Jumu'ah Adhan and Iqamah may both be blank; if either is entered, both must be valid. The five daily prayer rows remain required.

This folder contains the Apps Script JSON publisher and private verification action. It exposes only the intended masjid and timetable records. The spreadsheet and its edit access stay private. The public web app has one `doGet` path and cannot edit the spreadsheet.

## Create the mobile editing spreadsheet

1. Create a new Google Sheet while signed in to your account. Keep sharing **Restricted**.
2. Import `SaffReady_Timetable.xlsx` with File → Import → Upload, choosing “Replace spreadsheet”. This includes the complete 13-row dataset. The CSV files alongside it are backups.
3. Open Extensions → Apps Script, paste `Code.gs`, save, then have the designated trigger owner run `installTimingTrigger` and authorize it. Use only that one account to install `recordTimingHistory`. Apps Script trigger cleanup can see and remove only triggers owned by the current account; it does not guarantee uniqueness across accounts and deliberately does not delete another user's trigger. Check the trigger owner's list and coordinate with other editors to ensure no one else installed one.
4. The workbook already contains all 13 matching masjid and schedule rows. Do not clear or rename headers. Keep an unavailable/unverified Tamil name, affiliation, address, or coordinate blank; the app falls back to the English name. Keep `Masjid Arafa` affiliation blank. Do not invent `effective_from` dates.
5. In **Settings**, keep `schema_version=1`, `data_version=1`, `service_area=Coimbatore`, and `timezone=Asia/Kolkata`. `last_published_at` is maintained by the edit trigger.
6. The designated account's `installTimingTrigger` step installs the **From spreadsheet → On edit** trigger. Do not add a second trigger manually or run the installer from another account. Multiple accounts can install triggers for the same sheet, and those triggers can each record history for one edit.
7. Check sheet privacy and protect headers, schema/version cells, and the history tab. Only the timetable owner should edit Masjids and Prayer Timings. Keep formula and metadata cells protected from routine phone edits; the `updated_at` and `updated_by` cells are maintained on a timing edit.
8. Before deploying any write-capable workflow, inspect the actual spreadsheet's owner and sharing list and confirm the active Apps Script project is bound to that private spreadsheet. Set Script Property `VERIFICATION_ADMIN_EMAIL` to the administrator's Google account email. The private verification action fails closed if this property is missing, the active account is unavailable, or the account does not match. Treat every spreadsheet editor as trusted to view, edit, and run the bound Apps Script and to change Script Properties; the email check does not defend against a spreadsheet editor who can modify the guard or its configuration. Keep the editor list limited to people trusted with those capabilities.

## Columns and phone workflow

`observed_on` is the date the noticeboard was physically checked. An edit to a verified timetable field automatically sets only that Masjid's `Masjids.observed_on` to the edit date in `Asia/Kolkata`. The verified fields are `Prayer Timings` columns `fajr_adhan` through `jumuah_iqamah_offset_min`, `timing_pattern`, `effective_from`, and (when present) `handwritten_prayers` / `unclear_prayers`; plus `Masjids.name_en` and `Masjids.name_ta`. Formatting changes and other non-name Masjid fields do not change the observation date. `observed_on`, `updated_at`, `updated_by`, `notes`, and other administrative fields do not count as timetable verification edits. A manually entered observation date is preserved until a qualifying edit.

The checked-in workbook currently has 13 `Masjids` columns (A:M) and 30 `Prayer Timings` columns (A:AD); the publisher also accepts its declared optional trailing columns (`ishraq` through `sunset`, and `handwritten_prayers` / `unclear_prayers`) when present. The trigger writes `Masjids` column K (`observed_on`) for the matching `masjid_id` only. Its own script write does not fire another Apps Script edit trigger, and the handler ignores a direct `observed_on` edit for observation-date purposes.

For a physical check with no correction, use **SaffReady Admin → Verify unchanged timetable…** and enter the exact `masjid_id` after inspecting the noticeboard. The action requires exactly one matching Masjid ID, changes only that row's `observed_on` date (Asia/Kolkata), and appends a private `Timing History` event with result `unchanged`; it does not edit prayer cells or `updated_at`. A genuine single-cell schedule correction remains a normal edit in **Prayer Timings**: the trigger compares the event's old and new values, records the field change, updates `updated_at` / `updated_by`, sets that Masjid's `observed_on`, and appends one private verification event with result `changed`. Re-entering the same value is ignored. Script writes do not invoke the spreadsheet edit trigger recursively. Neither verification event is included in `doGet`.

Do not paste multiple timetable cells as one bulk edit when relying on correction history or timestamps. This project has no reliable private before-edit snapshot, and Apps Script does not supply per-cell old values for multi-cell edits. The trigger therefore does not claim a correction, update `updated_at` / `observed_on`, or append correction history for such an edit; the sheet values may still appear in the published feed. Edit timetable cells one at a time so the trigger can verify each change. Supporting bulk edits correctly requires a separately designed and validated snapshot workflow.

The first four tabs and all required columns are created in the specified order. `Masjids` has four extra optional fields at the end (`ishraq`, `sunrise`, `solar_noon`, `sunset`) to preserve separately posted observances such as Ummu Kulsum Azim's noticeboard values. `Prayer Timings` has two optional provenance fields (`handwritten_prayers`, `unclear_prayers`), containing comma-separated prayer keys, followed by the six prayers' three fixed-classification columns each.

Maghrib columns are `maghrib_iqamah_type`, `maghrib_iqamah_time`, and `maghrib_iqamah_offset_min`:

- `fixed`: enter `HH:mm` in `maghrib_iqamah_time`.
- `after_adhan`: leave `maghrib_iqamah_time` blank and set offset to zero. The app displays Immediately/உடன் and calculates Adhan plus offset at runtime. For future offset use `after_adhan` with the integer offset (0–120); never populate fixed time.

All other Adhan/Iqamah values must be canonical 24-hour `HH:mm`. `timing_pattern` is one of `fixed`, `seasonal`, `variable`, `unknown`; start with `unknown` unless a schedule's status is known. An `effective_from` value applies to the current timing row and is independent of `observed_on`. Leave it blank when unknown.

After setup, the phone editing procedure is: open the Google Sheets mobile app → open **Prayer Timings** → find the row by `masjid_id` → edit the verified timetable field → save. The trigger records the change privately and updates that Masjid's observation date. SaffReady fetches the new published dataset within approximately five minutes (also on foregrounding); no Next.js code change or deployment is required.

## Deploy the read-only JSON publisher

1. In Apps Script, choose **Deploy → New deployment → Web app**.
2. Set **Execute as** to the spreadsheet owner.
3. Set **Who has access** to **Anyone**. This makes only the timetable JSON returned by `doGet` public. It does not make the spreadsheet public, and no write handler is exposed. Google's account policy may restrict this option; if unavailable, the publisher cannot be used as an anonymous public feed under that account policy.
4. Deploy, authorize as prompted, and copy the `/exec` URL.
5. Add that URL to Vercel as the server-side environment variable `SHEETS_JSON_URL` (never `NEXT_PUBLIC_*`). Add `COIMBATORE_LATITUDE` / `COIMBATORE_LONGITUDE` only if adjusting the fixed forecast service-area coordinate. Redeploy once to configure the endpoint; later timetable edits do not need deployment.
6. Open the `/exec` URL and confirm JSON includes `version`, `publishedAt`, `timezone`, and exactly the active masjids with six prayer records each. For an Apps Script code update, save the source, run `installTimingTrigger` and verify one trigger, then choose **Deploy → Manage deployments → Edit** on the existing web app deployment and select **New version**. Confirm `/exec` returns the new version. Test using a copied spreadsheet or a planned real noticeboard verification; do not make an unverified production timetable edit just to test the trigger.

The publisher validates every active row before updating its last-valid snapshot. Missing or malformed times, invalid coordinates, duplicate IDs, and missing timing rows reject the entire new dataset. A blank required cell never silently removes a time or masjid. If validation fails after at least one valid publication, the endpoint returns the last valid snapshot. Timing History is append-only for normal sheet users and is never included in the JSON response.

## Manual owner work still needed

This repository cannot create a Google Sheet, authorize an Apps Script project, or configure Vercel without the owner's Google and Vercel accounts. Create the private sheet, seed all 13 rows, add the edit trigger, deploy the web app, then configure `SHEETS_JSON_URL` in Vercel. The repository includes the workbook, CSV backups, Apps Script publisher and setup instructions. It does not contain credentials, a spreadsheet ID or deployment URL.
