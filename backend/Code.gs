/**
 * Entry point ของ Web App — แอปอ่านเสียงยอดเงินเข้า (Money In Voice)
 *
 * ฐานข้อมูล: Google Sheet ที่ผูกกับสคริปต์นี้อยู่แล้ว (ไม่สร้างใหม่)
 *            header จะถูกสร้างให้อัตโนมัติในชีตแรกของไฟล์
 * ไฟล์แนบ:   Google Drive (โฟลเดอร์ "App Uploads")
 *
 * รองรับ action:
 *   GET  ?action=ping                              -> ตรวจสอบระบบ + ข้อมูลชีต
 *   GET  ?action=list[&limit=100][&account=...]    -> รายการเงินเข้าล่าสุดของบัญชีนั้น
 *   GET  ?action=summary[&account=...]             -> ยอดรวมวันนี้ + ยอดรวมทั้งหมดของบัญชีนั้น
 *   POST { action: 'resetSummary', payload: { account } } -> เริ่มนับยอดวันนี้ใหม่ (undo:true = คืนค่า)
 *   POST { action: 'create', payload: {...} }      -> บันทึกรายการเงินเข้า (payload.account = รหัสบัญชี)
 *   POST { action: 'upload', payload: {...} }      -> อัปโหลดรูปสลิปขึ้น Drive
 *   POST { action: 'notify', payload: {...} }       -> รับแจ้งเงินเข้าจาก Android (มี token)
 *   GET  ?action=listProducts                       -> รายการสินค้าและราคา
 *   POST { action: 'saveProduct', payload: {...} }  -> เพิ่ม/แก้สินค้า
 *   POST { action: 'deleteProduct', payload:{} }    -> ลบสินค้า
 */

var GET_ACTIONS = { ping: true, list: true, summary: true, listProducts: true };
var POST_ACTIONS = {
  create: true, upload: true, notify: true, resetSummary: true,
  saveProduct: true, deleteProduct: true
};

function doGet(e) {
  return handleRequest_(e, 'GET');
}

function doPost(e) {
  return handleRequest_(e, 'POST');
}

function handleRequest_(e, method) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var body = {};

    if (method === 'POST' && e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    var action = String(body.action || params.action || '');
    var payload = body.payload || body;
    var data;

    // กันการแก้ข้อมูลผ่านลิ้งก์ GET (Web App เปิดให้ anonymous)
    if (method === 'GET' && !GET_ACTIONS[action]) {
      throw new Error('Action นี้ต้องใช้ POST: ' + action);
    }
    if (method === 'POST' && !POST_ACTIONS[action]) {
      throw new Error('Action นี้ใช้ GET ได้อย่างเดียว: ' + action);
    }

    switch (action) {
      case 'ping':
        data = ping_();
        break;
      case 'list':
        data = listRecords_(params.limit, params.account);
        break;
      case 'summary':
        data = summarizeRecords_(params.account);
        break;
      case 'resetSummary':
        data = resetSummary_(payload, payload.account);
        break;
      case 'create':
        data = createRecord_(payload);
        break;
      case 'notify':
        data = notifyRecord_(payload);
        break;
      case 'upload':
        data = uploadFile_(payload);
        break;
      case 'listProducts':
        data = listProducts_();
        break;
      case 'saveProduct':
        data = saveProduct_(payload);
        break;
      case 'deleteProduct':
        data = deleteProduct_(payload);
        break;
      default:
        throw new Error('Unknown action: "' + action + '"');
    }

    return jsonResponse_({ ok: true, data: data });
  } catch (err) {
    return jsonResponse_({ ok: false, error: err.message || String(err) });
  }
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ตรวจสอบระบบ — เรียกครั้งแรกเพื่อให้ header ถูกสร้างในชีตทันที
 */
function ping_() {
  var sheet = getSheet_();
  var config = getConfig_();
  var folder = getDriveFolder_();

  return {
    ok: true,
    time: new Date().toISOString(),
    spreadsheetId: config.spreadsheetId,
    spreadsheetUrl: config.spreadsheetUrl,
    sheetName: sheet.getName(),
    headers: getHeaders_(),
    rowCount: Math.max(sheet.getLastRow() - 1, 0),
    driveFolderId: folder.getId()
  };
}

/**
 * แสดงค่าที่ตั้งไว้ใน Script Properties (รันได้จาก editor เพื่อตรวจสอบ)
 */
function showConfig() {
  var result = ping_();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

/**
 * ตั้งค่าฐานข้อมูลเอง (สำหรับรันจาก Apps Script editor)
 * - ใช้สเปรดชีตที่ผูกกับสคริปต์อยู่แล้ว / หรือตาม SPREADSHEET_ID ใน Script Properties
 * - สร้าง header ในชีตทันที
 * - หาโฟลเดอร์ Drive "App Uploads" ถ้าไม่มีค่อยสร้าง
 */
function setupDatabase() {
  var result = ping_();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function getConfig_() {
  var props = PropertiesService.getScriptProperties();
  var spreadsheetId = props.getProperty('SPREADSHEET_ID') || '';
  var ss = null;

  if (spreadsheetId) {
    ss = SpreadsheetApp.openById(spreadsheetId);
  } else {
    // สคริปต์นี้ผูกกับ Google Sheet อยู่แล้ว -> ใช้ไฟล์นั้น ไม่สร้างใหม่
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  if (!ss) {
    throw new Error(
      'ไม่พบสเปรดชีต: ใช้สคริปต์ที่ผูกกับ Google Sheet หรือตั้ง SPREADSHEET_ID ใน Script Properties'
    );
  }

  return {
    spreadsheet: ss,
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    sheetName: props.getProperty('SHEET_NAME') || ''
  };
}
