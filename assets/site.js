/* ════════════════════════════════════════════════════════════════════
   NB AUTOWORKS — shared page behaviors (all pages)
   nav · scroll reveal · footer year · hero tachometer (home)
   ════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var NS = 'http://www.w3.org/2000/svg';

function $(s, c){ return (c || document).querySelector(s); }
function $$(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

/* ── nav ─────────────────────────────────────────────────────────── */
var nav = $('#nav');
if (nav){
  addEventListener('scroll', function(){
    nav.classList.toggle('is-scrolled', scrollY > 8);
  }, {passive:true});
}
var navBtn = $('#navBtn'), menu = $('#navMenu');
if (navBtn && menu){
  function setMenu(open){
    menu.classList.toggle('is-open', open);
    navBtn.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  navBtn.addEventListener('click', function(){
    setMenu(!menu.classList.contains('is-open'));
  });
  menu.addEventListener('click', function(e){
    if (e.target.closest('a')) setMenu(false);
  });
  addEventListener('keydown', function(e){
    if (e.key === 'Escape' && menu.classList.contains('is-open')){
      setMenu(false);
      navBtn.focus();
    }
  });
  /* leaving mobile widths always closes the panel and unlocks scroll */
  var mq = window.matchMedia('(min-width: 761px)');
  mq.addEventListener('change', function(e){ if (e.matches) setMenu(false); });
}

/* ── language toggle (EN / ES) ───────────────────────────────────── */
/* Every translated element carries data-es="…"; English is cached in
   data-en on first switch. Choice persists in localStorage and can be
   forced with ?lang=es (handy for sharing a Spanish link). */
var LANG_KEY = 'nb-lang';
var lang = 'en';
try { lang = localStorage.getItem(LANG_KEY) || 'en'; } catch(e){}
var langQ = new URLSearchParams(location.search).get('lang');
if (langQ === 'es' || langQ === 'en') lang = langQ;

function applyLang(l){
  lang = l;
  document.documentElement.lang = l;
  $$('[data-es]').forEach(function(n){
    if (n.getAttribute('data-en') === null) n.setAttribute('data-en', n.innerHTML);
    var html = l === 'es' ? n.getAttribute('data-es') : n.getAttribute('data-en');
    if (n.innerHTML !== html) n.innerHTML = html;
  });
  $$('#langBtn [data-l]').forEach(function(s){
    s.classList.toggle('is-on', s.getAttribute('data-l') === l);
  });
  try { localStorage.setItem(LANG_KEY, l); } catch(e){}
}
var langBtn = $('#langBtn');
if (langBtn){
  langBtn.addEventListener('click', function(){
    applyLang(lang === 'es' ? 'en' : 'es');
  });
}
applyLang(lang);

/* ── scroll reveal ───────────────────────────────────────────────── */
var revealed = $$('[data-reveal]');
if (RM || !('IntersectionObserver' in window)){
  revealed.forEach(function(n){ n.classList.add('is-in'); });
} else {
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (en.isIntersecting){ en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });
  revealed.forEach(function(n){ io.observe(n); });
}

/* ── footer year ─────────────────────────────────────────────────── */
var yr = $('#year');
if (yr) yr.textContent = new Date().getFullYear();

/* ── floating WhatsApp pill (all pages) ──────────────────────────── */
var fab = document.createElement('a');
fab.className = 'wa-fab';
fab.href = 'https://wa.me/526251149099?text=Hola%20NB%20Autoworks%2C%20quiero%20agendar%20una%20cita.';
fab.target = '_blank';
fab.rel = 'noopener';
fab.setAttribute('aria-label', 'WhatsApp NB Autoworks');
fab.innerHTML = '<svg aria-hidden="true"><use href="#i-chat"/></svg><span>WhatsApp</span>';
document.body.appendChild(fab);
function fabCheck(){ fab.classList.toggle('is-show', scrollY > 420); }
addEventListener('scroll', fabCheck, {passive:true});
fabCheck();

/* ── hero tachometer — cold start, rev, settle to idle ───────────── */
(function tach(){
  var svg = $('#tach'); if (!svg) return;
  var out = $('#rpmOut');

  var C = 220, A0 = 135, SWEEP = 270, MAX = 8, RED = 7;
  var LIME = '#b5d327', RED1 = '#ff4a3e', RED2 = '#f0392e';

  function el(name, attrs, parent){
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(e);
    return e;
  }
  function txt(x, y, str, size, fill, extra){
    var t = el('text', {
      x: x, y: y, fill: fill, 'font-size': size, 'text-anchor': 'middle',
      'font-family': "'IBM Plex Mono', ui-monospace, monospace"
    });
    if (extra) for (var k in extra) t.setAttribute(k, extra[k]);
    t.textContent = str;
    return t;
  }
  function ang(v){ return A0 + (v / MAX) * SWEEP; }
  function pt(r, a){
    var rad = a * Math.PI / 180;
    return [C + r * Math.cos(rad), C + r * Math.sin(rad)];
  }
  function arc(r, a1, a2, attrs){
    var p1 = pt(r, a1), p2 = pt(r, a2);
    var large = (a2 - a1) > 180 ? 1 : 0;
    attrs.d = 'M' + p1[0] + ' ' + p1[1] + ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + p2[0] + ' ' + p2[1];
    attrs.fill = 'none';
    return el('path', attrs);
  }
  function easeInOut(t){ return t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2; }
  function easeOut(t){ return 1 - Math.pow(1 - t, 3); }

  /* dial rings — drawn for the dark theme */
  arc(196, A0, A0 + SWEEP, { stroke: 'rgba(238,241,235,.16)', 'stroke-width': 1 });
  arc(196, ang(RED), A0 + SWEEP, { stroke: RED1, 'stroke-width': 3,
      style: 'filter:drop-shadow(0 0 6px rgba(255,59,48,.30))' });

  /* ticks — minor every 0.2, major on the whole numbers */
  for (var v = 0; v <= MAX * 5; v++){
    var val = v / 5, a = ang(val);
    var isMajor = (v % 5 === 0);
    var p1 = pt(isMajor ? 176 : 183, a), p2 = pt(193, a);
    el('line', {
      x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1],
      stroke: isMajor ? (val >= RED ? RED2 : '#e9ece4')
                      : (val >= RED ? 'rgba(217,45,36,.5)' : 'rgba(238,241,235,.32)'),
      'stroke-width': isMajor ? 2 : 1
    });
  }

  /* numerals */
  for (var n = 0; n <= MAX; n++){
    var p = pt(150, ang(n));
    txt(p[0], p[1], n, 23, n >= RED ? RED2 : '#a6afa6',
        { 'dominant-baseline': 'central', 'font-weight': 500 });
  }
  txt(C, C + 64, '×1000 RPM', 11, '#7f877f', { 'letter-spacing': '2' });
  txt(C, C + 84, 'NB AUTOWORKS', 9, '#8d958d', { 'letter-spacing': '3' });
  txt(C, C + 100, 'CAMPO 4 · CHIH.', 7.5, '#737b73', { 'letter-spacing': '3' });

  /* needle */
  var g = el('g', { style: 'filter:drop-shadow(0 0 6px rgba(139,166,7,.45))' });
  el('line', { x1: C - 26, y1: C, x2: C + 158, y2: C, stroke: LIME, 'stroke-width': 3.5 }, g);
  el('circle', { cx: C, cy: C, r: 11, fill: '#0a0b0e', stroke: 'rgba(238,241,235,.28)' });
  el('circle', { cx: C, cy: C, r: 3.2, fill: LIME });

  var IDLE = 0.85, PEAK = 6.9;
  function setV(v){
    g.setAttribute('transform', 'rotate(' + ang(v) + ' ' + C + ' ' + C + ')');
    if (out){
      var rpm = Math.max(0, Math.round(v * 100) * 10);
      out.textContent = ('0000' + rpm).slice(-4);
    }
  }
  setV(0);
  if (RM){ setV(IDLE); return; }

  /* start sequence: crank blip → idle → rev to 6.9 → fall with
     a little undershoot → idle flutter, forever */
  var SEQ = [
    { d: 350, from: 0,    to: 1.15, ease: easeOut   },   /* crank catch  */
    { d: 300, from: 1.15, to: IDLE, ease: easeInOut },   /* settle       */
    { d: 420, from: IDLE, to: IDLE, ease: easeOut   },   /* breathe      */
    { d: 900, from: IDLE, to: PEAK, ease: easeInOut },   /* the rev      */
    { d: 130, from: PEAK, to: PEAK, ease: easeOut   },   /* hang on it   */
    { d: 850, from: PEAK, to: 0.72, ease: easeOut   },   /* fall past    */
    { d: 320, from: 0.72, to: IDLE, ease: easeInOut }    /* recover      */
  ];
  var t0 = null;
  function frame(ts){
    if (t0 === null) t0 = ts;
    var t = ts - t0;
    for (var i = 0; i < SEQ.length; i++){
      var s = SEQ[i];
      if (t < s.d){
        setV(s.from + (s.to - s.from) * s.ease(t / s.d));
        requestAnimationFrame(frame);
        return;
      }
      t -= s.d;
    }
    idle(ts);
  }
  function idle(ts){ /* gentle needle flutter around idle */
    setV(IDLE + 0.035 * Math.sin(ts / 140) + 0.02 * Math.sin(ts / 47 + 1.3));
    requestAnimationFrame(idle);
  }
  requestAnimationFrame(frame);
})();

})();
