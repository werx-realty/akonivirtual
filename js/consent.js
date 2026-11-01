/* Akoni Virtual cookie consent.
   Categories actually used on this site:
   - essential  : remembers this choice (akoni_consent cookie); Stripe sets its own cookies on Stripe's checkout page.
   - preferences: saves unsent form entries in this browser (agreement page) so they aren't lost.
   No analytics or advertising cookies are used, so none are shown.
   Nothing nonessential is stored until the visitor accepts. Global Privacy Control is honored as "reject". */
(function () {
  if (window.AkoniConsent) return;
  var NAME = 'akoni_consent', VERSION = 1, DAYS = 365;
  /* Google Analytics 4 Measurement ID (e.g. 'G-XXXXXXXXXX'). Leave empty = no analytics, and the Analytics option is hidden.
     When set, GA loads ONLY after the visitor turns Analytics on. */
  var GA_ID = '';
  var BASE = window.AKONI_LEGAL_BASE || '/';
  var gpc = navigator.globalPrivacyControl === true;
  var listeners = [];

  function read() {
    var m = document.cookie.match(/(?:^|;\s*)akoni_consent=([^;]+)/);
    if (!m) return null;
    try { var v = JSON.parse(decodeURIComponent(m[1])); return v && v.v === VERSION ? v : null; } catch (e) { return null; }
  }
  function write(prefs, analytics) {
    if (analytics === undefined) analytics = prefs;
    var v = { v: VERSION, preferences: !!prefs, analytics: !!(GA_ID && analytics), gpc: gpc, ts: new Date().toISOString() };
    document.cookie = NAME + '=' + encodeURIComponent(JSON.stringify(v)) + ';max-age=' + DAYS * 86400 + ';path=/;SameSite=Lax' + (location.protocol === 'https:' ? ';Secure' : '');
    if (!v.preferences) { try { localStorage.removeItem('akoni-agreement-draft'); } catch (e) {} }
    if (!v.analytics) clearGa();
    listeners.forEach(function (f) { try { f(v); } catch (e) {} });
    if (v.analytics) loadGa();
    return v;
  }
  function loadGa() {
    if (!GA_ID || window.__akGa) return; window.__akGa = 1;
    window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', GA_ID, { anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false });
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID; document.head.appendChild(s);
  }
  function clearGa() {
    document.cookie.split(';').forEach(function (c) { var n = c.split('=')[0].trim(); if (/^_ga/.test(n)) { var h = location.hostname.replace(/^www\./, ''); ['', ';domain=' + h, ';domain=.' + h].forEach(function (d) { document.cookie = n + '=;max-age=0;path=/' + d; }); } });
  }
  var state = read();
  if (!state && gpc) state = write(false, false);
  if (state && state.analytics) loadGa();

  var css = '.akc-bar{position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#0a0d14;color:#e6eaf2;border-top:3px solid #1f6bff;box-shadow:0 -12px 40px rgba(0,0,0,.25);font-family:"Plus Jakarta Sans",system-ui,-apple-system,sans-serif;padding:18px max(16px,env(safe-area-inset-right,0px)) calc(18px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))}' +
    '.akc-in{max-width:1180px;margin:0 auto;display:flex;gap:20px;align-items:center;flex-wrap:wrap}' +
    '.akc-txt{flex:1 1 420px;min-width:0;font-size:14.5px;line-height:1.55}.akc-txt b{color:#fff;display:block;font-size:15.5px;margin-bottom:3px}.akc-txt a{color:#8fb4ff}' +
    '.akc-btns{display:flex;gap:10px;flex-wrap:wrap}' +
    '.akc-b{font:inherit;font-family:inherit;font-weight:700;font-size:14px;min-height:44px;padding:0 18px;border-radius:10px;cursor:pointer;border:1.5px solid #3a4253;background:transparent;color:#fff}' +
    '.akc-b:hover{border-color:#8fb4ff}.akc-b.p{background:#1f6bff;border-color:#1f6bff}.akc-b.p:hover{background:#0d4fd6}' +
    '.akc-b:focus-visible,.akc-sw input:focus-visible+span{outline:3px solid rgba(143,180,255,.6);outline-offset:2px}' +
    '.akc-ov{position:fixed;inset:0;z-index:10000;background:rgba(10,13,20,.6);display:grid;place-items:center;padding:16px;font-family:"Plus Jakarta Sans",system-ui,sans-serif}' +
    '.akc-dlg{background:#fff;color:#151b27;border-radius:18px;width:min(560px,100%);max-height:90vh;overflow:auto;box-shadow:0 30px 80px rgba(0,0,0,.35)}' +
    '.akc-h{background:#0a0d14;color:#fff;padding:18px 22px;border-bottom:3px solid #1f6bff;font-weight:800;font-size:17px}' +
    '.akc-body{padding:20px 22px;display:grid;gap:14px;font-size:14.5px;line-height:1.55;color:#3b4456}' +
    '.akc-cat{border:1px solid #d5dae3;border-radius:13px;padding:14px 16px;display:grid;gap:6px}' +
    '.akc-row{display:flex;justify-content:space-between;align-items:center;gap:12px}.akc-row b{color:#151b27;font-size:15px}' +
    '.akc-on{font-size:12px;font-weight:700;color:#0d4fd6;background:#e8f0ff;border-radius:999px;padding:4px 10px}' +
    '.akc-sw{position:relative;display:inline-block;width:46px;height:26px;flex:none}.akc-sw input{position:absolute;opacity:0;width:100%;height:100%;margin:0;cursor:pointer}' +
    '.akc-sw span{position:absolute;inset:0;border-radius:999px;background:#c7cdd8;transition:.2s}.akc-sw span:after{content:"";position:absolute;left:3px;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:.2s}' +
    '.akc-sw input:checked+span{background:#1f6bff}.akc-sw input:checked+span:after{transform:translateX(20px)}' +
    '.akc-note{background:#f3f5f9;border-radius:10px;padding:10px 12px;font-size:13.5px}' +
    '.akc-foot{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;padding:0 22px 20px}.akc-foot .akc-b{color:#151b27;border-color:#d5dae3}.akc-foot .akc-b.p{color:#fff}' +
    '@media (max-width:640px){.akc-btns{width:100%}.akc-btns .akc-b{flex:1 1 auto}}';

  function el(html) { var d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }
  function addStyle() { if (document.getElementById('akc-style')) return; var s = document.createElement('style'); s.id = 'akc-style'; s.textContent = css; document.head.appendChild(s); }

  var bar = null;
  function showBar() {
    if (bar) return; addStyle();
    bar = el('<div class="akc-bar" role="region" aria-label="Cookie choices"><div class="akc-in"><div class="akc-txt"><b>Your privacy choices</b>' +
      'We use only the cookies needed to run this site. If you accept, we’ll also save what you type into forms on this device so you don’t lose it. We don’t use analytics or advertising cookies. <a href="' + BASE + 'cookie-policy.html">Cookie Policy</a> · <a href="' + BASE + 'privacy.html">Privacy Policy</a></div>' +
      '<div class="akc-btns"><button class="akc-b" data-akc="settings" type="button">Cookie settings</button><button class="akc-b" data-akc="reject" type="button">Reject nonessential</button><button class="akc-b p" data-akc="accept" type="button">Accept all</button></div></div></div>');
    bar.addEventListener('click', function (e) {
      var a = e.target.getAttribute('data-akc'); if (!a) return;
      if (a === 'accept') { state = write(true); hideBar(); }
      if (a === 'reject') { state = write(false); hideBar(); }
      if (a === 'settings') openSettings();
    });
    document.body.appendChild(bar);
  }
  function hideBar() { if (bar) { bar.remove(); bar = null; } }

  function openSettings() {
    addStyle();
    var cur = state ? state.preferences : false;
    var ov = el('<div class="akc-ov" role="dialog" aria-modal="true" aria-labelledby="akc-t"><div class="akc-dlg"><div class="akc-h" id="akc-t">Cookie settings</div><div class="akc-body">' +
      (gpc ? '<div class="akc-note">Your browser sent a Global Privacy Control signal, so nonessential storage is off by default. You can still turn it on below.</div>' : '') +
      '<div class="akc-cat"><div class="akc-row"><b>Essential</b><span class="akc-on">Always on</span></div>Needed for the site to work: remembering your cookie choice, signing in to the agreements desk, and secure checkout on Stripe’s payment page.</div>' +
      '<div class="akc-cat"><div class="akc-row"><b>Preferences</b><label class="akc-sw"><input type="checkbox" id="akc-pref"' + (cur ? ' checked' : '') + ' aria-label="Allow preference storage"><span></span></label></div>Saves the details you type into the agreement form on this device, so you can pick up where you left off. Stays on your device only.</div>' +
      '<div class="akc-note">We don’t use analytics, advertising or social media cookies. <a href="' + BASE + 'cookie-policy.html" style="color:#0d4fd6">Read the Cookie Policy</a></div>' +
      '</div><div class="akc-foot"><button class="akc-b" data-x="reject" type="button">Reject nonessential</button><button class="akc-b" data-x="save" type="button">Save choices</button><button class="akc-b p" data-x="accept" type="button">Accept all</button></div></div></div>');
    function close() { ov.remove(); document.removeEventListener('keydown', esc); }
    function esc(e) { if (e.key === 'Escape') close(); }
    ov.addEventListener('click', function (e) {
      if (e.target === ov) return close();
      var x = e.target.getAttribute('data-x'); if (!x) return;
      var an = ov.querySelector('#akc-an');
      state = x === 'accept' ? write(true, true) : x === 'reject' ? write(false, false) : write(ov.querySelector('#akc-pref').checked, an ? an.checked : false);
      hideBar(); close();
    });
    document.addEventListener('keydown', esc);
    document.body.appendChild(ov);
    ov.querySelector('button[data-x="accept"]').focus();
  }

  window.AkoniConsent = {
    get: function () { return state; },
    has: function (cat) { return cat === 'essential' ? true : !!(state && state[cat]); },
    open: openSettings,
    onChange: function (f) { listeners.push(f); },
  };
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-cookie-settings]');
    if (t) { e.preventDefault(); openSettings(); }
  });
  function init() { if (!state) showBar(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
