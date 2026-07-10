function escapeHTML(v){
  return String(v ?? '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function safeHttpUrl(value){
  if(!value) return '';
  try{
    const url = new URL(String(value), window.location.href);
    if(url.protocol === 'http:' || url.protocol === 'https:') return url.href;
  }catch(e){}
  return '';
}

function renderAll(){
const e = escapeHTML;

/* render timeline */
$('#timeline').innerHTML = DATA.timeline.map(t=>`
  <div class="tl-item reveal">
    <span class="tl-date">${e(t.date)}</span>
    <div class="tl-card"><span class="emoji">${e(t.emoji)}</span>
      <h3>${e(t.title)}</h3><p>${e(t.text)}</p>
    </div>
  </div>`).join('');

/* render album */
$('#albumGrid').innerHTML = DATA.album.map(a=>`
  <div class="polaroid reveal" onclick="this.classList.toggle('flipped')">
    <div class="tape"></div>
    <div class="polaroid-inner">
      <div class="pol-face">
        <div class="pol-photo">${a.img?`<img src="${e(a.img)}" alt="" loading="lazy">`:e(a.emoji)}</div>
        <div class="pol-caption hand">${e(a.caption)}</div>
      </div>
      <div class="pol-face back">
        <span class="hand">${e(a.story)}</span>
        <small>📍 ${e(a.date)}</small>
      </div>
    </div>
  </div>`).join('');

/* render collection */
$('#collGrid').innerHTML = DATA.collection.map(c=>`
  <div class="coll-card reveal">
    <span class="doll">${e(c.doll)}</span>
    <h3>${e(c.name)}</h3>
    <div class="meta">${e(c.meta)}</div>
    <p>${e(c.story)}</p>
  </div>`).join('');

/* render letters */
$('#lettersGrid').innerHTML = DATA.letters.map((l,i)=>`
  <div class="envelope reveal" onclick="openLetter(${i})">
    <span class="seal">${e(l.seal)}</span>
    <h3>${e(l.when)}</h3>
    <span class="hand">${e(l.note)}</span>
  </div>`).join('');

/* render playlist */
$('#playlist').innerHTML = DATA.playlist.map(p=>`
  <div class="track reveal">
    <div class="cover">${e(p.emoji)}</div>
    <div class="info"><b>${e(p.song)}</b><span>${e(p.artist)}</span></div>
    <div class="eq"><i></i><i></i><i></i></div>
    <div class="note">${e(p.note)}</div>
  </div>`).join('');

document.querySelectorAll('#playlist .track').forEach((el, i)=>{
  const url = safeHttpUrl((DATA.playlist[i] || {}).url);
  if(!url) return;
  el.addEventListener('click', ()=>window.open(url, '_blank', 'noopener'));
});

  updateDays();
}

/* letter modal */
function openLetter(i){
  const l = DATA.letters[i];
  $('#mTitle').textContent = l.title;
  $('#mBody').textContent = l.body;
  $('#mSign').textContent = DATA.signature;
  $('#modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(){
  $('#modal').classList.remove('open');
  document.body.style.overflow = '';
}
