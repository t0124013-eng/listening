/* =========================================================
   リスニング ラボ（メモリーポット スクール リスニング版）
   ========================================================= */

/* ★ 結果の送り先：Apps Script を「ウェブアプリ」として公開した URL を貼る。
   貼ると、セットを終えるたびに結果が自動でスプレッドシートに記録されます（空なら送りません） */
const REPORT_URL = 'https://script.google.com/macros/s/AKfycbzdOJedUrFRsghjkk2c2X74a_H0aHKbtubnTbbK-j4Eau_fevbGemvsD2NJ1dYTK0VLjg/exec';

const KEY = 'listening-lab-v1';
const SETS = window.LISTENING_SETS || [];
const $ = id => document.getElementById(id);
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } };
const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const dayDiff = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 864e5);
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const wait = ms => new Promise(r => setTimeout(r, ms));
const MARK = ['①', '②', '③', '④'];
const PART = {
  A: { name: 'Part A　短い発話', sub: '先に選択肢を読もう（5秒）。内容に最も近いものを選ぶ。', color: 'var(--part-a)', ansSec: 10, preview: 5 },
  B: { name: 'Part B　対話', sub: '先に状況と選択肢を読もう（5秒）。', color: 'var(--part-b)', ansSec: 15, preview: 5 },
  C: { name: 'Part C　講義', sub: '先に設問に目を通そう（30秒）。', color: 'var(--part-c)', ansSec: 40, preview: 30 }
};
const PLAY_SVG = '<svg viewBox="0 0 12 14" aria-hidden="true"><path d="M1 1.2v11.6a.8.8 0 0 0 1.2.7l9.4-5.8a.8.8 0 0 0 0-1.4L2.2.5A.8.8 0 0 0 1 1.2z" fill="currentColor"/></svg>';

/* ---------- 保存データ ---------- */
let prog = load(KEY + '-prog', { sets: {} });       // セットごとの記録
let day = load(KEY + '-day', { d: '', sets: 0, correct: 0, total: 0, secs: 0 });
let streak = load(KEY + '-streak', { n: 0, last: '' });
let cards = load(KEY + '-cards', []);
let opts = load(KEY + '-opts', { rate: 0.92 }); if (opts.mode !== 1 && opts.mode !== 2) opts.mode = 2;
let prof = load(KEY + '-profile', null);
if (day.d !== todayKey()) day = { d: todayKey(), sets: 0, correct: 0, total: 0, secs: 0 };
const saveAll = () => { store(KEY + '-prog', prog); store(KEY + '-day', day); store(KEY + '-streak', streak); store(KEY + '-cards', cards); };

/* ---------- 先生（イラスト）・ポップアップ・トースト ---------- */
const IMG = k => `img/${k}.png`;
const coach = (k, html) => `<div class="coach"><div class="coach-fig"><img src="${IMG(k)}" alt=""></div><div class="coach-say">${html}</div></div>`;
let popQ = [];
function pop(o) { popQ.push(o); if ($('pop').hidden) nextPop(); }
function nextPop() {
  const P = $('pop'), o = popQ.shift(); if (!o) { P.hidden = true; return; }
  $('popImg').src = IMG(o.img || 'guide'); $('popTitle').textContent = o.title; $('popMsg').innerHTML = o.msg || '';
  const a = $('popActs'); a.innerHTML = '';
  (o.acts || [['OK']]).forEach(([l, fn, sub]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'pop-btn' + (sub ? ' sub' : ''); b.textContent = l; b.onclick = () => { nextPop(); if (fn) fn(); }; a.appendChild(b); });
  P.hidden = false;
}
let toastT = 0;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2200); }

/* ---------- 画面切り替え ---------- */
let current = 'top';
function show(name) {
  document.querySelectorAll('.screen').forEach(s => s.hidden = s.id !== 'scr-' + name);
  current = name;
  if (name === 'top') renderTop();
  if (name === 'home') renderHome();
  if (name === 'cards') renderCards();
}

/* ---------- 読み上げ（Web Speech API） ---------- */
const TTS = { voices: [] };
const FEMALE = /female|samantha|karen|moira|tessa|victoria|allison|ava|susan|serena|fiona|zira|aria|jenny|libby|sonia|hazel|emma|michelle|joanna|kendra|salli|natasha|catherine|kathy|zoe|nicky|martha|ana\b/i;
const MALE = /\bmale|daniel|alex\b|fred|\btom\b|aaron|arthur|oliver|rishi|david|mark|guy|ryan|george|christopher|eric|brian|andrew|james|thomas|gordon|evan|nathan|reed|rocko|eddy/i;
/* 端末ごとの標準的な声を優先（Apple / Chrome / Windows）。変わった声（Fred・Eloquence系など）は使わない */
const PREF = {
  W: ['Samantha', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny', 'Microsoft Zira', 'Allison', 'Ava', 'Susan', 'Karen'],
  M: ['Microsoft Guy', 'Microsoft Andrew', 'Microsoft Christopher', 'Aaron', 'Alex', 'Nathan', 'Evan', 'Microsoft David', 'Microsoft Mark', 'Google UK English Male', 'Daniel', 'Arthur']
};
function voiceScore(v, g) {
  let s = 0; const n = v.name;
  const pi = PREF[g].findIndex(p => n.includes(p)); if (pi >= 0) s += 40 - pi * 2;
  if (/^(Fred|Ralph|Kathy|Junior|Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley)\b/.test(n)) s -= 30;
  if (/^en[-_](US|GB)/i.test(v.lang)) s += 4; else if (/^en/i.test(v.lang)) s += 2;
  if (/natural|neural|enhanced|premium|online/i.test(n)) s += 3;
  if (/google/i.test(n)) s += 1;
  if (/novelty|whisper|bells|bubbles|cellos|organ|trinoids|zarvox|jester|superstar|bahh|boing|wobble|bad news|good news|hysterical|junior|albert/i.test(n)) s -= 20;
  const f = FEMALE.test(n), m = !f && MALE.test(n);
  if (g === 'W' && f) s += 6; if (g === 'M' && m) s += 6;
  if (g === 'W' && m) s -= 6; if (g === 'M' && f) s -= 6;
  if (/google us english/i.test(n) && g === 'W') s += 2;
  if (/google uk english male/i.test(n) && g === 'M') s += 2;
  return s;
}
function loadVoices() {
  if (!('speechSynthesis' in window)) return;
  TTS.voices = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
  fillVoiceSelects();
}
function voiceFor(g) {
  return [...TTS.voices].sort((a, b) => voiceScore(b, g) - voiceScore(a, g))[0] || null;
}
let playTok = 0;
function stopSpeech() { playTok++; try { speechSynthesis.cancel(); } catch (e) { } }
function unlockTTS() { try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) { } }
/* lines を startIdx から順に読む。止められたら 'cancel'、最後まで読めたら 'done' */
function speakSeq(lines, startIdx, onLine, onWord) {
  return new Promise(resolve => {
    if (!('speechSynthesis' in window)) { resolve('done'); return; }
    const tok = ++playTok;
    /* 長い文は Chrome で途中で切れることがあるので、文ごと（長ければ読点ごと）に分けて読む */
    const chunks = [];
    lines.forEach(([sp, text], li) => {
      if (li < (startIdx || 0)) return;
      let cursor = 0;
      const push = piece => { const off = text.indexOf(piece, cursor); cursor = off + piece.length; chunks.push([sp, piece, li, off]); };
      text.split(/(?<=[.!?])\s+(?=["A-Z])/).forEach(sent => {
        const w = sent.split(/\s+/);
        if (w.length <= 28) { push(sent); return; }
        const mid = sent.indexOf(', ', Math.floor(sent.length / 2) - 40);
        if (mid > 0) { push(sent.slice(0, mid + 1)); push(sent.slice(mid + 2)); }
        else push(sent);
      });
    });
    lines = chunks; let i = 0;
    const vM = voiceFor('M'), vW = voiceFor('W'), same = vM && vW && vM.voiceURI === vW.voiceURI;
    const next = () => {
      if (tok !== playTok) return resolve('cancel');
      if (i >= lines.length) return resolve('done');
      const [sp, text, li, off] = lines[i]; if (onLine && (i === 0 || lines[i - 1][2] !== li)) onLine(li);
      const u = new SpeechSynthesisUtterance(text), v = sp === 'M' ? vM : vW;
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-US';
      u.rate = opts.rate || 0.92; u.pitch = same ? (sp === 'M' ? 0.82 : 1.12) : 1;
      let done = false;
      const words = text.split(/\s+/).length;
      /* カラオケ表示：読み上げ位置（boundary）が届く端末はそれを使い、届かない端末は速さから位置を推定する */
      let gotB = false, t0 = Date.now(), est = 0;
      const say = pos => { if (onWord && tok === playTok) onWord(li, off + Math.min(pos, text.length)); };
      if (onWord) {
        say(0);
        est = setInterval(() => { if (!gotB) say(Math.floor((Date.now() - t0) / 1000 * 14.5 * u.rate)); }, 90);
        u.onstart = () => { t0 = Date.now(); };
        u.onboundary = e => { if (e.name && e.name !== 'word') return; gotB = true; say(e.charIndex); };
      }
      const wd = setTimeout(() => fin(), (words / (2.6 * u.rate)) * 1000 * 1.9 + 4000);
      const fin = () => {
        if (done) return; done = true; clearTimeout(wd); clearInterval(est); say(text.length + 1);
        const nx = lines[i + 1]; i++;
        setTimeout(next, !nx ? 0 : nx[0] !== sp ? 650 : nx[2] !== li ? 380 : 160);
      };
      u.onend = fin; u.onerror = fin;
      speechSynthesis.speak(u);
    };
    try { speechSynthesis.cancel(); } catch (e) { }
    setTimeout(next, 60);
  });
}
function hasEnglishVoice() { return TTS.voices.length > 0; }
/* 英文を単語ごとの span に分ける（カラオケ用） */
function kHTML(text) {
  let h = '', m;
  /* 単語と後ろの空白を1つの span にして、蛍光ペンが途切れずにつながるようにする */
  const re2 = /(\S+)(\s*)/g; h = esc(text.slice(0, text.search(/\S|$/)));
  while ((m = re2.exec(text))) { if (!m[0]) break; h += `<span class="kw" data-s="${m.index}" data-e="${m.index + m[1].length}">${esc(m[0])}</span>`; }
  return h;
}
function kMark(el, pos) { if (!el) return; el.querySelectorAll('.kw').forEach(w => { const s = +w.dataset.s, e = +w.dataset.e; w.classList.toggle('done', e <= pos); w.classList.toggle('now', s <= pos && pos < e); }); }
function kClear(el) { if (el) el.querySelectorAll('.kw').forEach(w => w.classList.remove('done', 'now')); }

/* ---------- 表紙 ---------- */
function renderHome() {
  const n = liveStreak(), d = day.d === todayKey() ? day.sets : 0;
  $('cvStreak').innerHTML = n ? `<b>${n}</b>日連続 ・ 今日 <b>${d}</b>セット` : 'まずは1セット、10分から。';
}
$('cvStart').onclick = () => show('top');

/* ---------- TOP ---------- */
function liveStreak() { return streak.last && dayDiff(streak.last, todayKey()) <= 1 ? streak.n : 0; }
function nextSet() {
  const notYet = SETS.find(s => !prog.sets[s.id]);
  if (notYet) return notYet;
  return [...SETS].sort((a, b) => (prog.sets[a.id].best - prog.sets[b.id].best) || (prog.sets[a.id].lastAt - prog.sets[b.id].lastAt))[0];
}
function renderTop() {
  $('stStreak').textContent = liveStreak(); $('stToday').textContent = day.d === todayKey() ? day.sets : 0;
  $('stDone').textContent = SETS.filter(s => prog.sets[s.id]).length; $('stDoneOf').textContent = '/ ' + SETS.length;
  const T = prog.tot || { c: 0, t: 0 };
  $('stRate').textContent = T.t ? Math.round(T.c / T.t * 100) : '—'; $('stRateU').textContent = T.t ? '%' : '';
  const ns = nextSet();
  if (ns) { const i = SETS.indexOf(ns); $('tcEyebrow').textContent = prog.sets[ns.id] ? `SET ${i + 1} ・ もう一度` : `SET ${i + 1} ・ NEXT`; $('tcTitle').textContent = ns.title; $('tcGo').onclick = () => confirmStart(ns); }
  const L = $('setList'); L.innerHTML = '';
  SETS.forEach((s, i) => {
    const p = prog.sets[s.id], b = document.createElement('button'); b.type = 'button'; b.className = 'set-row' + (p ? ' done' : '');
    b.innerHTML = `<span class="set-no">${String(i + 1).padStart(2, '0')}</span><span class="set-txt"><b>${esc(s.title)}</b><small>${esc(s.theme)}${p ? `・${p.count}回` : '・未挑戦'}</small></span><span class="set-best">${p ? `ベスト<b>${p.best}/${p.total}</b>` : ''}</span>`;
    b.onclick = () => confirmStart(s); L.appendChild(b);
  });
  $('cardN').textContent = cards.filter(c => !c.ok).length;
  $('setSum').textContent = rateLabel();
  renderReport();
}
const rateLabel = () => ({ 0.82: 'ゆっくり', 0.92: '標準', 1.02: '速め' })[opts.rate] || '標準';
function confirmStart(s) {
  if (!('speechSynthesis' in window)) { pop({ img: 'think', title: '音声が使えません', msg: 'このブラウザは読み上げに対応していません。<br><b>Chrome か Safari</b> で開いてください。' }); return; }
  if (!hasEnglishVoice()) loadVoices();
  if (!hasEnglishVoice()) { pop({ img: 'think', title: '英語の声が見つかりません', msg: '端末の設定で<b>英語の読み上げ音声</b>を追加すると聞けるようになります。<br>このまま始めると、端末の標準の声で読みます。', acts: [['やめる', null, 1], ['このまま始める', () => startSet(s)]] }); return; }
  if (REPORT_URL && !prof) { openProfile(() => startSet(s)); return; }
  startSet(s);
}

/* ---------- PLAY ---------- */
let S = null, clockInt = 0, wakeLock = null;
const cur = () => S.set.items[S.idx];
const qKey = (i, j) => `${i}-${j}`;
async function keepAwake() { try { if (navigator.wakeLock) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) { } }
function releaseAwake() { try { if (wakeLock) wakeLock.release(); } catch (e) { } wakeLock = null; }
function startSet(set) {
  unlockTTS();
  S = { set, idx: 0, ans: {}, started: 0, phase: 'ready', read: 0, line: 0, tok: 0, paused: false, cd: null, pausedMs: 0, pauseAt: 0, subs: {}, mode: opts.mode };
  show('play'); renderPlay();
  $('pClock').textContent = '0:00';
  /* スタート画面：セット名と、聞く回数（1回／2回）を選んでから始める */
  const p = prog.sets[set.id], i = SETS.indexOf(set);
  $('stEyebrow').textContent = `SET ${i + 1} ・ ${set.theme}`; $('stTitle').textContent = set.title;
  $('stBest').textContent = p ? `${p.count + 1}回目のチャレンジ・ベスト ${p.best}/${p.total}` : 'はじめてのチャレンジ';
  renderModes(); $('startLayer').hidden = false;
}
function renderModes() { document.querySelectorAll('.st-mode').forEach(b => b.setAttribute('aria-checked', Number(b.dataset.m) === S.mode)); }
document.querySelectorAll('.st-mode').forEach(b => b.onclick = () => { S.mode = Number(b.dataset.m); opts.mode = S.mode; store(KEY + '-opts', opts); renderModes(); });
$('stGo').onclick = () => {
  unlockTTS(); $('startLayer').hidden = true; keepAwake();
  S.started = Date.now();
  clearInterval(clockInt); clockInt = setInterval(() => { if (S && S.started && !S.paused) $('pClock').textContent = mmss((Date.now() - S.started - S.pausedMs) / 1000); }, 500);
  enterItem();
};
$('stCancel').onclick = () => { $('startLayer').hidden = true; quitSet(); };
function renderPlay() {
  const it = cur(), P = PART[it.part], same = S.set.items.filter(x => x.part === it.part), k = same.indexOf(it) + 1;
  $('scr-play').style.setProperty('--pc', P.color);
  $('pTag').textContent = 'Part ' + it.part; $('pPos').textContent = `${k} / ${same.length}`;
  $('pDots').innerHTML = S.set.items.map((x, i) => `<i class="${i < S.idx ? 'done' : i === S.idx ? 'now' : ''}"></i>`).join('');
  $('pBandTitle').innerHTML = esc(P.name) + `<span class="mode-tag m${S.mode}">${S.mode === 1 ? '1回・本番' : '2回・練習'}</span>`; $('pBandSub').textContent = P.sub;
  $('pSitu').hidden = !it.situation; $('pSitu').textContent = it.situation ? '【状況】' + it.situation : '';
  const Q = $('pQs'); Q.innerHTML = '';
  it.qs.forEach((q, j) => {
    const box = document.createElement('div'); box.className = 'qbox';
    const label = it.part === 'A' ? '聞こえた英文の内容に最も近いものを選ぼう。' : esc(q.q);
    box.innerHTML = `<div class="qtext">${it.qs.length > 1 ? `<span class="qn">問${j + 1}</span>` : ''}${label}</div>`;
    q.opts.forEach((o, n) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'opt'; b.setAttribute('aria-pressed', S.ans[qKey(S.idx, j)] === n);
      b.innerHTML = `<span class="on">${MARK[n]}</span><span>${esc(o)}</span>`;
      b.onclick = () => { S.ans[qKey(S.idx, j)] = n; box.querySelectorAll('.opt').forEach((x, m) => x.setAttribute('aria-pressed', m === n)); updateNext(); };
      box.appendChild(b);
    });
    Q.appendChild(box);
  });
  $('playScroll').scrollTop = 0;
  renderStatus();
}
function renderStatus() {
  const it = cur();
  const A = $('pAudio'); A.classList.toggle('on', S.phase === 'listen' && !S.paused);
  const st = { ready: ['スタートを押すと始まります', ''], preview: [it.part === 'C' ? '設問を読む時間' : '選択肢を読む時間', ''], listen: [`${S.read + 1}回目を再生中`, `${it.lines.length > 1 ? `${S.line + 1} / ${it.lines.length} 文` : ''}`], between: ['もう一度読まれます', ''], answer: ['解答時間', ''] }[S.phase] || ['', ''];
  $('auState').textContent = st[0]; $('auSub').textContent = st[1];
  $('auReads').innerHTML = S.mode === 1 ? `<i class="${S.read >= 1 ? 'done' : S.phase === 'listen' ? 'on' : ''}">1回のみ</i>` : [0, 1].map(r => `<i class="${r < S.read ? 'done' : (r === S.read && (S.phase === 'listen' || S.phase === 'between')) ? 'on' : ''}">${r + 1}回目</i>`).join('');
  $('pCd').hidden = !(S.phase === 'preview' || S.phase === 'answer');
  tickCd(); renderSub(); updateNext();
}
const allAnswered = () => cur().qs.every((q, j) => S.ans[qKey(S.idx, j)] !== undefined);
function updateNext() {
  const b = $('playNext'), lastItem = S.idx === S.set.items.length - 1;
  if (S.phase === 'ready') { b.disabled = true; b.textContent = '次へ'; return; }
  if (S.phase === 'preview' && !allAnswered()) { b.disabled = false; b.textContent = '読んだ → 再生'; return; }
  const ready = allAnswered();
  b.textContent = ready ? (lastItem ? '決定して採点' : '決定して次へ') : S.phase === 'answer' ? (lastItem ? '採点する' : '次へ（未回答）') : (cur().qs.length > 1 ? 'すべて選ぶと進めます' : '選ぶと進めます');
  b.disabled = !(ready || S.phase === 'answer');
}
function enterItem() {
  const it = cur(); S.read = 0; S.line = 0; stopCountdown();
  S.phase = 'preview'; renderPlay(); startCountdown(PART[it.part].preview, beginListen);
}
/* スタート画面で選んだ回数（1回／2回）だけ自動で読み、終わったら解答時間へ */
async function beginListen() {
  stopCountdown();
  const it = cur(), tok = ++S.tok;
  while (S.read < S.mode) {
    S.phase = 'listen'; renderStatus();
    const r = await speakSeq(it.lines, S.line, i => { if (!S || tok !== S.tok) return; S.line = i; renderStatus(); }, (li, pos) => { if (S && tok === S.tok && li === S.line && opts.sub) kMark($('subTx'), pos); });
    if (!S || tok !== S.tok || r === 'cancel') return;
    S.line = 0; S.read++;
    if (S.read < S.mode) { S.phase = 'between'; renderStatus(); await wait(2000); if (!S || tok !== S.tok) return; }
  }
  S.phase = 'answer'; renderStatus();
  startCountdown(PART[it.part].ansSec, nextItem);
}
/* ---------- 字幕 ---------- */
function renderSub() {
  const on = !!opts.sub, t = $('subTog'); t.setAttribute('aria-pressed', on); t.textContent = on ? '字幕 ON' : '字幕 OFF';
  const box = $('subPop'), it = cur(); $('scr-play').classList.toggle('sub-on', on);
  const show = on && S.phase === 'listen' && !S.paused;
  box.hidden = !show; if (!show) return;
  S.subs[S.idx] = true;
  const [sp, text] = it.lines[S.line] || ['', ''];
  const key = `${S.idx}-${S.read}-${S.line}`;
  if (S.subKey !== key) { S.subKey = key; $('subSp').textContent = sp === 'M' ? '男性' : '女性'; $('subTx').innerHTML = kHTML(text); }
}
$('subTog').onclick = () => { opts.sub = !opts.sub; store(KEY + '-opts', opts); renderSub(); };
function startCountdown(sec, onEnd) {
  stopCountdown(); S.cd = { remain: sec, total: sec, onEnd };
  tickCd(); S.cd.int = setInterval(() => { if (S.paused) return; S.cd.remain--; tickCd(); if (S.cd.remain <= 0) { const f = S.cd.onEnd; stopCountdown(); f(); } }, 1000);
}
function tickCd() { if (!S.cd) return; $('pCdBar').style.width = Math.max(0, S.cd.remain / S.cd.total * 100) + '%'; const s = $('auSub'); if (S.phase === 'answer' || S.phase === 'preview') s.textContent = `残り ${Math.max(0, S.cd.remain)} 秒` + ''; }
function stopCountdown() { if (S && S.cd) { clearInterval(S.cd.int); S.cd = null; } }
function nextItem() {
  stopCountdown(); stopSpeech(); S.tok++;
  if (S.idx >= S.set.items.length - 1) { finishSet(); return; }
  S.idx++; enterItem();
}
function pausePlay() {
  if (!S || S.paused || S.phase === 'ready') return; S.paused = true; S.pauseAt = Date.now(); S.tok++; stopSpeech();
  $('pausedLayer').hidden = false; $('playPause').textContent = '再開する'; renderStatus();
}
function resumePlay() {
  if (!S || !S.paused) return; S.paused = false; S.pausedMs += Date.now() - S.pauseAt; $('pausedLayer').hidden = true; $('playPause').textContent = '一時停止';
  unlockTTS();
  if (S.phase === 'listen' || S.phase === 'between') beginListen();
  else renderStatus();
}
$('playPause').onclick = () => { if (!S || S.phase === 'ready') return; if (S.paused) resumePlay(); else pausePlay(); };
$('playNext').onclick = () => { if (allAnswered() || S.phase === 'answer') nextItem(); else if (S.phase === 'preview') { unlockTTS(); beginListen(); } };
$('playQuit').onclick = () => { if (S && S.phase === 'ready') { quitSet(); return; } pausePlay(); pop({ img: 'think', title: 'セットを中断しますか？', msg: '途中までの解答は<b>記録されません</b>。', acts: [['つづける', resumePlay, 1], ['中断する', quitSet]] }); };
function quitSet() { stopCountdown(); stopSpeech(); clearInterval(clockInt); releaseAwake(); $('pausedLayer').hidden = true; $('startLayer').hidden = true; $('playPause').textContent = '一時停止'; S = null; show('top'); }
document.addEventListener('visibilitychange', () => { if (document.hidden && S && current === 'play' && !S.paused && S.phase !== 'ready') pausePlay(); });

/* ---------- 採点・結果 ---------- */
let last = null;
function finishSet() {
  clearInterval(clockInt); releaseAwake();
  const set = S.set, parts = { A: [0, 0], B: [0, 0], C: [0, 0] }; let score = 0, total = 0;
  set.items.forEach((it, i) => it.qs.forEach((q, j) => { const ok = S.ans[qKey(i, j)] === q.ans; parts[it.part][1]++; total++; if (ok) { parts[it.part][0]++; score++; } }));
  const secs = Math.round((Date.now() - S.started - S.pausedMs) / 1000);
  const mode = S.mode, subItems = Object.keys(S.subs).length;
  const p = prog.sets[set.id] || { best: 0, total, count: 0 };
  const first = !p.count;
  p.count++; p.best = Math.max(p.best, score); p.total = total; p.last = score; p.lastAt = Date.now(); p.lastDate = todayKey();
  prog.sets[set.id] = p;
  if (day.d !== todayKey()) day = { d: todayKey(), sets: 0, correct: 0, total: 0, secs: 0 };
  day.sets++; day.correct += score; day.total += total; day.secs += secs;
  const t = todayKey();
  if (streak.last !== t) { streak.n = streak.last && dayDiff(streak.last, t) === 1 ? streak.n + 1 : 1; streak.last = t; }
  prog.tot = prog.tot || { c: 0, t: 0 }; prog.tot.c += score; prog.tot.t += total;
  saveAll();
  last = { finishedAt: Date.now(), set, ans: { ...S.ans }, subs: { ...S.subs }, mode, subItems, parts, score, total, secs, count: p.count };
  S = null;
  renderResult(); show('result'); autoSend();
}
function renderResult() {
  const R = last, rate = R.score / R.total;
  $('resTitle').textContent = R.set.title;
  $('resScore').innerHTML = `${R.score}<small>/${R.total}</small>`;
  $('resMsg').textContent = rate === 1 ? '全問正解！ 講義の流れまでしっかりつかめています。' : rate >= .75 ? 'よくできました。まちがえた問題のスクリプトを確認しよう。' : rate >= .5 ? 'あと一歩。ふりかえりで聞き取れなかった文を探そう。' : '聞き取れなかった文を▶でくり返し聞いてみよう。';
  $('resCoach').innerHTML = coach(rate >= .75 ? 'cheer' : 'read', rate >= .75 ? `<b>${R.score}問正解</b>！ ふりかえりで、聞き取れなかった文を<b>カード</b>にしておくと次に強くなるよ。` : `ここからが本番。<b>ふりかえり</b>で英文を見ずにもう一度聞いて、どこでつまずいたか確かめよう。`);
  $('resParts').innerHTML = ['A', 'B', 'C'].map(k => `<div style="--pc:${PART[k].color}">Part ${k}<b>${R.parts[k][0]}/${R.parts[k][1]}</b></div>`).join('');
  $('resTime').textContent = mmss(R.secs); $('resAid').textContent = `${R.mode === 1 ? '1回・本番モード' : '2回・練習モード'}・字幕 ${R.subItems}問`; $('resCount').textContent = R.count;
  renderReport();
}
$('resHome').onclick = () => show('top');
$('toReview').onclick = () => { renderReview(); show('review'); };

/* ---------- ふりかえり ---------- */
function cardId(type, text) { return type + ':' + text; }
function hasCard(type, text) { return cards.some(c => c.id === cardId(type, text)); }
function addCard(c) { if (hasCard(c.type, c.text)) return false; cards.push({ ...c, id: cardId(c.type, c.text), ok: false, added: Date.now() }); saveAll(); return true; }
function removeCard(id) { cards = cards.filter(c => c.id !== id); saveAll(); }
/* 語句の例文（本文から）。例文の中の語句は太字にする */
function vocabEx(en) { for (const st of SETS) { const v = (st.vocab || []).find(x => x[0] === en); if (v && v[2]) return v[2]; } return ''; }
function exHTML(en, ex) {
  if (!ex) return '';
  const pat = en.replace(/one's/, '\\w+').split('~').map(p => p.trim().split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+')).join('\\s+(?:\\w+\\s+){0,3}?');
  const re = new RegExp('\\b(' + pat + '\\w*)', 'i'), m = ex.match(re);
  return m ? esc(ex.slice(0, m.index)) + '<b>' + esc(m[0]) + '</b>' + esc(ex.slice(m.index + m[0].length)) : esc(ex);
}
let rvIdx = 0, rvHide = false;
function cardBtnSync(btn, type, text) { const on = hasCard(type, text); btn.classList.toggle('added', on); btn.textContent = on ? '✓' : '＋'; btn.setAttribute('aria-label', on ? 'カードから外す' : 'ふくしゅうカードに入れる'); }
function itemResult(R, i) { const it = R.set.items[i], n = it.qs.filter((q, j) => R.ans[qKey(i, j)] === q.ans).length; return { n, all: n === it.qs.length }; }
function renderReview() { rvIdx = 0; $('rvTitle').textContent = last.set.title; drawReview(); }
function drawReview() {
  stopSpeech();
  const R = last, items = R.set.items, pages = items.length + 1;
  /* 上のタブ：A1〜C と 語句 */
  const T = $('rvTabs'); T.innerHTML = '';
  items.forEach((it, i) => {
    const k = items.filter(x => x.part === it.part).indexOf(it) + 1, r = itemResult(R, i), b = document.createElement('button');
    b.type = 'button'; b.role = 'tab'; b.className = 'rv-tab ' + (r.all ? 'ok' : r.n ? 'part' : 'ng'); b.setAttribute('aria-selected', i === rvIdx);
    b.innerHTML = `<span>${it.part}${it.part === 'C' ? '' : k}</span><i>${r.all ? '○' : r.n ? '△' : '×'}</i>`; b.onclick = () => { rvIdx = i; drawReview(); };
    T.appendChild(b);
  });
  const vb = document.createElement('button'); vb.type = 'button'; vb.role = 'tab'; vb.className = 'rv-tab'; vb.setAttribute('aria-selected', rvIdx === items.length);
  vb.innerHTML = '<span>語句</span><i>Aa</i>'; vb.onclick = () => { rvIdx = items.length; drawReview(); }; T.appendChild(vb);
  const sel = T.children[rvIdx]; if (sel) T.scrollLeft = Math.max(0, sel.offsetLeft - (T.clientWidth - sel.offsetWidth) / 2);
  const P = $('rvPage'); P.innerHTML = '';
  if (rvIdx < items.length) drawItemPage(P, R, rvIdx); else drawVocabPage(P, R);
  $('rvPrev').disabled = rvIdx === 0;
  $('rvNext').textContent = rvIdx === pages - 1 ? 'ふりかえり完了' : '次へ ›';
  $('rvScroll').scrollTop = 0;
}
function drawItemPage(P, R, i) {
  const it = R.set.items[i], k = R.set.items.filter(x => x.part === it.part).indexOf(it) + 1, r = itemResult(R, i);
  P.style.setProperty('--pc', PART[it.part].color);
  const aids = R.subs[i] ? '<span class="aid">字幕を使った</span>' : '';
  P.insertAdjacentHTML('beforeend', `<div class="rv-hero"><h2><small>${esc(PART[it.part].name.replace('　', ' ・ '))}</small>Part ${it.part}${it.part === 'C' ? '' : '-' + k}</h2><span class="verdict ${r.all ? 'ok' : 'ng'}">${r.all ? '○ 正解' : it.qs.length > 1 ? `${r.n} / ${it.qs.length} 正解` : '× 不正解'}</span></div>` +
    (aids ? `<div class="aids">${aids}</div>` : '') + (it.situation ? `<div class="situ">【状況】${esc(it.situation)}</div>` : ''));
  /* 答えと解説 */
  const A = document.createElement('div'); A.className = 'box';
  A.innerHTML = '<div class="box-h"><b>答えと解説</b></div>';
  it.qs.forEach((q, j) => {
    const my = R.ans[qKey(i, j)], ok = my === q.ans, d = document.createElement('div'); d.className = 'ans';
    d.innerHTML = `<div class="ans-q">${it.qs.length > 1 ? `<span class="qn" style="color:var(--pc)">問${j + 1}</span> ` : ''}${it.part === 'A' ? '内容に最も近いもの' : esc(q.q)}</div>` +
      `<div class="ans-row mine ${ok ? 'ok' : 'ng'}"><span class="lb">あなた</span><span>${my === undefined ? '（時間内に答えられませんでした）' : MARK[my] + ' ' + esc(q.opts[my])}</span></div>` +
      (ok ? '' : `<div class="ans-row right"><span class="lb">正解</span><span>${MARK[q.ans]} ${esc(q.opts[q.ans])}</span></div>`) +
      `<div class="exp2">${esc(q.exp)}</div>`;
    const more = document.createElement('button'); more.type = 'button'; more.className = 'more'; more.textContent = '選択肢をすべて見る';
    more.onclick = () => { more.replaceWith(Object.assign(document.createElement('div'), { className: 'allopts', innerHTML: q.opts.map((o, n) => `<span>${MARK[n]} ${esc(o)}</span>`).join('') })); };
    d.appendChild(more); A.appendChild(d);
  });
  P.appendChild(A);
  /* スクリプト */
  const S2 = document.createElement('div'); S2.className = 'box' + (rvHide ? ' hide-text' : '');
  S2.innerHTML = `<div class="box-h"><b>スクリプト</b><span class="tools"><button type="button" class="chip-tog" data-a="all">▶ 全文</button><button type="button" class="chip-tog" data-a="hide" aria-pressed="${rvHide}">${rvHide ? '英文を表示' : '英文をかくす'}</button></span></div><div class="hint">文をタップするとその文だけ再生。＋でふくしゅうカードへ。</div>`;
  const rows = [];
  it.lines.forEach(([sp, text]) => {
    const row = document.createElement('div'); row.className = 'sline';
    row.innerHTML = `<button type="button" class="sbtn"><span class="spk ${sp}">${sp === 'M' ? '男' : '女'}</span><span class="stx">${kHTML(text)}</span></button><button type="button" class="addb"></button>`;
    const tx = row.querySelector('.stx'), ab = row.querySelector('.addb');
    row.querySelector('.sbtn').onclick = () => { rows.forEach(x => { x.classList.remove('speaking'); kClear(x.querySelector('.stx')); }); row.classList.add('speaking');
      speakSeq([[sp, text]], 0, null, (li, pos) => kMark(tx, pos)).then(() => { row.classList.remove('speaking'); setTimeout(() => kClear(tx), 800); }); };
    cardBtnSync(ab, 'line', text);
    ab.onclick = () => { if (hasCard('line', text)) { removeCard(cardId('line', text)); toast('カードから外しました'); } else { addCard({ type: 'line', text, sp, set: R.set.id }); toast('ふくしゅうカードに入れました'); } cardBtnSync(ab, 'line', text); };
    rows.push(row); S2.appendChild(row);
  });
  S2.querySelector('[data-a="all"]').onclick = e => { const b = e.currentTarget; b.textContent = '再生中…'; rows.forEach(x => kClear(x.querySelector('.stx')));
    speakSeq(it.lines, 0, n => rows.forEach((x, m) => x.classList.toggle('speaking', m === n)), (li, pos) => rows[li] && kMark(rows[li].querySelector('.stx'), pos))
      .then(() => { rows.forEach(x => { x.classList.remove('speaking'); kClear(x.querySelector('.stx')); }); b.textContent = '▶ 全文'; }); };
  S2.querySelector('[data-a="hide"]').onclick = e => { rvHide = !rvHide; S2.classList.toggle('hide-text', rvHide); e.currentTarget.setAttribute('aria-pressed', rvHide); e.currentTarget.textContent = rvHide ? '英文を表示' : '英文をかくす'; };
  P.appendChild(S2);
}
function drawVocabPage(P, R) {
  P.style.setProperty('--pc', 'var(--ink-soft)');
  P.insertAdjacentHTML('beforeend', `<div class="rv-hero"><h2><small>このセットで覚えたい語句</small>重要語句</h2><span class="verdict ok" style="background:var(--desk-2);color:var(--ink)">${(R.set.vocab || []).length}語</span></div>`);
  const B = document.createElement('div'); B.className = 'box';
  B.innerHTML = '<div class="hint">語句をタップすると発音を聞けます。＋でふくしゅうカードへ。</div>';
  const L = document.createElement('div'); L.className = 'vlist';
  (R.set.vocab || []).forEach(([en, ja, ex]) => {
    const r = document.createElement('div'); r.className = 'vrow2';
    r.innerHTML = `<button type="button" class="vbtn"><b>${esc(en)}</b><small>${esc(ja)}</small>${ex ? `<span class="vex">${exHTML(en, ex)}</span>` : ''}</button><button type="button" class="addb"></button>`;
    r.querySelector('.vbtn').onclick = () => speakSeq([['W', en.replace(/~/g, 'something')]], 0);
    const ab = r.querySelector('.addb'); cardBtnSync(ab, 'word', en);
    ab.onclick = () => { if (hasCard('word', en)) removeCard(cardId('word', en)); else { addCard({ type: 'word', text: en, ja, ex, set: R.set.id }); toast('ふくしゅうカードに入れました'); } cardBtnSync(ab, 'word', en); };
    L.appendChild(r);
  });
  B.appendChild(L); P.appendChild(B);
}
$('rvPrev').onclick = () => { if (rvIdx > 0) { rvIdx--; drawReview(); } };
$('rvNext').onclick = () => { if (rvIdx < last.set.items.length) { rvIdx++; drawReview(); } else { stopSpeech(); show('top'); } };
$('rvBack').onclick = () => { stopSpeech(); show('result'); };

/* ---------- ふくしゅうカード ---------- */
let cq = [], cIdx = 0;
function renderCards() {
  cq = cards.filter(c => !c.ok); cIdx = 0; cStep = 0;
  $('cdCoach').innerHTML = coach('read', cards.length ? 'カードは<b>1回タップで音声</b>、<b>もう1回タップで答え</b>。語句カードの答えには意味と本文の例文が出るよ。' : 'ふりかえり画面で <b>＋</b> を押すと、聞き取れなかった文や語句がここにたまるよ。');
  drawCard(); drawCardList();
}
/* カード：1回タップで音声 → もう1回タップで答え（文カードは英文、語句カードは意味と本文の例文） */
let cStep = 0;
function speakCard(c) { speakSeq([[c.sp || 'W', c.text.replace(/~/g, 'something')]], 0); }
function drawCard() {
  const st = $('cdStage'); st.innerHTML = '';
  if (!cards.length) return;
  if (cIdx >= cq.length) { st.innerHTML = `<div class="empty">${cq.length ? `${cq.length}枚おわり！<br>` : 'まだ覚えていないカードはありません。<br>'}「覚えた」にしたカードは一覧から戻せます。</div>`; if (cq.length) { const b = document.createElement('button'); b.className = 'btn sub'; b.type = 'button'; b.textContent = 'もう一周する'; b.onclick = renderCards; st.appendChild(b); } return; }
  const c = cq[cIdx], card = document.createElement('button'), isLine = c.type === 'line', ex = c.ex || (isLine ? '' : vocabEx(c.text));
  card.type = 'button'; card.className = 'flash';
  const steps = `<span class="step"><i class="${cStep === 0 ? 'on' : ''}">1 タップで音声</i><i class="${cStep === 1 ? 'on' : ''}">2 タップで答え</i></span>`;
  let body = '';
  if (cStep < 2) {
    body = isLine ? `<span class="bigplay" role="presentation">${PLAY_SVG}</span><span class="tap">${cStep === 0 ? 'タップして聞こう' : '口に出してまねしてから、もう一度タップ'}</span>`
                  : `<span class="front">${esc(c.text)}</span><span class="tap">${cStep === 0 ? 'タップして発音を聞こう' : '意味を言ってから、もう一度タップ'}</span>`;
  } else {
    body = isLine ? `<span class="front line">${esc(c.text)}</span><span class="tap">タップでもう一度聞く</span>`
                  : `<span class="front">${esc(c.text)}</span><span class="ja">${esc(c.ja || '')}</span>${ex ? `<span class="ex">${exHTML(c.text, ex)}</span>` : ''}<span class="tap">タップで発音、例文は下のボタンで聞けます</span>`;
  }
  card.innerHTML = `<span class="kind">${isLine ? '文カード' : '語句カード'}　${cIdx + 1} / ${cq.length}</span>` + body + (cStep < 2 ? steps : '');
  card.onclick = () => { if (cStep === 0) { speakCard(c); cStep = 1; drawCard(); } else if (cStep === 1) { stopSpeech(); cStep = 2; drawCard(); } else speakCard(c); };
  st.appendChild(card);
  if (cStep === 2 && !isLine && ex) { const eb = document.createElement('button'); eb.type = 'button'; eb.className = 'btn sub'; eb.textContent = '▶ 例文を聞く'; eb.onclick = () => speakSeq([['W', ex]], 0); st.appendChild(eb); }
  const j = document.createElement('div'); j.className = 'judge';
  j.innerHTML = '<button type="button" class="btn no">まだ</button><button type="button" class="btn yes">覚えた</button>';
  j.children[0].onclick = () => { stopSpeech(); cq.push(cq[cIdx]); cIdx++; cStep = 0; if (cq.length > cards.length * 3) cq = cq.slice(0, cIdx + 1); drawCard(); };
  j.children[1].onclick = () => { stopSpeech(); c.ok = true; saveAll(); cIdx++; cStep = 0; drawCard(); drawCardList(); };
  st.appendChild(j);
}
function drawCardList() {
  const L = $('cdList'); L.innerHTML = '';
  if (!cards.length) { L.innerHTML = '<div class="empty">カードはまだありません。</div>'; return; }
  [...cards].reverse().forEach(c => {
    const r = document.createElement('div'); r.className = 'c-row' + (c.ok ? ' ok' : '');
    const set = SETS.find(s => s.id === c.set);
    r.innerHTML = `<button type="button" class="ibtn" aria-label="再生">${PLAY_SVG}</button><span class="t">${esc(c.text)}<small>${c.ja ? esc(c.ja) + '・' : ''}${set ? esc(set.title) : ''}${c.ok ? '・覚えた' : ''}</small></span><span style="display:flex;gap:8px"><button type="button" class="c-del" data-a="ok">${c.ok ? '戻す' : ''}</button><button type="button" class="c-del" data-a="del">削除</button></span>`;
    r.children[0].onclick = () => speakSeq([[c.sp || 'W', c.text.replace(/~/g, 'something')]], 0);
    r.querySelector('[data-a="ok"]').onclick = () => { c.ok = false; saveAll(); renderCards(); };
    r.querySelector('[data-a="del"]').onclick = () => { removeCard(c.id); renderCards(); };
    if (!c.ok) r.querySelector('[data-a="ok"]').remove();
    L.appendChild(r);
  });
}
$('toCards').onclick = () => show('cards');
$('cdBack').onclick = () => { stopSpeech(); show('top'); };

/* ---------- 声と速さ ---------- */
function fillVoiceSelects() {
  $('voiceWarn').hidden = hasEnglishVoice();
  $('voiceWarn').textContent = 'この端末には英語の読み上げ音声が見つかりません。端末の設定（言語と音声）で英語の音声を追加してください。';
  if (current === 'top') $('setSum').textContent = rateLabel();
}
function renderRate() { document.querySelectorAll('#rateSeg button').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.r) === opts.rate)); }
$('toSettings').onclick = () => { loadVoices(); renderRate(); renderReport(); $('setSheet').hidden = false; };
document.querySelectorAll('#rateSeg button').forEach(b => b.onclick = () => { opts.rate = Number(b.dataset.r); store(KEY + '-opts', opts); renderRate(); });
$('vTest').onclick = () => speakSeq([['W', "Hello. I'll be reading the dialogues and the lecture."], ['M', 'And I will be the other speaker. Good luck!']], 0);
$('setClose').onclick = () => { stopSpeech(); $('setSheet').hidden = true; renderTop(); };
$('setSheet').addEventListener('click', e => { if (e.target === e.currentTarget) $('setClose').onclick(); });

/* ---------- 結果の自動送信（スプレッドシートへ） ---------- */
const devId = (() => { let v = load(KEY + '-device', ''); if (!v) { v = Math.random().toString(36).slice(2, 10); store(KEY + '-device', v); } return v; })();
const PEND_KEY = KEY + '-report-pending';
function renderReport() {
  const on = !!REPORT_URL, el = $('resSend');
  const who = $('setWho'); who.hidden = !on;
  if (on) { who.innerHTML = prof ? `登録：<b>${esc(prof.cls)} ${esc(prof.no)}番 ${esc(prof.name)}</b> <button type="button" id="setWhoEdit">変更</button>` : '登録：まだ（最初のセットを始めるときに登録します）'; const e = $('setWhoEdit'); if (e) e.onclick = () => { $('setSheet').hidden = true; openProfile(renderReport); }; }
  el.hidden = !on || !last;
  if (!on || !last) return;
  el.className = 'send ' + (last.sent || 'sending');
  el.textContent = last.sent === 'ok' ? '✓ 結果は先生のシートに記録されました' : last.sent === 'pending' ? '通信できたら自動で先生に送ります' : '先生に送信中…';
}
function payloadFor(R) {
  return {
    app: 'listening', rid: devId + '-' + R.finishedAt, date: todayKey(), cls: prof.cls, no: prof.no, name: prof.name,
    set: R.set.id, title: R.set.title, score: R.score, total: R.total,
    partA: R.parts.A[0], partB: R.parts.B[0], partC: R.parts.C[0], secs: R.secs, attempt: R.count, listens: R.mode, subtitles: R.subItems,
    rate: opts.rate || 0.92, setsToday: day.sets, streak: streak.n, device: devId, sentAt: new Date().toISOString()
  };
}
async function sendReport(data) { await fetch(REPORT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) }); }
/* セットを終えたら自動で送る。送れなかった分は端末に残して、次に通信できたときに送り直す */
async function autoSend() {
  if (!REPORT_URL || !last || !prof) return;
  const data = payloadFor(last); last.sent = 'sending'; renderReport();
  try { await sendReport(data); last.sent = 'ok'; }
  catch (e) { const p = load(PEND_KEY, []); p.push(data); store(PEND_KEY, p); last.sent = 'pending'; }
  renderReport(); flushPending();
}
let flushing = false;
async function flushPending() {
  if (flushing) return; const p = load(PEND_KEY, []); if (!p.length || !REPORT_URL || !navigator.onLine) return;
  flushing = true; const left = []; for (const d of p) { try { await sendReport(d); } catch (e) { left.push(d); } }
  store(PEND_KEY, left); flushing = false;
  if (left.length < p.length) { if (last && last.sent === 'pending' && !left.some(d => d.rid === payloadFor(last).rid)) { last.sent = 'ok'; renderReport(); } toast('たまっていた結果を先生に送りました'); }
}
let profNext = null;
function openProfile(next) { profNext = next || null; $('pfClass').value = prof ? prof.cls : ''; $('pfNo').value = prof ? prof.no : ''; $('pfName').value = prof ? prof.name : ''; $('pfErr').hidden = true; $('profSheet').hidden = false; }
$('pfCancel').onclick = () => { $('profSheet').hidden = true; profNext = null; };
$('pfSave').onclick = () => {
  const z = v => v.replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).trim();
  const cls = z($('pfClass').value).toUpperCase(), no = z($('pfNo').value).replace(/^0+(?=\d)/, ''), name = $('pfName').value.trim().replace(/\s+/g, ' ');
  const err = !cls ? 'クラスを入力してください' : !/^\d{1,3}$/.test(no) ? '出席番号は数字で入力してください' : !name ? '名前を入力してください' : '';
  if (err) { $('pfErr').textContent = err; $('pfErr').hidden = false; return; }
  prof = { cls, no, name }; store(KEY + '-profile', prof); $('profSheet').hidden = true; const n = profNext; profNext = null; if (n) n();
};

/* ---------- 起動 ---------- */
setInterval(() => { const d = new Date(); $('sbTime').textContent = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'); }, 10000);
{ const d = new Date(); $('sbTime').textContent = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'); }
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
show('home');
flushPending(); window.addEventListener('online', flushPending);
if (!load(KEY + '-welcomed', false)) {
  store(KEY + '-welcomed', true);
  pop({ img: 'welcome', title: 'リスニング ラボへようこそ', msg: '1セット約10分。<b>短い発話 → 対話 → 講義</b>の順に、大学入試レベルの英語を聞きます。<br>終わったら<b>ふりかえり</b>で、聞き取れなかった文を確かめよう。' });
}
try { if ('serviceWorker' in navigator && location.protocol === 'https:' && !/claude|claudeusercontent/.test(location.hostname)) navigator.serviceWorker.register('sw.js').catch(() => { }); } catch (e) { }
