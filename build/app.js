/* =========================================================
   リスニング ラボ（メモリーポット スクール リスニング版）
   ========================================================= */

/* ★ 先生への報告先：Apps Script を「ウェブアプリ」として公開した URL を貼る。空なら報告ボタンは出ません */
const REPORT_URL = '';

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
const MAX_PLAYS = 2;
const PART = {
  A: { name: 'Part A　短い発話', sub: '内容に最も近いものを選ぼう。最大2回まで聞けます。', color: 'var(--part-a)', ansSec: 10 },
  B: { name: 'Part B　対話', sub: '状況を読んでから聞こう。最大2回まで聞けます。', color: 'var(--part-b)', ansSec: 15 },
  C: { name: 'Part C　講義', sub: '先に設問に目を通そう（30秒）。最大2回まで聞けます。', color: 'var(--part-c)', ansSec: 40, preview: 30 }
};
const PLAY_SVG = '<svg viewBox="0 0 12 14" aria-hidden="true"><path d="M1 1.2v11.6a.8.8 0 0 0 1.2.7l9.4-5.8a.8.8 0 0 0 0-1.4L2.2.5A.8.8 0 0 0 1 1.2z" fill="currentColor"/></svg>';

/* ---------- 保存データ ---------- */
let prog = load(KEY + '-prog', { sets: {} });       // セットごとの記録
let day = load(KEY + '-day', { d: '', sets: 0, correct: 0, total: 0, secs: 0 });
let streak = load(KEY + '-streak', { n: 0, last: '' });
let grow = load(KEY + '-grow', { xp: 0, last: '' });
let cards = load(KEY + '-cards', []);
let opts = load(KEY + '-opts', { vw: '', vm: '', rate: 0.92 });
let prof = load(KEY + '-profile', null);
if (day.d !== todayKey()) day = { d: todayKey(), sets: 0, correct: 0, total: 0, secs: 0 };
const saveAll = () => { store(KEY + '-prog', prog); store(KEY + '-day', day); store(KEY + '-streak', streak); store(KEY + '-grow', grow); store(KEY + '-cards', cards); };

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
  if (name === 'top') { renderTop(); if (xpPending && last) { xpPending = false; setTimeout(showXpPop, 250); } }
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
  let h = '', last = 0, m; const re = /\S+/g;
  while ((m = re.exec(text))) { h += esc(text.slice(last, m.index)) + `<span class="kw" data-s="${m.index}" data-e="${m.index + m[0].length}">${esc(m[0])}</span>`; last = m.index + m[0].length; }
  return h + esc(text.slice(last));
}
function kMark(el, pos) { if (!el) return; el.querySelectorAll('.kw').forEach(w => { const s = +w.dataset.s, e = +w.dataset.e; w.classList.toggle('done', e <= pos); w.classList.toggle('now', s <= pos && pos < e); }); }
function kClear(el) { if (el) el.querySelectorAll('.kw').forEach(w => w.classList.remove('done', 'now')); }

/* ---------- 学びの木 ---------- */
const STAGES = [['種', 0], ['芽', 40], ['双葉', 110], ['本葉', 250], ['若木', 450], ['小さな木', 750], ['枝を広げた木', 1150], ['つぼみ', 1700], ['満開', 2400], ['実り', 3300], ['大樹', 4500]];
const levelOf = xp => { let L = 0; STAGES.forEach(([, t], i) => { if (xp >= t) L = i; }); return L; };
function growInfo(xp) {
  const L = levelOf(xp), cur = STAGES[L][1], nx = STAGES[L + 1];
  return { L, name: STAGES[L][0], t: nx ? (xp - cur) / (nx[1] - cur) : 1, need: nx ? nx[1] - xp : 0, nextName: nx ? nx[0] : null };
}
const HEALTH = ['元気', 'しおれ気味', 'しおれている', '枯れかけ'];
const wilt = () => grow.last && grow.last !== todayKey() ? Math.min(Math.max(0, dayDiff(grow.last, todayKey()) - 1), 3) : 0;
/*PLANT_SVG*/

/* ---------- TOP ---------- */
const tod = () => { const h = new Date().getHours(); return h < 10 ? 'morning' : h < 16 ? 'day' : h < 19 ? 'evening' : 'night'; };
function liveStreak() { return streak.last && dayDiff(streak.last, todayKey()) <= 1 ? streak.n : 0; }
function nextSet() {
  const notYet = SETS.find(s => !prog.sets[s.id]);
  if (notYet) return notYet;
  return [...SETS].sort((a, b) => (prog.sets[a.id].best - prog.sets[b.id].best) || (prog.sets[a.id].lastAt - prog.sets[b.id].lastAt))[0];
}
function renderTop() {
  $('streakN').textContent = liveStreak(); $('todayN').textContent = day.d === todayKey() ? day.sets : 0;
  $('scene').dataset.tod = tod();
  const gi = growInfo(grow.xp), w = wilt();
  $('plant').innerHTML = plantSVG(gi.L, gi.t, w);
  $('gLv').textContent = 'Lv.' + (gi.L + 1); $('gName').textContent = gi.name;
  $('gHealth').textContent = HEALTH[w]; $('gHealth').className = 'health h' + w;
  $('gBar').style.width = Math.round(gi.t * 100) + '%';
  $('gNext').textContent = gi.nextName ? `あと ${gi.need} XP で「${gi.nextName}」・累計 ${grow.xp} XP` : `大樹に育ちました・累計 ${grow.xp} XP`;
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
  const p = prog.sets[s.id];
  pop({ img: 'mic', title: s.title, msg: `${p ? `${p.count}回目のチャレンジ。ベストは <b>${p.best}/${p.total}</b>。<br>` : ''}Part A → B → C の順に進みます。<b>イヤホン</b>をつけて、メモを取りながら聞こう。`, acts: [['やめる', null, 1], ['はじめる', () => startSet(s)]] });
}

/* ---------- PLAY ---------- */
let S = null, clockInt = 0, wakeLock = null;
const cur = () => S.set.items[S.idx];
const qKey = (i, j) => `${i}-${j}`;
async function keepAwake() { try { if (navigator.wakeLock) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) { } }
function releaseAwake() { try { if (wakeLock) wakeLock.release(); } catch (e) { } wakeLock = null; }
function startSet(set) {
  unlockTTS();
  S = { set, idx: 0, ans: {}, started: Date.now(), phase: '', read: 0, line: 0, tok: 0, paused: false, cd: null, pausedMs: 0, pauseAt: 0, plays: {}, subs: {} };
  show('play'); keepAwake();
  clearInterval(clockInt); clockInt = setInterval(() => { if (S && !S.paused) $('pClock').textContent = mmss((Date.now() - S.started - S.pausedMs) / 1000); }, 500);
  $('pClock').textContent = '0:00';
  enterItem();
}
function renderPlay() {
  const it = cur(), P = PART[it.part], same = S.set.items.filter(x => x.part === it.part), k = same.indexOf(it) + 1;
  $('scr-play').style.setProperty('--pc', P.color);
  $('pTag').textContent = 'Part ' + it.part; $('pPos').textContent = `${k} / ${same.length}`;
  $('pDots').innerHTML = S.set.items.map((x, i) => `<i class="${i < S.idx ? 'done' : i === S.idx ? 'now' : ''}"></i>`).join('');
  $('pBandTitle').textContent = P.name; $('pBandSub').textContent = P.sub;
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
  const st = { intro: ['まもなく始まります', '耳を英語モードに'], preview: ['設問を読む時間', ''], listen: [`${S.read + 1}回目を再生中`, `${it.lines.length > 1 ? `${S.line + 1} / ${it.lines.length} 文` : ''}`], answer: ['解答時間', ''] }[S.phase] || ['', ''];
  $('auState').textContent = st[0]; $('auSub').textContent = st[1];
  $('auReads').innerHTML = [0, 1].map(r => `<i class="${r < S.read ? 'done' : (r === S.read && S.phase === 'listen') ? 'on' : ''}">${r + 1}回目</i>`).join('');
  const rb = $('auAgain'); rb.hidden = !(S.phase === 'answer' && S.read < MAX_PLAYS);
  $('pCd').hidden = !(S.phase === 'preview' || S.phase === 'answer');
  tickCd(); renderSub(); updateNext();
}
const allAnswered = () => cur().qs.every((q, j) => S.ans[qKey(S.idx, j)] !== undefined);
function updateNext() {
  const b = $('playNext'), lastItem = S.idx === S.set.items.length - 1;
  if (S.phase === 'preview' && !allAnswered()) { b.disabled = false; b.textContent = '設問を読んだ → 再生'; return; }
  const ready = allAnswered();
  b.textContent = ready ? (lastItem ? '決定して採点' : '決定して次へ') : S.phase === 'answer' ? (lastItem ? '採点する' : '次へ（未回答）') : (cur().qs.length > 1 ? 'すべて選ぶと進めます' : '選ぶと進めます');
  b.disabled = !(ready || S.phase === 'answer');
}
function enterItem() {
  const it = cur(); S.read = 0; S.line = 0; stopCountdown(); S.plays[S.idx] = 0;
  if (it.part === 'C') { S.phase = 'preview'; renderPlay(); startCountdown(PART.C.preview, beginListen); }
  else { S.phase = 'intro'; renderPlay(); const tok = ++S.tok; wait(S.idx === 0 ? 1500 : 1000).then(() => { if (S && tok === S.tok && !S.paused) beginListen(); }); }
}
/* 1回分を再生する。最後まで聞けたら解答時間へ。2回目は「もう1回聞く」を押したときだけ */
async function beginListen() {
  stopCountdown();
  const it = cur(), tok = ++S.tok;
  S.phase = 'listen'; renderStatus();
  const r = await speakSeq(it.lines, S.line, i => { if (!S || tok !== S.tok) return; S.line = i; renderStatus(); }, (li, pos) => { if (S && tok === S.tok && li === S.line && opts.sub) kMark($('subTx'), pos); });
  if (!S || tok !== S.tok || r === 'cancel') return;
  S.line = 0; S.read++; S.plays[S.idx] = S.read;
  S.phase = 'answer'; renderStatus();
  startCountdown(PART[it.part].ansSec, nextItem);
}
function listenAgain() { if (!S || S.phase !== 'answer' || S.read >= MAX_PLAYS) return; unlockTTS(); beginListen(); }
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
$('auAgain').onclick = listenAgain;
function startCountdown(sec, onEnd) {
  stopCountdown(); S.cd = { remain: sec, total: sec, onEnd };
  tickCd(); S.cd.int = setInterval(() => { if (S.paused) return; S.cd.remain--; tickCd(); if (S.cd.remain <= 0) { const f = S.cd.onEnd; stopCountdown(); f(); } }, 1000);
}
function tickCd() { if (!S.cd) return; $('pCdBar').style.width = Math.max(0, S.cd.remain / S.cd.total * 100) + '%'; const s = $('auSub'); if (S.phase === 'answer' || S.phase === 'preview') s.textContent = `残り ${Math.max(0, S.cd.remain)} 秒` + (S.phase === 'answer' && S.read < MAX_PLAYS ? '・もう1回聞けます' : ''); }
function stopCountdown() { if (S && S.cd) { clearInterval(S.cd.int); S.cd = null; } }
function nextItem() {
  stopCountdown(); stopSpeech(); S.tok++;
  if (S.idx >= S.set.items.length - 1) { finishSet(); return; }
  S.idx++; enterItem();
}
function pausePlay() {
  if (!S || S.paused) return; S.paused = true; S.pauseAt = Date.now(); S.tok++; stopSpeech();
  $('pausedLayer').hidden = false; renderStatus();
}
function resumePlay() {
  if (!S || !S.paused) return; S.paused = false; S.pausedMs += Date.now() - S.pauseAt; $('pausedLayer').hidden = true;
  unlockTTS();
  if (S.phase === 'intro' || S.phase === 'listen') beginListen();
  else renderStatus();
}
$('playPause').onclick = pausePlay; $('playResume').onclick = resumePlay;
$('playNext').onclick = () => { if (allAnswered() || S.phase === 'answer') nextItem(); else if (S.phase === 'preview') { unlockTTS(); beginListen(); } };
$('playQuit').onclick = () => { pausePlay(); pop({ img: 'think', title: 'セットを中断しますか？', msg: '途中までの解答は<b>記録されません</b>。', acts: [['つづける', resumePlay, 1], ['中断する', quitSet]] }); };
function quitSet() { stopCountdown(); stopSpeech(); clearInterval(clockInt); releaseAwake(); $('pausedLayer').hidden = true; S = null; show('top'); }
document.addEventListener('visibilitychange', () => { if (document.hidden && S && current === 'play' && !S.paused) pausePlay(); });

/* ---------- 採点・結果 ---------- */
let last = null, xpPending = false;
function finishSet() {
  clearInterval(clockInt); releaseAwake();
  const set = S.set, parts = { A: [0, 0], B: [0, 0], C: [0, 0] }; let score = 0, total = 0;
  set.items.forEach((it, i) => it.qs.forEach((q, j) => { const ok = S.ans[qKey(i, j)] === q.ans; parts[it.part][1]++; total++; if (ok) { parts[it.part][0]++; score++; } }));
  const secs = Math.round((Date.now() - S.started - S.pausedMs) / 1000);
  const replays = Object.values(S.plays).filter(n => n >= 2).length, subItems = Object.keys(S.subs).length;
  const p = prog.sets[set.id] || { best: 0, total, count: 0 };
  const first = !p.count;
  p.count++; p.best = Math.max(p.best, score); p.total = total; p.last = score; p.lastAt = Date.now(); p.lastDate = todayKey();
  prog.sets[set.id] = p;
  if (day.d !== todayKey()) day = { d: todayKey(), sets: 0, correct: 0, total: 0, secs: 0 };
  day.sets++; day.correct += score; day.total += total; day.secs += secs;
  const t = todayKey();
  if (streak.last !== t) { streak.n = streak.last && dayDiff(streak.last, t) === 1 ? streak.n + 1 : 1; streak.last = t; }
  const before = levelOf(grow.xp);
  const xp = Math.round((score * 10 + 20) * (first ? 1 : 0.5));
  grow.xp += xp; grow.last = t;
  saveAll();
  last = { set, ans: { ...S.ans }, plays: { ...S.plays }, subs: { ...S.subs }, replays, subItems, parts, score, total, secs, xp, count: p.count, levelUp: levelOf(grow.xp) > before };
  S = null; xpPending = true;
  renderResult(); show('result');
}
function renderResult() {
  const R = last, rate = R.score / R.total;
  $('resTitle').textContent = R.set.title;
  $('resScore').innerHTML = `${R.score}<small>/${R.total}</small>`;
  $('resMsg').textContent = rate === 1 ? '全問正解！ 講義の流れまでしっかりつかめています。' : rate >= .75 ? 'よくできました。まちがえた問題のスクリプトを確認しよう。' : rate >= .5 ? 'あと一歩。ふりかえりで聞き取れなかった文を探そう。' : '聞き取れなかった文を▶でくり返し聞いてみよう。';
  $('resCoach').innerHTML = coach(rate >= .75 ? 'cheer' : 'read', rate >= .75 ? `<b>${R.score}問正解</b>！ ふりかえりで、聞き取れなかった文を<b>カード</b>にしておくと次に強くなるよ。` : `ここからが本番。<b>ふりかえり</b>で英文を見ずにもう一度聞いて、どこでつまずいたか確かめよう。`);
  $('resParts').innerHTML = ['A', 'B', 'C'].map(k => `<div style="--pc:${PART[k].color}">Part ${k}<b>${R.parts[k][0]}/${R.parts[k][1]}</b></div>`).join('');
  $('resTime').textContent = mmss(R.secs); $('resAid').textContent = `2回聞いた ${R.replays}問・字幕 ${R.subItems}問`; $('resCount').textContent = R.count;
  R.reported = false; renderReport();
}
$('resHome').onclick = () => show('top');
$('rvDone').onclick = () => { stopSpeech(); if (last && !last.reviewed) { last.reviewed = true; } show('top'); };
function showXpPop() {
  const R = last, gi = growInfo(grow.xp);
  pop({ img: R.levelUp ? 'cheer' : 'guide', title: R.levelUp ? `レベルアップ！「${gi.name}」` : `+${R.xp} XP`,
    msg: `<div class="xp-pop"><span class="plant small">${plantSVG(gi.L, gi.t, 0)}</span><div class="xp-pop-txt">` +
      `<div class="g-stage"><span class="g-lv">Lv.${gi.L + 1}</span><span>${esc(gi.name)}</span></div>` +
      `<div class="g-bar"><span style="width:${Math.round(gi.t * 100)}%"></span></div>` +
      `<small>${gi.nextName ? `あと ${gi.need} XP で「${esc(gi.nextName)}」` : '最高レベルの大樹です'}</small></div></div>` +
      `「${esc(R.set.title)}」で <b>+${R.xp} XP</b>・累計 <b>${grow.xp} XP</b><br><small>正解1問 10XP＋完走 20XP（2回目以降は半分）</small>` });
}
$('toReview').onclick = () => { renderReview(); show('review'); };

/* ---------- ふりかえり ---------- */
function cardId(type, text) { return type + ':' + text; }
function hasCard(type, text) { return cards.some(c => c.id === cardId(type, text)); }
function addCard(c) { if (hasCard(c.type, c.text)) return false; cards.push({ ...c, id: cardId(c.type, c.text), ok: false, added: Date.now() }); saveAll(); return true; }
function removeCard(id) { cards = cards.filter(c => c.id !== id); saveAll(); }
function lineRow(sp, text, setId, onPlay) {
  const row = document.createElement('div'); row.className = 'ln';
  row.innerHTML = `<button type="button" class="ibtn" aria-label="この文を再生">${PLAY_SVG}</button><span class="sp">${sp === 'M' ? '男' : '女'}</span><span class="tx">${kHTML(text)}</span><button type="button" class="ibtn add" aria-label="カードに入れる">＋</button>`;
  const pb = row.children[0], ab = row.children[3];
  pb.onclick = () => { document.querySelectorAll('.ln.speaking').forEach(x => x.classList.remove('speaking')); row.classList.add('speaking'); const tx = row.children[2];
    document.querySelectorAll('.tx .kw.done,.tx .kw.now').forEach(w => w.classList.remove('done', 'now'));
    speakSeq([[sp, text]], 0, null, (li, pos) => kMark(tx, pos)).then(() => { row.classList.remove('speaking'); setTimeout(() => kClear(tx), 700); }); };
  const sync = () => { const on = hasCard('line', text); ab.classList.toggle('added', on); ab.textContent = on ? '✓' : '＋'; };
  ab.onclick = () => { if (hasCard('line', text)) { removeCard(cardId('line', text)); toast('カードから外しました'); } else { addCard({ type: 'line', text, sp, set: setId }); toast('ふくしゅうカードに入れました'); } sync(); };
  sync(); return row;
}
function renderReview() {
  const R = last, L = $('rvList'); L.innerHTML = '';
  $('rvTitle').textContent = R.set.title;
  R.set.items.forEach((it, i) => {
    const same = R.set.items.filter(x => x.part === it.part), k = same.indexOf(it) + 1;
    const allOk = it.qs.every((q, j) => R.ans[qKey(i, j)] === q.ans);
    const box = document.createElement('div'); box.className = 'rv-item'; box.style.setProperty('--pc', PART[it.part].color);
    const aid = (R.plays[i] >= 2 ? '<span class="aid">2回聞いた</span>' : '') + (R.subs[i] ? '<span class="aid">字幕</span>' : '');
    box.innerHTML = `<div class="rv-head"><b>Part ${it.part}-${k} ${aid}</b><span class="mark ${allOk ? 'ok' : 'ng'}">${allOk ? '正解' : it.qs.length > 1 ? it.qs.filter((q, j) => R.ans[qKey(i, j)] === q.ans).length + '/' + it.qs.length + ' 正解' : '不正解'}</span></div>`;
    if (it.situation) { const s = document.createElement('div'); s.className = 'hint'; s.textContent = '【状況】' + it.situation; box.appendChild(s); }
    const sc = document.createElement('div'); sc.className = 'script';
    const all = document.createElement('button'); all.type = 'button'; all.className = 'chip-tog'; all.style.alignSelf = 'flex-start'; all.innerHTML = '▶ 全文を再生';
    all.onclick = () => { all.innerHTML = '再生中…'; const rows = sc.querySelectorAll('.ln'); rows.forEach(r => kClear(r.children[2])); speakSeq(it.lines, 0, n => { rows.forEach((r, m) => r.classList.toggle('speaking', m === n)); }, (li, pos) => kMark(rows[li] && rows[li].children[2], pos)).then(() => { rows.forEach(r => { r.classList.remove('speaking'); kClear(r.children[2]); }); all.innerHTML = '▶ 全文を再生'; }); };
    box.appendChild(all);
    it.lines.forEach(([sp, text]) => sc.appendChild(lineRow(sp, text, R.set.id)));
    box.appendChild(sc);
    it.qs.forEach((q, j) => {
      const my = R.ans[qKey(i, j)], d = document.createElement('div'); d.className = 'rv-q';
      d.innerHTML = `<div class="qtext">${it.qs.length > 1 ? `<span class="qn">問${j + 1}</span>` : ''}${it.part === 'A' ? '内容に最も近いもの' : esc(q.q)}</div>` +
        q.opts.map((o, n) => `<button type="button" class="opt ${n === q.ans ? 'ok' : n === my ? 'ng' : ''}" disabled><span class="on">${MARK[n]}</span><span>${esc(o)}${n === my && n !== q.ans ? '　← あなたの答え' : ''}</span></button>`).join('') +
        (my === undefined ? '<div class="hint">時間内に答えられませんでした。</div>' : '') +
        `<div class="exp"><b>正解 ${MARK[q.ans]}</b>　${esc(q.exp)}</div>`;
      box.appendChild(d);
    });
    L.appendChild(box);
  });
  const V = $('rvVocab'); V.innerHTML = '';
  (R.set.vocab || []).forEach(([en, ja]) => {
    const r = document.createElement('div'); r.className = 'vrow';
    r.innerHTML = `<button type="button" class="ibtn" aria-label="発音を聞く">${PLAY_SVG}</button><div><b>${esc(en)}</b><small>${esc(ja)}</small></div><button type="button" class="ibtn add">＋</button>`;
    r.children[0].onclick = () => speakSeq([['W', en.replace(/~/g, 'something')]], 0);
    const ab = r.children[2], sync = () => { const on = hasCard('word', en); ab.classList.toggle('added', on); ab.textContent = on ? '✓' : '＋'; };
    ab.onclick = () => { if (hasCard('word', en)) removeCard(cardId('word', en)); else { addCard({ type: 'word', text: en, ja, set: R.set.id }); toast('ふくしゅうカードに入れました'); } sync(); };
    sync(); V.appendChild(r);
  });
  $('rvScroll').scrollTop = 0;
}
$('rvHide').onclick = () => { const on = $('rvHide').getAttribute('aria-pressed') !== 'true'; $('rvHide').setAttribute('aria-pressed', on); $('rvList').classList.toggle('hide-text', on); $('rvHide').textContent = on ? '英文を表示' : '英文をかくす'; };
$('rvBack').onclick = () => { stopSpeech(); show('result'); };

/* ---------- ふくしゅうカード ---------- */
let cq = [], cIdx = 0, cFlip = false;
function renderCards() {
  cq = cards.filter(c => !c.ok); cIdx = 0; cFlip = false;
  $('cdCoach').innerHTML = coach('read', cards.length ? '<b>文カード</b>は▶で聞いて、口に出してまねしてから（シャドーイング）めくろう。<b>語句カード</b>は意味を言ってからめくろう。' : 'ふりかえり画面で <b>＋</b> を押すと、聞き取れなかった文や語句がここにたまるよ。');
  drawCard(); drawCardList();
}
function drawCard() {
  const st = $('cdStage'); st.innerHTML = '';
  if (!cards.length) return;
  if (cIdx >= cq.length) { st.innerHTML = `<div class="empty">${cq.length ? `${cq.length}枚おわり！<br>` : 'まだ覚えていないカードはありません。<br>'}「覚えた」にしたカードは一覧から戻せます。</div>`; if (cq.length) { const b = document.createElement('button'); b.className = 'btn sub'; b.type = 'button'; b.textContent = 'もう一周する'; b.onclick = renderCards; st.appendChild(b); } return; }
  const c = cq[cIdx], card = document.createElement('button'); card.type = 'button'; card.className = 'flash';
  const isLine = c.type === 'line';
  card.innerHTML = `<span class="kind">${isLine ? '文カード' : '語句カード'}　${cIdx + 1} / ${cq.length}</span>` +
    (isLine ? `<span class="bigplay" role="presentation">${PLAY_SVG}</span>` + (cFlip ? `<span class="front line">${esc(c.text)}</span>` : '<span class="tap">聞いて、まねして言ってから、タップで英文を表示</span>')
      : `<span class="front">${esc(c.text)}</span>` + (cFlip ? `<span class="back">${esc(c.ja || '')}</span>` : '<span class="tap">意味を言ってから、タップでめくる</span>'));
  card.onclick = e => { if (e.target.closest('.bigplay')) { speakSeq([[c.sp || 'W', c.text.replace(/~/g, 'something')]], 0); return; } cFlip = !cFlip; drawCard(); };
  st.appendChild(card);
  if (isLine && !cFlip) setTimeout(() => speakSeq([[c.sp || 'W', c.text]], 0), 250);
  const j = document.createElement('div'); j.className = 'judge';
  j.innerHTML = '<button type="button" class="btn no">まだ</button><button type="button" class="btn yes">覚えた</button>';
  j.children[0].onclick = () => { stopSpeech(); cq.push(cq[cIdx]); cIdx++; cFlip = false; if (cq.length > cards.length * 3) cq = cq.slice(0, cIdx + 1); drawCard(); };
  j.children[1].onclick = () => { stopSpeech(); c.ok = true; grow.xp += 2; grow.last = todayKey(); saveAll(); cIdx++; cFlip = false; drawCard(); drawCardList(); };
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
$('toSettings').onclick = () => { loadVoices(); renderRate(); $('setSheet').hidden = false; };
document.querySelectorAll('#rateSeg button').forEach(b => b.onclick = () => { opts.rate = Number(b.dataset.r); store(KEY + '-opts', opts); renderRate(); });
$('vTest').onclick = () => speakSeq([['W', "Hello. I'll be reading the dialogues and the lecture."], ['M', 'And I will be the other speaker. Good luck!']], 0);
$('setClose').onclick = () => { stopSpeech(); $('setSheet').hidden = true; renderTop(); };
$('setSheet').addEventListener('click', e => { if (e.target === e.currentTarget) $('setClose').onclick(); });

/* ---------- 先生への報告 ---------- */
const devId = (() => { let v = load(KEY + '-device', ''); if (!v) { v = Math.random().toString(36).slice(2, 10); store(KEY + '-device', v); } return v; })();
const PEND_KEY = KEY + '-report-pending';
function renderReport() {
  const on = !!REPORT_URL;
  $('reportTop').hidden = !on || !(day.d === todayKey() && day.sets);
  if (on && day.sets) $('reportTopSub').textContent = `今日 ${day.sets}セット・${day.correct}/${day.total}問正解`;
  $('reportRes').hidden = !on || !last;
  if (on && last) { $('reportRes').classList.toggle('done', !!last.reported); $('reportResSub').textContent = last.reported ? '報告済み・押すと送り直します' : 'このセットの結果を送ります'; }
}
function payloadFor(R) {
  const gi = growInfo(grow.xp);
  return {
    app: 'listening', date: todayKey(), cls: prof.cls, no: prof.no, name: prof.name,
    set: R.set.id, title: R.set.title, score: R.score, total: R.total,
    partA: R.parts.A[0], partB: R.parts.B[0], partC: R.parts.C[0], secs: R.secs, attempt: R.count, replays: R.replays, subtitles: R.subItems,
    setsToday: day.sets, correctToday: day.correct, totalToday: day.total,
    streak: streak.n, xp: grow.xp, level: gi.L + 1, device: devId, sentAt: new Date().toISOString()
  };
}
async function sendReport(data) { await fetch(REPORT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) }); }
async function doReport() {
  if (!last) return; const data = payloadFor(last);
  try { await sendReport(data); last.reported = true; renderReport(); pop({ img: 'cheer', title: '報告しました！', msg: `「${esc(last.set.title)}」<b>${last.score}/${last.total}</b> を先生に送ったよ。` }); }
  catch (e) { const p = load(PEND_KEY, []); p.push(data); store(PEND_KEY, p); pop({ img: 'think', title: 'いまは送れませんでした', msg: '通信できる場所でアプリを開くと、<b>自動で送り直します</b>。' }); }
}
async function flushPending() {
  const p = load(PEND_KEY, []); if (!p.length || !REPORT_URL || !navigator.onLine) return;
  const left = []; for (const d of p) { try { await sendReport(d); } catch (e) { left.push(d); } }
  store(PEND_KEY, left); if (left.length < p.length) toast('先生への報告を送りました');
}
function openReport() {
  if (!prof) { openProfile(openReport); return; }
  if (!last) { pop({ img: 'tablet', title: '今日の記録', msg: `今日は <b>${day.sets}セット</b>・<b>${day.correct}/${day.total}問</b> 正解。<br>結果は、各セットの結果画面から送れます。` }); return; }
  pop({ img: 'tablet', title: '結果を報告する', msg: `「${esc(last.set.title)}」<b>${last.score}/${last.total}</b>（A ${last.parts.A[0]}・B ${last.parts.B[0]}・C ${last.parts.C[0]}）<br><small>${esc(prof.cls)} ${esc(prof.no)}番 ${esc(prof.name)}</small>`, acts: [['名前を変更', () => openProfile(openReport), 1], ['報告する', doReport]] });
}
let profNext = null;
function openProfile(next) { profNext = next || null; $('pfClass').value = prof ? prof.cls : ''; $('pfNo').value = prof ? prof.no : ''; $('pfName').value = prof ? prof.name : ''; $('pfErr').hidden = true; $('profSheet').hidden = false; }
$('pfCancel').onclick = () => { $('profSheet').hidden = true; };
$('pfSave').onclick = () => {
  const z = v => v.replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).trim();
  const cls = z($('pfClass').value).toUpperCase(), no = z($('pfNo').value).replace(/^0+(?=\d)/, ''), name = $('pfName').value.trim().replace(/\s+/g, ' ');
  const err = !cls ? 'クラスを入力してください' : !/^\d{1,3}$/.test(no) ? '出席番号は数字で入力してください' : !name ? '名前を入力してください' : '';
  if (err) { $('pfErr').textContent = err; $('pfErr').hidden = false; return; }
  prof = { cls, no, name }; store(KEY + '-profile', prof); $('profSheet').hidden = true; const n = profNext; profNext = null; if (n) n();
};
$('reportTop').onclick = openReport; $('reportRes').onclick = openReport;

/* ---------- 起動 ---------- */
$('treeBtn').onclick = () => { const b = $('treeBtn'); b.classList.remove('boing'); void b.offsetWidth; b.classList.add('boing'); };
setInterval(() => { const d = new Date(); $('sbTime').textContent = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'); }, 10000);
{ const d = new Date(); $('sbTime').textContent = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'); }
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
show('top');
flushPending(); window.addEventListener('online', flushPending);
if (!load(KEY + '-welcomed', false)) {
  store(KEY + '-welcomed', true);
  pop({ img: 'welcome', title: 'リスニング ラボへようこそ', msg: '1セット約10分。<b>短い発話 → 対話 → 講義</b>の順に、大学入試レベルの英語を聞きます。<br>終わったら<b>ふりかえり</b>で、聞き取れなかった文を確かめよう。' });
}
try { if ('serviceWorker' in navigator && location.protocol === 'https:' && !/claude|claudeusercontent/.test(location.hostname)) navigator.serviceWorker.register('sw.js').catch(() => { }); } catch (e) { }
