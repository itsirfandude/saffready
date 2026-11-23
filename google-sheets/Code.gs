// SaffReady read-only JSON publisher. Bind this project to the private timetable spreadsheet.
const TABS = { masjids: 'Masjids', timings: 'Prayer Timings', history: 'Timing History', settings: 'Settings' };
const PRAYERS=['fajr','dhuhr','asr','maghrib','isha','jumuah'];
const REQUIRED = {
  Masjids: ['id','name_en','name_ta','maps_name','affiliation','address','latitude','longitude','maps_url','active','observed_on','source','notes','ishraq','sunrise','solar_noon','sunset'],
  'Prayer Timings': ['masjid_id',...PRAYERS.flatMap(p=>[p+'_adhan',p+'_iqamah',p+'_iqamah_type',p+'_iqamah_offset_min']),'timing_pattern','effective_from','updated_at','updated_by','notes','handwritten_prayers','unclear_prayers'],
  'Timing History': ['masjid_id','prayer','field_changed','previous_value','new_value','changed_at','changed_by','reason'],
  Settings: ['key','value']
};
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
function initializeSchema() {
  const ss=SpreadsheetApp.getActive();
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID',ss.getId());
  for(const [name,headers] of Object.entries(REQUIRED)) {
    let sheet=ss.getSheetByName(name); if(!sheet)sheet=ss.insertSheet(name);
    sheet.getRange(1,1,1,headers.length).setValues([headers]); sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,headers.length).setFontWeight('bold');
    sheet.getRange(1,1,1,headers.length).protect().setDescription(name+' schema headers');
  }
  const settings=ss.getSheetByName(TABS.settings);
  settings.getRange(2,1,5,2).setValues([['schema_version','1'],['data_version','1'],['last_published_at',''],['service_area','Coimbatore'],['timezone','Asia/Kolkata']]);
  const timings=ss.getSheetByName(TABS.timings);
  const timingHeaders=REQUIRED['Prayer Timings'];
  for(const prayer of PRAYERS){
    const adhan=timingHeaders.indexOf(prayer+'_adhan')+1, iqamah=timingHeaders.indexOf(prayer+'_iqamah')+1;
    const type=timingHeaders.indexOf(prayer+'_iqamah_type')+1, offset=timingHeaders.indexOf(prayer+'_iqamah_offset_min')+1;
    for(const col of [adhan,iqamah]){const letter=String.fromCharCode(64+col);const rule=SpreadsheetApp.newDataValidation().requireFormulaSatisfied('=REGEXMATCH(TO_TEXT('+letter+'2),"^([01][0-9]|2[0-3]):[0-5][0-9]$")').setAllowInvalid(false).setHelpText('Enter HH:mm in 24-hour time.').build();timings.getRange(2,col,500,1).setNumberFormat('@').setDataValidation(rule);}
    timings.getRange(2,offset,500,1).setNumberFormat('0').setDataValidation(SpreadsheetApp.newDataValidation().requireNumberBetween(0,120).setAllowInvalid(false).build());
    timings.getRange(2,type,500,1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(prayer==='maghrib'?['fixed','after_adhan']:['fixed'],true).setAllowInvalid(false).build());
  }
  const masjidsSheet=ss.getSheetByName(TABS.masjids);
  masjidsSheet.getRange('K2:K501').setNumberFormat('@').setDataValidation(SpreadsheetApp.newDataValidation().requireFormulaSatisfied('=OR(K2="",REGEXMATCH(TO_TEXT(K2),"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"))').setAllowInvalid(false).setHelpText('Use YYYY-MM-DD or leave blank when unknown.').build());
  masjidsSheet.getRange('N2:Q501').setNumberFormat('@');
  timings.getRange('AA2:AA501').setDataValidation(SpreadsheetApp.newDataValidation().requireFormulaSatisfied('=OR(AA2="",REGEXMATCH(TO_TEXT(AA2),"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"))').setAllowInvalid(false).build());
  timings.getRange('Z2:Z501').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['fixed','seasonal','variable','unknown'],true).setAllowInvalid(false).build());
  timings.getRange('AB2:AC501').setNumberFormat('@');
  const history=ss.getSheetByName(TABS.history); history.protect().setDescription('Append-only SaffReady timing history');
  settings.protect().setDescription('SaffReady schema and publication metadata');
  timings.getRange('AB:AC').protect().setDescription('Updated timestamp and editor are maintained by the on-edit script');
  return 'Schema initialized. Add the 13 masjid rows and matching timing rows before deploying.';
}
function doGet() {
  const props = PropertiesService.getScriptProperties();
  try {
    const dataset = buildDataset_();
    const body = JSON.stringify(dataset);
    props.setProperty('LAST_VALID_DATASET', body);
    return json_({...dataset,sourceStale:false});
  } catch (err) {
    const previous = props.getProperty('LAST_VALID_DATASET');
    if (previous) return json_({...JSON.parse(previous),sourceStale:true});
    return json_({ error: 'Timetable validation failed', version: null, masjids: [] });
  }
}
function installTimingTrigger() {
  const ss=SpreadsheetApp.getActive();
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='recordTimingHistory').forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('recordTimingHistory').forSpreadsheet(ss).onEdit().create();
  return 'Owner-authorized on-edit trigger installed.';
}
function buildDataset_() {
  const id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if(!id)throw new Error('Run initializeSchema once from the bound spreadsheet.');
  const ss = SpreadsheetApp.openById(id);
  const settings = rows_(ss.getSheetByName(TABS.settings));
  const setting = Object.fromEntries(settings.map(r => [String(r.key), String(r.value || '')]));
  const mRows = rows_(ss.getSheetByName(TABS.masjids));
  const tRows = rows_(ss.getSheetByName(TABS.timings));
  if (!mRows.length || !tRows.length) throw new Error('Required rows are missing. Empty cells never delete existing records; fill every required field before publishing.');
  const activeRows=mRows.filter(r=>String(r.active).toLowerCase()!=='false');
  const allIds=new Set(mRows.map(r=>String(r.id)));
  if(allIds.size!==mRows.length)throw new Error('Duplicate masjid id in Masjids.');
  if(activeRows.length!==13)throw new Error('SaffReady currently expects exactly 13 active masjids.');
  const timings = new Map(tRows.map(r => [String(r.masjid_id), r]));
  if (timings.size !== tRows.length) throw new Error('Duplicate masjid_id in Prayer Timings.');
  if(tRows.some(r=>!allIds.has(String(r.masjid_id))))throw new Error('Orphan Prayer Timings row; every timing row must match a masjid.');
  const masjids = activeRows.map(m => {
    if(!m.id||!m.name_en)throw new Error('Masjid id and English name are required. Leave an unverified Tamil name blank.');
    if(m.observed_on&&!/^\\d{4}-\\d{2}-\\d{2}$/.test(m.observed_on))throw new Error('observed_on must be YYYY-MM-DD for '+m.id);
    const t = timings.get(String(m.id));
    if (!t) throw new Error('Missing Prayer Timings row for ' + m.id);
    const pattern = t.timing_pattern || 'unknown';
    if (!['fixed','seasonal','variable','unknown'].includes(pattern)) throw new Error('Invalid timing_pattern for ' + m.id);
    if(t.effective_from&&!/^\\d{4}-\\d{2}-\\d{2}$/.test(t.effective_from))throw new Error('effective_from must be YYYY-MM-DD for '+m.id);
    const handwritten=new Set(String(t.handwritten_prayers||'').split(',').map(x=>x.trim()).filter(Boolean));
    const unclear=new Set(String(t.unclear_prayers||'').split(',').map(x=>x.trim()).filter(Boolean));
    const prayers = PRAYERS.map(p => {
      const adhan = requiredTime_(t[p + '_adhan'], m.id + ' ' + p + ' adhan');
      const type=String(t[p+'_iqamah_type']||'fixed');let iqamah;
      if(type==='fixed'){if(String(t[p+'_iqamah_offset_min']||'').trim()!=='')throw new Error('Fixed offset must be blank: '+m.id+' '+p);iqamah=requiredTime_(t[p+'_iqamah'],m.id+' '+p+' iqamah')}
      else if(type==='after_adhan'){if(p!=='maghrib'||String(t[p+'_iqamah']||'').trim()!=='')throw new Error('Only Maghrib may use blank-time after_adhan: '+m.id);const offset=Number(t[p+'_iqamah_offset_min']);if(!Number.isInteger(offset)||offset<0||offset>120)throw new Error('Invalid after-Adhan offset: '+m.id);iqamah={type:'after_adhan',offsetMin:offset}}
      else throw new Error('Invalid Iqamah type: '+m.id+' '+p);
      return { prayer:p, adhan, iqamah, timingPattern:p==='jumuah'?'fixed':undefined, observedOn:m.observed_on || null, effectiveFrom:t.effective_from || null, source:m.source || 'noticeboard_photo', handwritten:handwritten.has(p), unclear:unclear.has(p) };
    });
    const lat = m.latitude === '' ? null : Number(m.latitude), lng = m.longitude === '' ? null : Number(m.longitude);
    if ((lat === null) !== (lng === null) || (lat !== null && (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat)>90 || Math.abs(lng)>180))) throw new Error('Invalid coordinate pair for ' + m.id);
    const extra=[['Ishraq','இஷ்ராக்',m.ishraq],['Sunrise','சூரிய உதயம்',m.sunrise],['Solar noon','நண்பகல்',m.solar_noon],['Sunset','சூரிய அஸ்தமனம்',m.sunset]].filter(x=>x[2]).map(x=>({name_en:x[0],name_ta:x[1],time:requiredTime_(x[2],String(m.id)+' '+x[0])}));
    return { id:String(m.id), name_en:String(m.name_en), name_ta:m.name_ta || null, mapsName:m.maps_name || null, affiliation:m.affiliation || null, address_ta:m.address || null, lat,lng,mapsUrl:m.maps_url || null, active:true, observedOn:m.observed_on || null, source:m.source || 'noticeboard_photo', notes:m.notes || null, timingPattern:pattern, updatedAt:t.updated_at || null, prayers, additionalObservances:extra };
  });
  if (masjids.length !== activeRows.length) throw new Error('Dataset record count mismatch.');
  return { version:setting.data_version || '1', publishedAt:setting.last_published_at || new Date().toISOString(), timezone:setting.timezone || 'Asia/Kolkata', masjids };
}
function requiredTime_(value, label) { const v=String(value || '').trim(); if (!TIME.test(v)) throw new Error('Missing or malformed HH:mm value: ' + label); return v; }
function rows_(sheet) { if (!sheet) throw new Error('Missing sheet tab.'); const values=sheet.getDataRange().getDisplayValues(); if (!values.length) throw new Error('Missing header row in ' + sheet.getName()); const expected=REQUIRED[sheet.getName()]; if (expected.some((x,i)=>values[0][i]!==x)) throw new Error('Unexpected columns in ' + sheet.getName()); return values.slice(1).filter(r=>r.some(v=>v!=='')).map(row=>Object.fromEntries(expected.map((key,i)=>[key,row[i] || '']))); }
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }

// Installable onEdit trigger: snapshots changed timetable cells to the append-only history tab.
function recordTimingHistory(e) {
  const sheet=e.range.getSheet(); if(![TABS.timings,TABS.masjids].includes(sheet.getName()) || e.range.getRow()<2) return;
  const ss=sheet.getParent(), history=ss.getSheetByName(TABS.history), headers=REQUIRED[sheet.getName()];
  const row=sheet.getRange(e.range.getRow(),1,1,headers.length).getDisplayValues()[0];
  const field=headers[e.range.getColumn()-1]; if(!field)return;
  if(sheet.getName()===TABS.timings && /(adhan|iqamah|effective_from|timing_pattern)/.test(field)){
    const id=row[0], prayer=field.startsWith('maghrib_')?'maghrib':field.split('_')[0];
    history.appendRow([id,prayer,field,e.oldValue || '',e.value || '',new Date(),Session.getActiveUser().getEmail() || '', 'Mobile sheet edit']);
    sheet.getRange(e.range.getRow(),28).setValue(new Date().toISOString());
    sheet.getRange(e.range.getRow(),29).setValue(Session.getActiveUser().getEmail() || 'Sheet editor');
  }
  const settings=rows_(ss.getSheetByName(TABS.settings)); const version=settings.find(r=>r.key==='data_version');
  if(version){const sheetSettings=ss.getSheetByName(TABS.settings); const values=sheetSettings.getDataRange().getDisplayValues(); const index=values.findIndex(r=>r[0]==='data_version'); sheetSettings.getRange(index+1,2).setValue(Number(version.value || 0)+1);}
  const settingSheet=ss.getSheetByName(TABS.settings), settingRows=settingSheet.getDataRange().getDisplayValues(), publishedIndex=settingRows.findIndex(r=>r[0]==='last_published_at'); if(publishedIndex>=0)settingSheet.getRange(publishedIndex+1,2).setValue(new Date().toISOString());
}
