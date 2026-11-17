# กาแฟสดสุขใจ (Slip Verify)

แอปหน้าร้านสำหรับร้านกาแฟ ใช้ **GitHub Pages** เป็น frontend และ **Google Apps Script** เป็น backend
โดยใช้ **Google Sheets** เป็นฐานข้อมูล และ **Google Drive** เก็บไฟล์แนบ

แอปเหลือ 3 หน้าที่ใช้จริง (เมนูล่างมี 2 แท็บ):

| หน้า | ไฟล์ | คำอธิบาย |
|---|---|---|
| ตรวจสลิป & เงินเข้า (หน้าหลัก) | `docs/index.html` | ฟีดรายการเงินเข้าจาก Google Sheets + **อ่านออกเสียงยอดเงินเข้าอัตโนมัติ** (poll ทุก 15 วิ) + ปุ่มยืนยันสลิป |
| ตั้งค่าเสียง | `docs/settings-voice.html` | เลือกเสียงพากย์ AI (persona), ทดสอบฟังเสียง, วางคีย์ Gemini |
| เพิ่มเงินเข้า | `docs/money-in.html` | ฟอร์มบันทึกยอดรับเงิน บันทึกลง Sheets + อัปโหลดรูปสลิปขึ้น Drive (เปิดจากลิงก์ "＋ เพิ่มเงินเข้า" ในการ์ดรายการล่าสุด ไม่ได้อยู่ในเมนูล่าง) |

> หมายเหตุ: หน้าเดโม/ของเสริมเดิม (`dashboard.html`, `settings-shift.html`, `counter-live.html`) ถูกลบออกแล้ว
> — ถ้าต้องการกลับมา ดูได้จาก history ของ git

เสียงประกาศพูดแค่ยอดเงิน เช่น **"เงินเข้า 150 บาท"** (ไม่พูดชื่อลูกค้า) ส่วนชื่อลูกค้ายังแสดงบนจอตามปกติ


## ลิงก์โปรเจกต์

| ส่วน | ลิงก์ |
|---|---|
| GitHub repo | https://github.com/smartzzz78/sheet-drive-app |
| เว็บไซต์ (GitHub Pages) | https://smartzzz78.github.io/sheet-drive-app/ |
| Apps Script editor | https://script.google.com/d/1t4YAMXsn4pqoQa8jigMv1xrNVvN1iGYKn7v7IrjWXijtryUvjvsoFuxh/edit |
| Web App endpoint | https://script.google.com/macros/s/AKfycbxvcU7CAxGGqlEU5mZxl_OIrbDIPqM7fv8Jen--ijrApeZWOlbRZrkBhAsyDm-xja7O/exec |

```
.
├─ docs/                 # Frontend (GitHub Pages เสิร์ฟจากโฟลเดอร์นี้)
│  ├─ index.html         # หน้าหลัก: ตรวจสลิป + อ่านเสียงยอดเงินเข้า
│  ├─ settings-voice.html # ตั้งค่าเสียง: persona, ทดสอบเสียง, คีย์ Gemini
│  ├─ money-in.html      # ฟอร์มบันทึกเงินเข้า (เปิดจากลิงก์ในหน้าแรก)
│  └─ js/
│     ├─ config.js       # ใส่ Web App URL ที่นี่
│     ├─ api.js          # ตัวเรียก API
│     ├─ ai-voice.js     # เสียง AI (Gemini TTS) + fallback เสียงระบบ
│     └─ app.js          # ดึงข้อมูล + อ่านเสียงยอดเงินเข้า (ใช้ใน index.html)
├─ backend/              # Apps Script (clasp)
│  ├─ appsscript.json
│  ├─ Code.gs            # doGet/doPost + ping/setupDatabase()
│  ├─ Sheets.gs          # CRUD กับ Google Sheets
│  ├─ Drive.gs           # อัปโหลดไฟล์ขึ้น Drive
│  └─ Voice.gs           # Gemini TTS + เก็บ API key (Script Properties)
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

1. เปิด **Web App URL** ด้วยเบราว์เซอร์ที่ล็อกอินบัญชีเจ้าของ (smartzzz2851@gmail.com)
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
gh repo create sheet-drive-app --public --source=. --remote=origin --push
```

เปิด GitHub Pages ให้เสิร์ฟจาก `main` / `docs`:

```powershell
gh api -X POST repos/{owner}/sheet-drive-app/pages `
  -f "source[branch]=main" -f "source[path]=/docs"
```

หรือทำผ่านเว็บ: **Settings → Pages → Source: Deploy from a branch → main / docs → Save**

เว็บไซต์จะอยู่ที่ `https://<username>.github.io/sheet-drive-app/`

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
| `summary` | GET | `?action=summary` | `{ date, todayCount, todayTotal, totalCount, totalAmount }` — ยอดรวมวันนี้/ทั้งหมด (คำนวณฝั่งเซิร์ฟเวอร์ ใช้กับยอดเงินรวมบนหน้าจอ) |
| `create` | POST | `{ action:'create', payload:{ amount, customer, bank, ref, note, fileName, fileUrl } }` | record ที่สร้าง |
| `notify` | POST | `{ action:'notify', payload:{ token, amount, ref?, customer?, bank?, note?, dryRun? } }` | รับเงินเข้าอัตโนมัติจากแอป Android (ดูหัวข้อ "เงินเข้าอัตโนมัติ") — `{ duplicate, record }` |
| `upload` | POST | `{ action:'upload', payload:{ filename, mimeType, base64 } }` | ข้อมูลไฟล์บน Drive |
| `voiceConfig` | GET | `?action=voiceConfig` | `{ hasKey, model, voice }` — สถานะเสียง AI (ไม่เปิดคีย์) |
| `setVoiceConfig` | POST | `{ action:'setVoiceConfig', payload:{ apiKey?, voice?, model? } }` | ตั้งคีย์ / โหมดเสียง AI |
| `speak` | POST | `{ action:'speak', payload:{ text, voice?, model? } }` | `{ audioBase64, mimeType }` เสียงจาก Gemini TTS |

หมายเหตุ: frontend ส่ง POST ด้วย `Content-Type: text/plain` เพื่อเลี่ยง CORS preflight
เพราะ Apps Script ไม่รองรับ request method `OPTIONS`

## เสียง AI (Gemini TTS)

เสียงประกาศเงินเข้าทั้งหมดสร้างด้วย **Gemini TTS** (โมเดล `gemini-3.8-flash-tts`) — เสียงหญิงไทยสดใสกระตือรือร้นคล้ายตัวอย่างที่ให้มา

- **คีย์ API เก็บบนเซิร์ฟเวอร์เท่านั้น** (Script Properties `GEMINI_API_KEY`) — ไม่มีคีย์ใน frontend/repo
- ตั้งคีย์ครั้งแรกได้จากหน้า **ตั้งค่าเสียง** (การ์ด "คีย์ Gemini (เสียง AI)") โดยวางคีย์แล้วกดบันทึก
  หรือตั้งเองใน Apps Script → Project Settings → Script properties → `GEMINI_API_KEY`
- เมื่อมีคีย์อยู่แล้ว การเปลี่ยนคีย์ผ่านหน้าเว็บจะถูกปฏิเสธ (กันคนอื่นเขียนทับ) — ต้องลบ `GEMINI_API_KEY` ใน Script Properties ก่อน
- เลือกน้ำเสียงได้จากการ์ด persona ในหน้า **ตั้งค่าเสียง** แล้วระบบจะใช้เสียงนั้นประกาศทุกหน้า:

| Persona | โหมดเสียง Gemini | ลักษณะ |
|---|---|---|
| น้องมะลิ (แนะนำ) | Zephyr | หญิง สดใส กระตือรือร้น — ตรงกับตัวอย่างมากที่สุด |
| น้องใบเฟิร์น | Aoede | หญิง หวาน นุ่มนวล |
| พี่กานต์ | Orus | ชาย หนักแน่น น่าเชื่อถือ |
| น้องมีนา | Leda | หญิง สดใส กระตุ้นเต้น |

- ถ้าเรียก AI ไม่สำเร็จ (ไม่มีคีย์/โควต้าหมด/ออฟไลน์) ระบบจะใช้เสียงระบบ (Web Speech API) พูดแทนอัตโนมัติ

### เลือกแหล่งเสียง: AI หรือเสียงเครื่อง

หน้า **ตั้งค่าเสียง** มีการ์ด **"แหล่งเสียงที่ใช้ประกาศ"** ให้เลือก 2 แบบ

| ตัวเลือก | พฤติกรรม |
|---|---|
| **เสียง AI (Gemini)** — ค่าเริ่มต้น | เรียก `action=speak` ไปสร้างเสียงจาก Gemini แล้วเล่น (กินเน็ต/โควตา) ถ้าล้มเหลวจะสลับเป็นเสียงเครื่องให้อัตโนมัติ |
| **เสียงเครื่อง** | ใช้ `speechSynthesis` ของอุปกรณ์ทันที — **ไม่เรียก API เลย** ไม่กินโควตา เหมาะกับตอนเน็ตไม่ดีหรือโควตาหมด |

- ค่าถูกจำไว้ **แยกตามเครื่อง/เบราว์เซอร์** (`localStorage` คีย์ `voiceSource`) — เปลี่ยนที่มือถือเครื่องหนึ่งไม่กระทบเครื่องอื่น
- ตัวเลือกนี้ใช้ทั้งปุ่ม "ทดสอบฟังเสียง" และเสียงประกาศจริงในหน้าแรก
- ถ้าเลือกเสียงเครื่องแต่เครื่องยังไม่มีเสียงภาษาไทย หน้าตั้งค่าจะขึ้นคำเตือนให้ติดตั้งเสียงไทยใน Settings → Text-to-speech

## วิธีทำงานของ "อ่านเสียงยอดเงินเข้า"

1. เปิดหน้า `index.html` (แท็บ "ตรวจสลิป") ทิ้งไว้ที่เคาน์เตอร์
2. มีรายการใหม่เข้ามา (แอป KTB → เงินเข้า ส่งอัตโนมัติ หรือเพิ่มผ่านหน้า "เพิ่มเงินเข้า" หรือพิมพ์ใน Google Sheet ตรง ๆ)
3. ระบบ poll ทุก 8 วินาที → เจอรายการใหม่ → เสียงกริ่ง "ding-dong" + **เสียงที่เลือกไว้** (เสียง AI Gemini หรือเสียงเครื่อง ตามที่ตั้งในหน้า "ตั้งค่าเสียง") พูด
   *"เงินเข้า 150 บาท"* (พูดแค่ยอดเงิน ไม่พูดชื่อลูกค้า — แต่ toast และแบนเนอร์บนจอแสดงชื่อลูกค้าด้วย)
   (โหมดเสียง AI: ถ้า AI ใช้ไม่ได้ จะเปลี่ยนเป็นเสียงระบบอัตโนมัติ)

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
| Version | 1.2.0 (versionCode 4) |
| Android ที่รองรับ | 7.0 ขึ้นไป (minSdk 24, targetSdk 34) |
| ไฟล์ติดตั้ง | `Documents\coffee-slip-apk\kaafae-sukjai-v1.2.0.apk` (~41 KB) |
| ซอร์สโค้ด | `Documents\coffee-slip-apk\app-merged\` — **อยู่นอก repo นี้** (มี token ฝังอยู่) |
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

### วิธีติดตั้ง (ทำครั้งเดียว)

1. คัดลอก `kaafae-sukjai-v1.2.0.apk` ไปที่มือถือเคาน์เตอร์ แล้วเปิดไฟล์ → ติดตั้งทับรุ่นเดิมได้เลย
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
- ถ้า backend รุ่นเก่ายังไม่มี `summary` หน้าเว็บจะคำนวณยอดจากรายการที่ดึงมาให้แทนอัตโนมัติ
- เป็นการแสดงบนจอเท่านั้น — เสียงยังพูดแค่ "เงินเข้า … บาท" ตามเดิม

## แอป Android (APK)

ตั้งแต่ **1.1.0** แอปเป็น **WebView wrapper** ที่โหลดหน้าเว็บ GitHub Pages เต็มจอ
และมี **NotificationListenerService** อ่าน notification ของ Krungthai NEXT อยู่ในตัว
→ ติดตั้งแอปเดียวจบ (ตรวจสลิป + เพิ่มเงินเข้า + ตั้งค่าเสียง + ตัวรับเงินเข้าอัตโนมัติ)
และ**อัปเดตตามเว็บอัตโนมัติ**เมื่อ push ขึ้น GitHub

| รายการ | ค่า |
|---|---|
| Package ID | `th.coffeesukjai.slipverify` |
| Version | 1.2.0 (versionCode 4) |
| Android ที่รองรับ | 7.0 ขึ้นไป (minSdk 24, targetSdk 34) |
| URL ที่เปิด | `https://smartzzz78.github.io/sheet-drive-app/index.html` |
| ไฟล์ติดตั้ง | `Documents\coffee-slip-apk\kaafae-sukjai-v1.2.0.apk` (~41 KB) |
| ซอร์สโค้ด | `Documents\coffee-slip-apk\app-merged\` (นอก repo) |

- รุ่น 1.0.0 (TWA / Chrome engine) ถูกแทนที่แล้ว — เก็บ `coffee-slip-v1.0.0.apk` ไว้เป็นรุ่นย้อนกลับได้
- ไฟล์ APK / AAB / keystore / รหัสผ่าน **ไม่ได้อยู่ใน repo นี้** (อยู่ใน `.gitignore`)
  เก็บแยกที่ `Documents\coffee-slip-apk\` พร้อม `README-APK.txt`
- **keystore ห้ามหายและห้าม commit** — ถ้าหายจะอัปเดตทับแอปเดิมไม่ได้อีก
- ไม่ต้องใช้ `assetlinks.json` แล้ว (ไม่ใช่ TWA) แต่ยังเก็บไว้ได้ไม่เสียหาย
- WebView ในแอปตั้ง `mediaPlaybackRequiresUserGesture(false)` → เสียงกริ่ง/เสียง AI เล่นเองได้
- "เสียงเครื่อง" ในแอปใช้ **Android TextToSpeech** ผ่านสะพาน `window.AndroidVoice` (ไม่พึ่ง speechSynthesis ของ WebView)
- build ใหม่เฉพาะเมื่อเปลี่ยนชื่อแอป / ไอคอน / URL เว็บ / token / ตัวอ่านยอด
  (แก้โค้ดเว็บไม่ต้อง build ใหม่):

```powershell
cd "C:\Users\PC22\Documents\coffee-slip-apk\app-merged"
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
| `SHEET_NAME` | ชื่อชีต (ค่าเริ่มต้น `Records`) |
| `DRIVE_FOLDER_ID` | ID ของโฟลเดอร์ Drive สำหรับเก็บไฟล์ |
| `GEMINI_API_KEY` | คีย์ Gemini สำหรับเสียง AI (ตั้งผ่านหน้าเว็บได้) |
| `TTS_MODEL` | โมเดล TTS (ค่าเริ่มต้น `gemini-3.8-flash-tts`) |
| `TTS_VOICE` | โหมดเสียง เช่น `Zephyr` (ค่าเริ่มต้น) |

## แก้ปัญหาที่พบบ่อย

- **`clasp login --status` ขึ้นว่า not logged in** → รัน `.\scripts\login.ps1` ใหม่
- **หน้าเว็บขึ้น `ยังไม่ได้ตั้งค่า API_URL`** → รัน `set-api-url.ps1` แล้ว push ใหม่
- **เรียก API ได้ 403 "ต้องมีสิทธิ์เข้าถึง" (You need access)** → สคริปต์ยังไม่ได้รับอนุญาต
  ให้เปิด Web App URL ด้วยเบราว์เซอร์ที่ล็อกอินบัญชีเจ้าของ → Advanced → Go to project → Allow (1 ครั้งพอ)
- **อัปเดตโค้ดแล้วหน้าเว็บยังเป็นของเก่า** → GitHub Pages แคชไฟล์ไว้ ~10 นาที
  กด Ctrl+F5 (hard refresh) หรือรอสักครู่แล้วรีเฟรชใหม่
- **พิมพ์แถวใน Google Sheet เองแล้วไม่มีเสียง** → ไม่จำเป็นต้องใส่คอลัมน์ `id`
  แต่ต้องมีข้อมูลอย่างน้อย 1 ช่อง (ชื่อ/ยอด/หมายเหตุ) และยอดเงินพิมพ์เป็นตัวเลขเท่านั้น เช่น `1500` หรือ `1,500`
- **ไม่มีเสียงพูด** → เบราว์เซอร์ (โดยเฉพาะ iOS) ต้องแตะหน้าจอก่อน 1 ครั้งเพื่อปลดล็อกเสียง
- **เสียง AI ใช้ไม่ได้ (เป็นเสียงระบบแทน)** → ตรวจการ์ด "AI Voice API Key" ในหน้าตั้งค่าว่าขึ้น "ตั้งค่าแล้ว" หรือยัง
  ถ้ายังไม่ได้ตั้ง ให้วางคีย์ Gemini API แล้วกดบันทึก (คีย์เก็บบนเซิร์ฟเวอร์ ไม่แสดงบนหน้าเว็บ)
  ถ้าขึ้น "ตั้งค่าแล้ว" แต่ยังเป็นเสียงระบบ อาจเป็นโควต้าคีย์หมดหรือเน็ตล่ม — ดู error ใน console (F12)
  ถ้า console ขึ้น `HTTP 429: You exceeded your current quota` → โควต้า Gemini ของคีย์นี้หมดชั่วคราว
  (มี free quota ต่อวัน/ต่อนาที) ให้รอสักครู่แล้วลองใหม่ หรือตั้ง billing ที่ Google AI Studio
  ระหว่างรอ ระบบจะพูดด้วยเสียงระบบแทนอัตโนมัติ (เป็นพฤติกรรมที่ออกแบบไว้)
- **อยากเปลี่ยนคีย์ Gemini ใหม่** → ไป Apps Script → Project Settings → Script properties
  ลบ `GEMINI_API_KEY` ออกก่อน แล้วค่อยบันทึกคีย์ใหม่ผ่านหน้าเว็บได้
- **ไฟล์เปิดจากลิงก์ไม่ได้** → organization อาจห้ามแชร์สาธารณะ ให้แชร์โฟลเดอร์ `App Uploads` เอง
- **`npm` ใช้ไม่ได้ใน PowerShell** → ตั้ง execution policy: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
