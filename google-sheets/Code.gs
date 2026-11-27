// SaffReady read-only JSON publisher. Bind this project to the private timetable spreadsheet.
const TABS = { masjids: 'Masjids', timings: 'Prayer Timings', history: 'Timing History', settings: 'Settings' };
const PRAYERS=['fajr','dhuhr','asr','maghrib','isha','jumuah'];
const REQUIRED = {
  Masjids: ['id','name_en','name_ta','maps_name','affiliation','address','latitude','longitude','maps_url','active','observed_on','source','notes','ishraq','sunrise','solar_noon','sunset'],
  'Prayer Timings': ['masjid_id',...PRAYERS.flatMap(p=>[p+'_adhan',p+'_iqamah',p+'_iqamah_type',p+'_iqamah_offset_min']),'timing_pattern','effective_from','updated_at','updated_by','notes','handwritten_prayers','unclear_prayers',...PRAYERS.flatMap(p=>[p+'_fixed',p+'_fixed_basis',p+'_fixed_checked_on'])],
  'Timing History': ['masjid_id','prayer','field_changed','previous_value','new_value','changed_at','changed_by','reason'],
  Settings: ['key','value']
};
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const VERIFIED_MASJID_FIELDS = ['name_en','name_ta'];
const VERIFIED_TIMING_FIELDS = [...PRAYERS.flatMap(p=>[p+'_adhan',p+'_iqamah',p+'_iqamah_type',p+'_iqamah_offset_min']),'timing_pattern','effective_from','handwritten_prayers','unclear_prayers'];
const FIXED_METADATA_FIELDS = PRAYERS.flatMap(p=>[p+'_fixed',p+'_fixed_basis',p+'_fixed_checked_on']);
const PUBLISHED_MASJID_FIELDS = ['name_en','name_ta','maps_name','affiliation','address','latitude','longitude','maps_url','active','observed_on','source','notes','ishraq','sunrise','solar_noon','sunset'];
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
    for(const col of [adhan,iqamah]){const letter=String.fromCharCode(64+col),condition=prayer==='jumuah'?'OR('+letter+'2="",REGEXMATCH(TO_TEXT('+letter+'2),"^([01][0-9]|2[0-3]):[0-5][0-9]$"))':'REGEXMATCH(TO_TEXT('+letter+'2),"^([01][0-9]|2[0-3]):[0-5][0-9]$")';const rule=SpreadsheetApp.newDataValidation().requireFormulaSatisfied('='+condition).setAllowInvalid(false).setHelpText(prayer==='jumuah'?'Enter HH:mm or leave both Jumu’ah times blank.':'Enter HH:mm in 24-hour time.').build();timings.getRange(2,col,500,1).setNumberFormat('@').setDataValidation(rule);}
    timings.getRange(2,offset,500,1).setNumberFormat('0').setDataValidation(SpreadsheetApp.newDataValidation().requireNumberBetween(0,120).setAllowInvalid(false).build());
    timings.getRange(2,type,500,1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(prayer==='maghrib'?['fixed','after_adhan']:['fixed'],true).setAllowInvalid(false).build());
  }
  const masjidsSheet=ss.getSheetByName(TABS.masjids);
  masjidsSheet.getRange('K2:K501').setNumberFormat('@').setDataValidation(SpreadsheetApp.newDataValidation().requireFormulaSatisfied('=OR(K2="",REGEXMATCH(TO_TEXT(K2),"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"))').setAllowInvalid(false).setHelpText('Use YYYY-MM-DD or leave blank when unknown.').build());
  masjidsSheet.getRange('N2:Q501').setNumberFormat('@');
  timings.getRange('AA2:AA501').setDataValidation(SpreadsheetApp.newDataValidation().requireFormulaSatisfied('=OR(AA2="",REGEXMATCH(TO_TEXT(AA2),"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"))').setAllowInvalid(false).build());
  timings.getRange('Z2:Z501').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['fixed','seasonal','variable','unknown'],true).setAllowInvalid(false).build());
  timings.getRange('AB2:AC501').setNumberFormat('@');
  for(const prayer of PRAYERS){
    const fixed=timingHeaders.indexOf(prayer+'_fixed')+1, checked=timingHeaders.indexOf(prayer+'_fixed_checked_on')+1;
    const fixedLetter=columnLetter_(fixed), checkedLetter=columnLetter_(checked);
    timings.getRange(2,fixed,500,1).setDataValidation(SpreadsheetApp.newDataValidation().requireFormulaSatisfied('=OR('+fixedLetter+'2="",UPPER(TO_TEXT('+fixedLetter+'2))="TRUE",UPPER(TO_TEXT('+fixedLetter+'2))="FALSE")').setAllowInvalid(false).setHelpText('Use TRUE, FALSE, or leave blank when not verified.').build());
    timings.getRange(2,checked,500,1).setNumberFormat('@').setDataValidation(SpreadsheetApp.newDataValidation().requireFormulaSatisfied('=OR('+checkedLetter+'2="",REGEXMATCH(TO_TEXT('+checkedLetter+'2),"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"))').setAllowInvalid(false).setHelpText('Use YYYY-MM-DD or leave blank until verified.').build());
  }
  const history=ss.getSheetByName(TABS.history); history.protect().setDescription('Append-only SaffReady timing history');
  settings.protect().setDescription('SaffReady schema and publication metadata');
  timings.getRange('AB:AC').protect().setDescription('Updated timestamp and editor are maintained by the on-edit script');
  return 'Schema initialized. Add each active masjid and its matching timing row before deploying.';
}
function doGet() {
  const props = PropertiesService.getScriptProperties();
  let stage = 'buildDataset_';
  try {
    const dataset = buildDataset_();
    stage = 'JSON.stringify';
    const body = JSON.stringify(dataset);
    stage = 'LAST_VALID_DATASET.setProperty';
    props.setProperty('LAST_VALID_DATASET', body);
    stage = 'response construction';
    return json_({...dataset,sourceStale:false});
  } catch (err) {
    // Log only the failed operation and a stable category, never exception text.
    console.error('SaffReady publisher failure stage=' + stage + ' category=' + safePublisherErrorCategory_(stage,err));
    const previous = props.getProperty('LAST_VALID_DATASET');
    if (previous) return json_({...JSON.parse(previous),sourceStale:true});
    return json_({ error: 'Timetable validation failed', version: null, masjids: [] });
  }
}
function safePublisherErrorCategory_(stage,err) {
  if(stage==='buildDataset_')return classifyPublisherFailure_(err);
  if(stage==='JSON.stringify')return 'SERIALIZATION_ERROR';
  if(stage==='LAST_VALID_DATASET.setProperty')return 'SCRIPT_PROPERTY_WRITE_ERROR';
  if(stage==='response construction')return 'RESPONSE_CONSTRUCTION_ERROR';
  return 'UNCLASSIFIED_PUBLISHER_FAILURE';
}
function classifyPublisherFailure_(err) {
  const message=err && err.message ? String(err.message) : '';
  const exact={
    'Run initializeSchema once from the bound spreadsheet.':'MISSING_SPREADSHEET_ID_PROPERTY',
    'Required rows are missing. Empty cells never delete existing records; fill every required field before publishing.':'EMPTY_MASJID_OR_TIMING_ROWS',
    'Duplicate masjid id in Masjids.':'DUPLICATE_MASJID_ID',
    'At least one active masjid is required.':'NO_ACTIVE_MASJIDS',
    'Duplicate masjid_id in Prayer Timings.':'DUPLICATE_TIMING_MASJID_ID',
    'Orphan Prayer Timings row; every timing row must match a masjid.':'ORPHAN_TIMING_ROW',
    'Masjid id and English name are required. Leave an unverified Tamil name blank.':'MISSING_MASJID_ID_OR_ENGLISH_NAME',
    'Dataset record count mismatch.':'DATASET_RECORD_COUNT_MISMATCH',
  };
  if(exact[message])return exact[message];
  if(message.startsWith('observed_on must be YYYY-MM-DD'))return 'INVALID_OBSERVED_ON_FORMAT';
  if(message.startsWith('effective_from must be YYYY-MM-DD'))return 'INVALID_EFFECTIVE_FROM_FORMAT';
  if(message.startsWith('Invalid timetable value for '))return 'INVALID_TIMETABLE_VALUE';
  if(message.startsWith('Missing or malformed HH:mm value: '))return 'MISSING_OR_INVALID_PRAYER_TIME';
  if(message.startsWith('Missing Prayer Timings row for '))return 'MISSING_TIMING_ROW';
  if(message.startsWith('Invalid timing_pattern for '))return 'INVALID_TIMING_PATTERN';
  if(message.startsWith('Invalid Iqamah type: '))return 'INVALID_IQAMAH_TYPE';
  if(message.startsWith('Invalid coordinate pair for '))return 'INVALID_COORDINATE_PAIR';
  if(message.startsWith('Invalid after-Adhan offset: '))return 'INVALID_AFTER_ADHAN_OFFSET';
  if(message.startsWith('Fixed offset must be blank: '))return 'FIXED_IQAMAH_OFFSET_NOT_BLANK';
  if(message.startsWith('Only Maghrib may use blank-time after_adhan: '))return 'INVALID_AFTER_ADHAN_CONFIGURATION';
  if(message.startsWith('Missing sheet tab.'))return 'MISSING_REQUIRED_SHEET_TAB';
  if(message.startsWith('Missing header row in '))return 'MISSING_SHEET_HEADER_ROW';
  if(message.startsWith('Unexpected columns in '))return 'UNEXPECTED_SHEET_COLUMNS';
  return 'UNCLASSIFIED_PUBLISHER_FAILURE';
}
function installTimingTrigger() {
  const ss=SpreadsheetApp.getActive();
  // Apps Script returns only triggers owned by the current account. This cleanup
  // intentionally leaves triggers created by every other account untouched.
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='recordTimingHistory').forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('recordTimingHistory').forSpreadsheet(ss).onEdit().create();
  return 'Owner-authorized on-edit trigger installed.';
}
function onOpen() {
  SpreadsheetApp.getUi().createMenu('SaffReady Admin')
    .addItem('Verify unchanged timetable…', 'promptUnchangedVerification_')
    .addToUi();
}
function promptUnchangedVerification_() {
  requireVerificationAdmin_();
  const ui=SpreadsheetApp.getUi();
  const answer=ui.prompt('Verify unchanged timetable', 'Enter the exact masjid id after physically checking its noticeboard:', ui.ButtonSet.OK_CANCEL);
  if(answer.getSelectedButton()!==ui.Button.OK)return;
  verifyMasjidUnchanged(answer.getResponseText().trim());
  ui.alert('Verification recorded.');
}
function requireVerificationAdmin_() {
  const configured=PropertiesService.getScriptProperties().getProperty('VERIFICATION_ADMIN_EMAIL');
  const active=(Session.getActiveUser().getEmail()||'').trim().toLowerCase();
  if(!configured || !active || active!==configured.trim().toLowerCase()) throw new Error('Verification is restricted to the configured timetable administrator.');
}
// Private spreadsheet action. Deliberately absent from doGet and all web routes.
function verifyMasjidUnchanged(masjidId) {
  requireVerificationAdmin_();
  const id=String(masjidId||'').trim();
  if(!id)throw new Error('A masjid id is required.');
  const lock=LockService.getDocumentLock();
  if(!lock.tryLock(10000))throw new Error('Could not acquire verification lock. Retry the action.');
  try {
    const ss=SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'));
    const masjids=ss.getSheetByName(TABS.masjids), values=masjids.getDataRange().getDisplayValues();
    const matches=[];
    values.forEach((r,index)=>{if(index>0 && r[0]===id)matches.push(index);});
    if(matches.length!==1)throw new Error(matches.length===0?'Unknown masjid id: '+id:'Duplicate masjid id: '+id);
    const row=matches[0];
    const history=ss.getSheetByName(TABS.history);
    if(!history)throw new Error('Missing private Timing History sheet.');
    const today=Utilities.formatDate(new Date(),'Asia/Kolkata','yyyy-MM-dd');
    const observed=masjids.getRange(row+1,11);
    observed.setNumberFormat('@'); observed.setValue(today);
    // Existing Timing History schema is retained; private result uses new_value.
    history.appendRow([id,'','verification',values[row][10]||'', 'unchanged',today,Session.getActiveUser().getEmail(),'Physical noticeboard check']);
    return today;
  } finally { lock.releaseLock(); }
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
  if(allIds.size!==mRows.length){const seen=new Set();const duplicate=mRows.find(row=>{const key=String(row.id);if(seen.has(key))return true;seen.add(key);return false;});throw new Error('Invalid timetable value for '+(duplicate.name_en||'Unknown Masjid')+' ('+duplicate.id+'), field id, value "'+duplicate.id+'"; expected a unique Masjid ID.');}
  if(!activeRows.length)throw new Error('At least one active masjid is required.');
  const timings = new Map(tRows.map(r => [String(r.masjid_id), r]));
  if (timings.size !== tRows.length){const seen=new Set();const duplicate=tRows.find(row=>{const key=String(row.masjid_id);if(seen.has(key))return true;seen.add(key);return false;});throw new Error('Invalid timetable value for '+(mRows.find(row=>String(row.id)===String(duplicate.masjid_id))?.name_en||'Unknown Masjid')+' ('+duplicate.masjid_id+'), field masjid_id, value "'+duplicate.masjid_id+'"; expected exactly one Prayer Timings row per Masjid.');}
  const orphan=tRows.find(r=>!allIds.has(String(r.masjid_id)));
  if(orphan)throw new Error('Invalid timetable value for Unknown Masjid ('+orphan.masjid_id+'), field masjid_id, value "'+orphan.masjid_id+'"; expected an ID present in the Masjids sheet.');
  const warnings=[];
  const previous=JSON.parse(PropertiesService.getScriptProperties().getProperty('LAST_VALID_DATASET')||'{"masjids":[]}');
  const previousById=new Map((previous.masjids||[]).map(m=>[String(m.id),m]));
  const masjids = activeRows.map(m => {
    if(!m.id||!m.name_en)throw new Error('Invalid timetable value for '+(m.name_en||'Unknown Masjid')+' ('+(m.id||'missing ID')+'), field id/name_en, value "'+(m.id||m.name_en||'')+'"; expected a Masjid ID and English name.');
    if(m.observed_on&&!validDate_(m.observed_on))throw new Error('Invalid timetable value for '+m.name_en+' ('+m.id+'), field observed_on, value "'+m.observed_on+'"; expected a real date in YYYY-MM-DD format.');
    const t = timings.get(String(m.id));
    if (!t) throw new Error('Invalid timetable value for '+m.name_en+' ('+m.id+'), field masjid_id, value ""; expected one matching Prayer Timings row.');
    const pattern = t.timing_pattern || 'unknown';
    if (!['fixed','seasonal','variable','unknown'].includes(pattern)) throw new Error('Invalid timing_pattern for ' + m.id);
    if(t.effective_from&&!validDate_(t.effective_from))throw new Error('Invalid timetable value for '+m.name_en+' ('+m.id+'), field effective_from, value "'+t.effective_from+'"; expected a real date in YYYY-MM-DD format.');
    const handwritten=new Set(String(t.handwritten_prayers||'').split(',').map(x=>x.trim()).filter(Boolean));
    const unclear=new Set(String(t.unclear_prayers||'').split(',').map(x=>x.trim()).filter(Boolean));
    const prayers = PRAYERS.map(p => {
      const label=m.name_en+' ('+m.id+'), prayer '+p;
      const adhanRaw=String(t[p+'_adhan']||'').trim(), iqamahRaw=String(t[p+'_iqamah']||'').trim();
      let adhan=null, iqamah=null;
      if(p!=='jumuah'||adhanRaw||iqamahRaw){
        adhan=requiredTime_(adhanRaw,label,'adhan');
        const type=String(t[p+'_iqamah_type']||'fixed');
        if(type==='fixed'){
          if(String(t[p+'_iqamah_offset_min']||'').trim()!=='')invalidValue_(label,'iqamah_offset_min',t[p+'_iqamah_offset_min'],'blank when iqamah_type is fixed');
          iqamah=requiredTime_(iqamahRaw,label,'iqamah');
          if(minutes_(iqamah)<minutes_(adhan)&&minutes_(iqamah)+1440-minutes_(adhan)>120)invalidValue_(label,'iqamah',iqamah,'at or after Adhan, or within 120 minutes after midnight');
        } else if(type==='after_adhan'){
          if(p!=='maghrib'||iqamahRaw)invalidValue_(label,'iqamah_type',type,'after_adhan only for Maghrib with a blank iqamah time');
          const raw=String(t[p+'_iqamah_offset_min']||'').trim(), offset=Number(raw);
          if(raw===''||!Number.isInteger(offset)||offset<0||offset>120)invalidValue_(label,'iqamah_offset_min',raw,'an integer from 0 through 120');
          iqamah={type:'after_adhan',offsetMin:offset};
        } else invalidValue_(label,'iqamah_type',type,'fixed, or after_adhan for Maghrib');
      }
      const fixedRaw=String(t[p+'_fixed']||'').trim().toUpperCase();
      if(fixedRaw!==''&&fixedRaw!=='TRUE'&&fixedRaw!=='FALSE')invalidValue_(label,'fixed',t[p+'_fixed'],'TRUE, FALSE, or blank when unknown');
      const fixed=fixedRaw===''?null:fixedRaw==='TRUE';
      const fixedBasis=String(t[p+'_fixed_basis']||'').trim()||null;
      const fixedCheckedOn=String(t[p+'_fixed_checked_on']||'').trim()||null;
      if(fixedCheckedOn&&!validDate_(fixedCheckedOn))invalidValue_(label,'fixed_checked_on',fixedCheckedOn,'a real date in YYYY-MM-DD format');
      if(fixed===true&&(!fixedBasis||!fixedCheckedOn))invalidValue_(label,'fixed/fixed_basis/fixed_checked_on',[fixedRaw,fixedBasis,fixedCheckedOn],'TRUE requires a confirmation source and verification date');
      if(p==='jumuah'&&fixed===true&&!adhan)invalidValue_(label,'adhan/iqamah/fixed','TRUE with blank Jumuah timings','complete Jumuah Adhan and Iqamah values before confirming fixed status');
      const old=(previousById.get(String(m.id))?.prayers||[]).find(x=>x.prayer===p);
      if(old&&adhan&&old.adhan&&Math.abs(timeDelta_(adhan,old.adhan))>15)warnings.push('Timing changed by more than 15 minutes: '+label+' adhan ('+old.adhan+' → '+adhan+'). Verify the source.');
      const oldIqamah=old&&resolvedIqamah_(old.iqamah,old.adhan);
      const currentIqamah=resolvedIqamah_(iqamah,adhan);
      if(oldIqamah&&currentIqamah&&Math.abs(timeDelta_(currentIqamah,oldIqamah))>15)warnings.push('Timing changed by more than 15 minutes: '+label+' iqamah ('+oldIqamah+' → '+currentIqamah+'). Verify the source.');
      if(adhan&&currentIqamah&&minutes_(currentIqamah)-minutes_(adhan)>120)warnings.push('Unusually long Adhan-to-Iqamah interval: '+label+' ('+Math.round((minutes_(currentIqamah)-minutes_(adhan))/60)+' hours). Verify the source.');
      if(p==='maghrib'&&adhan&&m.sunset&&TIME.test(m.sunset)){const delta=minutes_(adhan)-minutes_(m.sunset);if(delta < -10||delta>60)warnings.push('Maghrib Adhan differs from the recorded local sunset by '+delta+' minutes for '+label+'. Local and seasonal variation is expected; please verify the noticeboard and sunset value.');}
      return { prayer:p, adhan, iqamah, timingPattern:p==='jumuah'?'fixed':undefined, observedOn:m.observed_on || null, effectiveFrom:t.effective_from || null, source:m.source || 'noticeboard_photo', handwritten:handwritten.has(p), unclear:unclear.has(p), fixed, fixedBasis, fixedCheckedOn };
    });
    const lat = m.latitude === '' ? null : Number(m.latitude), lng = m.longitude === '' ? null : Number(m.longitude);
    if ((lat === null) !== (lng === null) || (lat !== null && (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat)>90 || Math.abs(lng)>180))) throw new Error('Invalid coordinate pair for ' + m.id);
    const extra=[['Ishraq','இஷ்ராக்',m.ishraq],['Sunrise','சூரிய உதயம்',m.sunrise],['Solar noon','நண்பகல்',m.solar_noon],['Sunset','சூரிய அஸ்தமனம்',m.sunset]].filter(x=>x[2]).map(x=>({name_en:x[0],name_ta:x[1],time:requiredTime_(x[2],m.name_en+' ('+m.id+'), field '+x[0],'time')}));
    return { id:String(m.id), name_en:String(m.name_en), name_ta:m.name_ta || null, mapsName:m.maps_name || null, affiliation:m.affiliation || null, address_ta:m.address || null, lat,lng,mapsUrl:m.maps_url || null, active:true, observedOn:m.observed_on || null, source:m.source || 'noticeboard_photo', notes:m.notes || null, timingPattern:pattern, updatedAt:t.updated_at || null, prayers, additionalObservances:extra };
  });
  if (masjids.length !== activeRows.length) throw new Error('Dataset record count mismatch.');
  warnings.forEach(w=>console.warn('SaffReady publisher warning: '+w));
  return { version:setting.data_version || '1', publishedAt:setting.last_published_at || new Date().toISOString(), timezone:setting.timezone || 'Asia/Kolkata', masjids, validationWarnings:warnings };
}
function requiredTime_(value, label, field) { const v=String(value || '').trim(); if (!TIME.test(v)) invalidValue_(label,field||'time',v,'a required 24-hour HH:mm time'); return v; }
function invalidValue_(label,field,value,expected){throw new Error('Invalid timetable value for '+label+', field '+field+', value "'+String(value)+'"; expected '+expected+'.');}
function minutes_(value){const parts=String(value).split(':').map(Number);return parts[0]*60+parts[1];}
function timeDelta_(a,b){const delta=minutes_(a)-minutes_(b);return Math.sign(delta)*Math.min(Math.abs(delta),1440-Math.abs(delta));}
function resolvedIqamah_(value,adhan){if(typeof value==='string'&&TIME.test(value))return value;if(value&&typeof value==='object'&&value.type==='after_adhan'&&TIME.test(adhan||'')){const total=minutes_(adhan)+value.offsetMin;return ('0'+Math.floor((total%1440)/60)).slice(-2)+':'+('0'+(total%60)).slice(-2);}return null;}
function validDate_(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value)))return false;const d=new Date(String(value)+'T00:00:00Z');return !isNaN(d.getTime())&&d.toISOString().slice(0,10)===value;}
function columnLetter_(column){let letter='';while(column){const remainder=(column-1)%26;letter=String.fromCharCode(65+remainder)+letter;column=Math.floor((column-1)/26);}return letter;}
function rows_(sheet) { if (!sheet) throw new Error('Missing sheet tab.'); const values=sheet.getDataRange().getDisplayValues(); if (!values.length) throw new Error('Missing header row in ' + sheet.getName()); const expected=REQUIRED[sheet.getName()]; if (!expected || values[0].length>expected.length || values[0].some((x,i)=>x!==expected[i])) throw new Error('Unexpected columns in ' + sheet.getName()); return values.slice(1).filter(r=>r.some(v=>v!=='')).map(row=>Object.fromEntries(expected.map((key,i)=>[key,row[i] || '']))); }
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }

// Installable onEdit trigger: preserves private history, updates one verified Masjid, and publishes feed edits.
function recordTimingHistory(e) {
  if (!e || !e.range) return;
  const sheet=e.range.getSheet(), tab=sheet.getName();
  if (![TABS.timings,TABS.masjids].includes(tab) || e.range.getRow()<2) return;
  const headers=REQUIRED[tab], firstCol=e.range.getColumn(), lastCol=firstCol+e.range.getNumColumns()-1;
  const touched=headers.slice(firstCol-1,lastCol);
  const verifiedFields=tab===TABS.timings?VERIFIED_TIMING_FIELDS:VERIFIED_MASJID_FIELDS;
  const touchesVerifiedField=touched.some(field=>verifiedFields.includes(field));
  const masjidFields=tab===TABS.masjids?PUBLISHED_MASJID_FIELDS:[];
  const timingFields=tab===TABS.timings?[...VERIFIED_TIMING_FIELDS,...FIXED_METADATA_FIELDS,'updated_at']:[];
  const isPublishedEdit=touched.some(field=>masjidFields.includes(field)||timingFields.includes(field));
  if (!isPublishedEdit) return;

  const rowCount=e.range.getNumRows(), columnCount=e.range.getNumColumns();
  const singleCell=rowCount===1 && columnCount===1;
  // Apps Script supplies oldValue/value only for single-cell edits. There is no
  // before-edit snapshot in this project, so a multi-cell edit cannot prove a delta.
  const oldValue=String(e.oldValue===undefined ? '' : e.oldValue);
  const newValue=String(e.value===undefined ? '' : e.value);
  const verifiedChange=singleCell && touchesVerifiedField && oldValue!==newValue;
  if(singleCell && touchesVerifiedField && !verifiedChange) return;

  const lock=LockService.getDocumentLock();
  if (!lock.tryLock(10000)) throw new Error('Could not acquire edit lock. Retry the edit.');
  try {
    const ss=sheet.getParent(), now=new Date(), editor=Session.getActiveUser().getEmail() || 'Sheet editor';
    const firstRow=e.range.getRow();
    for(let offset=0;offset<rowCount;offset++) {
      const rowIndex=firstRow+offset;
      const id=sheet.getRange(rowIndex,1).getDisplayValue(); if(!id)continue;
      if(tab===TABS.timings && verifiedChange) {
        const history=ss.getSheetByName(TABS.history);
        const field=headers[firstCol-1];
        const prayer=PRAYERS.find(p=>field.startsWith(p+'_')) || '';
        history.appendRow([id,prayer,field,oldValue,newValue,now,editor,'Mobile sheet edit']);
        // Column indices 28 and 29 are the publisher's updated_at/updated_by metadata.
        sheet.getRange(rowIndex,28).setValue(now.toISOString());
        sheet.getRange(rowIndex,29).setValue(editor);
      }
      if(verifiedChange) {
        const masjids=ss.getSheetByName(TABS.masjids), values=masjids.getDataRange().getDisplayValues();
        const match=values.findIndex((valuesRow,index)=>index>0 && valuesRow[0]===id);
        if(match>0) {
          const observedCell=masjids.getRange(match+1,11);
          observedCell.setNumberFormat('@');
          observedCell.setValue(Utilities.formatDate(now,'Asia/Kolkata','yyyy-MM-dd'));
        }
        // Keep a private audit event separate from the per-cell correction history.
        ss.getSheetByName(TABS.history).appendRow([id,'','verification','', 'changed',Utilities.formatDate(now,'Asia/Kolkata','yyyy-MM-dd'),editor,'Timetable correction verified']);
      }
    }
    const settings=ss.getSheetByName(TABS.settings), values=settings.getDataRange().getDisplayValues();
    const versionIndex=values.findIndex(r=>r[0]==='data_version'), publishedIndex=values.findIndex(r=>r[0]==='last_published_at');
    if(versionIndex>=0)settings.getRange(versionIndex+1,2).setValue(Number(values[versionIndex][1] || 0)+1);
    if(publishedIndex>=0)settings.getRange(publishedIndex+1,2).setValue(now.toISOString());
  } finally { lock.releaseLock(); }
}
