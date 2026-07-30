/* ════════════════════════════════════════════════════════════════════
   NB AUTOWORKS — shared page behaviors (all pages)
   ─────────────────────────────────────────────────────────────────────
   01 helpers          05 scroll reveal
   02 nav              06 pointer effects (spotlight · torch · tilt)
   03 language toggle  07 gallery lightbox + filters
   04 scroll engine    08 hero instruments — tach + dyno (home)
   Everything below degrades to a plain, readable page without JS, and
   every motion path is switched off under prefers-reduced-motion.
   ════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ── 01 · helpers ────────────────────────────────────────────────── */
var RM   = matchMedia('(prefers-reduced-motion: reduce)').matches;
var FINE = matchMedia('(hover:hover) and (pointer:fine)').matches;
var NS   = 'http://www.w3.org/2000/svg';

function $(s, c){ return (c || document).querySelector(s); }
function $$(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
function safe(fn){ try { fn(); } catch(err){ if (window.console) console.error(err); } }
function el(tag, cls, html){
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}
var ICON = {
  expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M21 3l-7.5 7.5M9 21H3v-6M3 21l7.5-7.5"/></svg>',
  close:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  prev:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4l-8 8 8 8"/></svg>',
  next:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4l8 8-8 8"/></svg>'
};

/* ── 02 · nav ────────────────────────────────────────────────────── */
var nav = $('#nav');
var navBtn = $('#navBtn'), menu = $('#navMenu');
var menuOpen = false;

if (navBtn && menu){
  $$('#navMenu > *').forEach(function(n, i){ n.style.setProperty('--i', i); });

  var setMenu = function(open){
    menuOpen = open;
    menu.classList.toggle('is-open', open);
    navBtn.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && nav) nav.classList.remove('is-hidden');
  };
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
  matchMedia('(min-width: 761px)').addEventListener('change', function(e){
    if (e.matches) setMenu(false);
  });
}

/* ── 03 · language toggle (EN / ES) ──────────────────────────────── */
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

/* ── 04 · scroll engine ──────────────────────────────────────────
   One rAF-coalesced pass per scroll: progress bar, nav state,
   parallax layers and the floating WhatsApp pill. */
var bar = el('div', 'progress');
bar.setAttribute('aria-hidden', 'true');
document.body.appendChild(bar);

/* [element that gets --py, section it belongs to, travel in px] */
var layers = [];
(function collectLayers(){
  if (RM) return;
  var hero = $('.hero__bg');
  if (hero) layers.push([hero, $('.hero'), 90]);
  var stmt = $('.statement__bg');
  if (stmt) layers.push([stmt, $('.statement'), 120]);
  var ph = $('.page-hero');
  if (ph) layers.push([ph, ph, 70]);
})();

var fab = el('a', 'wa-fab');
fab.href = 'https://wa.me/526251149099?text=Hola%20NB%20Autoworks%2C%20quiero%20agendar%20una%20cita.';
fab.target = '_blank';
fab.rel = 'noopener';
fab.setAttribute('aria-label', 'WhatsApp NB Autoworks');
fab.innerHTML = '<svg aria-hidden="true"><use href="#i-chat"/></svg><span>WhatsApp</span>';
document.body.appendChild(fab);

var lastY = scrollY, ticking = false;
function onScroll(){
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(function(){
    ticking = false;
    var y = scrollY, vh = innerHeight;

    var max = document.documentElement.scrollHeight - vh;
    bar.style.setProperty('--p', max > 0 ? Math.min(1, y / max) : 0);

    if (nav){
      nav.classList.toggle('is-scrolled', y > 8);
      /* out of the way going down, back the instant you head up */
      if (!RM && !menuOpen && !document.body.classList.contains('lb-open')){
        if (y > 620 && y > lastY + 4) nav.classList.add('is-hidden');
        else if (y < lastY - 4 || y < 620) nav.classList.remove('is-hidden');
      }
    }

    for (var i = 0; i < layers.length; i++){
      var L = layers[i], r = L[1].getBoundingClientRect();
      if (r.bottom < -240 || r.top > vh + 240) continue;
      var d = (vh / 2 - (r.top + r.height / 2)) / vh;   /* −0.5 … 0.5 */
      L[0].style.setProperty('--py', (d * L[2]).toFixed(1) + 'px');
    }

    fab.classList.toggle('is-show', y > 420);
    lastY = y;
  });
}
addEventListener('scroll', onScroll, {passive:true});
addEventListener('resize', onScroll, {passive:true});
addEventListener('load', onScroll);
onScroll();

/* ── 05 · scroll reveal ──────────────────────────────────────────
   [data-reveal] animates in; [data-in] only gets the .is-in flag so
   CSS can time a detail (a rule drawing itself, a spine filling). */
(function reveal(){
  /* section headers and page-hero intros stagger themselves */
  $$('.sec-head, .page-hero .container').forEach(function(head){
    var i = 0;
    $$(':scope > *', head).forEach(function(kid){
      if (kid.hasAttribute('data-reveal')) { i++; return; }
      kid.setAttribute('data-reveal', '');
      if (!kid.style.getPropertyValue('--rd'))
        kid.style.setProperty('--rd', (i * 80) + 'ms');
      i++;
    });
  });
  $$('.sec-title:not([data-reveal])').forEach(function(n){
    n.setAttribute('data-reveal', '');
  });
  /* grids the markup doesn't already stagger */
  $$('.gallery, .team, .values, .props').forEach(function(grid){
    $$(':scope > *', grid).forEach(function(kid, i){
      if (!kid.hasAttribute('data-reveal')) kid.setAttribute('data-reveal', '');
      if (!kid.style.getPropertyValue('--rd'))
        kid.style.setProperty('--rd', ((i % 3) * 70) + 'ms');
    });
  });
  var stmt = $('.statement__in');
  if (stmt) stmt.setAttribute('data-in', '');

  var items = $$('[data-reveal], [data-in]');
  if (RM || !('IntersectionObserver' in window)){
    items.forEach(function(n){ n.classList.add('is-in'); });
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -7% 0px' });

  /* Hold the first frame until the DISPLAY font has landed.
     Headings are sized in `ch`, so their boxes are measured against
     whichever font is currently rendering — on a phone Archivo used to
     swap in mid-fade and the hero title re-flowed ~22px wider at 70%
     opacity, which reads as the fade glitching.

     Waiting on Archivo alone, not document.fonts.ready: the two mono
     faces are small labels that move nothing, and on a weak connection
     they were holding the whole page back a further second. The cap is
     the backstop for a font that never arrives — it delays the reveal
     rather than withholding it. */
  function observeAll(){ items.forEach(function(n){ io.observe(n); }); }
  var started = false;
  function start(){ if (!started){ started = true; observeAll(); } }
  var gate = null;
  if (document.fonts && document.fonts.status !== 'loaded'){
    try { gate = document.fonts.load('900 1em Archivo'); }
    catch (e){ gate = document.fonts.ready; }
  }
  if (gate && gate.then){
    gate.then(start, start);
    setTimeout(start, 1500);
  } else start();
})();

/* ── 06 · pointer effects ────────────────────────────────────────
   One delegated listener drives every hover flourish: the card
   spotlight and the gauge tilt. Mouse/trackpad only — nothing here is
   required to use the page. */
safe(function pointerFX(){
  if (!FINE || RM) return;
  var SPOT = '.disc, .card, .value, .person, .fcard';
  var spot = null, tilt = null, px = 0, py = 0, queued = false;

  addEventListener('pointermove', function(e){
    if (e.pointerType && e.pointerType !== 'mouse') return;
    var t = e.target;
    if (!t || !t.closest) return;
    px = e.clientX; py = e.clientY;
    spot = t.closest(SPOT);
    tilt = t.closest('.gauge-card');
    if (!queued){ queued = true; requestAnimationFrame(paint); }
  }, {passive:true});

  function pct(node){
    var r = node.getBoundingClientRect();
    return [((px - r.left) / r.width * 100).toFixed(1) + '%',
            ((py - r.top) / r.height * 100).toFixed(1) + '%', r];
  }
  var tiltedCard = null;
  function paint(){
    queued = false;
    if (spot){ var s = pct(spot); spot.style.setProperty('--mx', s[0]);
                                  spot.style.setProperty('--my', s[1]); }
    if (tiltedCard && tiltedCard !== tilt){
      tiltedCard.style.setProperty('--tx', '0deg');
      tiltedCard.style.setProperty('--ty', '0deg');
    }
    if (tilt){
      var r = tilt.getBoundingClientRect();
      var dx = (px - r.left) / r.width - .5, dy = (py - r.top) / r.height - .5;
      tilt.style.setProperty('--tx', (-dy * 9).toFixed(2) + 'deg');
      tilt.style.setProperty('--ty', ( dx * 9).toFixed(2) + 'deg');
    }
    tiltedCard = tilt;
  }
});

/* ── 07 · gallery — filters + lightbox ───────────────────────────── */
safe(function gallery(){
  var shots = $$('.gallery .shot');
  if (!shots.length) return;

  /* the photo gets a clipped frame so it can zoom, plus a view chip */
  shots.forEach(function(fig){
    var img = fig.querySelector('img');
    if (!img) return;
    var frame = el('div', 'shot__frame');
    img.parentNode.insertBefore(frame, img);
    frame.appendChild(img);
    frame.appendChild(el('span', 'shot__zoom',
      ICON.expand + '<span data-es="Ver">View</span>'));
    var title = fig.querySelector('.shot__t');
    fig.setAttribute('role', 'button');
    fig.setAttribute('tabindex', '0');
    fig.setAttribute('aria-label', (title ? title.textContent.trim() + ' — ' : '') +
      'open photo');
  });

  /* — filters (work page) — */
  var chips = $$('.filter');
  if (chips.length){
    chips.forEach(function(chip){
      var f = chip.getAttribute('data-f');
      var n = f === 'all' ? shots.length
            : shots.filter(function(s){ return s.getAttribute('data-cat') === f; }).length;
      chip.appendChild(el('span', 'filter__n', n));
      chip.addEventListener('click', function(){
        chips.forEach(function(c){ c.classList.toggle('is-on', c === chip); });
        chip.setAttribute('aria-pressed', 'true');
        shots.forEach(function(s){
          var show = f === 'all' || s.getAttribute('data-cat') === f;
          var was = !s.classList.contains('is-out');
          s.classList.toggle('is-out', !show);
          s.classList.remove('is-back');
          if (show && !was){ void s.offsetWidth; s.classList.add('is-back'); }
        });
      });
    });
  }

  /* — lightbox — */
  var lb = el('div', 'lb');
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Photo viewer');
  lb.innerHTML =
    '<div class="lb__bar">' +
      '<p class="lb__count"><b>1</b> / 1</p>' +
      '<button class="lb__btn lb__close" type="button" aria-label="Close">' + ICON.close + '</button>' +
    '</div>' +
    '<div class="lb__stage">' +
      '<button class="lb__btn lb__prev" type="button" aria-label="Previous">' + ICON.prev + '</button>' +
      '<figure class="lb__fig"><img alt=""><figcaption class="lb__cap"><b></b><span></span></figcaption></figure>' +
      '<button class="lb__btn lb__next" type="button" aria-label="Next">' + ICON.next + '</button>' +
    '</div>' +
    '<div class="lb__foot"><span data-es="Navegar">Browse</span> <kbd>←</kbd><kbd>→</kbd>' +
      '<span data-es="Cerrar">Close</span> <kbd>esc</kbd></div>';
  document.body.appendChild(lb);

  var lbImg   = $('.lb__fig img', lb);
  var lbTitle = $('.lb__cap b', lb);
  var lbTag   = $('.lb__cap span', lb);
  var lbNum   = $('.lb__count b', lb);
  var lbTotal = $('.lb__count', lb);
  var btnClose = $('.lb__close', lb), btnPrev = $('.lb__prev', lb), btnNext = $('.lb__next', lb);
  var live = [], at = 0, restore = null;

  function show(i){
    live = shots.filter(function(s){ return !s.classList.contains('is-out'); });
    if (!live.length) return;
    at = (i + live.length) % live.length;
    var fig = live[at], img = fig.querySelector('img');
    var t = fig.querySelector('.shot__t'), tag = fig.querySelector('.shot__tag');
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt || '';
    lbTitle.textContent = t ? t.textContent.trim() : '';
    lbTag.textContent = tag ? tag.textContent.trim() : '';
    lbNum.textContent = at + 1;
    lbTotal.lastChild.nodeValue = ' / ' + live.length;
    [1, -1].forEach(function(step){        /* warm the neighbours */
      var n = live[(at + step + live.length) % live.length];
      if (n) new Image().src = n.querySelector('img').src;
    });
  }
  function open(fig){
    restore = document.activeElement;
    lb.classList.add('is-open');
    document.body.classList.add('lb-open');
    show(shots.filter(function(s){ return !s.classList.contains('is-out'); }).indexOf(fig));
    btnClose.focus();
  }
  function close(){
    lb.classList.remove('is-open');
    document.body.classList.remove('lb-open');
    if (restore && restore.focus) restore.focus();
  }
  var isOpen = function(){ return lb.classList.contains('is-open'); };

  shots.forEach(function(fig){
    fig.addEventListener('click', function(){ open(fig); });
    fig.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open(fig); }
    });
  });
  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', function(){ show(at - 1); });
  btnNext.addEventListener('click', function(){ show(at + 1); });
  lb.addEventListener('click', function(e){
    if (!e.target.closest('.lb__fig') && !e.target.closest('.lb__btn')) close();
  });
  addEventListener('keydown', function(e){
    if (!isOpen()) return;
    if (e.key === 'Escape'){ close(); }
    else if (e.key === 'ArrowLeft'){ show(at - 1); }
    else if (e.key === 'ArrowRight'){ show(at + 1); }
    else if (e.key === 'Tab'){        /* keep focus inside the dialog */
      var f = [btnClose, btnPrev, btnNext];
      var i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  /* swipe */
  var sx = null;
  lb.addEventListener('pointerdown', function(e){ sx = e.clientX; });
  lb.addEventListener('pointerup', function(e){
    if (sx === null) return;
    var dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 60) show(at + (dx < 0 ? 1 : -1));
  });
});

/* ── 08 · hero instruments — tachometer + dyno pull ──────────────────
   One card with two faces. The tach cold-starts, revs out and settles to
   idle; a timer then turns the card over to a dyno pull, which draws its
   curves and holds; then it turns back. Coming back, the tach picks up
   where it left off — at idle. The start sequence is a one-time thing,
   so the engine never re-revs on its own; only a tap does that.

   Both faces are drawn rather than styled, so they share a palette:
   a smoked instrument on the dark theme, white-faced wherever
   html.t-light is on — which, since the light makeover, is the whole
   site. The dark half stays for the same reason light.css is a layer:
   dropping the class puts the showroom back. */
safe(function instruments(){
  var tachSvg = $('#tach'); if (!tachSvg) return;
  var dynoSvg = $('#dyno');
  var stage   = $('#gaugeStage');
  var flipEl  = $('#gaugeFlip');
  var card    = tachSvg.closest('.gauge-card');

  var LIGHT = document.documentElement.classList.contains('t-light');
  var P = LIGHT ? {
    face:'#fdfdfa',  faceRing:'rgba(22,24,26,.07)',
    track:'rgba(22,24,26,.09)',
    arc:'#8fb213',   arcGlow:'rgba(140,175,20,.40)',
    ring:'rgba(22,24,26,.22)',
    tickMaj:'#2b2f2b',   tickMin:'rgba(22,24,26,.34)',
    tickMajRed:'#d0281c', tickMinRed:'rgba(208,40,28,.45)',
    num:'#4e564e',   numRed:'#c4241a',
    ledOff:'#e4e7dd', ledRing:'rgba(22,24,26,.12)',
    ledLime:'#8fb213', amber:'#e08a00', ledRed:'#e0261a',
    /* legends run 11 → 9 → 7.5px, so the contrast has to run the other
       way; the first cut of these faded out as they got smaller */
    label1:'#6e766f', label2:'#6b736d', label3:'#666e68',
    needle:'#6d8d0b', needleGlow:'rgba(109,141,11,.32)',
    hub:'#ffffff',   hubRing:'rgba(22,24,26,.24)', hubDot:'#6d8d0b',
    red:'#d0281c',   redGlow:'rgba(208,40,28,.26)',
    /* dyno face */
    hp:'#6d8d0b',    tq:'#2b2f2b',
    grid:'rgba(22,24,26,.09)', axis:'rgba(22,24,26,.26)',
    plot:'rgba(22,24,26,.022)', cursor:'rgba(109,141,11,.34)'
  } : {
    face:null,       faceRing:null,
    track:'rgba(238,241,235,.07)',
    arc:'#b5d327',   arcGlow:'rgba(181,211,39,.5)',
    ring:'rgba(238,241,235,.16)',
    tickMaj:'#e9ece4',   tickMin:'rgba(238,241,235,.32)',
    tickMajRed:'#f0392e', tickMinRed:'rgba(217,45,36,.5)',
    num:'#a6afa6',   numRed:'#f0392e',
    ledOff:'#1b1f25', ledRing:'rgba(238,241,235,.10)',
    ledLime:'#b5d327', amber:'#ffb020', ledRed:'#ff4a3e',
    label1:'#7f877f', label2:'#8d958d', label3:'#737b73',
    needle:'#b5d327', needleGlow:'rgba(139,166,7,.45)',
    hub:'#0a0b0e',   hubRing:'rgba(238,241,235,.28)', hubDot:'#b5d327',
    red:'#ff4a3e',   redGlow:'rgba(255,59,48,.30)',
    hp:'#b5d327',    tq:'#e9ece4',
    grid:'rgba(238,241,235,.08)', axis:'rgba(238,241,235,.22)',
    plot:'rgba(238,241,235,.022)', cursor:'rgba(181,211,39,.4)'
  };

  function mk(root, name, attrs, parent){
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    (parent || root).appendChild(e);
    return e;
  }
  function txt(root, x, y, str, size, fill, extra){
    var t = mk(root, 'text', {
      x: x, y: y, fill: fill, 'font-size': size, 'text-anchor': 'middle',
      'font-family': "'IBM Plex Mono', ui-monospace, monospace"
    });
    if (extra) for (var k in extra) t.setAttribute(k, extra[k]);
    t.textContent = str;
    return t;
  }
  function easeInOut(t){ return t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2; }
  function easeOut(t){ return 1 - Math.pow(1 - t, 3); }

  /* ══ 08a · the tachometer ═══════════════════════════════════════ */
  function buildTach(){
    var svg = tachSvg, out = $('#rpmOut');
    var C = 220, A0 = 135, SWEEP = 270, MAX = 8, RED = 7;

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
      return mk(svg, 'path', attrs);
    }

    /* a printed dial face, so the light theme reads as a white
       instrument rather than type floating on the card. Drawn first —
       everything below lands on top of it. */
    if (P.face){
      mk(svg, 'circle', { cx: C, cy: C, r: 201, fill: P.face, stroke: P.faceRing });
      mk(svg, 'circle', { cx: C, cy: C, r: 168, fill: 'none', stroke: P.faceRing });
    }

    /* outer power ring — sweeps up with the needle */
    var PR = 205, PLEN = 2 * Math.PI * PR * (SWEEP / 360);
    arc(PR, A0, A0 + SWEEP, { stroke: P.track, 'stroke-width': 6,
        'stroke-linecap': 'round' });
    var power = arc(PR, A0, A0 + SWEEP, {
      stroke: P.arc, 'stroke-width': 6, 'stroke-linecap': 'round',
      'stroke-dasharray': PLEN, 'stroke-dashoffset': PLEN, opacity: .8,
      style: 'filter:drop-shadow(0 0 7px ' + P.arcGlow + ')'
    });

    /* dial rings — the sweep, then the redline over it */
    arc(196, A0, A0 + SWEEP, { stroke: P.ring, 'stroke-width': 1 });
    arc(196, ang(RED), A0 + SWEEP, { stroke: P.red, 'stroke-width': 3,
        style: 'filter:drop-shadow(0 0 6px ' + P.redGlow + ')' });

    /* ticks — minor every 0.2, major on the whole numbers */
    for (var v = 0; v <= MAX * 5; v++){
      var val = v / 5, a = ang(val);
      var isMajor = (v % 5 === 0);
      var p1 = pt(isMajor ? 176 : 183, a), p2 = pt(193, a);
      mk(svg, 'line', {
        x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1],
        stroke: isMajor ? (val >= RED ? P.tickMajRed : P.tickMaj)
                        : (val >= RED ? P.tickMinRed : P.tickMin),
        'stroke-width': isMajor ? 2 : 1
      });
    }

    /* numerals */
    for (var n = 0; n <= MAX; n++){
      var p = pt(150, ang(n));
      txt(svg, p[0], p[1], n, 23, n >= RED ? P.numRed : P.num,
          { 'dominant-baseline': 'central', 'font-weight': 500 });
    }

    /* shift lights — the row that lights up on the way to the limiter */
    var LEDS = 7, leds = [];
    for (var i = 0; i < LEDS; i++){
      leds.push(mk(svg, 'circle', {
        cx: C + (i - (LEDS - 1) / 2) * 20, cy: C - 108, r: 5,
        fill: P.ledOff, stroke: P.ledRing
      }));
    }
    function ledColor(i){ return i < 3 ? P.ledLime : (i < 5 ? P.amber : P.ledRed); }
    function setLeds(v, ts){
      var over = v >= RED;
      var flash = over && Math.floor(ts / 90) % 2 === 0;
      for (var i = 0; i < LEDS; i++){
        var on = over ? flash : v >= 3 + i * (RED - 3) / LEDS;
        leds[i].setAttribute('fill', on ? ledColor(i) : P.ledOff);
        leds[i].setAttribute('style', on
          ? 'filter:drop-shadow(0 0 6px ' + ledColor(i) + ')' : '');
      }
    }

    txt(svg, C, C + 64, '×1000 RPM', 11, P.label1, { 'letter-spacing': '2' });
    txt(svg, C, C + 84, 'NB AUTOWORKS', 9, P.label2, { 'letter-spacing': '3' });
    txt(svg, C, C + 100, 'CAMPO 4 · CHIH.', 7.5, P.label3, { 'letter-spacing': '3' });

    /* needle */
    var g = mk(svg, 'g', { style: 'filter:drop-shadow(0 0 6px ' + P.needleGlow + ')' });
    mk(svg, 'line', { x1: C - 26, y1: C, x2: C + 158, y2: C, stroke: P.needle,
        'stroke-width': 3.5 }, g);
    mk(svg, 'circle', { cx: C, cy: C, r: 11, fill: P.hub, stroke: P.hubRing });
    mk(svg, 'circle', { cx: C, cy: C, r: 3.2, fill: P.hubDot });

    var IDLE = 0.85, PEAK = 6.9;
    function setV(v, ts){
      g.setAttribute('transform', 'rotate(' + ang(v) + ' ' + C + ' ' + C + ')');
      power.setAttribute('stroke-dashoffset', PLEN * (1 - v / MAX));
      setLeds(v, ts || 0);
      if (out){
        var rpm = Math.max(0, Math.round(v * 100) * 10);
        out.textContent = ('0000' + rpm).slice(-4);
      }
    }
    setV(0);
    if (RM){ setV(IDLE); return { show:function(){}, hide:function(){},
                                  rev:function(){}, onScreen:function(){} }; }

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
    var seq = SEQ, t0 = null, running = false, pending = false, mode = 'seq';
    var visible = true, onscreen = false, pausedAt = null;

    function loop(ts){
      pending = false;
      if (!running) return;
      /* a pause must not eat into the sequence — shift its clock by
         however long we were stopped, or it jumps on the way back */
      if (pausedAt !== null){
        if (t0 !== null) t0 += ts - pausedAt;
        pausedAt = null;
      }
      var done = true;
      if (mode === 'seq'){
        if (t0 === null) t0 = ts;
        var t = ts - t0;
        for (var i = 0; i < seq.length && done; i++){
          var s = seq[i];
          if (t < s.d){
            setV(s.from + (s.to - s.from) * s.ease(t / s.d), ts);
            done = false;
          }
          t -= s.d;
        }
        if (done) mode = 'idle';
      }
      /* gentle needle flutter around idle */
      if (mode === 'idle')
        setV(IDLE + 0.035 * Math.sin(ts / 140) + 0.02 * Math.sin(ts / 47 + 1.3), ts);
      pending = true;
      requestAnimationFrame(loop);
    }
    function sync(){
      var want = visible && onscreen;
      if (want === running) return;
      running = want;
      if (running){ if (!pending){ pending = true; requestAnimationFrame(loop); } }
      else pausedAt = performance.now();
    }

    return {
      show:     function(){ visible = true;  sync(); },
      hide:     function(){ visible = false; sync(); },
      onScreen: function(v){ onscreen = v;   sync(); },
      /* the only way the engine revs a second time */
      rev:      function(){ seq = SEQ.slice(3); mode = 'seq'; t0 = null;
                            pausedAt = null; sync(); }
    };
  }

  /* ══ 08b · the dyno pull ════════════════════════════════════════
     A chassis-dyno plot of the same engine the tach is attached to:
     torque against engine speed, with power derived from it. The two
     curves therefore cross at 5252 rpm, exactly as they do on a real
     sheet — that crossing is the giveaway that a dyno chart is honest
     arithmetic and not a drawing.

     The numbers are a SAMPLE, labelled as one on the face. Swap the
     TQ array below for a real pull whenever the shop has one to show. */
  function buildDyno(){
    var svg = dynoSvg;
    var hpOut = $('#hpOut'), tqOut = $('#tqOut'), rpmOut = $('#dynoRpm');

    var R0 = 1000, R1 = 7000, YMAX = 700, STEP = 500;
    var L = 56, RG = 416, T = 74, B = 344;
    /* lb-ft every 500 rpm from 1000. The top end has to fall away
       faster than the revs climb (steeper than tq/rpm per rpm) or power
       never peaks — the first cut of this curve was still making more
       horsepower at the limiter, which no real sheet does. */
    var TQ = [382, 462, 523, 560, 579, 590, 596, 594, 571, 542, 505, 455, 396];

    function X(r){ return L + (r - R0) / (R1 - R0) * (RG - L); }
    function Y(v){ return B - (v / YMAX) * (B - T); }
    /* Catmull-Rom through the control points — smooth, and it passes
       through every measured value instead of averaging them away */
    function tqAt(r){
      var f = (r - R0) / STEP;
      var i = Math.max(0, Math.min(TQ.length - 2, Math.floor(f)));
      var t = f - i;
      var p0 = TQ[Math.max(0, i - 1)], p1 = TQ[i],
          p2 = TQ[i + 1], p3 = TQ[Math.min(TQ.length - 1, i + 2)];
      return .5 * (2*p1 + (-p0 + p2)*t + (2*p0 - 5*p1 + 4*p2 - p3)*t*t +
                   (-p0 + 3*p1 - 3*p2 + p3)*t*t*t);
    }
    function hpAt(r){ return tqAt(r) * r / 5252; }

    /* find the peaks off the curve itself, so the callouts can never
       drift away from what is actually drawn */
    var pkHp = { v: 0, r: R0 }, pkTq = { v: 0, r: R0 };
    for (var r = R0; r <= R1; r += 10){
      var h = hpAt(r), q = tqAt(r);
      if (h > pkHp.v){ pkHp = { v: h, r: r }; }
      if (q > pkTq.v){ pkTq = { v: q, r: r }; }
    }

    /* face */
    if (P.face) mk(svg, 'rect', { x: 0, y: 0, width: 440, height: 440, rx: 0,
        fill: P.face, stroke: 'none' });
    txt(svg, 220, 34, 'POWER & TORQUE', 12.5, P.label1,
        { 'letter-spacing': '3.4', 'font-weight': 500 });
    txt(svg, 220, 52, 'SAMPLE PULL · CHASSIS DYNO', 9, P.label3,
        { 'letter-spacing': '2.6' });

    mk(svg, 'rect', { x: L, y: T, width: RG - L, height: B - T, fill: P.plot,
        stroke: 'none' });

    /* grid + scales */
    for (var gv = 0; gv <= 600; gv += 200){
      mk(svg, 'line', { x1: L, y1: Y(gv), x2: RG, y2: Y(gv),
          stroke: gv === 0 ? P.axis : P.grid, 'stroke-width': 1 });
      txt(svg, L - 10, Y(gv), gv, 10, P.label3,
          { 'text-anchor': 'end', 'dominant-baseline': 'central' });
    }
    for (var gr = R0; gr <= R1; gr += 1000){
      mk(svg, 'line', { x1: X(gr), y1: T, x2: X(gr), y2: B,
          stroke: gr === R0 ? P.axis : P.grid, 'stroke-width': 1 });
      txt(svg, X(gr), B + 21, gr / 1000, 11.5, P.label2, { 'font-weight': 500 });
    }
    txt(svg, 220, B + 41, 'ENGINE SPEED  ×1000 RPM', 9, P.label3,
        { 'letter-spacing': '2.4' });

    /* the curves */
    function pathFor(fn){
      var d = '';
      for (var r = R0; r <= R1; r += 40)
        d += (d ? 'L' : 'M') + X(r).toFixed(1) + ' ' + Y(fn(r)).toFixed(1) + ' ';
      return d;
    }
    var line = { fill: 'none', 'stroke-width': 3, 'stroke-linecap': 'round',
                 'stroke-linejoin': 'round' };
    function curve(fn, color, glow){
      var a = {}; for (var k in line) a[k] = line[k];
      a.d = pathFor(fn); a.stroke = color;
      a.style = 'filter:drop-shadow(0 0 6px ' + glow + ')';
      return mk(svg, 'path', a);
    }
    var tqPath = curve(tqAt, P.tq, 'transparent');
    var hpPath = curve(hpAt, P.hp, P.arcGlow);

    /* travelling read-out: a cursor down the plot and a dot on each
       curve, so the pull reads as a machine measuring rather than two
       lines appearing */
    var cursor = mk(svg, 'line', { x1: L, y1: T, x2: L, y2: B,
        stroke: P.cursor, 'stroke-width': 1.5, opacity: 0 });
    var hpDot = mk(svg, 'circle', { cx: L, cy: B, r: 4.5, fill: P.hp, opacity: 0 });
    var tqDot = mk(svg, 'circle', { cx: L, cy: B, r: 4.5, fill: P.tq, opacity: 0 });

    /* peak callouts — held back until the run is over */
    var marks = mk(svg, 'g', { opacity: 0,
        style: 'transition:opacity .45s ease' });
    function callout(pk, label, color, dy, anchor){
      mk(svg, 'circle', { cx: X(pk.r), cy: Y(pk.v), r: 4, fill: color,
          stroke: P.face || '#0a0b0e', 'stroke-width': 1.5 }, marks);
      var tx = txt(svg, X(pk.r) + (anchor === 'end' ? -9 : 9), Y(pk.v) + dy,
          Math.round(pk.v) + label, 10.5, color,
          { 'text-anchor': anchor, 'font-weight': 500 });
      marks.appendChild(tx);
    }
    callout(pkHp, ' HP',    P.hp, -10, 'end');
    callout(pkTq, ' LB-FT', P.tq, -11, 'middle');

    /* legend */
    function key(x, color, label){
      mk(svg, 'line', { x1: x, y1: 404, x2: x + 20, y2: 404, stroke: color,
          'stroke-width': 3, 'stroke-linecap': 'round' });
      var t = txt(svg, x + 26, 404, label, 10, P.label2,
          { 'text-anchor': 'start', 'dominant-baseline': 'central',
            'letter-spacing': '1.6' });
      return t;
    }
    key(138, P.hp, 'HP');
    key(228, P.tq, 'LB-FT');
    txt(svg, 220, 428, 'NB AUTOWORKS · CAMPO 4', 8.5, P.label3,
        { 'letter-spacing': '3' });

    var hpLen = hpPath.getTotalLength ? hpPath.getTotalLength() : 0;
    var tqLen = tqPath.getTotalLength ? tqPath.getTotalLength() : 0;
    [[hpPath, hpLen], [tqPath, tqLen]].forEach(function(p){
      p[0].setAttribute('stroke-dasharray', p[1]);
      p[0].setAttribute('stroke-dashoffset', p[1]);
    });

    function chips(hp, tq, rpm){
      if (hpOut) hpOut.textContent = ('000' + Math.round(hp)).slice(-3);
      if (tqOut) tqOut.textContent = ('000' + Math.round(tq)).slice(-3);
      if (rpmOut) rpmOut.textContent = ('0000' + (Math.round(rpm / 10) * 10)).slice(-4);
    }

    var raf = null, DUR = 2300;
    function settle(){
      hpPath.setAttribute('stroke-dashoffset', 0);
      tqPath.setAttribute('stroke-dashoffset', 0);
      cursor.setAttribute('opacity', 0);
      hpDot.setAttribute('opacity', 0);
      tqDot.setAttribute('opacity', 0);
      marks.setAttribute('opacity', 1);
      chips(pkHp.v, pkTq.v, pkHp.r);
    }
    if (RM){ settle(); return { play: settle, stop: function(){} }; }

    function stop(){ if (raf){ cancelAnimationFrame(raf); raf = null; } }
    function play(){
      stop();
      marks.setAttribute('opacity', 0);
      cursor.setAttribute('opacity', 1);
      hpDot.setAttribute('opacity', 1);
      tqDot.setAttribute('opacity', 1);
      chips(0, 0, R0);
      var t0 = null;
      raf = requestAnimationFrame(function step(ts){
        if (t0 === null) t0 = ts;
        var k = Math.min(1, (ts - t0) / DUR), e = easeOut(k);
        hpPath.setAttribute('stroke-dashoffset', hpLen * (1 - e));
        tqPath.setAttribute('stroke-dashoffset', tqLen * (1 - e));
        var r = R0 + (R1 - R0) * e, x = X(r);
        cursor.setAttribute('x1', x); cursor.setAttribute('x2', x);
        hpDot.setAttribute('cx', x); hpDot.setAttribute('cy', Y(hpAt(r)));
        tqDot.setAttribute('cx', x); tqDot.setAttribute('cy', Y(tqAt(r)));
        chips(hpAt(r), tqAt(r), r);
        if (k < 1){ raf = requestAnimationFrame(step); return; }
        raf = null;
        /* the tip catches up, the callouts land */
        cursor.setAttribute('opacity', 0);
        hpDot.setAttribute('opacity', 0);
        tqDot.setAttribute('opacity', 0);
        marks.setAttribute('opacity', 1);
        chips(pkHp.v, pkTq.v, pkHp.r);
      });
    }
    return { play: play, stop: stop };
  }

  /* ══ 08c · the turn ═════════════════════════════════════════════ */
  var tach = buildTach();
  var dyno = (dynoSvg && flipEl) ? buildDyno() : null;

  /* the hint line belongs to the face, so each one is its own element:
     applyLang rewrites the innerHTML of anything carrying data-es, and
     would wipe a single line we were retitling from JS */
  var hints = {};
  if (card){
    var hint = el('p', 'gauge-card__hint');
    hints.tach = el('span', 'is-on', '<b>Tap</b> the gauge to rev it');
    hints.tach.setAttribute('data-es', '<b>Toca</b> el tacómetro para acelerar');
    hints.dyno = el('span', '', 'Power &amp; torque — <b>sample pull</b>');
    hints.dyno.setAttribute('data-es', 'Potencia y par — <b>curva de muestra</b>');
    hint.appendChild(hints.tach); hint.appendChild(hints.dyno);
    card.appendChild(hint);
  }

  var faces = {
    tach: { chips: $('.chipset--tach'), pane: $('.inst--tach') },
    dyno: { chips: $('.chipset--dyno'), pane: $('.inst--dyno') }
  };

  /* no dyno face, no reduced motion, no flip — just the tach as before */
  if (!dyno || RM){
    tach.show();
    if ('IntersectionObserver' in window){
      new IntersectionObserver(function(e){ tach.onScreen(e[0].isIntersecting); },
        { threshold: 0 }).observe(tachSvg);
    } else tach.onScreen(true);
    if (card && !RM){
      card.classList.add('is-live');
      card.addEventListener('click', function(){ tach.rev(); });
    }
    return;
  }

  var TACH_MS = 7200, DYNO_MS = 7800, TURN = 1050;
  var face = 'tach', onscreen = false, held = false;
  var timer = null, mid = null, park = null;

  function later(fn, ms){ return setTimeout(fn, ms); }
  function clearAll(){
    if (timer){ clearTimeout(timer); timer = null; }
    if (mid){ clearTimeout(mid); mid = null; }
  }
  /* the dyno starts parked; the first turn brings it round */
  if (faces.dyno.pane) faces.dyno.pane.classList.add('is-off');
  function schedule(ms){
    if (timer) clearTimeout(timer);
    timer = (onscreen && !held) ? later(turn, ms) : null;
  }

  function turn(){
    face = (face === 'tach') ? 'dyno' : 'tach';
    var to = faces[face], from = faces[face === 'tach' ? 'dyno' : 'tach'];

    /* restart the edge-light even if it is mid-run */
    if (stage){
      stage.classList.remove('is-turning');
      void stage.offsetWidth;
      stage.classList.add('is-turning');
    }
    flipEl.classList.toggle('is-dyno', face === 'dyno');
    if (to.chips)   to.chips.classList.add('is-on');
    if (from.chips) from.chips.classList.remove('is-on');
    if (to.pane)    to.pane.removeAttribute('aria-hidden');
    if (from.pane)  from.pane.setAttribute('aria-hidden', 'true');
    if (hints.tach){
      hints.tach.classList.toggle('is-on', face === 'tach');
      hints.dyno.classList.toggle('is-on', face === 'dyno');
    }

    /* both faces have to be present for the card to have two sides */
    if (to.pane)   to.pane.classList.remove('is-off');
    if (from.pane) from.pane.classList.remove('is-off');

    if (mid) clearTimeout(mid);
    mid = later(function(){
      mid = null;
      if (face === 'dyno'){
        dyno.play();            /* starts as the face swings into view */
        tach.hide();            /* …and the tach stops burning frames  */
      } else {
        /* back on the tach: it resumes at idle. The start sequence
           already ran, so nothing re-revs — that is a tap only. */
        tach.show();
        dyno.stop();
      }
    }, TURN * .48);

    if (park) clearTimeout(park);
    park = later(function(){
      park = null;
      if (from.pane) from.pane.classList.add('is-off');
    }, TURN + 40);

    schedule(face === 'dyno' ? DYNO_MS : TACH_MS);
  }

  tach.show();
  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(e){
      onscreen = e[0].isIntersecting;
      tach.onScreen(onscreen && face === 'tach');
      if (onscreen) schedule(face === 'dyno' ? DYNO_MS : TACH_MS);
      else clearAll();
    }, { threshold: 0 }).observe(card || tachSvg);
  } else {
    onscreen = true; tach.onScreen(true);
    schedule(TACH_MS);
  }

  /* hold the rotation while someone is actually reading the card */
  if (card){
    card.classList.add('is-live');
    ['pointerenter', 'focusin'].forEach(function(ev){
      card.addEventListener(ev, function(){ held = true; clearAll(); });
    });
    ['pointerleave', 'focusout'].forEach(function(ev){
      card.addEventListener(ev, function(){
        held = false;
        schedule(face === 'dyno' ? DYNO_MS : TACH_MS);
      });
    });
    card.addEventListener('click', function(){
      if (face === 'tach'){
        tach.rev();
        schedule(TACH_MS);      /* don't turn away mid-rev */
      } else {
        dyno.play();
        schedule(DYNO_MS);
      }
    });
  }
});

/* ── photos fade in as they load ─────────────────────────────────── */
safe(function fadeIn(){
  if (RM) return;
  $$('img[loading="lazy"]').forEach(function(img){
    if (img.complete) return;
    img.classList.add('img-in');
    var on = function(){ img.classList.add('is-on'); };
    img.addEventListener('load', on);
    img.addEventListener('error', on);
    if (img.complete) on();              /* raced us to it */
  });
});

/* ── footer year ─────────────────────────────────────────────────── */
var yr = $('#year');
if (yr) yr.textContent = new Date().getFullYear();

/* injected copy (view chips, gauge hint, lightbox footer) joins the
   language toggle — re-running is a no-op for everything else */
applyLang(lang);

})();
