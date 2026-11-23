import json,csv
from pathlib import Path
from openpyxl import Workbook,load_workbook
from openpyxl.styles import Font,PatternFill
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.utils import get_column_letter
ROOT=Path(__file__).resolve().parent.parent
records=json.loads(Path('/tmp/saffready-masjids.json').read_text())
assert len(records)==13 and len({m['id'] for m in records})==13
for m in records:
 if m['name_en'].startswith('Irshadhul'):
  m['name_ta']='இர்ஷாதுல் முஸ்லிம் ஷாஃபியா சுன்னத் ஜமாஅத்';m['mapsUrl']='https://maps.app.goo.gl/NEVTinzoGEME41UT6';m['affiliation']='SUNNAT JAMAAT'
 if m['id']=='mifthahul-janna':m['affiliation']='SUNNAT JAMAAT';m['mapsUrl']='https://maps.app.goo.gl/Wm4JRb1Cjx2Z1QWf7'
for m in records:
 for p in m['prayers']:
  if p['prayer']=='jumuah':p['timingPattern']='fixed'
# exact public affiliation map
aff={'Masjidus Salaam':'TNTJ','Masjid Maalikul Mulk':'JAQH','Masjidul Quddus':'YMJ',"Masjidul Mu'mineen":'SUNNAT JAMAAT','Masjid Arafa':None,'Masjidul Akram':'NTF','Masjidul Jannath':'TMMK TRUST','Masjid Aamina Binth Wahab':'SUNNAT JAMAAT','Masjid Ummu Kulsum Azim':'AHLE HADEES','Masjidul Muslimeen':'JAQH','Masjidul Kousar':None,'Irshadhul Muslimeen Shafiyya Sunnath Jamaath':'SUNNAT JAMAAT','Mifthahul Janna Sunnath Val Jamath Masjid':'SUNNAT JAMAAT'}
for m in records:m['affiliation']=aff[m['name_en']]
wb=Workbook(); ws=wb.active;ws.title='Masjids'
headers=['id','name_en','name_ta','maps_name','affiliation','address','latitude','longitude','maps_url','active','observed_on','source','notes']
ws.append(headers)
for m in records:ws.append([m.get('id'),m.get('name_en'),m.get('name_ta'),m.get('mapsName'),m.get('affiliation'),m.get('address_ta'),m.get('lat'),m.get('lng'),m.get('mapsUrl'),True,m.get('observedOn') or next((p.get('observedOn') for p in m['prayers'] if p.get('observedOn')),None),m.get('source','noticeboard_photo'),m.get('notes')])
pr=wb.create_sheet('Prayer Timings'); prayers=['fajr','dhuhr','asr','maghrib','isha','jumuah']
ph=['masjid_id']
for p in prayers:ph += [p+'_adhan',p+'_iqamah',p+'_iqamah_type',p+'_iqamah_offset_min']
ph += ['timing_pattern','effective_from','updated_at','updated_by','notes']
pr.append(ph)
for m in records:
 row=[m['id']]
 for p in prayers:
  x=next(y for y in m['prayers'] if y['prayer']==p); val=x['iqamah']; after=isinstance(val,dict)
  row += [x.get('adhan'),None if after else val,'after_adhan' if after else 'fixed',val.get('offsetMin',0) if after else None]
 row += ['fixed' if p=='jumuah' else m.get('timingPattern','unknown'),None,None,None,m.get('notes')]
 pr.append(row)
h=wb.create_sheet('Timing History');h.append(['masjid_id','prayer','field_changed','previous_value','new_value','changed_at','changed_by','reason'])
s=wb.create_sheet('Settings');s.append(['key','value']);[s.append(x) for x in [('schema_version','1'),('data_version','1'),('timezone','Asia/Kolkata'),('service_area','Coimbatore'),('last_published_at','')]]
r=wb.create_sheet('Read Me');
for line in ['SaffReady timetable workbook','Masjids: identity, addresses, Maps links, coordinates and affiliation. Edit these only to correct directory data.','Prayer Timings: one row per masjid, canonical 24-hour HH:mm. Edit schedule cells on your phone. Jumuah timing_pattern is fixed for all 13.','For immediately after Maghrib Adhan set maghrib_iqamah_type=after_adhan, offset=0, and leave maghrib_iqamah_time blank. Never copy the Adhan time into Iqamah.','Timing History: append-only audit records. Do not edit or delete rows.','Settings: schema/version/timezone/service area and publisher timestamp. Do not edit metadata manually.','Phone update: Google Sheets app → Prayer Timings → find masjid_id → edit one cell → save. Apps Script trigger records edits; the app refreshes within about five minutes.','Publish: the installed read-only Apps Script endpoint publishes valid rows automatically. No deployment for time edits.','Restore: edit the cell back to its previous valid value. Keep the history row as the audit trail.']:r.append([line])
for sh in wb.worksheets:
 sh.freeze_panes='A2';sh.auto_filter.ref=sh.dimensions
 for c in sh[1]:c.font=Font(bold=True,color='FFFFFF');c.fill=PatternFill('solid',fgColor='34445B')
 for col in sh.columns:
  letter=get_column_letter(col[0].column);sh.column_dimensions[letter].width=min(44,max(14,max(len(str(c.value or '')) for c in col)+2))
# time validations across all schedule time columns; blank is allowed only for after-adhan fields.
tv=DataValidation(type='custom',formula1='=OR(B2="",AND(ISTEXT(B2),REGEXMATCH(B2,"^([01][0-9]|2[0-3]):[0-5][0-9]$")))',allow_blank=True);pr.add_data_validation(tv)
for col in range(2,2+len(prayers)*4):
 if (col-2)%4 in (0,1):tv.add(f'{get_column_letter(col)}2:{get_column_letter(col)}14')
# Export matching CSV import backups.
for sheet in [ws,pr,h,s]:
 with (ROOT/'google-sheets'/f'{sheet.title.replace(" ","_")}.csv').open('w',newline='',encoding='utf-8-sig') as f:csv.writer(f).writerows(sheet.values)
out=ROOT/'google-sheets'/'SaffReady_Timetable.xlsx';wb.save(out)
# independent reload check
check=load_workbook(out,data_only=True);assert len(list(check['Masjids'].values))-1==13;assert len({r[0] for r in list(check['Masjids'].values)[1:]})==13
assert all(r[25]=='fixed' for r in list(check['Prayer Timings'].values)[1:])
print(out)
