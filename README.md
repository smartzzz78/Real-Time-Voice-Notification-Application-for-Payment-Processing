# PayVox

แอปแจ้งเตือนเงินเข้าแบบเรียลไทม์ด้วยเสียง พร้อมฟีดรายการและเครื่องมือตรวจสลิป ใช้ **GitHub Pages** เป็น frontend และ **Google Apps Script** เป็น backend
โดยใช้ **Google Sheets** เป็นฐานข้อมูล และ **Google Drive** เก็บไฟล์แนบ

แอปมีหน้าที่ใช้จริง 3 หน้า (เมนูล่างมี 2 แท็บ):

| หน้า | ไฟล์ | คำอธิบาย |
|---|---|---|
| ตรวจสลิป & เงินเข้า (หน้าหลัก) | `docs/index.html` | ฟีดรายการเงินเข้าจาก Google Sheets + **อ่านออกเสียงยอดเงินเข้าอัตโนมัติ** (poll ทุก 8 วิ) + ปุ่มยืนยันสลิป |
| QR ชำระเงิน | `docs/qr.html` | เลือกสินค้า → ใส่จำนวน → คำนวณยอด → สร้าง QR PromptPay (แท็บที่ 2) |
| เพิ่มเงินเข้า | `docs/money-in.html` | ฟอร์มบันทึกยอดรับเงิน บันทึกลง Sheets + อัปโหลดรูปสลิปขึ้น Drive (เปิดจากลิงก์ "＋ เพิ่มเงินเข้า" ในการ์ดรายการล่าสุด ไม่ได้อยู่ในเมนูล่าง) |

> หมายเหตุ: หน้าเดโม/ของเสริมเดิม (`dashboard.html`, `settings-shift.html`, `counter-live.html`) ถูกลบออกแล้ว
> — ถ้าต้องการกลับมา ดูได้จาก history ของ git

เสียงประกาศพูดแค่ยอดเงิน เช่น **"เงินเข้า 150 บาท"** (ไม่พูดชื่อลูกค้า) ส่วนชื่อลูกค้ายังแสดงบนจอตามปกติ
เสียงที่ใช้เป็น **เสียงพูดจากเครื่อง (Web Speech API)** เท่านั้น — ไม่มีการเรียก AI TTS ไม่ต้องใส่คีย์ Gemini ไม่กินโควตา/เน็ต
ไอคอนทั้งหมดเป็น **Material Symbols แบบ self-host** (`docs/fonts/`, subset ~10 KB) จึงไม่โหลดจาก `fonts.googleapis.com` และถูก service worker cache ร่วมกับเว็บ

## ระบบ QR PromptPay

- หน้า `qr.html` (เมนู **QR**) อ่านรายการสินค้าจากชีต **สินค้า** ใน Google Sheet เดิม
- โครงสร้างชีตสินค้า: `id | name | price | active` — เพิ่ม/แก้/ลบได้จากหน้า QR
  (ตั้ง `active` เป็น `false` ในชีตเพื่อซ่อนสินค้าที่ปิดขาย ไม่ให้โชว์/สร้าง QR)
- ตัวอย่าง: ขนม 2 ชิ้น × 5 บาท = **10 บาท**
- ระบบสร้าง payload ตามมาตรฐาน EMV (มี CRC16) สำหรับ PromptPay แบบระบุจำนวนเงิน
- **เลข PromptPay และชื่อผู้รับเก็บใน `localStorage` ของเครื่องเท่านั้น** ไม่ส่งขึ้นเซิร์ฟเวอร์/Repo
- หลังลูกค้าสแกนชำระ เงินเข้าจะถูกอ่านโดยตัวรับ KTB และประกาศเสียงเหมือนเดิม


## ลิงก์โปรเจกต์

| ส่วน | ลิงก์ |
|---|---|
| GitHub repo | https://github.com/smartzzz78/Real-Time-Voice-Notification-Application-for-Payment-Processing |
| เว็บไซต์ (GitHub Pages) | https://smartzzz78.github.io/Real-Time-Voice-Notification-Application-for-Payment-Processing/ |
| Web App endpoint | https://script.google.com/macros/s/AKfycbxvcU7CAxGGqlEU5mZxl_OIrbDIPqM7fv8Jen--ijrApeZWOlbRZrkBhAsyDm-xja7O/exec |

```
.
├─ docs/                 # Frontend (GitHub Pages เสิร์ฟจากโฟลเดอร์นี้)
│  ├─ index.html         # หน้าหลัก: ตรวจสลิป + อ่านเสียงยอดเงินเข้า
│  ├─ qr.html            # หน้า QR: คำนวณยอดจากสินค้า + QR PromptPay
│  ├─ money-in.html      # ฟอร์มบันทึกเงินเข้า (เปิดจากลิงก์ในหน้าแรก)
│  ├─ fonts/             # ไอคอน Material Symbols self-host (subset + LICENSE)
│  └─ js/
│     ├─ config.js       # ใส่ Web App URL ที่นี่
│     ├─ api.js          # ตัวเรียก API
│     └─ app.js          # ดึงข้อมูล + อ่านเสียงยอดเงินเข้า (ใช้ใน index.html)
├─ backend/              # Apps Script (clasp)
│  ├─ appsscript.json
│  ├─ Code.gs            # doGet/doPost + ping/setupDatabase()
│  ├─ Sheets.gs          # CRUD กับ Google Sheets
│  ├─ Drive.gs           # อัปโหลดไฟล์ขึ้น Drive
├─ scripts/
│  ├─ login.ps1          # เปิดหน้าต่าง login GitHub + Google
│  ├─ set-api-url.ps1    # อัปเดต API URL ใน frontend
│  └─ deploy.ps1         # push ทั้ง GitHub และ Apps Script
└─ package.json
```

## เครื่องมือที่ติดตั้งแล้ว

| เครื่องมือ | หน้าที่ |
|---|---|
| Git 2.56 | push โค้ดขึ้น GitHub |
| Node.js 26.13 + npm 11.20 | รัน clasp และ serve frontend |
| GitHub CLI 2.103.3 | สร้าง repo / เปิด GitHub Pages |
| clasp 3.4.1 | push โค้ดขึ้น Apps Script |

> ถ้าเปิด terminal ใหม่แล้วคำสั่งไม่เจอ ให้ปิดแล้วเปิด PowerShell ใหม่ (PATH จะอัปเดต)

---

## ขั้นตอนที่ 1 — Login

รัน:

```powershell
.\scripts\login.ps1
```

จะเปิดหน้าต่าง 2 อัน:
1. **GitHub CLI** — เลือก `GitHub.com` → `HTTPS` → `Login with a web browser` แล้วใส่ code
2. **clasp (Google)** — เลือกบัญชี Google ที่จะใช้เป็นเจ้าของ Sheet/Drive แล้วกด Allow

ตรวจสอบ:

```powershell
gh auth status
clasp show-authorized-user
```

## ขั้นตอนที่ 2 — ฐานข้อมูล (Google Sheet ที่ผูกกับสคริปต์)

โปรเจกต์ Apps Script นี้ผูกกับ Google Sheet อยู่แล้ว — **ไม่ต้องสร้างสเปรดชีตใหม่**
เมื่อมีการเรียก API ครั้งแรก (หรือรัน `setupDatabase` ใน editor) ระบบจะ:

- สร้าง **header database** ให้อัตโนมัติในชีตแรกของไฟล์:
  `id | ref | customer | bank | amount | note | fileName | fileUrl | createdAt`
- หาโฟลเดอร์ Drive ชื่อ `App Uploads` (มีอยู่แล้วใช้เดิม ไม่มีค่อยสร้าง)

รันทดสอบ: เปิด editor (**Deploy แล้วต้อง authorize ก่อน 1 ครั้ง — ดูขั้นตอนที่ 3**) → เลือกฟังก์ชัน `setupDatabase` → Run
จะได้ log แสดง `spreadsheetId`, `sheetName`, `rowCount`

> ถ้าต้องการใช้ชีตอื่น (ไม่ใช่ชีตแรก) ให้ตั้ง `SHEET_NAME` ใน Script Properties
> ถ้าสคริปต์ไม่ได้ผูกกับสเปรดชีต ให้ตั้ง `SPREADSHEET_ID` ใน Script Properties

## ขั้นตอนที่ 3 — Deploy Web App + อนุญาตสคริปต์ (สำคัญ)

deploy ผ่าน clasp แล้ว:

```powershell
cd backend
clasp deploy --description "v1"
```

**จำเป็นต้องอนุญาตสคริปต์ 1 ครั้ง** (deploy ผ่าน clasp/API จะข้ามขั้นตอนนี้ ทำให้เว็บตอบ 403 "ต้องมีสิทธิ์เข้าถึง"):

1. เปิด **Web App URL** ด้วยเบราว์เซอร์ที่ล็อกอินบัญชีเจ้าของ Apps Script
2. จะเจอหน้าขอสิทธิ์ → เลือกบัญชี → **Advanced** → **Go to project (unsafe)** → **Allow**
3. เสร็จแล้วหน้าเว็บจะแสดง JSON ของ `ping` — แปลว่าใช้ได้แล้ว

ตั้งค่า Web App URL ใน frontend (ถ้า deployment URL เปลี่ยน):

```powershell
.\scripts\set-api-url.ps1 -Url "https://script.google.com/macros/s/XXXX/exec"
```

## ขั้นตอนที่ 4 — ทดสอบในเครื่อง

```powershell
npm run serve
```

เปิด http://localhost:3000 ลองบันทึกข้อมูล + แนบไฟล์
ถ้าสำเร็จ ข้อมูลจะไปอยู่ใน Google Sheets และไฟล์อยู่ใน Google Drive

## ขั้นตอนที่ 5 — สร้าง GitHub repo + เปิด Pages

```powershell
gh repo create Real-Time-Voice-Notification-Application-for-Payment-Processing --public --source=. --remote=origin --push
```

เปิด GitHub Pages ให้เสิร์ฟจาก `main` / `docs`:

```powershell
gh api -X POST repos/{owner}/Real-Time-Voice-Notification-Application-for-Payment-Processing/pages `
  -f "source[branch]=main" -f "source[path]=/docs"
```

หรือทำผ่านเว็บ: **Settings → Pages → Source: Deploy from a branch → main / docs → Save**

เว็บไซต์จะอยู่ที่ `https://<username>.github.io/Real-Time-Voice-Notification-Application-for-Payment-Processing/`

## ขั้นตอนที่ 6 — Deploy ครั้งต่อไป

แก้โค้ดเสร็จแล้วรันคำสั่งเดียว:

```powershell
.\scripts\deploy.ps1 -Message "เพิ่มฟีเจอร์..."
```

สคริปต์จะ `git push` (frontend) และ `clasp push` + `clasp deploy` (backend) ให้

> **สำคัญ:** ถ้า `clasp deploy` สร้าง deployment ใหม่ URL จะเปลี่ยน
> ให้รัน `.\scripts\set-api-url.ps1 -Url "..."` แล้ว commit/push อีกครั้ง
> หรือไปที่ Apps Script → Deploy → **Manage deployments → แก้ไข deployment เดิม** เพื่อให้ URL คงเดิม

---

## API ที่ backend รองรับ

| Action | Method | Body / Query | ผลลัพธ์ |
|---|---|---|---|
| `ping` | GET | `?action=ping` | `{ ok, time, spreadsheetId, sheetName, headers, rowCount }` (สร้าง header ให้อัตโนมัติ) |
| `list` | GET | `?action=list` (option `&limit=100`) | รายการเงินเข้าล่าสุด (ใหม่สุดก่อน) |
| `summary` | GET | `?action=summary` | `{ date, todayCount, todayTotal, totalCount, totalAmount, resetActive, resetAt, resetAtLocal, todayFrom }` — ยอดรวมวันนี้/ทั้งหมด (คำนวณฝั่งเซิร์ฟเวอร์ ใช้กับยอดเงินรวมบนหน้าจอ) |
| `resetSummary` | POST | `{ action:'resetSummary', payload:{} }` (หรือ `payload:{ undo:true }` เพื่อคืนค่า) | เริ่มนับยอดวันนี้ใหม่ตั้งแต่ตอนนี้ / ล้างการรีเซ็ท — คืนสรุปชุดเดียวกับ `summary` |
| `create` | POST | `{ action:'create', payload:{ amount, customer, bank, ref, note, fileName, fileUrl } }` | record ที่สร้าง |
| `notify` | POST | `{ action:'notify', payload:{ token, amount, ref?, customer?, bank?, note?, dryRun? } }` | รับเงินเข้าอัตโนมัติจากแอป Android (ดูหัวข้อ "เงินเข้าอัตโนมัติ") — `{ duplicate, record }` |
| `upload` | POST | `{ action:'upload', payload:{ filename, mimeType, base64 } }` | ข้อมูลไฟล์บน Drive |
| `listProducts` | GET | `?action=listProducts` | รายการสินค้าจากชีต "สินค้า" |
| `saveProduct` | POST | `{ action:'saveProduct', payload:{ id?, name, price } }` | เพิ่ม/แก้สินค้า |
| `deleteProduct` | POST | `{ action:'deleteProduct', payload:{ id } }` | ลบสินค้า |

หมายเหตุ: frontend ส่ง POST ด้วย `Content-Type: text/plain` เพื่อเลี่ยง CORS preflight
เพราะ Apps Script ไม่รองรับ request method `OPTIONS`
backend บังคับ method ตามตารานี้ — action ที่แก้ข้อมูลเรียกผ่าน GET จะถูกปฏิเสธ

## เสียงประกาศ (จากเครื่อง)

- ทุกหน้าใช้ **`speechSynthesis` / Web Speech API** ของอุปกรณ์ในการพูดภาษาไทย (`th-TH`)
- **ไม่มีเสียง AI, ไม่มีคีย์ Gemini, ไม่มี endpoint `speak`** — ทำงานได้แม้ออฟไลน์หลังโหลดหน้าแล้ว
- ถ้าเครื่องยังไม่มีเสียงภาษาไทย ให้ติดตั้งใน Settings → Text-to-speech → Install voice data (Android)
- บน iOS/Chrome ต้องแตะหน้าจอ 1 ครั้งก่อนถึงจะให้เสียงเล่นได้ (browser policy)

## วิธีทำงานของ "อ่านเสียงยอดเงินเข้า"

1. เปิดหน้า `index.html` (แท็บ "ตรวจสลิป") ทิ้งไว้ที่เคาน์เตอร์
2. มีรายการใหม่เข้ามา (แอป KTB → เงินเข้า ส่งอัตโนมัติ หรือเพิ่มผ่านหน้า "เพิ่มเงินเข้า" หรือพิมพ์ใน Google Sheet ตรง ๆ)
3. ระบบ poll ทุก 8 วินาที → เจอรายการใหม่ → เสียงกริ่ง "ding-dong" + **เสียงพูดจากเครื่อง** พูด
   *"เงินเข้า 150 บาท"* (พูดแค่ยอดเงิน ไม่พูดชื่อลูกค้า — แต่ toast และแบนเนอร์บนจอแสดงชื่อลูกค้าด้วย)

## เงินเข้าอัตโนมัติจาก Krungthai NEXT

เป้าหมาย: **มีคนโอนเงิน → แอปที่เคาน์เตอร์ประกาศยอดให้เอง** โดยไม่ต้องกดอะไร

```
Krungthai NEXT เด้ง notification "เงินเข้า 150.00 บาท"
        │  (ตัวอ่านในแอป อ่าน notification เฉพาะแพ็กเกจ ktbcs.netbank)
        ├──────────────► กริ่ง + ประกาศ "เงินเข้า 150 บาท" ทันทีในมือถือ
        │                 (ทำงานแม้แอปอยู่เบื้องหลัง/จอดับ)
        ▼
POST action=notify  + token  ──────────────► Apps Script
        │                                      │ ตรวจ token / rate limit / กันซ้ำ (ref)
        ▼                                      ▼
   log ในมือถือ                        บันทึกลง Google Sheet
                                                │
                                     หน้าแรก poll ทุก 8 วินาที
                                                ▼
                               การ์ดใหม่ + ยอดรวมวันนี้บนจอ (ไม่พูดซ้ำ)
```

### ฝั่งเซิร์ฟเวอร์ (`backend/Notify.gs`)

| รายการ | ค่า |
|---|---|
| Token | Script Properties `NOTIFY_TOKEN` — **ไม่เคยอยู่ในโค้ดหน้าเว็บ/repo** |
| ตั้ง/เปลี่ยน token | รันฟังก์ชัน `setNotifyToken('...')` ใน Apps Script editor (ยาว ≥ 20 ตัวอักษร) |
| Rate limit | 30 ครั้ง/นาที (CacheService) |
| กันแจ้งซ้ำ | ส่ง `ref` เดิมซ้ำภายใน 6 ชั่วโมง → ตอบ `{ duplicate:true }` ไม่บันทึกเพิ่ม |
| ทดสอบ | ส่ง `dryRun:true` → ตรวจ token เท่านั้น ไม่เขียนข้อมูล (ใช้กับปุ่ม "ทดสอบเชื่อมต่อ") |

### ตัวรับเงินเข้า (อยู่ในแอปเดียวกัน)

ตั้งแต่เวอร์ชัน **1.1.0** ตัวอ่าน notification รวมอยู่ในแอปหลักแล้ว (ไม่ต้องติดตั้ง 2 แอป)
แอปหลักเปลี่ยนตัวห่อจาก TWA เป็น **WebView + NotificationListenerService** ในแอปเดียว

| รายการ | ค่า |
|---|---|
| Package ID | `th.coffeesukjai.slipverify` (ตัวเดียวกับแอปหลัก — ติดตั้งทับรุ่น 1.0.0 ได้เลย) |
| Version | 1.2.3 (versionCode 7) |
| Android ที่รองรับ | 7.0 ขึ้นไป (minSdk 24, targetSdk 34) |
| ไฟล์ติดตั้ง | `payvox-v1.2.3.apk` (เผยแพร่ใน GitHub Releases) |
| ซอร์ส Android | เก็บเป็นส่วนตัวนอก repository สาธารณะ |
| build ใหม่ | `powershell -ExecutionPolicy Bypass -File .\build.ps1` (ไม่ใช้ Gradle, ใช้ JDK 17 + build-tools 36.1.0) |

ในแอปเดียวมี: หน้าเว็บเต็มจอ + แถบสถานะบาง ๆ ด้านบน ("ตัวรับเงินเข้า: พร้อม ✓" แตะเพื่อตั้งค่า)
+ หน้าตั้งค่า (สิทธิ์การแจ้งเตือน / แบตเตอรี่ / ทดสอบเชื่อมต่อ / log 15 รายการ)
+ ตัวอ่าน notification ของ `ktbcs.netbank` + เสียงพูด Android TTS เป็นตัวสำรองของ "เสียงเครื่อง"

> แอปเสริมรุ่นแยก `ktb-notify-v1.0.0.apk` (package `th.coffeesukjai.ktbnotify`) ยังใช้ได้เหมือนเดิม
> แต่ไม่จำเป็นแล้ว — ถ้าติดตั้งทั้งคู่ เซิร์ฟเวอร์จะกันรายการซ้ำให้ (ref เดียวกัน)

สิ่งที่ตัวรับเงินเข้าทำ: อ่าน notification ของ `ktbcs.netbank` → กรองเฉพาะ "เงินเข้า" (ตัด "เงินออก/โอนออก/ชำระ") →
อ่านยอด (ข้าม "ยอดคงเหลือ") → ส่งเฉพาะยอด + เวลา + ref เข้าเซิร์ฟเวอร์

> **1.2.0 — ประกาศอัตโนมัติทันที:** พอบันทึกสำเร็จ ตัวอ่านจะ **กริ่งสั้น + พูด "เงินเข้า 150 บาท"** เอง
> (ไม่ต้องรอ poll และทำงานได้แม้แอปอยู่เบื้องหลัง/จอดับ) แล้วจำ `ref` ที่ประกาศแล้วไว้
> หน้าเว็บถามผ่าน `AndroidVoice.wasAnnounced(ref)` → **ไม่พูดซ้ำ** แค่แสดงการ์ด + ยอดรวมวันนี้
> หน้าเว็บยังซิงก์เองทุก 8 วินาที และซิงก์ทันทีเมื่อกลับเข้าหน้า / เน็ตกลับมา / สลับแอปกลับมา

> **1.2.1 — กันยอดหายเมื่อเน็ตสะดุด:** ตัวอ่านลองส่งใหม่อัตโนมัติสูงสุด 3 ครั้งด้วย `ref` เดิม
> ฝั่ง backend ใช้ `LockService` ป้องกัน request พร้อมกันและทำเครื่องหมาย dedupe หลังเขียน Sheets สำเร็จเท่านั้น
> ถ้ารอบแรกบันทึกสำเร็จแต่คำตอบขาดหาย รอบ retry ที่ตอบ `duplicate` ยังประกาศเสียงหนึ่งครั้งโดยไม่เพิ่มยอดซ้ำ

### วิธีติดตั้ง (ทำครั้งเดียว)

1. ดาวน์โหลด `payvox-v1.2.3.apk` จาก GitHub Releases ไปที่มือถือเคาน์เตอร์ แล้วเปิดไฟล์ → ติดตั้งทับรุ่นเดิมได้เลย
2. เปิดแอป → ครั้งแรกจะเด้งหน้า **ตัวรับเงินเข้า** อัตโนมัติ
3. ถ้าเป็น Android 13 ขึ้นไป: กด **"① เปิดข้อมูลแอป"** → ⋮ มุมขวาบน → **"อนุญาตการตั้งค่าที่จำกัด"**
   (ถ้าไม่มีเมนูนี้ ข้ามได้ — บางรุ่นไม่ต้องอนุญาต)
4. กด **"② เปิดหน้าการเข้าถึงการแจ้งเตือนของแอปนี้"** → เปิดสวิตช์ของแอปนี้
5. กด **"ตั้งค่าประหยัดแบตเตอรี่"** → ตั้งค่าให้แอปนี้ **ไม่จำกัดการทำงาน** (สำคัญกับ Xiaomi/OPPO/vivo)
6. กด **"ทดสอบเชื่อมต่อเซิร์ฟเวอร์ (ไม่บันทึก)"** → ขึ้น "ทดสอบผ่าน"
7. กด ‹ กลับมาหน้าเว็บ; ตรวจว่าแถบด้านบนขึ้น **"ตัวรับเงินเข้า: พร้อม ✓"**
8. ในแอป Krungthai NEXT ตรวจว่าเปิดแจ้งเตือนเงินเข้าไว้ (และห้ามปิด notification ของ KTB NEXT)
9. ทดสอบจริง: โอนเข้าบัญชีร้าน 1 บาท → ควรมองเห็น log "ส่งสำเร็จ" และหน้าแรกประกาศเองภายใน ~10 วินาที

### ข้อจำกัดที่ต้องรู้

- **อ่านได้เฉพาะ notification ของแอป KTB NEXT** — LINE (Krungthai Connext) อ่านไม่ได้, KTB ไม่มีอีเมลเงินเข้าฟรี, SMS Alert มีค่าบริการรายเดือน
- บอกได้แค่ว่า "มียอดเงินเข้าจริงในบัญชี" — **ไม่ได้ตรวจว่าสลิปที่ลูกค้าโชว์เป็นของจริง**
- มือถือต้องเปิด + ต่อเน็ต; ถ้าระบบฆ่าแอปหรือผู้ใช้ "บังคับหยุด" จะไม่แจ้ง
- ถ้า KTB เปลี่ยนรูปแบบข้อความ ต้องปรับ `AmountParser.java` แล้ว build ใหม่
- ยังมีทางสำรอง: กด **＋ เพิ่มเงินเข้า** กรอกเองได้เสมอ

## ยอดเงินรวมวันนี้

หน้าแรกมีการ์ด **"ยอดเงินรวมวันนี้"** (ตัวเลขใหญ่ สีหลัก) ใต้แบนเนอร์เสียง

- ยอดคำนวณฝั่งเซิร์ฟเวอร์จาก `action=summary` โดยใช้เขตเวลา `Asia/Bangkok` ของสคริปต์
  → ถูกต้องแม้หน้าเว็บแสดงรายการเพียง 100 รายการล่าสุด
- นับเฉพาะรายการที่ `createdAt` เป็นวันนี้ พร้อมจำนวนรายการกำกับ ("N รายการวันนี้")
- อัปเดตทุกครั้งที่ poll (8 วินาที) และเมื่อกด "ซิงก์ธนาคาร"
- **รีเซ็ทเองอัตโนมัติทุกเที่ยงคืน (Asia/Bangkok)** — ไม่ต้องทำอะไร
- **รีเซ็ทกลางวันได้:** กดปุ่ม `รีเซ็ท` ที่การ์ดยอดรวม → **กดอีกครั้ง**ภายใน 4 วินาทีเพื่อยืนยัน (กันกดพลาด)
  → ยอดและจำนวนรายการเริ่มนับใหม่ตั้งแต่ตอนนั้น ข้อความใต้ยอดจะแสดง "นับตั้งแต่ HH:mm น."
- **คืนค่าได้:** หลังรีเซ็ทจะมีปุ่ม `คืนค่า` (undo) กดแล้วกลับไปนับยอดทั้งวันตามเดิม
- เวลารีเซ็ทเก็บใน Script Properties `TOTAL_RESET_AT` (ฝั่งเซิร์ฟเวอร์) และ **ไม่ลบ/แก้ข้อมูลในชีต**
  → รายการเงินเข้าในฟีดด้านล่างยังอยู่ครบ เสียงยังพูดแค่ "เงินเข้า … บาท" ตามเดิม
- ถ้า backend รุ่นเก่ายังไม่มี `summary` หน้าเว็บจะคำนวณยอดจากรายการที่ดึงมาให้แทนอัตโนมัติ

## แอป Android (APK)

ตั้งแต่ **1.1.0** แอปเป็น **WebView wrapper** ที่โหลดหน้าเว็บ GitHub Pages เต็มจอ
และมี **NotificationListenerService** อ่าน notification ของ Krungthai NEXT อยู่ในตัว
→ ติดตั้งแอปเดียวจบ (ตรวจสลิป + เพิ่มเงินเข้า + ตั้งค่าเสียง + ตัวรับเงินเข้าอัตโนมัติ)
และ**อัปเดตตามเว็บอัตโนมัติ**เมื่อ push ขึ้น GitHub

| รายการ | ค่า |
|---|---|
| Package ID | `th.coffeesukjai.slipverify` |
| Version | 1.2.3 (versionCode 7) |
| Android ที่รองรับ | 7.0 ขึ้นไป (minSdk 24, targetSdk 34) |
| URL ที่เปิด | `https://smartzzz78.github.io/Real-Time-Voice-Notification-Application-for-Payment-Processing/index.html` |
| ไฟล์ติดตั้ง | `payvox-v1.2.3.apk` (เผยแพร่ใน GitHub Releases) |
| ซอร์ส Android | เก็บเป็นส่วนตัวนอก repository สาธารณะ |

- รุ่น 1.0.0 (TWA / Chrome engine) ถูกแทนที่แล้ว — เก็บ `coffee-slip-v1.0.0.apk` ไว้เป็นรุ่นย้อนกลับได้
- ไฟล์ APK / AAB / keystore / รหัสผ่าน **ไม่ได้อยู่ใน repo นี้** (อยู่ใน `.gitignore`)
  เก็บแยกที่ `Documents\PayVox\` พร้อม `README-APK.txt`
- **keystore ห้ามหายและห้าม commit** — ถ้าหายจะอัปเดตทับแอปเดิมไม่ได้อีก
- ไม่ต้องใช้ `assetlinks.json` แล้ว (ไม่ใช่ TWA) แต่ยังเก็บไว้ได้ไม่เสียหาย
- WebView ในแอปตั้ง `mediaPlaybackRequiresUserGesture(false)` → เสียงกริ่ง/เสียงประกาศจากเครื่องเล่นเองได้
- หน้าเว็บใช้ **Web Speech API (`speechSynthesis`, `th-TH`)** โดยตรง — ไม่มี AI TTS / Gemini
  ส่วนตัวรับแจ้งเตือน KTB ใน APK ใช้ **Android TextToSpeech** ของตัวแอปเอง (คนละทางกับหน้าเว็บ)
- build ใหม่เฉพาะเมื่อเปลี่ยนชื่อแอป / ไอคอน / URL เว็บ / token / ตัวอ่านยอด
  (แก้โค้ดเว็บไม่ต้อง build ใหม่):

```powershell
cd "C:\Users\PC22\Documents\PayVox\app-merged"
powershell -ExecutionPolicy Bypass -File .\make-icon.ps1   # เฉพาะเมื่ออยากเปลี่ยนไอคอน
powershell -ExecutionPolicy Bypass -File .\build.ps1
```

## โครงสร้างข้อมูลใน Sheets

ชีตแรกของสเปรดชีตที่ผูกกับสคริปต์ (header สร้างให้อัตโนมัติ):
`id | ref | customer | bank | amount | note | fileName | fileUrl | createdAt`

- `id` — timestamp ใช้ตรวจจับรายการใหม่
- `ref` — รหัสอ้างอิงบนสลิป
- `customer` / `bank` — ชื่อลูกค้า / ธนาคาร
- `amount` — ยอดเงิน
- `fileName` / `fileUrl` — ไฟล์สลิปบน Google Drive
- `createdAt` — เวลาที่บันทึก

## การตั้งค่าขั้นสูง

เก็บค่าใน **Script Properties** (Apps Script → Project Settings → Script properties):

| Key | ความหมาย |
|---|---|
| `SPREADSHEET_ID` | ID ของสเปรดชีตที่ใช้เป็น DB |
| `SHEET_NAME` | ชื่อชีต (ค่าที่ตั้งไว้ `รายการ`) |
| `DRIVE_FOLDER_ID` | ID ของโฟลเดอร์ Drive สำหรับเก็บไฟล์ |

## แก้ปัญหาที่พบบ่อย

- **`clasp login --status` ขึ้นว่า not logged in** → รัน `.\scripts\login.ps1` ใหม่
- **หน้าเว็บขึ้น `ยังไม่ได้ตั้งค่า API_URL`** → รัน `set-api-url.ps1` แล้ว push ใหม่
- **เรียก API ได้ 403 "ต้องมีสิทธิ์เข้าถึง" (You need access)** → สคริปต์ยังไม่ได้รับอนุญาต
  ให้เปิด Web App URL ด้วยเบราว์เซอร์ที่ล็อกอินบัญชีเจ้าของ → Advanced → Go to project → Allow (1 ครั้งพอ)
- **อัปเดตโค้ดแล้วหน้าเว็บยังเป็นของเก่า** → GitHub Pages แคชไฟล์ไว้ ~10 นาที
  กด Ctrl+F5 (hard refresh) หรือรอสักครู่แล้วรีเฟรชใหม่
- **ไอคอนโชว์เป็นชื่อ เช่น `volume_up`** → ตรวจว่า `fonts/material-symbols.css?v=1` โหลดได้ (ไฟล์อยู่ใน repo แล้ว ไม่พึ่ง Google Fonts)
  ถ้าเพิ่มไอคอนใหม่ ต้องสร้าง woff2 subset ให้ครบรายการในคอมเมนต์หัวไฟล์ CSS
- **Pages deploy ขึ้น `No artifacts named "github-pages"`** → workflow มี retry รอ artifact 60 วิและใช้ actions เวอร์ชันใหม่แล้ว
  ถ้ายังเจอให้ rerun job เดิม 1 ครั้ง (URL เว็บไม่เปลี่ยน)
- **พิมพ์แถวใน Google Sheet เองแล้วไม่มีเสียง** → ไม่จำเป็นต้องใส่คอลัมน์ `id`
  แต่ต้องมีข้อมูลอย่างน้อย 1 ช่อง (ชื่อ/ยอด/หมายเหตุ) และยอดเงินพิมพ์เป็นตัวเลขเท่านั้น เช่น `1500` หรือ `1,500`
- **ไม่มีเสียงพูด** → เบราว์เซอร์ (โดยเฉพาะ iOS) ต้องแตะหน้าจอก่อน 1 ครั้งเพื่อปลดล็อกเสียง
- **ไม่มีเสียงพูดภาษาไทย** → ตรวจว่าเครื่องมีเสียงไทย install ไว้แล้ว (Android: Settings → Text-to-speech → Install voice data)
  และแตะหน้าจอ 1 ครั้งก่อนทดสอบเสียง
- **ไฟล์เปิดจากลิงก์ไม่ได้** → organization อาจห้ามแชร์สาธารณะ ให้แชร์โฟลเดอร์ `App Uploads` เอง
- **`npm` ใช้ไม่ได้ใน PowerShell** → ตั้ง execution policy: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
