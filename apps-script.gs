/**
 * リスニング ラボ：生徒の結果を自動で受け取る Google Apps Script
 * （「リスニング ラボ 記録」スプレッドシートの「拡張機能 → Apps Script」に貼り付けて使います）
 *
 * ■ 最初に1回だけ行う設定
 * 1. スプレッドシートのメニュー「拡張機能」→「Apps Script」を開き、最初からある中身を消して、このファイルを全部貼り付けて保存
 * 2. 上の関数の選択欄で「setupSheets」を選んで「実行」。承認画面が出たら自分のアカウントを選んで「許可」
 *    （「このアプリは Google で確認されていません」と出たら「詳細」→「（安全ではないページ）に移動」→「許可」）
 * 3. 右上「デプロイ」→「新しいデプロイ」→ 歯車マークで「ウェブアプリ」を選ぶ
 *      説明：リスニング ラボ
 *      次のユーザーとして実行：自分
 *      アクセスできるユーザー：全員
 *    →「デプロイ」。初回は Google アカウントの承認画面が出るので「許可」する
 * 4. 表示された「ウェブアプリの URL」（https://script.google.com/macros/s/…/exec）をコピーし、
 *    index.html の  const REPORT_URL = '';  の '' の中に貼って GitHub に上げ直す
 *
 * ■ シートのしくみ
 * 「記録」         … 生徒がセットを終えるたびに、このスクリプトが1行追加する（やり直しも1回ずつ残る）
 * 「生徒別まとめ」 … 記録を集計する式が入っている（このスクリプトは値を書かない）
 * 「セット別まとめ」… 同上
 * 「設定」         … 「ようす」欄の目安（使っていない日数・正答率）を変えられる
 * 集計の式が壊れたときは、メニュー「リスニング ラボ」→「集計シートを作り直す」で元に戻せます。
 *
 * ■ このスクリプトを書きかえたとき
 * 「デプロイ」→「デプロイを管理」→ 鉛筆マーク →「バージョン：新しいバージョン」→「デプロイ」
 * （URL は変わらないので、index.html はそのままで大丈夫です）
 */
const LOG = '記録', SUM = '生徒別まとめ', SETSUM = 'セット別まとめ', CONF = '設定';
const HEAD = ['日時', '日付', 'クラス', '番号', '名前', 'セット', 'タイトル', '得点', '満点', '正答率',
  'Part A', 'Part B', 'Part C', '聞く回数', '字幕を使った問題数', '所要時間(秒)', 'このセット何回目', '読む速さ',
  '今日のセット数', '連続日数', '端末', '受付ID'];
const ROWS_SUM = 400, ROWS_SET = 50;

/* 生徒別まとめ：2行目の式（3行目以降は同じ式を下にコピー） */
const SUM_HEAD = ['クラス', '番号', '名前', '解いた回数', '解いたセット(種類)', '直近7日の回数', '平均正答率', '直近の正答率',
  'Part A（3問）', 'Part B（2問）', 'Part C（3問）', '1回（本番）で解いた回数', '字幕を使った回数', '連続日数', '最終利用日', 'ようす'];
const SUM_A2 = '=IFERROR(SORT(UNIQUE(FILTER({記録!C2:C,記録!D2:D},記録!C2:C<>"")),1,TRUE,2,TRUE),"")';
const SUM_ROW = [
  '=IF($A2="","",IFERROR(ARRAYFORMULA(LOOKUP(2,1/((記録!$C$2:$C=$A2)*(記録!$D$2:$D=$B2)),記録!$E$2:$E)),""))',
  '=IF($A2="","",COUNTIFS(記録!$C:$C,$A2,記録!$D:$D,$B2))',
  '=IF($A2="","",COUNTUNIQUE(FILTER(記録!$F$2:$F,記録!$C$2:$C=$A2,記録!$D$2:$D=$B2)))',
  '=IF($A2="","",COUNTIFS(記録!$C:$C,$A2,記録!$D:$D,$B2,記録!$B:$B,">="&(TODAY()-6)))',
  '=IF($A2="","",IF(SUMIFS(記録!$I:$I,記録!$C:$C,$A2,記録!$D:$D,$B2)=0,"",SUMIFS(記録!$H:$H,記録!$C:$C,$A2,記録!$D:$D,$B2)/SUMIFS(記録!$I:$I,記録!$C:$C,$A2,記録!$D:$D,$B2)))',
  '=IF($A2="","",IFERROR(ARRAYFORMULA(LOOKUP(2,1/((記録!$C$2:$C=$A2)*(記録!$D$2:$D=$B2)),記録!$J$2:$J)),""))',
  '=IF($A2="","",IF($D2=0,"",SUMIFS(記録!$K:$K,記録!$C:$C,$A2,記録!$D:$D,$B2)/(3*$D2)))',
  '=IF($A2="","",IF($D2=0,"",SUMIFS(記録!$L:$L,記録!$C:$C,$A2,記録!$D:$D,$B2)/(2*$D2)))',
  '=IF($A2="","",IF($D2=0,"",SUMIFS(記録!$M:$M,記録!$C:$C,$A2,記録!$D:$D,$B2)/(3*$D2)))',
  '=IF($A2="","",COUNTIFS(記録!$C:$C,$A2,記録!$D:$D,$B2,記録!$N:$N,"1回（本番）"))',
  '=IF($A2="","",COUNTIFS(記録!$C:$C,$A2,記録!$D:$D,$B2,記録!$O:$O,">0"))',
  '=IF($A2="","",IFERROR(ARRAYFORMULA(LOOKUP(2,1/((記録!$C$2:$C=$A2)*(記録!$D$2:$D=$B2)),記録!$T$2:$T)),""))',
  '=IF($A2="","",MAXIFS(記録!$B:$B,記録!$C:$C,$A2,記録!$D:$D,$B2))',
  '=IF($A2="","",IF(TODAY()-$O2>=設定!$B$3,"使っていない日が続いている",IF(AND($D2>=設定!$B$5,$G2<設定!$B$4),"正答率が低め","")))'
];
/* セット別まとめ */
const SET_HEAD = ['セット', 'タイトル', '解いた人数', '解いた回数', '平均正答率', 'Part A', 'Part B', 'Part C', '1回（本番）の割合'];
const SET_A2 = '=IFERROR(SORT(UNIQUE(FILTER({記録!F2:F,記録!G2:G},記録!F2:F<>""))),"")';
const SET_ROW = [
  '=IF($A2="","",COUNTUNIQUE(FILTER(記録!$C$2:$C&"-"&記録!$D$2:$D,記録!$F$2:$F=$A2)))',
  '=IF($A2="","",COUNTIF(記録!$F:$F,$A2))',
  '=IF($A2="","",IF(SUMIF(記録!$F:$F,$A2,記録!$I:$I)=0,"",SUMIF(記録!$F:$F,$A2,記録!$H:$H)/SUMIF(記録!$F:$F,$A2,記録!$I:$I)))',
  '=IF($A2="","",IF($D2=0,"",SUMIF(記録!$F:$F,$A2,記録!$K:$K)/(3*$D2)))',
  '=IF($A2="","",IF($D2=0,"",SUMIF(記録!$F:$F,$A2,記録!$L:$L)/(2*$D2)))',
  '=IF($A2="","",IF($D2=0,"",SUMIF(記録!$F:$F,$A2,記録!$M:$M)/(3*$D2)))',
  '=IF($A2="","",IF($D2=0,"",COUNTIFS(記録!$F:$F,$A2,記録!$N:$N,"1回（本番）")/$D2))'
];

function onOpen() {
  SpreadsheetApp.getUi().createMenu('リスニング ラボ').addItem('集計シートを作り直す', 'setupSheets').addToUi();
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.app !== 'listening') return out_({ ok: false });
    const props = PropertiesService.getScriptProperties();
    if (props.getProperty('setupDone') !== '1') { setupSheets(); props.setProperty('setupDone', '1'); }
    const sh = logSheet_();
    // 同じ結果が2回届いたとき（通信の再送など）は1回分だけ記録する
    const last = sh.getLastRow();
    if (last > 1 && d.rid) {
      const from = Math.max(2, last - 499);
      const ids = sh.getRange(from, HEAD.indexOf('受付ID') + 1, last - from + 1, 1).getValues().flat();
      if (ids.indexOf(d.rid) >= 0) return out_({ ok: true, duplicate: true });
    }
    const [y, m, dd] = String(d.date).split('-').map(Number);
    const speed = { 0.82: 'ゆっくり', 0.92: '標準', 1.02: '速め' }[d.rate] || '標準';
    const r = sh.getLastRow() + 1;
    sh.getRange(r, 1, 1, HEAD.length).setValues([[new Date(d.sentAt || Date.now()), new Date(y, m - 1, dd), String(d.cls), Number(d.no), d.name,
      d.set, d.title, d.score, d.total, '=IF(I' + r + '=0,"",H' + r + '/I' + r + ')', d.partA, d.partB, d.partC,
      d.listens === 1 ? '1回（本番）' : '2回（練習）', d.subtitles, d.secs, d.attempt, speed,
      d.setsToday, d.streak, d.device, d.rid || '']]);
    return out_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function logSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(LOG);
  if (!sh) { sh = ss.insertSheet(LOG); }
  if (sh.getLastRow() === 0) sh.appendRow(HEAD);
  return sh;
}

/* 見出し・書式・集計の式を整える（記録の行には触れない） */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone('Asia/Tokyo');
  const log = logSheet_();
  log.getRange(1, 1, 1, HEAD.length).setValues([HEAD]);
  styleHead_(log, HEAD.length);
  log.getRange('A2:A').setNumberFormat('yyyy/mm/dd hh:mm');
  log.getRange('B2:B').setNumberFormat('yyyy/mm/dd');
  log.getRange('C2:C').setNumberFormat('@');
  log.getRange('J2:J').setNumberFormat('0%');

  let conf = ss.getSheetByName(CONF);
  if (!conf) {
    conf = ss.insertSheet(CONF);
    conf.getRange('A1:C5').setValues([
      ['「生徒別まとめ」のようす欄の目安', '', ''],
      ['項目', '値', 'メモ'],
      ['使っていない日数（この日数以上で表示）', 7, '初期値。学校の運用に合わせて変えてください'],
      ['正答率が低めとする基準', 0.5, '初期値。平均正答率がこれ未満で表示'],
      ['基準を当てはめる最低回数', 3, '初期値。解いた回数がこれ以上の生徒だけ判定']]);
    conf.getRange('A1').setFontWeight('bold');
    styleHead_(conf, 3, 2);
    conf.getRange('B3:B5').setFontColor('#0000FF').setBackground('#FFFF00');
    conf.getRange('B4').setNumberFormat('0%');
    conf.autoResizeColumns(1, 3);
  }

  buildSummary_(ss, SUM, SUM_HEAD, SUM_A2, SUM_ROW, ROWS_SUM, { pct: ['G', 'H', 'I', 'J', 'K'], date: ['O'] });
  buildSummary_(ss, SETSUM, SET_HEAD, SET_A2, SET_ROW, ROWS_SET, { pct: ['E', 'F', 'G', 'H', 'I'], date: [] });
  PropertiesService.getScriptProperties().setProperty('setupDone', '1');
}

function buildSummary_(ss, name, head, a2, rowFormulas, rows, fmt) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  sh.clear();
  if (sh.getMaxRows() < rows + 1) sh.insertRowsAfter(sh.getMaxRows(), rows + 1 - sh.getMaxRows());
  sh.getRange(1, 1, 1, head.length).setValues([head]);
  styleHead_(sh, head.length);
  sh.getRange('A2').setFormula(a2);
  const first = head.length - rowFormulas.length + 1;   // 式が入る最初の列（生徒別：C列、セット別：C列）
  sh.getRange(2, first, 1, rowFormulas.length).setFormulas([rowFormulas]);
  sh.getRange(2, first, 1, rowFormulas.length).copyTo(sh.getRange(3, first, rows - 1, rowFormulas.length));
  fmt.pct.forEach(c => sh.getRange(c + '2:' + c).setNumberFormat('0%'));
  fmt.date.forEach(c => sh.getRange(c + '2:' + c).setNumberFormat('yyyy/mm/dd'));
  sh.autoResizeColumns(1, head.length);
}

function styleHead_(sh, n, row) {
  row = row || 1;
  sh.getRange(row, 1, 1, n).setFontWeight('bold').setBackground('#1D2F45').setFontColor('#FFFFFF');
  if (row === 1) sh.setFrozenRows(1);
}

function doGet() { return out_({ ok: true, app: 'listening-lab' }); }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
