/**
 * リスニング ラボ：先生への報告を受け取る Google Apps Script
 *
 * 使い方
 * 1. 学校アカウントで新しい Google スプレッドシートを作る
 * 2. メニュー「拡張機能」→「Apps Script」を開き、このファイルの中身を全部貼り付けて保存
 * 3. 右上「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」
 *      次のユーザーとして実行：自分
 *      アクセスできるユーザー：全員
 * 4. 表示された URL（https://script.google.com/macros/s/…/exec）を、
 *    index.html の REPORT_URL = '' の '' の中に貼って GitHub に上げ直す
 *
 * 記録は「リスニング記録」シートに、1人・1日・1セットにつき1行。
 * 同じ日に同じセットをやり直して報告すると、その行が最新の結果に置きかわります（回数の列で何回目か分かります）。
 */
const SHEET = 'リスニング記録';
const HEAD = ['日付', 'クラス', '番号', '名前', 'セット', 'タイトル', '得点', '満点', 'A', 'B', 'C', '所要時間(秒)', '何回目',
  '2回聞いた問題数', '字幕を使った問題数', '今日のセット数', '今日の正解', '今日の問題数', '連続日数', '累計XP', '木のLv', '端末', '送信時刻'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(HEAD);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEAD.length).setFontWeight('bold').setBackground('#1D2F45').setFontColor('#ffffff');
  }
  return sh;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.app !== 'listening') return out_({ ok: false });
    const sh = sheet_();
    const row = ["'" + d.date, "'" + d.cls, d.no, d.name, d.set, d.title, d.score, d.total, d.partA, d.partB, d.partC, d.secs, d.attempt, d.replays, d.subtitles,
      d.setsToday, d.correctToday, d.totalToday, d.streak, d.xp, d.level, d.device, d.sentAt];
    const last = sh.getLastRow();
    if (last > 1) {
      const keys = sh.getRange(2, 1, last - 1, 5).getDisplayValues();
      for (let i = keys.length - 1; i >= 0; i--) {
        const k = keys[i];
        if (k[0] === String(d.date) && k[1] === String(d.cls) && k[2] === String(d.no) && k[4] === String(d.set)) {
          sh.getRange(i + 2, 1, 1, row.length).setValues([row]);
          return out_({ ok: true, updated: true });
        }
      }
    }
    sh.appendRow(row);
    return out_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function doGet() { return out_({ ok: true, app: 'listening-lab' }); }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
