/**
 * จัดการฐานข้อมูลด้วย Google Sheets (รายการเงินเข้า)
 *
 * ใช้ชีตที่ผู้กับสคริปต์อยู่แล้ว — ไม่สร้างสเปรดชีต/ชีตใหม่
 * ถ้ายังไม่มี header จะเขียนให้อัตโนมัติในแถวแรกของชีต
 */

var HEADERS = ['id', 'ref', 'customer', 'bank', 'amount', 'note', 'fileName', 'fileUrl', 'createdAt', 'account'];
var PRODUCT_HEADERS = ['id', 'name', 'price', 'active'];
var PRODUCTS_SHEET = 'สินค้า';

function getHeaders_() {
  return HEADERS.slice();
}

/**
 * รหัสบัญชี/PromptPay ใช้แยกรายการของแต่ละบัญชี
 * ทำให้พิมพ์ "081-234-5678" เครื่องหนึ่งกับ "0812345678" อีกเครื่องเห็นรายการชุดเดียวกัน
 * ค่าว่าง = "บัญชีหลัก" (รายการเก่าก่อนมีฟีเจอร์นี้)
 */
function normalizeAccountKey_(value) {
  return String(value == null ? '' : value)
    .trim()
    .replace(/[\s\-–—_]/g, '')
    .toUpperCase()
    .slice(0, 40);
}

function getSpreadsheet_() {
  // getConfig_() รองรับทั้ง SPREADSHEET_ID และสคริปต์ที่ผูกกับชีตอยู่แล้ว
  return getConfig_().spreadsheet;
}

/**
 * เอาชีตที่จะใช้เก็บข้อมูล:
 * 1) ชื่อจาก Script Properties SHEET_NAME ถ้าตั้งไว้
 * 2) ไม่งั้นใช้ชีตแรกของสเปรดชีตที่ผูกกับสคริปต์
 */
function getSheet_() {
  var config = getConfig_();
  var ss = config.spreadsheet;
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
  if (String(sheet.getRange(1, 1).getValue()).trim() === '') {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    return;
  }

  // ย้าย schema: เติม header คolumn ใหม่ (account) โดยไม่ทับข้อมูลเดิม
  // เขียนเฉพาะคอลัมน์ที่ว่างทั้งคอลัมน์เท่านั้น
  var checkRows = Math.min(sheet.getLastRow(), 20);
  for (var c = 1; c <= HEADERS.length; c++) {
    if (String(sheet.getRange(1, c).getValue()).trim() !== '') continue;
    var col = sheet.getRange(1, c, Math.max(checkRows, 1), 1).getValues();
    var hasData = false;
    for (var r = 0; r < col.length; r++) {
      if (String(col[r][0]).trim() !== '') { hasData = true; break; }
    }
    if (hasData) continue;
    sheet.getRange(1, c).setValue(HEADERS[c - 1]);
    sheet.getRange(1, c).setFontWeight('bold');
  }
}

function listRecords_(limitParam, accountParam) {
  var limit = parseInt(limitParam, 10);
  var accountKey = normalizeAccountKey_(accountParam);
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

    // แยกรายการตามบัญชี/PromptPay — รหัสตรงกัน (คนละเครื่องได้) จึงเห็นชุดเดียวกัน
    if (normalizeAccountKey_(row[9]) !== accountKey) continue;

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
      // ใส่เลขแถวด้วย เพื่อไม่ให้แถวเหมือนกันสองแถวได้ id ซ้ำ
      id = 'manual-' + (i + 2) + '-' + [row[1], row[2], row[3], row[4], row[5], row[8]].join('|');
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
      createdAt: row[8] instanceof Date ? row[8].toISOString() : String(row[8] || ''),
      account: normalizeAccountKey_(row[9])
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
function resetAtPropName_(accountKey) {
  var key = normalizeAccountKey_(accountKey);
  // ค่าว่างใช้ property เดิม เพื่อไม่ให้การรีเซ็ทของผู้ใช้เดิมหาย
  return key ? TOTAL_RESET_AT_PROP + '_' + key : TOTAL_RESET_AT_PROP;
}

function getTotalResetAt_(accountKey) {
  var raw = PropertiesService.getScriptProperties().getProperty(resetAtPropName_(accountKey));
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
function resetSummary_(payload, accountParam) {
  payload = payload || {};
  var props = PropertiesService.getScriptProperties();
  var propName = resetAtPropName_(accountParam);
  var undo = payload.undo === true || String(payload.undo) === 'true';

  if (undo) {
    props.deleteProperty(propName);
  } else {
    props.setProperty(propName, new Date().toISOString());
  }

  return summarizeRecords_(accountParam);
}

/**
 * สรุปยอดเงิน: ยอดรวมของวันนี้ + ยอดรวมทั้งหมด (คำนวณฝั่งเซิร์ฟเวอร์)
 * ใช้กับ action=summary เพื่อให้ยอดรวมถูกต้องแม้หน้าเว็บดึงมาแสดงแค่บางรายการ
 *
 * ยอด "วันนี้" = รายการของวันนี้ (เวลาไทย) ที่เกิดหลังเวลาตัดต้น
 * โดยเวลาตัดต้น = max(เที่ยงคืนของวันนี้, เวลาที่กดรีเซ็ท)
 * => รีเซ็ทเองทุกเที่ยงคืน และกดรีเซ็ทกลางวันได้ด้วย
 */
function summarizeRecords_(accountParam) {
  var accountKey = normalizeAccountKey_(accountParam);
  var sheet = getSheet_();
  var lastRow = sheet.getLastRow();
  var tz = Session.getScriptTimeZone();
  var now = new Date();

  var todayParts = Utilities.formatDate(now, tz, 'yyyy-MM-dd').split('-');
  // ใช้ parseDate เพื่อให้ "เที่ยงคืนวันนี้" ถูกต้องตามเขตเวลาของสคริปต์เสมอ
  // (new Date(y,m,d) อาจถูกตีความเป็น UTC ถ้า runtime ไม่ได้ใช้เขตเวลาเดียวกัน)
  var todayStart = Utilities.parseDate(
    todayParts.join('-') + ' 00:00:00', tz, 'yyyy-MM-dd HH:mm:ss'
  );

  var resetAt = getTotalResetAt_(accountKey);
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
    if (normalizeAccountKey_(row[9]) !== accountKey) continue;

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
  if (!isFinite(amount) || amount <= 0) {
    throw new Error('กรุณาระบุยอดเงิน (มากกว่า 0)');
  }

  var customer = String(payload.customer || '').trim();
  var accountKey = normalizeAccountKey_(payload.account);
  var record = {
    id: String(Date.now()),
    ref: String(payload.ref || '').trim(),
    customer: customer,
    bank: String(payload.bank || '').trim(),
    amount: amount,
    note: String(payload.note || ''),
    fileName: String(payload.fileName || ''),
    fileUrl: String(payload.fileUrl || ''),
    createdAt: new Date(),
    account: accountKey
  };

  // dryRun ให้หน้าเว็บ/QA ทดสอบการแปลงรหัสบัญชีโดยไม่เขียนลงชีต
  if (payload.dryRun === true || String(payload.dryRun) === 'true') {
    record.createdAt = record.createdAt.toISOString();
    return record;
  }

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
    record.createdAt,
    record.account
  ]);

  record.createdAt = record.createdAt.toISOString();
  return record;
}

/* ---------- สินค้า สำหรับคำนวณยอดและสร้าง QR PromptPay ---------- */

function ensureProductsSheet_() {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(PRODUCTS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(PRODUCTS_SHEET);
  }
  if (String(sheet.getRange(1, 1).getValue()).trim() === '') {
    sheet.getRange(1, 1, 1, PRODUCT_HEADERS.length).setValues([PRODUCT_HEADERS]);
    sheet.getRange(1, 1, 1, PRODUCT_HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function listProducts_() {
  var sheet = ensureProductsSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var values = sheet.getRange(2, 1, lastRow - 1, PRODUCT_HEADERS.length).getValues();
  var products = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var name = String(row[1] || '').trim();
    if (!name) continue;
    var activeRaw = String(row[3] === '' || row[3] == null ? 'true' : row[3]).trim().toLowerCase();
    if (activeRaw === 'false' || activeRaw === '0' || activeRaw === 'no' || activeRaw === 'inactive') {
      continue; // สินค้าปิดขาย: ไม่โชว์ในหน้า QR
    }
    var price = Number(String(row[2]).replace(/[,\s฿]/g, ''));
    if (!isFinite(price) || price < 0) price = 0;
    products.push({
      id: String(row[0] || ''),
      name: name,
      price: Math.round(price * 100) / 100,
      active: true
    });
  }
  return products;
}

function saveProduct_(payload) {
  payload = payload || {};
  var name = String(payload.name || '').trim();
  var price = Number(payload.price);
  if (!name) throw new Error('กรุณาระบุชื่อสินค้า');
  if (!isFinite(price) || price <= 0) throw new Error('กรุณาระบุราคาสินค้า (มากกว่า 0)');

  var sheet = ensureProductsSheet_();
  var id = String(payload.id || '').trim();
  if (id) {
    var ids = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 0), 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === id) {
        sheet.getRange(i + 2, 2, 1, 3).setValues([[name, price, 'true']]);
        return { id: id, name: name, price: price, active: true };
      }
    }
  }

  id = String(Date.now());
  sheet.appendRow([id, name, price, 'true']);
  return { id: id, name: name, price: price, active: true };
}

function deleteProduct_(payload) {
  payload = payload || {};
  var id = String(payload.id || '');
  if (!id) throw new Error('ไม่พบรหัสสินค้า');
  var sheet = ensureProductsSheet_();
  var ids = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 0), 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === id) {
      sheet.deleteRow(i + 2);
      return { ok: true };
    }
  }
  throw new Error('ไม่พบสินค้าที่ต้องการลบ');
}
