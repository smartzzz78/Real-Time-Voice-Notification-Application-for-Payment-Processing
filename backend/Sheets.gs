/**
 * จัดการฐานข้อมูลด้วย Google Sheets (รายการเงินเข้า)
 *
 * ใช้ชีตที่ผู้กับสคริปต์อยู่แล้ว — ไม่สร้างสเปรดชีต/ชีตใหม่
 * ถ้ายังไม่มี header จะเขียนให้อัตโนมัติในแถวแรกของชีต
 */

var HEADERS = ['id', 'ref', 'customer', 'bank', 'amount', 'note', 'fileName', 'fileUrl', 'createdAt'];

function getHeaders_() {
  return HEADERS.slice();
}

function getSpreadsheet_() {
  var config = getConfig_();
  if (config.spreadsheetId) {
    return SpreadsheetApp.openById(config.spreadsheetId);
  }
  throw new Error('ไม่พบสเปรดชีต กรุณารัน setupDatabase() ก่อน');
}

/**
 * เอาชีตที่จะใช้เก็บข้อมูล:
 * 1) ชื่อจาก Script Properties SHEET_NAME ถ้าตั้งไว้
 * 2) ไม่งั้นใช้ชีตแรกของสเปรดชีตที่ผูกกับสคริปต์
 */
function getSheet_() {
  var config = getConfig_();
  var ss = SpreadsheetApp.openById(config.spreadsheetId);
  var sheet = null;

  if (config.sheetName) {
    sheet = ss.getSheetByName(config.sheetName);
    if (!sheet) {
      // ถ้าระบุชื่อไว้แต่ไม่มีชีตนั้น ให้กลับไปใช้ชีตแรก ไม่สร้างชีตใหม่
      sheet = null;
    }
  }

  if (!sheet) {
    sheet = ss.getSheets()[0];
  }

  ensureHeaders_(sheet);
  return sheet;
}

/**
 * สร้าง header database ในชีตที่ส่งให้ (ถ้ายังไม่มี)
 * เขียนเฉพาะเมื่อแถวแรกว่างเท่านั้น เพื่อไม่ทับข้อมูลเดิม
 */
function ensureHeaders_(sheet) {
  var firstCell = sheet.getRange(1, 1).getValue();
  if (String(firstCell).trim() !== '') {
    return; // มีข้อมูล/header อยู่แล้ว ไม่แตะ
  }

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function listRecords_(limitParam) {
  var limit = parseInt(limitParam, 10);
  if (!limit || limit < 1 || limit > 500) {
    limit = 100;
  }

  var sheet = getSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  var records = [];

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var id = String(row[0]).trim();

    // รองรับแถวที่พิมพ์เพิ่มเองใน Sheet (ไม่ได้ใส่ id):
    // - แถวว่างทั้งแถว = ข้าม
    // - มีข้อมูลแต่ไม่มี id = สร้าง id สังเคราะห์จากค่าในแถว เพื่อให้ประกาศเสียงได้
    if (!id) {
      var hasData = false;
      for (var c = 1; c < HEADERS.length; c++) {
        if (String(row[c]).trim() !== '') { hasData = true; break; }
      }
      if (!hasData) continue;
      id = 'manual-' + [row[1], row[2], row[3], row[4], row[5], row[8]].join('|');
    }

    // แปลงยอดเงินแบบทนทาน: 1500 / "1,500" / "฿1,500.00" ทำงานได้ทั้งหมด
    var amountNum = Number(String(row[4]).replace(/[,\s฿]/g, ''));
    if (!isFinite(amountNum)) amountNum = 0;

    records.push({
      id: id,
      ref: String(row[1] || ''),
      customer: String(row[2] || ''),
      bank: String(row[3] || ''),
      amount: amountNum,
      note: String(row[5] || ''),
      fileName: String(row[6] || ''),
      fileUrl: String(row[7] || ''),
      createdAt: row[8] instanceof Date ? row[8].toISOString() : String(row[8] || '')
    });
  }

  // ใหม่สุดก่อน (แถวล่าง = ล่าสุด) และจำกัดจำนวน
  return records.reverse().slice(0, limit);
}

/* ---------- รีเซ็ทยอดรวมวันนี้ (เก็บเวลาไว้ใน Script Properties) ---------- */

var TOTAL_RESET_AT_PROP = 'TOTAL_RESET_AT';

/**
 * เวลาที่ผู้ใช้กด "รีเซ็ท" ครั้งล่าสุด (หรือ null ถ้าไม่เคย/เพิ่งคืนค่า)
 * หมายเหตุ: ยอดรวมยังรีเซ็ทเองทุกเที่ยงคืนตามเวลาไทยอยู่แล้ว
 * ค่านี้ใช้เมื่อต้องการรีเซ็ทกลางวัน (เช่น เริ่มรอบใหม่หลังปิดร้าน)
 */
function getTotalResetAt_() {
  var raw = PropertiesService.getScriptProperties().getProperty(TOTAL_RESET_AT_PROP);
  if (!raw) return null;
  var d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * action=resetSummary
 *   {}            -> เริ่มนับยอดรวมวันนี้ใหม่ตั้งแต่ "ตอนนี้"
 *   { undo: true } -> ล้างการรีเซ็ท กลับไปนับยอดทั้งวันตามเดิม
 * คืนค่าสรุปชุดเดียวกับ action=summary เพื่อให้หน้าเว็บอัปเดตได้ทันที
 */
function resetSummary_(payload) {
  payload = payload || {};
  var props = PropertiesService.getScriptProperties();
  var undo = payload.undo === true || String(payload.undo) === 'true';

  if (undo) {
    props.deleteProperty(TOTAL_RESET_AT_PROP);
  } else {
    props.setProperty(TOTAL_RESET_AT_PROP, new Date().toISOString());
  }

  return summarizeRecords_();
}

/**
 * สรุปยอดเงิน: ยอดรวมของวันนี้ + ยอดรวมทั้งหมด (คำนวณฝั่งเซิร์ฟเวอร์)
 * ใช้กับ action=summary เพื่อให้ยอดรวมถูกต้องแม้หน้าเว็บดึงมาแสดงแค่บางรายการ
 *
 * ยอด "วันนี้" = รายการของวันนี้ (เวลาไทย) ที่เกิดหลังเวลาตัดต้น
 * โดยเวลาตัดต้น = max(เที่ยงคืนของวันนี้, เวลาที่กดรีเซ็ท)
 * => รีเซ็ทเองทุกเที่ยงคืน และกดรีเซ็ทกลางวันได้ด้วย
 */
function summarizeRecords_() {
  var sheet = getSheet_();
  var lastRow = sheet.getLastRow();
  var tz = Session.getScriptTimeZone();
  var now = new Date();

  var todayParts = Utilities.formatDate(now, tz, 'yyyy-MM-dd').split('-');
  var todayStart = new Date(
    Number(todayParts[0]),
    Number(todayParts[1]) - 1,
    Number(todayParts[2]),
    0, 0, 0, 0
  );

  var resetAt = getTotalResetAt_();
  // ถ้ารีเซ็ทไว้เมื่อวาน/ก่อนหน้า ถือว่าเที่ยงคืนของวันนี้ตัดยอดไปแล้ว
  var resetActive = !!(resetAt && resetAt.getTime() > todayStart.getTime());
  var cutoff = resetActive ? resetAt : todayStart;

  var summary = {
    date: todayParts.join('-'),
    todayCount: 0,
    todayTotal: 0,
    totalCount: 0,
    totalAmount: 0,
    resetAt: resetActive ? resetAt.toISOString() : '',
    resetAtLocal: resetActive ? Utilities.formatDate(resetAt, tz, 'HH:mm') : '',
    resetActive: resetActive,
    todayFrom: cutoff.toISOString()
  };

  if (lastRow < 2) return summary;

  var values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var amount = Number(String(row[4]).replace(/[,\s฿]/g, ''));
    if (!isFinite(amount)) amount = 0;

    // ข้ามแถวว่าง (ชีตอาจมีแถวที่จัดรูปแบบไว้แต่ไม่มีข้อมูล)
    var hasData = false;
    for (var c = 0; c < HEADERS.length; c++) {
      if (String(row[c]).trim() !== '') { hasData = true; break; }
    }
    if (!hasData) continue;

    summary.totalCount += 1;
    summary.totalAmount += amount;

    var created = row[8];
    var createdDate = created instanceof Date ? created : (created ? new Date(created) : null);
    if (!createdDate || isNaN(createdDate.getTime())) continue;

    var sameDay = Utilities.formatDate(createdDate, tz, 'yyyy-MM-dd') === summary.date;
    if (sameDay && createdDate.getTime() >= cutoff.getTime()) {
      summary.todayCount += 1;
      summary.todayTotal += amount;
    }
  }

  summary.todayTotal = Math.round(summary.todayTotal * 100) / 100;
  summary.totalAmount = Math.round(summary.totalAmount * 100) / 100;
  return summary;
}

function createRecord_(payload) {
  payload = payload || {};

  var amount = Number(payload.amount);
  if (!amount || amount <= 0) {
    throw new Error('กรุณาระบุยอดเงิน (มากกว่า 0)');
  }

  var customer = String(payload.customer || '').trim();
  var record = {
    id: String(Date.now()),
    ref: String(payload.ref || '').trim(),
    customer: customer,
    bank: String(payload.bank || '').trim(),
    amount: amount,
    note: String(payload.note || ''),
    fileName: String(payload.fileName || ''),
    fileUrl: String(payload.fileUrl || ''),
    createdAt: new Date()
  };

  var sheet = getSheet_();
  sheet.appendRow([
    record.id,
    record.ref,
    record.customer,
    record.bank,
    record.amount,
    record.note,
    record.fileName,
    record.fileUrl,
    record.createdAt
  ]);

  record.createdAt = record.createdAt.toISOString();
  return record;
}
