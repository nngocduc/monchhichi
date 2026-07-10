const ADMIN_PASS = "monchhichi";    // 🔑 管理パスワードはここで変更

/* ================== ADMIN ================== */
const LONG_FIELDS = ['body','story','text'];
const SECTION_DEFS = [
  {key:'_settings', label:'⚙️ 全般'},
  {key:'timeline',  label:'📖 Story'},
  {key:'album',     label:'📸 Album'},
  {key:'collection',label:'🐒 Collection'},
  {key:'letters',   label:'💌 Letters'},
  {key:'playlist',  label:'🎵 Music'},
  {key:'secret',    label:'✨ Secret'},
];
let curSection = 'timeline', curIndex = 0;
const esc = v => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');

function isAdmin(){ return sessionStorage.getItem('olr_admin') === '1'; }
function setAdmin(on){
  if(on) sessionStorage.setItem('olr_admin','1'); else sessionStorage.removeItem('olr_admin');
  document.body.classList.toggle('admin', on);
}
function openLogin(){
  $('#loginErr').textContent = '';
  $('#loginPass').value = '';
  $('#loginModal').classList.add('open');
  setTimeout(()=>$('#loginPass').focus(), 100);
}
function closeLogin(){ $('#loginModal').classList.remove('open'); }
function tryLogin(){
  if($('#loginPass').value === ADMIN_PASS){
    closeLogin(); setAdmin(true); heartsRain(15);
  } else {
    $('#loginErr').textContent = 'パスワードが違うよ 🙈';
    $('#loginPass').select();
  }
}
$('#adminLink').addEventListener('click', ()=>{
  if(isAdmin()){ openEditor(); return; }
  openLogin();
});
$('#loginSubmit').addEventListener('click', tryLogin);
$('#loginPass').addEventListener('keydown', e=>{ if(e.key==='Enter') tryLogin(); });
$('#loginCancel').addEventListener('click', closeLogin);
$('#loginModal').addEventListener('click', e=>{ if(e.target.id==='loginModal') closeLogin(); });
$('#adminLogout').addEventListener('click', ()=>setAdmin(false));
$('#adminEdit').addEventListener('click', openEditor);
$('#adminExport').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(DATA,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'our-little-room-data.json'; a.click();
  URL.revokeObjectURL(a.href);
});
function isPlainObject(v){
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v);
}
function isValidImportData(d){
  if(!isPlainObject(d)) return false;
  if(typeof d.anniversary !== 'string' || typeof d.signature !== 'string') return false;
  const listKeys = ['timeline','album','collection','letters','playlist'];
  if(!listKeys.every(k => Array.isArray(d[k]) && d[k].every(isPlainObject))) return false;
  if(!isPlainObject(d.secret) || !Array.isArray(d.secret.fail)) return false;
  return true;
}
$('#adminImport').addEventListener('change', e=>{
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = ()=>{
    let parsed;
    try{ parsed = JSON.parse(r.result); }
    catch(err){ toast('JSONファイルが正しくありません ✗'); return; }
    if(!isValidImportData(parsed)){
      toast('JSONの形式が正しくありません（必要な項目が不足） ✗');
      return;
    }
    DATA = parsed; persist(); toast('データをインポートしました ✔');
  };
  r.readAsText(f); e.target.value = '';
});
let resetArmed = false, resetTimer;
$('#adminReset').addEventListener('click', ()=>{
  if(!resetArmed){
    resetArmed = true;
    toast('もう一度押すと初期化します（編集内容は消えます）');
    clearTimeout(resetTimer);
    resetTimer = setTimeout(()=>{ resetArmed = false; }, 4000);
    return;
  }
  resetArmed = false;
  DATA = currentStore.reset(DEFAULT_DATA);
  renderAll(); revealAll(); toast('初期状態に戻しました ✔');
});

function toast(msg){
  const t = $('#edToast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 1600);
}

function openEditor(){
  $('#editorModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  drawTabs(); drawEditor();
}
function closeEditor(){
  $('#editorModal').classList.remove('open');
  document.body.style.overflow = '';
}
$('#editorModal').addEventListener('click', e=>{ if(e.target.id==='editorModal') closeEditor(); });

function drawTabs(){
  $('#edTabs').innerHTML = SECTION_DEFS.map(s=>
    `<button class="ed-tab ${s.key===curSection?'on':''}" data-k="${s.key}">${s.label}</button>`).join('');
  document.querySelectorAll('.ed-tab').forEach(b=>b.addEventListener('click', ()=>{
    curSection = b.dataset.k; curIndex = 0; drawTabs(); drawEditor();
  }));
}
function fieldInput(key, val){
  if(LONG_FIELDS.includes(key) || String(val ?? '').includes('\n'))
    return `<label>${key}<textarea data-f="${key}" rows="5">${esc(val)}</textarea></label>`;
  return `<label>${key}<input data-f="${key}" value="${esc(val)}"></label>`;
}
function drawEditor(){
  const box = $('#edBody');
  if(curSection === '_settings'){
    box.innerHTML = fieldInput('anniversary', DATA.anniversary)
      + fieldInput('signature', DATA.signature)
      + `<button class="ed-save" onclick="saveSettings()">💾 保存</button>`;
    return;
  }
  if(curSection === 'secret'){
    const s = DATA.secret || {};
    box.innerHTML = fieldInput('success', s.success)
      + `<label>fail（1行に1つ）<textarea data-f="fail" rows="4">${esc((s.fail||[]).join('\n'))}</textarea></label>`
      + fieldInput('monchhichi5', s.monchhichi5)
      + fieldInput('typeLove', s.typeLove)
      + `<button class="ed-save" onclick="saveSecret()">💾 保存</button>`;
    return;
  }
  const arr = DATA[curSection] || (DATA[curSection] = []);
  if(curIndex >= arr.length) curIndex = Math.max(0, arr.length - 1);
  const item = arr[curIndex];
  box.innerHTML =
    `<div class="ed-items">`
    + arr.map((it,i)=>`<button class="ed-item ${i===curIndex?'on':''}" data-i="${i}">${i+1}</button>`).join('')
    + `<button class="ed-item" id="edAdd" title="項目を追加">＋</button></div>`
    + (item
        ? Object.keys(item).map(k=>fieldInput(k, item[k])).join('')
          + `<div class="ed-actions">
               <button class="ed-save" onclick="saveItem()">💾 この項目を保存</button>
               <button class="ed-del" onclick="delItem()">🗑 項目を削除</button>
             </div>`
        : '<p style="color:var(--ink-soft)">項目がまだありません — ＋で追加してね。</p>');
  document.querySelectorAll('.ed-item[data-i]').forEach(b=>b.addEventListener('click', ()=>{
    curIndex = +b.dataset.i; drawEditor();
  }));
  const add = $('#edAdd');
  if(add) add.addEventListener('click', ()=>{
    const tplSrc = arr[0] || (DEFAULT_DATA[curSection]||[])[0] || {};
    arr.push(Object.fromEntries(Object.keys(tplSrc).map(k=>[k,''])));
    curIndex = arr.length - 1; drawEditor();
  });
}
function readFields(){
  const o = {};
  document.querySelectorAll('#edBody [data-f]').forEach(el=>o[el.dataset.f] = el.value);
  return o;
}
function saveSettings(){
  const o = readFields();
  DATA.anniversary = o.anniversary; DATA.signature = o.signature;
  persist(); toast('保存しました ✔');
}
function saveSecret(){
  const o = readFields();
  DATA.secret = { success:o.success, fail:o.fail.split('\n').filter(Boolean),
                  monchhichi5:o.monchhichi5, typeLove:o.typeLove };
  persist(); toast('保存しました ✔');
}
function saveItem(){
  Object.assign(DATA[curSection][curIndex], readFields());
  persist(); toast('保存しました ✔');
}
function delItem(){
  if(!confirm('この項目を削除する？')) return;
  DATA[curSection].splice(curIndex, 1);
  curIndex = 0; persist(); drawEditor(); toast('削除しました ✔');
}

if(isAdmin()) document.body.classList.add('admin');
