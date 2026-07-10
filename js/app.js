const currentStore = activeStore;
let DATA = currentStore.load(DEFAULT_DATA);

const $ = s => document.querySelector(s);

renderAll();

$('#modal').addEventListener('click', e=>{ if(e.target.id==='modal') closeModal(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ closeModal(); closeEditor(); } });

/* room interactions */
let speechTimer, monClicks = 0;
document.querySelectorAll('.room-item').forEach(el=>{
  el.addEventListener('click', ()=>{
    const sp = $('#speech');
    $('#speechText').textContent = el.dataset.say;
    sp.classList.remove('show'); void sp.offsetWidth; sp.classList.add('show');
    clearTimeout(speechTimer);
    speechTimer = setTimeout(()=>sp.classList.remove('show'), 4000);
    if(el.id==='monchhichi' && ++monClicks===5){
      monClicks = 0;
      $('#speechText').textContent = DATA.secret.monchhichi5;
      heartsRain(40);
    }
  });
});

/* hearts rain */
function heartsRain(n=25){
  const icons = ['🤎','🧡','💛','🐒','✨'];
  for(let i=0;i<n;i++){
    const h = document.createElement('div');
    h.className = 'heart-fall';
    h.textContent = icons[Math.floor(Math.random()*icons.length)];
    h.style.left = Math.random()*100+'vw';
    h.style.fontSize = (16+Math.random()*22)+'px';
    h.style.animationDuration = (2.5+Math.random()*3)+'s';
    h.style.animationDelay = (Math.random()*1.2)+'s';
    document.body.appendChild(h);
    setTimeout(()=>h.remove(), 7000);
  }
}

/* secret: anniversary date (auto-format dd/mm/yyyy) */
let failCount = 0;
$('#secretInput').addEventListener('input', e=>{
  const digits = e.target.value.replace(/\D/g,'').slice(0,8);
  let v = digits;
  if(digits.length > 4) v = digits.slice(0,2)+'/'+digits.slice(2,4)+'/'+digits.slice(4);
  else if(digits.length > 2) v = digits.slice(0,2)+'/'+digits.slice(2);
  e.target.value = v;
  if(v.length < DATA.anniversary.length) { $('#secretMsg').textContent=''; return; }
  if(v === DATA.anniversary){
    $('#secretMsg').textContent = DATA.secret.success;
    heartsRain(50);
  } else {
    $('#secretMsg').textContent = DATA.secret.fail[failCount++ % DATA.secret.fail.length];
  }
});

/* secret: type "love" anywhere */
let buffer = '';
document.addEventListener('keydown', e=>{
  if(/INPUT|TEXTAREA/.test(e.target.tagName)) return;
  buffer = (buffer + e.key.toLowerCase()).slice(-4);
  if(buffer === 'love'){
    heartsRain(35);
    const sp = $('#speech');
    $('#speechText').textContent = DATA.secret.typeLove;
    sp.classList.add('show');
    setTimeout(()=>sp.classList.remove('show'), 4500);
  }
});

/* secret: footer heart */
$('#footHeart').addEventListener('click', ()=>heartsRain(30));

/* days counter */
function updateDays(){
  const [d,m,y] = String(DATA.anniversary||'').split('/').map(Number);
  const days = Math.floor((Date.now() - new Date(y, m-1, d)) / 864e5);
  if(days > 0){
    $('#daysCounter').textContent = `${days} 日、一緒にいるよ — これからもずっと 🤍`;
    $('#daysBig').textContent = days.toLocaleString('ja-JP');
    $('#heroChip').hidden = false;
  }
}

/* scroll progress bar */
(function(){
  const bar = $('#progress');
  let ticking = false;
  window.addEventListener('scroll', ()=>{
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(()=>{
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
      ticking = false;
    });
  }, {passive:true});
})();

/* scroll reveal (staggered) */
const io = new IntersectionObserver(es=>{
  let delay = 0;
  es.forEach(e=>{
    if(e.isIntersecting){
      e.target.style.transitionDelay = delay + 'ms';
      delay = Math.min(delay + 90, 450);
      e.target.classList.add('visible');
      io.unobserve(e.target);
    }
  });
},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

function persist(){
  const saved = currentStore.save(DATA);
  renderAll(); revealAll();
  if(!saved && typeof toast === 'function'){
    toast('ブラウザに保存できませんでした（容量またはプライベートモード） ✗');
  }
}
function revealAll(){ document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible')); }

/* nav active state */
const links = document.querySelectorAll('nav a');
const secIO = new IntersectionObserver(es=>{
  es.forEach(e=>{
    if(e.isIntersecting){
      links.forEach(a=>a.classList.toggle('active', a.getAttribute('href')==='#'+e.target.id));
    }
  });
},{rootMargin:'-40% 0px -55% 0px'});
document.querySelectorAll('section').forEach(s=>secIO.observe(s));
