const $=s=>document.querySelector(s), P=D.posts, BY={};
let YR='hl';
P.forEach((p,i)=>{p.n=i;BY[p.id]=p;p.body=p.p.join('\n');});
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const main=$('#main');
let view='time';

const CATN={}; D.cats.forEach(c=>{CATN[c.k]=c.n});
function counts(){const c={};P.forEach(p=>{const k=p.d.slice(0,10);c[k]=(c[k]||0)+1});return c}
const DAY=counts();
const YEARS=[...new Set(P.map(p=>p.d.slice(0,4)))].sort();

function yearBlock(y){
  const n=P.filter(p=>p.d.startsWith(y)).length;
  let h='<div class="yr"><div class="yh"><b>'+y+'</b><span>'+n+' 篇</span></div><div class="scroll"><div class="grid">';
  const s=new Date(y+'-01-01T00:00:00'), e=new Date(y+'-12-31T00:00:00');
  let d=new Date(s); d.setDate(d.getDate()-d.getDay());
  while(d<=e){
    const iso=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'), c=DAY[iso]||0;
    const lv=c===0?'':(c===1?'l1':c===2?'l2':c<=4?'l3':'l4');
    h+='<div class="cell '+lv+(c?' has':'')+'"'+(c?' data-d="'+iso+'" title="'+iso+' · '+c+' 篇"':'')+'></div>';
    d.setDate(d.getDate()+1);
  }
  return h+'</div></div></div>';
}
function heat(){
  let h='<div class="intro">'+D.intro.map(t=>'<p>'+esc(t)+'</p>').join('')+'</div>';
  h+='<div class="stats">'
   +stat(P.length,'篇')+stat(P.reduce((a,p)=>a+p.body.length,0).toLocaleString(),'字')
   +stat(D.photos.length,'张图')
   +stat(YEARS[0]+'–'+YEARS[YEARS.length-1],'年')+'</div>';
  h+='<h2 class="sec">时间轴</h2><div class="seg">';
  h+='<button data-yr="hl"'+(YR==='hl'?' class="on"':'')+'>精选<i>'+D.hl.length+'</i></button>';
  YEARS.forEach(y=>{ const n=P.filter(p=>p.d.startsWith(y)).length;
    h+='<button data-yr="'+y+'"'+(YR===y?' class="on"':'')+'>'+y+'<i>'+n+'</i></button>'; });
  h+='<button data-yr="all"'+(YR==='all'?' class="on"':'')+'>全部<i>'+P.length+'</i></button></div>';
  if(YR==='hl'){
    h+=list(D.hl.map(id=>BY[id]).filter(Boolean));
  } else if(YR==='all'){
    YEARS.forEach(y=>{ h+=yearBlock(y); });
    h+='<h2 class="sec" style="margin-top:34px">最近</h2>'+list(P.slice().reverse().slice(0,12));
  } else {
    h+=yearBlock(YR);
    const ps=P.filter(p=>p.d.startsWith(YR));
    h+='<h2 class="sec" style="margin-top:30px">'+YR+' 年的 '+ps.length+' 篇</h2>'+list(ps);
  }
  return h;
}
const stat=(a,b)=>'<div class="stat"><b>'+a+'</b><span>'+b+'</span></div>';

function card(p,hl){
  const th=p.m.length?'<img class="tn" alt="" loading="lazy" src="thumbs/i'+String(p.m[0].i).padStart(3,'0')+'.jpg">':'';
  let ex=p.body.replace(/\n/g,' ').slice(0,110);
  if(hl){const k=hl.toLowerCase(),j=p.body.toLowerCase().indexOf(k);
    if(j>=0){const a=Math.max(0,j-34);ex=(a?'…':'')+p.body.slice(a,a+120).replace(/\n/g,' ');}}
  ex=esc(ex); if(hl)ex=mark(ex,hl);
  return '<div class="card" data-go="'+p.id+'"><div class="row"><div class="tx">'
   +'<div class="dt">'+p.d+(p.m.length?'<span class="pill">'+p.m.length+' 图</span>':'')+'</div>'
   +'<h3>'+(hl?mark(esc(p.t),hl):esc(p.t))+'</h3><p>'+ex+'</p></div>'+th+'</div></div>';
}
const mark=(s,k)=>s.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),m=>'<mark>'+m+'</mark>');
const list=a=>a.length?a.map(p=>card(p)).join(''):'<div class="empty">没有内容。</div>';

function show(html_,scroll){main.innerHTML=html_; if(scroll!==false)window.scrollTo(0,0);
  if(window.toggleTop) toggleTop();}
// re-render without the view jumping: hold `sel` at the same viewport offset
function keepAnchored(sel, render){
  const before = document.querySelector(sel);
  const top = before ? before.getBoundingClientRect().top : null;
  render();
  if(top===null) return;
  const after = document.querySelector(sel);
  if(!after) return;
  const delta = after.getBoundingClientRect().top - top;
  if(delta) window.scrollTo(0, Math.max(0, window.scrollY + delta));
}

function timeline(keep){view='time';tab();show(heat(), keep?false:undefined)}
function photos(){view='photo';tab();render_photos()}
let PF=null;
function render_photos(){
  const all=D.photos, sel=PF;
  const shown=sel?all.filter(p=>p.c.indexOf(sel)>=0):all;
  const n={}; all.forEach(p=>p.c.forEach(c=>n[c]=(n[c]||0)+1));
  D.extra.forEach(p=>p.c.forEach(c=>n[c]=(n[c]||0)+1));
  let h='<h2 class="sec">相册 · '+(shown.length+(sel?D.extra.filter(x=>x.c.indexOf(sel)>=0).length:D.extra.length))+' 张</h2><div class="chips">';
  h+='<button class="chip'+(sel?'':' on')+'" data-cat="">全部 '+(all.length+D.extra.length)+'</button>';
  D.cats.forEach(c=>{ if(!n[c.k])return;
    h+='<button class="chip'+(sel===c.k?' on':'')+'" data-cat="'+c.k+'">'+c.n+' '+n[c.k]+'</button>'});
  h+='</div>';
  const ex = sel ? D.extra.filter(x=>x.c.indexOf(sel)>=0) : D.extra;
  if(ex.length){
    h+='<div class="yhd"><b>这四年啊</b><span>'+ex.length+' 张</span></div><div class="walls">';
    ex.forEach(x=>{
      const cn=(x.c||[]).map(k=>CATN[k]).filter(Boolean).join(' · ');
      h+='<img loading="lazy" src="thumbs/x'+String(x.k).padStart(3,'0')+'.jpg" '
        +'alt="'+esc([cn,x.d].filter(Boolean).join(' · ')||'这四年啊')+'" '
        +'data-zoom="x'+String(x.k).padStart(3,'0')+'" title="'+(x.d||'')+'">'; });
    h+='</div>';
  }
  const years=[...new Set(shown.map(p=>p.y))];
  years.forEach(y=>{
    const g=shown.filter(p=>p.y===y); if(!g.length)return;
    const lab=y==='?'?'年份不详':(y.slice(0,4)+' 年 '+parseInt(y.slice(5),10)+' 月');
    h+='<div class="yhd"><b>'+lab+'</b><span>'+g.length+' 张</span></div><div class="walls">';
    g.forEach(m=>{
      const t=m.p&&BY[m.p]?BY[m.p].t:'未能归位';
      h+='<img loading="lazy" src="thumbs/i'+String(m.i).padStart(3,'0')+'.jpg" '
        +'alt="'+esc(m.p&&BY[m.p]?t:lab)+'" '
        +(m.p?'data-go="'+m.p+'"':'data-zoom="'+m.i+'"')+' title="'+esc(t)+'">';
    });
    h+='</div>';
  });
  show(h,false);
}
let WAD=false;
function wall(){view='wall';tab();
  const W=D.wall, ads=W.filter(x=>x.kind==='ad');
  const shown=WAD?W:W.filter(x=>x.kind!=='ad');
  let h='<h2 class="sec">留言板 · '+W.filter(x=>x.kind!=='ad').length+' 条</h2>';
  h+='<div class="wnote">新浪把博文下面的评论清空了，一条也没剩下。这个留言板却还在，'
   +'从 2006 年 1 月一直到今天，'+new Set(W.filter(x=>x.kind==='msg').map(x=>x.who)).size
   +' 个人留下过话。原样保留，错别字和火星文都没有改。</div>';
  h+='<div class="newbox"><h3>也留一句吧</h3>'
   +'<p class="hint">我经常查看这个页面，大概每两年半就一回</p>'
   +'<div id="wslot"></div></div>';
  h+='<div class="chips"><button class="chip'+(WAD?'':' on')+'" data-wad="0">留言 '
   +(W.length-ads.length)+'</button><button class="chip'+(WAD?' on':'')+'" data-wad="1">连广告与串门一起看 '
   +W.length+'</button></div>';
  let yr='';
  shown.forEach(m=>{
    const y=m.time.slice(0,4);
    if(y!==yr){yr=y; const n=shown.filter(x=>x.time.slice(0,4)===y).length;
      h+='<div class="yhd"><b>'+y+' 年</b><span>'+n+' 条</span></div>';}
    h+='<div class="msg '+(m.kind==='own'?'own':(m.kind==='ad'?'ad':''))+'">'
     +'<div class="mh"><span class="mw">'+esc(m.who)+'</span>'
     +'<span class="mt">'+m.time.slice(0,16)+'</span>'
     +(m.kind==='own'?'<span class="pill">博主</span>':'')
     +(m.priv?'<span class="pill">悄悄话</span>':'')
     +(m.kind==='ad'?'<span class="pill">广告</span>':'')
     +'</div><div class="mb">'+esc(m.body)+'</div></div>';
  });
  show(h,false);
  mountWaline();
}
// built once and moved back into place on re-render, so switching tabs
// never reloads the thread or throws away a half-typed message
let WALINE=null;
function walineLib(){
  if(!WALINE) WALINE=import('https://unpkg.com/@waline/client@v3/dist/waline.js');
  return WALINE;
}
const WL_BASE={
  serverURL:'https://neverland-waline.vercel.app',
  lang:'zh-CN', login:'disable', meta:['nick'], requiredMeta:['nick'],
  emoji:false, search:false, imageUploader:false,
  reaction:false, pageview:false, dark:false, wordLimit:800,
  locale:{ placeholder:'写点什么吧……', nick:'名字',
    nickError:'留个称呼吧，随便什么都行', submit:'发表', comment:'新留言',
    sofa:'还没有人留言，你可以是第一个。' }
};
let WHOST=null;
function mountWaline(){
  const slot=document.getElementById('wslot');
  if(!slot) return;
  if(!WHOST){
    WHOST=document.createElement('div');
    WHOST.id='waline';
    slot.appendChild(WHOST);
    walineLib().then(m=>{
      m.init(Object.assign({}, WL_BASE, {el:'#waline', path:'/liuyan'}));
    }).catch(()=>{ slot.innerHTML='<p class="hint">留言板暂时加载不出来，稍后再试试。</p>'; });
    return;
  }
  slot.appendChild(WHOST);
}
function series(){view='series';tab();
  let h='';
  D.series.forEach(s=>{
    const ps=s.ids.map(i=>BY[i]).filter(Boolean).sort((a,b)=>a.d<b.d?-1:1);
    h+='<h2 class="sec">'+esc(s.name)+' · '+ps.length+' 篇</h2>'+list(ps);
  });
  show(h||'<div class="empty">没有系列。</div>', false);
}
function day(iso, restore){
  saveScroll();
  view='day';DAY_=iso;tab();
  show('<h2 class="sec">'+iso+'</h2>'+list(P.filter(p=>p.d.startsWith(iso))), false);
  setScroll(restore ? (SCROLL['day:'+iso]||0) : 0);
  pushView('day', iso);
}
function search(k){
  view='search';tab();
  if(!k.trim()){timeline();return}
  const kk=k.toLowerCase();
  const hit=P.filter(p=>p.t.toLowerCase().includes(kk)||p.body.toLowerCase().includes(kk));
  show('<h2 class="sec">“'+esc(k)+'” · '+hit.length+' 篇</h2>'
    +(hit.length?hit.slice().reverse().map(p=>card(p,k)).join(''):'<div class="empty">没有找到。</div>'));
}
function post(id, restore){
  const p=BY[id]; if(!p)return timeline();
  saveScroll();
  view='post';CUR=id;tab();
  const at={};p.m.forEach(m=>{(at[m.a]=at[m.a]||[]).push(m)});
  let h='<article><div class="dt">'+p.d+'</div><h1>'+esc(p.t)+'</h1>';
  (at[-1]||[]).forEach(m=>{h+=fig(m,p.t)});
  p.p.forEach((t,n)=>{h+='<p>'+esc(t)+'</p>';
    (at[n]||[]).forEach(m=>{h+=fig(m,p.t)})});
  if(!p.p.length)Object.keys(at).forEach(k=>at[k].forEach(m=>{h+=fig(m,p.t)}));
  h+='</article><div class="nav2">';
  const a=P[p.n-1],b=P[p.n+1];
  h+=a?'<a data-go="'+a.id+'">← '+esc(a.t)+'</a>':'<span></span>';
  h+=b?'<a data-go="'+b.id+'" style="text-align:right">'+esc(b.t)+' →</a>':'<span></span>';
  h+='</div><div class="pcom"><h3>说点什么</h3><div id="pslot"></div></div>';
  show(h, false);
  mountPostWaline(id);
  setScroll(restore ? (SCROLL['post:'+id]||0) : 0);
  pushView('post', id);
}
// one instance, re-pointed at a new path as you move between posts —
// cheaper than tearing the widget down and rebuilding it 350 times
let PHOST=null, PAPI=null;
function mountPostWaline(id){
  const slot=document.getElementById('pslot');
  if(!slot) return;
  if(!PHOST){
    PHOST=document.createElement('div'); PHOST.id='pwaline';
    slot.appendChild(PHOST);
    walineLib().then(m=>{
      PAPI=m.init(Object.assign({}, WL_BASE, {el:'#pwaline', path:'/'+id}));
    }).catch(()=>{ slot.innerHTML='<p class="hint">留言区暂时加载不出来。</p>'; });
    return;
  }
  slot.appendChild(PHOST);
  if(PAPI && PAPI.update) PAPI.update({path:'/'+id});
}
const fig=(m,t)=>'<figure><img loading="lazy" src="images/i'+String(m.i).padStart(3,'0')+'.jpg" '
  +'alt="'+esc(t||'')+'" width="'+m.w+'" height="'+m.h+'" data-zoom="'+m.i+'"></figure>';

// Every view keeps its own scroll position, and every move is a real history
// entry — so Back returns you to the album exactly where you left it, and
// stepping through 前一篇/后一篇 walks back post by post.
const SCROLL={};
const VIEWS={time:timeline,photo:photos,series:series,wall:wall};
let CUR=null, DAY_=null, NAVLOCK=false;
if('scrollRestoration' in history) history.scrollRestoration='manual';

function setScroll(y){ window.scrollTo(0,y); if(window.toggleTop) toggleTop(); }
function keyOf(v){ return v==='post' ? 'post:'+CUR : v==='day' ? 'day:'+DAY_ : v; }
function saveScroll(){ if(view!=='search') SCROLL[keyOf(view)]=window.scrollY; }
function pushView(v, id){
  if(NAVLOCK) return;
  const hash = (v==='post'||v==='day') ? '#'+id : '#'+v;
  const st = {v:v, id:id||null};
  if(location.hash===hash && history.state && history.state.v===v) history.replaceState(st,'',hash);
  else history.pushState(st,'',hash);
}
function goto_(name){
  saveScroll();
  view=name;
  VIEWS[name](true);
  setScroll(SCROLL[name]||0);
  pushView(name);
}
function restoreState(st){
  NAVLOCK=true;
  if(st && st.v==='post' && BY[st.id]) post(st.id, true);
  else if(st && st.v==='day' && st.id) day(st.id, true);
  else if(st && VIEWS[st.v]){ view=st.v; VIEWS[st.v](true); setScroll(SCROLL[st.v]||0); tab(); }
  else { view='time'; timeline(true); setScroll(SCROLL.time||0); tab(); }
  NAVLOCK=false;
}
window.addEventListener('popstate', e=>{
  const h=location.hash.slice(1);
  restoreState(e.state || (BY[h] ? {v:'post',id:h} : (VIEWS[h] ? {v:h} : null)));
});
function tab(){document.querySelectorAll('nav button').forEach(b=>
  b.classList.toggle('on',b.dataset.v===view))}

document.addEventListener('click',e=>{
  const yb=e.target.closest('[data-yr]');
  if(yb){YR=yb.dataset.yr; keepAnchored('.seg', ()=>timeline(true)); return}
  const wa=e.target.closest('[data-wad]');
  if(wa){WAD=wa.dataset.wad==='1'; keepAnchored('.chips', wall); return}
  const ch=e.target.closest('[data-cat]');
  if(ch){PF=ch.dataset.cat||null; keepAnchored('.chips', render_photos); return}
  const g=e.target.closest('[data-go]'); if(g){post(g.dataset.go);return}
  const z=e.target.closest('[data-zoom]');
  if(z){ openLb(z); return }
  const c=e.target.closest('.cell.has'); if(c){day(c.dataset.d);return}
});
const topBtn=$('#top');
const toggleTop=()=>topBtn.classList.toggle('on', window.scrollY>420);
window.toggleTop=toggleTop;
addEventListener('scroll', toggleTop, {passive:true});
topBtn.onclick=()=>{
  try{ scrollTo({top:0, behavior:'smooth'}) }catch(e){ scrollTo(0,0) }
};
// the lightbox is a gallery over every zoomable image in the current view,
// so ‹ › walk the album (or the post) without closing it
let LB=[], LBA=[], LBI=0;
const lbSrc=id=>'images/'+(String(id)[0]==='x'?id:'i'+String(id).padStart(3,'0'))+'.jpg';
function paintLb(){
  const id=LB[LBI];
  $('#lbi').src=lbSrc(id);
  $('#lbi').alt=LBA[LBI]||'';
  $('#lbc').textContent=(LBI+1)+' / '+LB.length;
  $('#lbp').disabled=LBI<=0;
  $('#lbn').disabled=LBI>=LB.length-1;
}
function openLb(el){
  const zs=[...main.querySelectorAll('[data-zoom]')];
  LB=zs.map(n=>n.dataset.zoom);
  LBA=zs.map(n=>n.getAttribute('alt')||n.getAttribute('title')||'');
  LBI=Math.max(0, LB.indexOf(el.dataset.zoom));
  $('#lb').classList.add('on');
  paintLb();
}
function stepLb(d){
  const n=LBI+d;
  if(n<0||n>=LB.length) return;
  LBI=n; paintLb();
  // keep the thumbnail you're on in view behind the lightbox
  const t=main.querySelectorAll('[data-zoom]')[LBI];
  if(t&&t.scrollIntoView) t.scrollIntoView({block:'center'});
}
const closeLb=()=>$('#lb').classList.remove('on');
$('#lbp').onclick=e=>{e.stopPropagation();stepLb(-1)};
$('#lbn').onclick=e=>{e.stopPropagation();stepLb(1)};
$('#lbx').onclick=e=>{e.stopPropagation();closeLb()};
$('#lbi').onclick=e=>e.stopPropagation();
$('#lb').onclick=closeLb;
document.addEventListener('keydown',e=>{
  if(!$('#lb').classList.contains('on')) return;
  if(e.key==='Escape') closeLb();
  else if(e.key==='ArrowLeft') stepLb(-1);
  else if(e.key==='ArrowRight') stepLb(1);
});
// swipe on touch
let TX=null;
$('#lb').addEventListener('touchstart',e=>{TX=e.touches[0].clientX},{passive:true});
$('#lb').addEventListener('touchend',e=>{
  if(TX===null) return;
  const dx=e.changedTouches[0].clientX-TX; TX=null;
  if(Math.abs(dx)>45) stepLb(dx<0?1:-1);
},{passive:true});
$('#q').addEventListener('input',e=>search(e.target.value));
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>goto_(b.dataset.v));
$('.brand').onclick=()=>{saveScroll();SCROLL.time=0;view='time';timeline(true);setScroll(0);pushView('time')};

// 配色：跟随系统 → 浅色 → 深色 → 跟随系统。跟随系统时不写 data-theme，
// 也不留 localStorage，交给 CSS 里的 prefers-color-scheme。
const THEMES=[{k:'',n:'跟随系统',i:'◐'},{k:'light',n:'浅色',i:'☀'},{k:'dark',n:'深色',i:'☾'}];
// file:// 下 Chrome 会禁掉 localStorage：仍然能切，只是刷新后不记得。
const readTheme=()=>{try{const v=localStorage.getItem('theme');
  return v==='light'||v==='dark'?v:''}catch(e){return ''}};
const saveTheme=k=>{try{k?localStorage.setItem('theme',k):localStorage.removeItem('theme')}catch(e){}};
let THEME=readTheme();
function paintTheme(){
  const t=THEMES.find(x=>x.k===THEME)||THEMES[0];
  if(t.k) document.documentElement.dataset.theme=t.k;
  else delete document.documentElement.dataset.theme;
  const b=$('#theme');
  b.textContent=t.i; b.title='配色：'+t.n; b.setAttribute('aria-label','配色：'+t.n);
}
$('#theme').onclick=()=>{
  THEME=THEMES[(THEMES.findIndex(x=>x.k===THEME)+1)%THEMES.length].k;
  saveTheme(THEME); paintTheme();
};
paintTheme();

// ---------------------------------------------------------------- music player
(function initPlayer(){
  const tracks=D.music||[];
  const root=$('#player');
  if(!tracks.length||!root) return;
  root.hidden=false;
  document.body.classList.add('has-player');

  const audio=$('#pa'), fab=$('#pfab'), toggle=$('#ptoggle'), seek=$('#pseek');
  const titleEl=$('#ptitle'), artistEl=$('#partist');
  let i=0, seeking=false;

  function paintMeta(){
    const t=tracks[i];
    titleEl.textContent=t.title||'未命名';
    artistEl.textContent=t.artist||'';
    artistEl.hidden=!t.artist;
  }
  function paintPlay(){
    const on=!audio.paused;
    const icon=on?'❚❚':'▶';
    const label=on?'暂停':'播放';
    fab.textContent=icon; toggle.textContent=icon;
    toggle.setAttribute('aria-label',label);
  }
  function setOpen(open){
    root.classList.toggle('open',open);
    document.body.classList.toggle('has-player-open',open);
    fab.setAttribute('aria-expanded',open?'true':'false');
  }
  function load(idx,autoplay){
    i=(idx%tracks.length+tracks.length)%tracks.length;
    const t=tracks[i];
    audio.src=t.src;
    paintMeta();
    seek.value=0;
    if(autoplay) audio.play().catch(()=>{});
    paintPlay();
  }
  function playPause(){
    if(audio.paused) audio.play().catch(()=>{});
    else audio.pause();
  }

  fab.onclick=()=>setOpen(true);
  $('#pcollapse').onclick=()=>setOpen(false);
  toggle.onclick=playPause;
  $('#pprev').onclick=()=>load(i-1,!audio.paused);
  $('#pnext').onclick=()=>load(i+1,!audio.paused);

  audio.addEventListener('play',paintPlay);
  audio.addEventListener('pause',paintPlay);
  audio.addEventListener('ended',()=>load(i+1,true));
  audio.addEventListener('timeupdate',()=>{
    if(seeking||!audio.duration) return;
    seek.value=String(Math.round((audio.currentTime/audio.duration)*1000));
  });
  seek.addEventListener('pointerdown',()=>{seeking=true});
  seek.addEventListener('pointerup',()=>{seeking=false});
  seek.addEventListener('change',()=>{
    if(!audio.duration) return;
    audio.currentTime=(Number(seek.value)/1000)*audio.duration;
    seeking=false;
  });
  seek.addEventListener('input',()=>{
    if(!audio.duration) return;
    seeking=true;
    audio.currentTime=(Number(seek.value)/1000)*audio.duration;
  });

  setOpen(true);
  load(0,true);
})();

const start=location.hash.slice(1);
if(start&&BY[start]){ view='post';CUR=start; history.replaceState({v:'post',id:start},'','#'+start); post(start); }
else if(VIEWS[start]){ view=start; history.replaceState({v:start,id:null},'','#'+start); VIEWS[start](true); tab(); }
else { history.replaceState({v:'time',id:null},'','#time'); timeline(); }
