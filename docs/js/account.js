/**
 * account.js — รหัสบัญชี/PromptPay ของเครื่องนี้ (ใช้ร่วมกันทั้ง 3 หน้า)
 *
 * - เก็บใน localStorage KEY เดียวกับที่หน้า QR ใช้ (payvoxPromptPay)
 * - ทำให้พิมพ์ "081-234-5678" เครื่องหนึ่งกับ "0812345678" อีกเครื่อง
 *   ได้รหัสเดียวกัน → เห็นรายการเงินเข้าชุดเดียวกัน
 * - ค่าว่าง = "บัญชีหลัก" (รายการเก่าก่อนมีฟีเจอร์แยกบัญชี)
 * - ไม่ส่งชื่อผู้รับ/ข้อมูลส่วนตัวขึ้น GitHub หรือโค้ดที่เปิดเผย
 */
(function () {
  'use strict';

  var KEY = 'payvoxPromptPay';

  function normalize(value) {
    return String(value == null ? '' : value)
      .trim()
      .replace(/[\s\-–—_]/g, '')
      .toUpperCase()
      .slice(0, 40);
  }

  function get() {
    try {
      return normalize(localStorage.getItem(KEY) || '');
    } catch (e) {
      return '';
    }
  }

  function set(value) {
    var key = normalize(value);
    try {
      localStorage.setItem(KEY, key);
    } catch (e) {
      /* WebView บางเครื่องปิด localStorage — ยังใช้งานต่อได้ใน session นี้ */
    }
    return key;
  }

  function label() {
    return get() || 'บัญชีหลัก';
  }

  window.PayVoxAccount = {
    key: KEY,
    normalize: normalize,
    get: get,
    set: set,
    label: label
  };
})();
