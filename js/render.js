function renderAll(){
/* render timeline */
$('#timeline').innerHTML = DATA.timeline.map(t=>`
  <div class="tl-item reveal">
    <span class="tl-date">${t.date}</span>
    <div class="tl-card"><span class="emoji">${t.emoji}</span>
      <h3>${t.title}</h3><p>${t.text}</p>
    </div>
  </div>`).join('');

/* render album */
$('#albumGrid').innerHTML = DATA.album.map(a=>`
  <div class="polaroid reveal" onclick="this.classList.toggle('flipped')">
    <div class="tape"></div>
    <div class="polaroid-inner">
      <div class="pol-face">
        <div class="pol-photo">${a.img?`<img src="${a.img}" alt="" loading="lazy">`:a.emoji}</div>
        <div class="pol-caption hand">${a.caption}</div>
      </div>
      <div class="pol-face back">
        <span class="hand">${a.story}</span>
        <small>📍 ${a.date}</small>
      </div>
    </div>
  </div>`).join('');

/* render collection */
$('#collGrid').innerHTML = DATA.collection.map(c=>`
  <div class="coll-card reveal">
    <span class="doll">${c.doll}</span>
    <h3>${c.name}</h3>
    <div class="meta">${c.meta}</div>
    <p>${c.story}</p>
  </div>`).join('');

/* render letters */
$('#lettersGrid').innerHTML = DATA.letters.map((l,i)=>`
  <div class="envelope reveal" onclick="openLetter(${i})">
    <span class="seal">${l.seal}</span>
    <h3>${l.when}</h3>
    <span class="hand">${l.note}</span>
  </div>`).join('');

/* render playlist */
$('#playlist').innerHTML = DATA.playlist.map(p=>`
  <div class="track reveal" ${p.url?`onclick="window.open('${p.url}','_blank')"`:''}>
    <div class="cover">${p.emoji}</div>
    <div class="info"><b>${p.song}</b><span>${p.artist}</span></div>
    <div class="eq"><i></i><i></i><i></i></div>
    <div class="note">${p.note}</div>
  </div>`).join('');

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
