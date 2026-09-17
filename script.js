let selectedCond = '-';
let selectedSim = '-';
const form = document.getElementById('storeForm');
const STORAGE_KEY = 'store_form_auto_save_data';

// กำหนดวันที่ปัจจุบันอัตโนมัติ ไม่เกี่ยวกับระบบบันทึก/รีเซ็ต
// ใช้วันที่ตามเวลาเครื่อง (ไม่ใช้ toISOString เพราะเป็น UTC ทำให้ช่วงเที่ยงคืน-06:59 ชี้วันเมื่อวาน)
function setDefaultDate() {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const dateInput = document.getElementById('inputDate');
    if (dateInput.value !== today) {
        dateInput.value = today;
    }
}

// -------------------------------------------------------------
// ระบบบันทึก โหลด และล้างข้อมูลอัตโนมัติ
// -------------------------------------------------------------
function saveData() {
    const formData = {};
    const elements = form.querySelectorAll('input, textarea, select');
    
    elements.forEach(el => {
        if (el.name && el.name !== 'date') {
            formData[el.name] = el.value;
        }
    });

    formData['selectedCond'] = selectedCond;
    formData['selectedSim'] = selectedSim;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
}

function loadData() {
    setDefaultDate(); // ตั้งค่าวันที่เริ่มต้น

    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return;

    try {
        const formData = JSON.parse(savedData);
        const elements = form.querySelectorAll('input, textarea, select');

        elements.forEach(el => {
            if (el.name && el.name !== 'date' && formData[el.name] !== undefined) {
                el.value = formData[el.name];
            }
        });

        if (formData['selectedCond']) {
            selectCond(formData['selectedCond'], false);
        }
        if (formData['selectedSim']) {
            selectSim(formData['selectedSim'], false);
        }
    } catch (e) {
        console.error("Failed to load auto-saved data", e);
    }
}

function resetAllData() {
    // 1. ล้างค่า Input/Textarea ทั้งหมด ยกเว้นช่องวันที่ (วันที่เป็นอัตโนมัติ ไม่ผูกกับปุ่มรีเซ็ต)
    form.querySelectorAll('input, textarea, select').forEach(el => {
        if (el.id !== 'inputDate') {
            el.value = '';
        }
    });

    // 2. คืนค่าการเลือกปุ่ม
    selectedCond = '-';
    selectedSim = '-';
    document.querySelectorAll('.btn-opt').forEach(btn => btn.classList.remove('active'));

    // 3. ล้าง Textarea สรุปผล
    document.getElementById('output').value = '';

    // 4. ลบข้อมูลจาก Storage
    localStorage.removeItem(STORAGE_KEY);
}

// -------------------------------------------------------------
// ฟังก์ชันเลือกสถานะปุ่ม
// -------------------------------------------------------------
function selectCond(val, autoSave = true) {
    if (selectedCond === val) {
        selectedCond = '-';
    } else {
        selectedCond = val;
    }
    
    document.getElementById('btn_m1').classList.toggle('active', selectedCond === 'มือ 1');
    document.getElementById('btn_m2').classList.toggle('active', selectedCond === 'มือ 2');
    if (autoSave) saveData();
}

function selectSim(val, autoSave = true) {
    if (selectedSim === val) {
        selectedSim = '-';
    } else {
        selectedSim = val;
    }

    document.getElementById('btn_ais').classList.toggle('active', selectedSim === 'AIS');
    document.getElementById('btn_true').classList.toggle('active', selectedSim === 'True');
    document.getElementById('btn_dtac').classList.toggle('active', selectedSim === 'dtac');
    if (autoSave) saveData();
}

const getVal = (name) => form.elements[name] ? form.elements[name].value.trim() || '-' : '-';

function formatDate(v) {
    if (!v || v === '-') return '-';
    const parts = v.split('-');
    if (parts.length !== 3) return v;
    const [y, m, d] = parts;
    return `${parseInt(d)}/${parseInt(m)}/${parseInt(y) + 543}`;
}

// -------------------------------------------------------------
// เงินดาวน์ (คำนวณอัตโนมัติ = ยอดที่ร้านจัด x เรท %)
// -------------------------------------------------------------
function parseNumber(v) {
    if (!v || v === '-') return null;
    const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? null : n;
}

function updateDownAuto() {
    const amt = parseNumber(form.elements['p_store_amt'].value);
    const rate = parseNumber(form.elements['p_store_rate'].value);
    if (amt !== null && rate !== null) {
        form.elements['p_down'].value =
            (amt * rate / 100).toLocaleString('th-TH', { maximumFractionDigits: 2 });
    } else {
        form.elements['p_down'].value = '';
    }
}

// -------------------------------------------------------------
// สร้างข้อความสรุป
// -------------------------------------------------------------
function buildText() {
    const pRate = getVal('p_rate');
    const pPeriod = getVal('p_period');
    let pInstallment = '-';
    if (pRate !== '-' || pPeriod !== '-') {
        pInstallment = `${pRate} * ${pPeriod}`;
    }

    const pStoreAmt = getVal('p_store_amt');
    const pStoreRate = getVal('p_store_rate');
    let pStoreFull = '-';
    if (pStoreAmt !== '-' || pStoreRate !== '-') {
        pStoreFull = `${pStoreAmt} & ${pStoreRate}${pStoreRate.includes('%') ? '' : '%'}`;
    }

    const txt = `✅แบบฟอร์มการกรอกข้อมูลร้านค้า
( ✨รบกวนร้านค้ากรอกข้อมูลให้ครบถ้วนเพื่อความรวดเร็วในการตรวจสอบ ✨)

1️⃣ แนบรูปบัตรประชาชนลูกค้า & รูปลูกค้าถ่ายคู่บัตร ‼️

🗓️วันที่ : ${formatDate(getVal('date'))}
2️⃣ ชื่อ-สกุล : ${getVal('name')}
ชื่อเล่น : ${getVal('nickname')}

3️⃣ เบอร์โทรลูกค้า : ${getVal('phone')}
ไอดี ไลน์ ลูกค้า : ${getVal('line')}

4️⃣ ที่อยู่ ปัจจุบันของลูกค้า : ${getVal('addr')}

5️⃣ ที่ทำงานลูกค้า ดังนี้ (แนบเอกสารหลักฐานการทำงานเลยนะคะ)👇🏻
ชื่อบริษัท/ร้าน : ${getVal('work_name')}
ที่อยู่บริษัท : ${getVal('work_addr')}
เบอร์โทรติดต่อที่ทำงาน : ${getVal('work_phone')}
ตำแหน่ง / หน้าที่ : ${getVal('work_pos')}
เงินเดือน : ${getVal('salary')}

6️⃣ บุคคลอ้างอิง (ต้องเป็นพ่อ /แม่ /ญาติ ❗️)👇🏻
อ้างอิง 1 ชื่อ - สกุล : ${getVal('r1_name')}
ชื่อเล่น : ${getVal('r1_nick')}
เบอร์โทร : ${getVal('r1_tel')}
อาชีพ : ${getVal('r1_job')}
ความสัมพันธ์ : ${getVal('r1_rel')}

อ้างอิง 2 ชื่อ - สกุล : ${getVal('r2_name')}
ชื่อเล่น : ${getVal('r2_nick')}
เบอร์โทร : ${getVal('r2_tel')}
อาชีพ : ${getVal('r2_job')}
ความสัมพันธ์ : ${getVal('r2_rel')}

7️⃣ คนค้ำประกัน (แนบบัตรประชาชนด้วยนะคะ ❗️)👇🏻
ชื่อ - สกุล : ${getVal('g_name')}
ชื่อเล่น : ${getVal('g_nick')}
เบอร์โทร : ${getVal('g_tel')}
อาชีพ : ${getVal('g_job')}
รายได้ : ${getVal('g_inc')}
ความสัมพันธ์ : ${getVal('g_rel')}

8️⃣ แนบ Link Facebook / TikTok / IG 👇🏻
${getVal('social')}

9️⃣ รายละเอียดสินค้าที่ผ่อน ระบุทั้งหมดให้ชัดเจน⤵️
รุ่น & ความจุ : ${getVal('p_model')}
สีเครื่อง : ${getVal('p_color')}
มือ 1&2 (โปรดระบุ) : ${selectedCond}
เงินดาวน์ : ${getVal('p_down')}
เรทผ่อน/เดือน * จำนวนงวด : ${pInstallment}
ยอดที่ร้านจัด & เรท % : ${pStoreFull}
ลูกค้าใช้ซิมอะไร : ${selectedSim}

📲ข้อมูลที่สามารถส่งตามหลังได้ เมื่อผ่านการอนุมัติแล้ว ✅
1️⃣ รูปลูกค้าถือเครื่อง+บัตรปชช และ เลขหลังบัตรประชาชน
2️⃣รูปเครื่องลูกค้า(ด้านหลัง)
3️⃣รูปหน้าเลขอีมี่
4️⃣รูปหน้าเลขเครื่อง`;

    document.getElementById('output').value = txt;
    return txt;
}

// -------------------------------------------------------------
// ผูก Event Listeners ผ่าน JavaScript ทันทีที่โหลด DOM
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    updateDownAuto();

    // ให้วันที่เป็นวันนี้เสมอ และอัปเดตเองทันทีที่ขึ้นวันใหม่ (เปิดหน้าจอค้างไว้ก็อัปเดต)
    setDefaultDate();
    setInterval(setDefaultDate, 30 * 1000);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) setDefaultDate();
    });

    // คำนวณเงินดาวน์อัตโนมัติเมื่อพิมพ์ยอดที่ร้านจัดหรือเรท %
    form.elements['p_store_amt'].addEventListener('input', updateDownAuto);
    form.elements['p_store_rate'].addEventListener('input', updateDownAuto);

    // ผูกปุ่มล้างข้อมูล
    document.getElementById('btnResetTop').addEventListener('click', resetAllData);

    // ผูกปุ่มเลือกสถานะ
    document.getElementById('btn_m1').addEventListener('click', () => selectCond('มือ 1'));
    document.getElementById('btn_m2').addEventListener('click', () => selectCond('มือ 2'));
    
    document.getElementById('btn_ais').addEventListener('click', () => selectSim('AIS'));
    document.getElementById('btn_true').addEventListener('click', () => selectSim('True'));
    document.getElementById('btn_dtac').addEventListener('click', () => selectSim('dtac'));

    // ผูกปุ่มสรุปข้อมูล
    document.getElementById('btnBuildText').addEventListener('click', buildText);

    // บันทึกข้อมูลอัตโนมัติเมื่อมีการพิมพ์
    form.addEventListener('input', saveData);
    form.addEventListener('change', saveData);
});