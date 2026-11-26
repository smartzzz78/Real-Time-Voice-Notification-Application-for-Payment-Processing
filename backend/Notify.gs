/**
 * action=notify — รับแจ้งเงินเข้าอัตโนมัติจากแอป Android "KTB → เงินเข้า"
 *
 * แอปจะอ่าน notification ของ Krungthai NEXT แล้วส่งยอดเงินเข้ามาที่นี่
 * ความปลอดภัย:
 *   - ต้องส่ง token ที่ตรงกับ Script Properties NOTIFY_TOKEN
 *     (token ไม่ได้อยู่ในหน้าเว็บ/ไฟล์ frontend)
 *   - จำกัดไม่เกิน 30 ครั้ง/นาที กันการยิงรัว
 *   - กันแจ้งซ้ำด้วย ref (เก็บใน CacheService 6 ชั่วโมง)
 *   - รองรับ dryRun สำหรับปุ่ม "ทดสอบเชื่อมต่อ" (ไม่บันทึกข้อมูล)
 */

var NOTIFY_TOKEN_PROP = 'NOTIFY_TOKEN';
var NOTIFY_ACCOUNT_PROP = 'NOTIFY_ACCOUNT';
var NOTIFY_MAX_PER_MINUTE = 30;
var NOTIFY_DEDUPE_SECONDS = 21600; // 6 ชั่วโมง

function getNotifyToken_() {
  return PropertiesService.getScriptProperties().getProperty(NOTIFY_TOKEN_PROP) || '';
}

/**
 * บัญชีของรายการที่แอป Android ส่งมา (APK เดิมไม่ได้ส่ง account)
 * ตั้งครั้งเดียวจาก Apps Script editor: setNotifyAccount('0812345678')
 * ถ้าไม่ตั้ง = "บัญชีหลัก" (ค่าว่าง) และยังเห็นรายการเก่าทั้งหมด
 */
function getNotifyAccount_() {
  return normalizeAccountKey_(
    PropertiesService.getScriptProperties().getProperty(NOTIFY_ACCOUNT_PROP) || ''
  );
}

function notifyRecord_(payload) {
  payload = payload || {};

  var expected = getNotifyToken_();
  if (!expected) {
    throw new Error('ยังไม่ได้ตั้งค่า token สำหรับรับแจ้งเตือนอัตโนมัติ');
  }
  if (String(payload.token || '') !== expected) {
    throw new Error('token ไม่ถูกต้อง');
  }

  var amount = Number(payload.amount);
  if (!isFinite(amount) || amount <= 0) {
    throw new Error('ยอดเงินไม่ถูกต้อง');
  }
  amount = Math.round(amount * 100) / 100;

  // ปุ่มทดสอบในแอป: ตรวจ token อย่างเดียว ไม่เขียนข้อมูล
  if (payload.dryRun) {
    return { dryRun: true, ok: true, amount: amount };
  }

  var ref = String(payload.ref || '').trim().slice(0, 80);
  var accountKey = normalizeAccountKey_(payload.account || getNotifyAccount_());
  var cache = CacheService.getScriptCache();
  var lock = LockService.getScriptLock();

  // กัน notification เดียวกันเข้าพร้อมกัน 2 request:
  // cache อย่างเดียวไม่ atomic — ทั้งสอง request อาจเช็กว่า "ยังไม่มี" พร้อมกันได้
  if (!lock.tryLock(10000)) {
    throw new Error('ระบบกำลังบันทึกรายการอื่น กรุณาลองใหม่');
  }

  try {
    var minuteKey = 'notify-rate-' + Math.floor(Date.now() / 60000);
    var used = Number(cache.get(minuteKey) || 0);
    if (used >= NOTIFY_MAX_PER_MINUTE) {
      throw new Error('มีรายการเข้ามาถี่เกินไป กรุณารอสักครู่');
    }
    cache.put(minuteKey, String(used + 1), 120);

    var dupKey = ref ? 'notify-ref-' + accountKey + '|' + ref : '';
    if (dupKey && cache.get(dupKey)) {
      return { duplicate: true, record: null };
    }

    var record = createRecord_({
      ref: ref,
      customer: String(payload.customer || '').trim(),
      bank: String(payload.bank || 'กรุงไทย (KTB NEXT)').trim(),
      amount: amount,
      note: String(payload.note || 'เงินเข้าอัตโนมัติจาก KTB NEXT').slice(0, 200),
      account: accountKey
    });

    // สำคัญ: ทำเครื่องหมายว่าซ้ำ "หลัง" appendRow สำเร็จเท่านั้น
    // ถ้า Sheets ล้มเหลว request ถัดไปต้องลองบันทึกได้ ไม่ใช่ถูกทิ้งนาน 6 ชั่วโมง
    if (dupKey) cache.put(dupKey, '1', NOTIFY_DEDUPE_SECONDS);

    return { duplicate: false, record: record };
  } finally {
    lock.releaseLock();
  }
}

/**
 * ตั้ง token สำหรับรับแจ้งเตือน (รันจาก Apps Script editor ครั้งเดียว)
 * ใช้ในกรณีที่ต้องการเปลี่ยน token ด้วยตัวเอง
 */
function setNotifyToken(token) {
  token = String(token || '').trim();
  if (token.length < 20) {
    throw new Error('token ต้องยาวอย่างน้อย 20 ตัวอักษร');
  }
  PropertiesService.getScriptProperties().setProperty(NOTIFY_TOKEN_PROP, token);
  return { ok: true, hasToken: true };
}

/**
 * กำหนดบัญชีที่รับรายการแจ้งเตือนอัตโนมัติ (รันจาก Apps Script editor ครั้งเดียว)
 * ใช้เลข PromptPay เดียวกับที่กรอกในหน้าเว็บ เช่น setNotifyAccount('0812345678')
 * เรียก setNotifyAccount('') เพื่อกลับไปใช้ "บัญชีหลัก"
 */
function setNotifyAccount(account) {
  var key = normalizeAccountKey_(account);
  PropertiesService.getScriptProperties().setProperty(NOTIFY_ACCOUNT_PROP, key);
  return { ok: true, account: key };
}
