import {
    ActivityIndicator,
    Animated,
    Easing,
    FlatList,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Inflate, DecodeUTF8, inflateSync, strFromU8 } from 'fflate';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useNavigation, useRoute } from '@react-navigation/native';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import * as XLSX from 'xlsx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import colors from '../../CommonFiles/Colors';
import { ENDPOINTS } from '../../CommonFiles/Constant'; // 👈 apne path ke hisab se change karo
import { unzip } from 'react-native-zip-archive';

const CHUNK_SIZE = 5000; // ek request mein kitni rows jayengi (web admin 30000 bhejta hai; phone ke liye 5000 safe hai)
const PREVIEW_ROWS = 10; // mapping screen par kitni sample rows dikhani hain
const COL_W = 150; // preview table ki column width
const BLOCK_SIZE = 512 * 1024; // CSV ko itne bytes ke block mein padhte hain (memory safe)
const PREVIEW_BYTES = 128 * 1024; // CSV preview ke liye sirf pehle itne bytes
const EXCEL_STEPS = ['Reading file from storage', 'Decoding file', 'Parsing sheet (longest step, screen may pause)'];
const UPLOAD_PARALLEL = 3; // ek saath kitni requests chalein (server pe problem ho to 1 kar do)
const USE_DENSE = true; // SheetJS dense mode: kam memory + fast parse. Agar kuch gadbad lage to false kar do
const EXCEL_MAX_SEC_PER_MB = 6; // Excel poori file read ka worst-case estimate (sec per MB)
const EXCEL_PREVIEW_SEC_PER_MB = 3; // Excel preview (pick par) ka worst-case estimate

// Jo extensions allow hain (SheetJS in sab ko padh leta hai)
const ALLOWED_EXT = ['csv', 'tsv', 'xls', 'xlsx', 'xlsm', 'xlsb', 'xltx', 'xltm', 'ods'];
const CSV_EXT = ['csv', 'tsv']; // ye files stream hoti hain (fast), baaki Excel hain

const MIME_TYPES = {
    csv: 'text/csv',
    tsv: 'text/tab-separated-values',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xlsm: 'application/vnd.ms-excel.sheet.macroEnabled.12',
    xlsb: 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
    xltx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
    xltm: 'application/vnd.ms-excel.template.macroEnabled.12',
    ods: 'application/vnd.oasis.opendocument.spreadsheet',
};

// Ye columns server khud set karta hai, isliye dropdown mein nahi dikhane
const HIDE_COLUMNS = ['finance_name', 'agency_person_name', 'agency_contact_number'];

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// unique + trimmed headers (blank header ko Column_N bana deta hai)
const makeHeaders = (rawHeaders) => {
    const seen = {};
    return rawHeaders.map((h, i) => {
        let name = String(h ?? '').trim() || `Column_${i + 1}`;
        if (seen[name]) {
            seen[name] += 1;
            name = `${name}_${seen[name]}`;
        } else {
            seen[name] = 1;
        }
        return name;
    });
};

const toPath = (uri) => decodeURIComponent(String(uri).replace('file://', ''));

const cellText = (v) => (v !== undefined && v !== null ? String(v).trim() : '');

const nonBlankRow = (r) => r.some((c) => String(c ?? '').trim() !== '');

const fmtNum = (n) => String(n || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const fmtTime = (sec) => {
    const s = Math.max(0, Math.round(sec));
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
};

// modal ko screen par aane ka time do (heavy kaam se pehle)
const paint = (ms = 250) => new Promise((r) => setTimeout(r, ms));

// Fix format: file ka header (norm kiya hua) → db column
const FIXED_FORMAT = {
    month: 'vehicle_month',
    financename: 'vehicle_finance_name',
    manager: 'vehicle_manager',
    branch: 'vehicle_branch',
    agreementno: 'vehicle_agreement_no',
    appid: 'vehicle_app_id',
    customername: 'vehicle_customer_name',
    bucket: 'vehicle_bucket',
    emi: 'vehicle_emi',
    principaloutstanding: 'vehicle_principle_outstanding',
    totaloutstatinding: 'vehicle_total_outstanding', // aapki file mein spelling aisi hi hai
    totaloutstanding: 'vehicle_total_outstanding',
    product: 'vehicle_product',
    asset: 'vehicle_product',
    fildfos: 'vehicle_fild_fos',
    rcno: 'vehicle_registration_no',
    registrationno: 'vehicle_registration_no',
    enginno: 'vehicle_engine_no',
    engineno: 'vehicle_engine_no',
    eng: 'vehicle_engine_no',
    chasisno: 'vehicle_chassis_no',
    chassisno: 'vehicle_chassis_no',
    repofos: 'vehicle_repo_fos',
};

const getFinanceName = (f) =>
    f?.finance_name || f?.agency_name || f?.vehicle_finance_name_admin || f?.name || '';

const getFinanceId = (f) => f?.agency_id ?? f?.finance_id ?? f?.id ?? '';

// CSV ke liye fix order (PHP position se padhti hai)
const EXPECTED_ORDER = [
    'vehicle_month', 'vehicle_finance_name', 'vehicle_manager', 'vehicle_branch',
    'vehicle_agreement_no', 'vehicle_app_id', 'vehicle_customer_name', 'vehicle_bucket',
    'vehicle_emi', 'vehicle_principle_outstanding', 'vehicle_total_outstanding',
    'vehicle_product', 'vehicle_fild_fos', 'vehicle_registration_no',
    'vehicle_engine_no', 'vehicle_chassis_no', 'vehicle_repo_fos',
];

const colLabel = (c) => c.replace(/^vehicle_/, '').replace(/_/g, ' ');

// file ke headers ko fixed format se compare karke errors ki list deta hai
const checkFormat = (headers, autoMap) => {
    const errors = [];

    if (headers.length !== EXPECTED_ORDER.length) {
        errors.push(`${EXPECTED_ORDER.length} columns are required, but the file contains ${headers.length}`);
    }

    headers.forEach((h, i) => {
        if (!autoMap[i]) errors.push(`Column ${i + 1} "${h}" could not be recognized (extra or invalid column name)`);
    });

    const missing = EXPECTED_ORDER.filter((c) => !autoMap.includes(c));
    missing.forEach((c) => errors.push(`"${colLabel(c)}" column was not found in the file`));

    if (!missing.length && autoMap.every(Boolean) && headers.length === EXPECTED_ORDER.length) {
        EXPECTED_ORDER.forEach((c, i) => {
            if (autoMap[i] !== c) {
                errors.push(`Column ${i + 1} contains "${headers[i]}" but "${colLabel(c)}" is expected there`);
            }
        });
    }

    return errors;
};

/* ---------------- CSV STREAMING HELPERS ---------------- */

// Incremental CSV parser: text ke tukde feed karo, poori rows milti rehti hain
const makeCsvParser = (delim) => {
    let field = '';
    let row = [];
    let inQ = false;
    let quotePending = false;
    let skipLF = false;
    let out = [];

    const endRow = () => {
        row.push(field);
        field = '';
        out.push(row);
        row = [];
    };

    const feed = (text) => {
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];

            if (skipLF) {
                skipLF = false;
                if (ch === '\n') continue;
            }

            if (inQ) {
                if (quotePending) {
                    quotePending = false;
                    if (ch === '"') {
                        field += '"';
                        continue;
                    }
                    inQ = false; // closing quote tha, ab ch ko normal char ki tarah handle karo
                } else if (ch === '"') {
                    quotePending = true;
                    continue;
                } else {
                    field += ch;
                    continue;
                }
            }

            if (ch === '"' && field === '') inQ = true;
            else if (ch === delim) {
                row.push(field);
                field = '';
            } else if (ch === '\n') endRow();
            else if (ch === '\r') {
                endRow();
                skipLF = true;
            } else field += ch;
        }
        const done = out;
        out = [];
        return done;
    };

    const finish = () => {
        inQ = false;
        quotePending = false;
        if (field !== '' || row.length) endRow();
        const done = out;
        out = [];
        return done;
    };

    return { feed, finish };
};

const detectDelimiter = (text, ext) => {
    if (ext === 'tsv') return '\t';
    const first = text.split(/\r?\n/)[0] || '';
    const cands = [',', ';', '\t', '|'];
    let best = ',';
    let bestCount = -1;
    cands.forEach((d) => {
        const n = first.split(d).length - 1;
        if (n > bestCount) {
            bestCount = n;
            best = d;
        }
    });
    return best;
};

// CSV ke pehle PREVIEW_BYTES padhke header + sample rows nikalta hai (instant)
const loadCsvPreview = async (path, size, ext) => {
    let txt = await RNFS.read(path, Math.min(PREVIEW_BYTES, size), 0, 'utf8');
    if (txt.charCodeAt(0) === 0xfeff) txt = txt.slice(1);
    const delim = detectDelimiter(txt, ext);
    const parser = makeCsvParser(delim);
    let arr = parser.feed(txt);
    if (size <= PREVIEW_BYTES) arr = arr.concat(parser.finish());
    arr = arr.filter(nonBlankRow);
    return { arr: arr.slice(0, PREVIEW_ROWS + 1), delim };
};

// Poori CSV me lines gino (header chhodke). Blank/multiline cells ki wajah se thoda approx ho sakta hai.
const countCsvRows = async (path, size, onPct) => {
    let pos = 0;
    let lines = 0;
    let lastChar = '';
    let lastPct = -1;

    while (pos < size) {
        const len = Math.min(BLOCK_SIZE, size - pos);
        const txt = await RNFS.read(path, len, pos, 'utf8');
        pos += len;
        if (!txt) continue;

        let idx = -1;
        // eslint-disable-next-line no-cond-assign
        while ((idx = txt.indexOf('\n', idx + 1)) !== -1) lines++;
        lastChar = txt[txt.length - 1];

        const pct = Math.round((pos / size) * 100);
        if (pct !== lastPct) {
            lastPct = pct;
            onPct && onPct(pct);
        }
    }
    if (lastChar && lastChar !== '\n') lines++;
    return Math.max(lines - 1, 0);
};

// CSV ko block-by-block padhke CHUNK_SIZE rows ke batch mein onBatch ko deta hai
// NOTE: utf8 block boundary par multi-byte char (Hindi etc.) tut sakta hai; ASCII data mein koi issue nahi.
const streamCsv = async (path, size, delim, { batchSize, onBatch, onBytes }) => {
    const parser = makeCsvParser(delim);
    let pos = 0;
    let skipHeader = true;
    const buf = [];

    const take = (rows) => {
        for (let i = 0; i < rows.length; i++) {
            if (skipHeader) {
                skipHeader = false;
                continue;
            }
            if (nonBlankRow(rows[i])) buf.push(rows[i]);
        }
    };

    const flush = async (force) => {
        while (buf.length >= batchSize || (force && buf.length)) {
            await onBatch(buf.splice(0, batchSize));
        }
    };

    while (pos < size) {
        const len = Math.min(BLOCK_SIZE, size - pos);
        let txt = await RNFS.read(path, len, pos, 'utf8');
        if (pos === 0 && txt.charCodeAt(0) === 0xfeff) txt = txt.slice(1);
        pos += len;

        take(parser.feed(txt));
        onBytes && onBytes(pos / size);
        await flush(false);
        await paint(0); // UI ko saans lene do
    }

    take(parser.finish());
    await flush(true);
};

/* ---------------- EXCEL HELPERS ---------------- */

// base64 → bytes (SheetJS ke apne base64 decode se kaafi fast, aur ye bytes se seedha XLSX.read hota hai)
const B64_LOOKUP = (() => {
    const tbl = new Uint8Array(256).fill(255);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    for (let i = 0; i < 64; i++) tbl[chars.charCodeAt(i)] = i;
    tbl[45] = 62; // '-'
    tbl[95] = 63; // '_'
    return tbl;
})();

const base64ToBytes = (b64) => {

    if (typeof atob === 'function') {
        try {
            const s = atob(b64); // native decode
            const out = new Uint8Array(s.length);
            for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
            return out;
        } catch (e) {
            /* neeche purana JS decode chalega */
        }
    }

    let len = b64.length;
    while (len > 0 && b64.charCodeAt(len - 1) === 61) len--; // '=' padding hatao
    const out = new Uint8Array(Math.floor((len * 3) / 4));
    let o = 0;
    let buf = 0;
    let bits = 0;
    for (let i = 0; i < len; i++) {
        const v = B64_LOOKUP[b64.charCodeAt(i)];
        if (v === 255) continue; // newline/space skip
        buf = (buf << 6) | v;
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            out[o++] = (buf >> bits) & 255;
            buf &= (1 << bits) - 1;
        }
    }
    return o === out.length ? out : out.subarray(0, o);
};

const loadExcelBytes = async (path, onStep) => {
    const t0 = Date.now();
    const b64 = await RNFS.readFile(path, 'base64');
    const t1 = Date.now();
    onStep && onStep(1); // step 1: decoding
    await paint(60); // modal ko repaint hone do, phir heavy decode
    const bytes = base64ToBytes(b64);
    console.log(`[VFU] file read ${t1 - t0}ms, base64 decode ${Date.now() - t1}ms, bytes=${bytes.length}`);
    onStep && onStep(2); // step 2: parsing (sabse heavy)
    await paint(100);
    return bytes;
};

// Web admin wali hi settings: cellDates + dateNF 'dd-mmm' (26-Jan jaisa exact text) aur raw:false
const readOpts = (extra) => ({
    type: 'array',
    sheets: 0, // sirf pehli sheet parse hogi
    cellDates: true,
    cellFormula: false,
    cellHTML: false,
    cellStyles: false,
    cellText: false, // har cell ka text parse ke time nahi banta, slice ke time lazily banta hai (total time kam)
    dense: USE_DENSE,
    ...extra,
});

const JSON_OPTS = { header: 1, defval: '', raw: false, dateNF: 'dd-mmm', blankrows: false };

// !ref galat ho sakta hai → cells se asli range nikalo
const scanBounds = (ws) => {
    let maxR = 0;
    let maxC = 0;
    const grid = ws['!data'] || (Array.isArray(ws) ? ws : null);
    if (grid) {
        grid.forEach((row, r) => {
            if (!row) return;
            if (r > maxR) maxR = r;
            if (row.length - 1 > maxC) maxC = row.length - 1;
        });
    } else {
        Object.keys(ws).forEach((k) => {
            if (k[0] === '!') return;
            const a = XLSX.utils.decode_cell(k);
            if (a.r > maxR) maxR = a.r;
            if (a.c > maxC) maxC = a.c;
        });
    }
    return { s: { r: 0, c: 0 }, e: { r: maxR, c: maxC } };
};

// Sheet → array of arrays (preview ke liye)
const parseSheet = (ws) => {
    let arr = XLSX.utils.sheet_to_json(ws, JSON_OPTS);
    if (arr.length < 2) {
        ws['!ref'] = XLSX.utils.encode_range(scanBounds(ws));
        arr = XLSX.utils.sheet_to_json(ws, JSON_OPTS);
    }
    return arr;
};

// PICK par: sirf header + sample rows (sheetRows). Poori file ke rows parse nahi hote.
const readExcelPreview = (bytes) => {
    const t0 = Date.now();
    const wb = XLSX.read(bytes, readOpts({ sheetRows: PREVIEW_ROWS + 1 }));
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) return { arr: [], total: 0 };

    // total rows sheet ki dimension se (poori file parse kiye bina)
    const fullRef = ws['!fullref'] || ws['!ref'];
    let total = null;
    if (fullRef) {
        const rg = XLSX.utils.decode_range(fullRef);
        total = rg.e.r - rg.s.r;
    }
    const arr = parseSheet(ws);
    console.log(`[VFU] excel preview parse ${Date.now() - t0}ms, previewRows=${arr.length}, total=${total}`);
    return { arr, total };
};

// SUBMIT par: workbook ek baar khulti hai (sabse heavy step, JS thread block hota hai).
// Uske baad rows chunk-by-chunk nikalte hain, isliye upload ke dauran UI/timer chalta rehta hai.
const openExcelFull = (bytes) => {
    const t0 = Date.now();
    const wb = XLSX.read(bytes, readOpts());
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) throw new Error('No sheet found in the file');

    let range = ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']) : { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };
    if (range.e.r - range.s.r < 1) range = scanBounds(ws);

    console.log(`[VFU] excel full parse ${Date.now() - t0}ms, rows ${range.s.r}-${range.e.r}, cols ${range.s.c}-${range.e.c}`);
    return { ws, firstRow: range.s.r, lastRow: range.e.r, firstCol: range.s.c, lastCol: range.e.c };
};

// sheet se rows ka ek tukda (array of arrays)
const sheetSlice = (ws, startRow, endRow, firstCol, lastCol) =>
    XLSX.utils.sheet_to_json(ws, {
        ...JSON_OPTS,
        range: { s: { r: startRow, c: firstCol }, e: { r: endRow, c: lastCol } },
    });

/* ---------------- FAST XLSX READER (SheetJS ke bina: zip + XML stream) ---------------- */
// Ye sirf .xlsx/.xlsm/.xltx/.xltm ke liye hai (zip based). xls/xlsb/ods purane SheetJS path se chalenge.
const FAST_XLSX_EXT = ['xlsx', 'xlsm', 'xltx', 'xltm'];
const FAST_XLS_EXT = ['xls'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const readB64 = async (path, len, pos) => base64ToBytes(await RNFS.read(path, len, pos, 'base64'));
const u16 = (b, o) => b[o] | (b[o + 1] << 8);
const u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;

// zip ki central directory se entries ka map: name -> { method, comp, off }
const zipEntries = async (path, size) => {
    const tailLen = Math.min(size, 65557);
    const tail = await readB64(path, tailLen, size - tailLen);
    let e = tail.length - 22;
    while (e >= 0 && !(tail[e] === 0x50 && tail[e + 1] === 0x4b && tail[e + 2] === 5 && tail[e + 3] === 6)) e--;
    if (e < 0) throw new Error('Not a zip file');
    const count = u16(tail, e + 10);
    const cdSize = u32(tail, e + 12);
    const cdOff = u32(tail, e + 16);
    if (cdOff === 0xffffffff || count === 0xffff) throw new Error('zip64 not supported');

    const cd = await readB64(path, cdSize, cdOff);
    const map = {};
    let o = 0;
    for (let i = 0; i < count && o + 46 <= cd.length; i++) {
        if (u32(cd, o) !== 0x02014b50) break;
        const method = u16(cd, o + 10);
        const comp = u32(cd, o + 20);
        const nameLen = u16(cd, o + 28);
        const extraLen = u16(cd, o + 30);
        const cmtLen = u16(cd, o + 32);
        const off = u32(cd, o + 42);
        let name = '';
        for (let k = 0; k < nameLen; k++) name += String.fromCharCode(cd[o + 46 + k]);
        map[name] = { method, comp, off };
        o += 46 + nameLen + extraLen + cmtLen;
    }
    return map;
};

const entryDataStart = async (path, en) => {
    const h = await readB64(path, 30, en.off);
    return en.off + 30 + u16(h, 26) + u16(h, 28);
};

// chhoti entry (workbook, rels, styles) poori ek baar mein
const entryText = async (path, en) => {
    const start = await entryDataStart(path, en);
    const comp = await readB64(path, en.comp, start);
    return strFromU8(en.method === 8 ? inflateSync(comp) : comp);
};


// Hermes mein TextDecoder nahi hota, isliye fflate ka DecodeUTF8 byte-by-byte JS loop chalata hai (bahut slow).
// Ye decoder ASCII ke liye native-speed rasta leta hai, aur Hindi/non-ASCII ke liye decodeURIComponent(escape()) trick.
const makeUtf8Decoder = (onStr) => {
    let rem = null; // chunk ke end mein adhoora multi-byte character
    const decodeBytes = (u8, end) => {
        let s = '';
        for (let i = 0; i < end; i += 8192) {
            s += String.fromCharCode.apply(null, u8.subarray(i, Math.min(i + 8192, end)));
        }
        if (!/[\x80-\xff]/.test(s)) return s; // pure ASCII
        try {
            return decodeURIComponent(escape(s)); // latin1-bytes -> utf8 text (native)
        } catch (e) {
            return strFromU8(u8.subarray(0, end)); // kharab bytes: fflate ka slow-but-safe decoder
        }
    };
    return {
        push: (u8, final) => {
            if (rem) {
                const m = new Uint8Array(rem.length + u8.length);
                m.set(rem);
                m.set(u8, rem.length);
                u8 = m;
                rem = null;
            }
            let end = u8.length;
            if (!final) {
                let i = end - 1;
                let back = 0;
                while (i >= 0 && back < 3 && (u8[i] & 0xc0) === 0x80) {
                    i--;
                    back++;
                }
                if (i >= 0 && u8[i] >= 0xc0) {
                    const need = u8[i] >= 0xf0 ? 4 : u8[i] >= 0xe0 ? 3 : 2;
                    if (end - i < need) {
                        rem = u8.slice(i);
                        end = i;
                    }
                }
            }
            if (end > 0) onStr(decodeBytes(u8, end));
        },
    };
};
// badi entry ko block-by-block inflate karke text ke tukde deta hai.
// onText false return kare to wahin ruk jata hai (preview ke liye). afterBlock async ho sakta hai.
const streamEntryText = async (path, en, { onText, onRead, afterBlock, block = BLOCK_SIZE }) => {
    const start = await entryDataStart(path, en);
    let stop = false;
    const dec = makeUtf8Decoder((s) => {
        if (!stop && onText(s) === false) stop = true;
    });
    let inf = null;
    if (en.method === 8) inf = new Inflate((chunk, final) => dec.push(chunk, final));
    else if (en.method !== 0) throw new Error('Unsupported zip compression');

    let pos = 0;
    while (pos < en.comp && !stop) {
        const len = Math.min(block, en.comp - pos);
        const bytes = await readB64(path, len, start + pos);
        pos += len;
        const last = pos >= en.comp;
        if (inf) inf.push(bytes, last);
        else dec.push(bytes, last);
        onRead && onRead(len);
        if (afterBlock) await afterBlock();
        await paint(0); // UI ko saans lene do
    }
};

// pehli sheet ki entry (workbook.xml + rels se)
const findSheet = async (path, ents) => {
    try {
        const wb = await entryText(path, ents['xl/workbook.xml']);
        const rels = await entryText(path, ents['xl/_rels/workbook.xml.rels']);
        const m = /<sheet\b[^>]*\br:id="([^"]+)"/.exec(wb);
        if (m) {
            const rm = new RegExp('<Relationship\\b[^>]*\\bId="' + m[1] + '"[^>]*>').exec(rels);
            const t = rm && /\bTarget="([^"]+)"/.exec(rm[0]);
            if (t) {
                let p = t[1].replace(/^\/+/, '');
                if (!p.startsWith('xl/')) p = 'xl/' + p;
                if (ents[p]) return ents[p];
            }
        }
    } catch (e) {
        /* neeche default try hoga */
    }
    return ents['xl/worksheets/sheet1.xml'] || null;
};

// styles.xml se wo style indexes jo date format ke hain
const loadDateStyles = async (path, ents) => {
    const set = new Set();
    if (!ents['xl/styles.xml']) return set;
    const x = await entryText(path, ents['xl/styles.xml']);
    const custom = {};
    (x.match(/<numFmt\b[^>]*>/g) || []).forEach((tag) => {
        const id = /numFmtId="(\d+)"/.exec(tag);
        const code = /formatCode="([^"]*)"/.exec(tag);
        if (id && code) custom[id[1]] = code[1];
    });
    const isDateFmt = (id) => {
        if ((id >= 14 && id <= 22) || (id >= 45 && id <= 47)) return true;
        const code = custom[id];
        if (!code) return false;
        const c = code.replace(/&quot;/g, '"').replace(/"[^"]*"/g, '').replace(/\\./g, '').replace(/\[[^\]]*\]/g, '');
        return /[dmyhs]/i.test(c) && !/^general$/i.test(c);
    };
    const cx = /<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/.exec(x);
    if (cx) {
        (cx[1].match(/<xf\b[^>]*>/g) || []).forEach((tag, i) => {
            const m = /numFmtId="(\d+)"/.exec(tag);
            if (m && isDateFmt(+m[1])) set.add(i);
        });
    }
    return set;
};

const unesc = (s) =>
    s.indexOf('&') < 0
        ? s
        : s.replace(/&(#x[0-9a-fA-F]+|#\d+|lt|gt|amp|quot|apos);/g, (m, g) => {
            if (g === 'lt') return '<';
            if (g === 'gt') return '>';
            if (g === 'amp') return '&';
            if (g === 'quot') return '"';
            if (g === 'apos') return "'";
            const cp = g[1] === 'x' || g[1] === 'X' ? parseInt(g.slice(2), 16) : parseInt(g.slice(1), 10);
            return String.fromCodePoint(cp);
        });

// <si> ya <is> ke andar ke saare <t> ka text jodta hai
const siText = (item) => {
    if (item.indexOf('<rPh') >= 0) item = item.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '');
    let out = '';
    let q = 0;
    while ((q = item.indexOf('<t', q)) !== -1) {
        const c = item.charCodeAt(q + 2);
        if (c !== 62 && c !== 32) {
            q += 2;
            continue;
        }
        const gt = item.indexOf('>', q);
        if (item.charCodeAt(gt - 1) === 47) {
            q = gt;
            continue;
        }
        const e = item.indexOf('</t>', gt);
        if (e < 0) break;
        out += item.slice(gt + 1, e);
        q = e + 4;
    }
    return unesc(out);
};

// sharedStrings ke text tukde se strings nikalke sst mein daalta hai. carry = adhoori string
const makeSstFeeder = (sst) => {
    let carry = '';
    return (s) => {
        carry += s;
        let st = 0;
        let e;
        while ((e = carry.indexOf('</si>', st)) !== -1) {
            sst.push(siText(carry.slice(st, e)));
            st = e + 5;
        }
        carry = carry.slice(st);
    };
};

const colIdx = (ref) => {
    let n = 0;
    for (let i = 0; i < ref.length; i++) {
        const c = ref.charCodeAt(i);
        if (c < 65 || c > 90) break;
        n = n * 26 + (c - 64);
    }
    return n - 1;
};

const attr = (a, k) => {
    const key = ` ${k}="`;
    const i = a.indexOf(key);
    if (i < 0) return '';
    const s = i + key.length;
    return a.slice(s, a.indexOf('"', s));
};

const fmtSerialDate = (serial) => {
    const d = new Date(Math.round((serial - 25569) * 86400000));
    return `${String(d.getUTCDate()).padStart(2, '0')}-${MONTHS[d.getUTCMonth()]}`;
};

const cleanNum = (v) => {
    if (v.length > 15 && v.indexOf('.') > 0 && v.indexOf('E') < 0) {
        const n = Number(v);
        if (!Number.isNaN(n)) return String(parseFloat(n.toPrecision(15)));
    }
    return v;
};

// ek <row> ka xml -> array of strings (khali jagah '')
const parseRowXml = (xml, getStr, dateStyles, startCol, width) => {
    let p = xml.lastIndexOf('<row ');
    if (p < 0) return null;
    p = xml.indexOf('>', p) + 1;
    const out = [];
    let lastCol = startCol - 1;

    while ((p = xml.indexOf('<c ', p)) !== -1) {
        const gt = xml.indexOf('>', p);
        const self = xml.charCodeAt(gt - 1) === 47;
        const attrs = ' ' + xml.slice(p + 3, self ? gt - 1 : gt);
        p = gt + 1;
        if (self) continue;
        const endC = xml.indexOf('</c>', p);
        if (endC < 0) break;
        const inner = xml.slice(p, endC);
        p = endC + 4;

        const ref = attr(attrs, 'r');
        const ci = ref ? colIdx(ref) : lastCol + 1;
        lastCol = ci;
        const t = attr(attrs, 't');

        let val = '';
        if (t === 'inlineStr') {
            val = siText(inner);
        } else {
            const vs = inner.indexOf('<v');
            if (vs >= 0) {
                const vg = inner.indexOf('>', vs);
                if (inner.charCodeAt(vg - 1) !== 47) {
                    const v = inner.slice(vg + 1, inner.indexOf('</v>', vg));
                    if (t === 's') val = getStr(+v);
                    else if (t === 'str') val = unesc(v);
                    else if (t === 'b') val = v === '1' ? 'TRUE' : 'FALSE';
                    else if (t === 'e') val = '';
                    else if (v !== '' && dateStyles.size && dateStyles.has(+attr(attrs, 's'))) val = fmtSerialDate(+v);
                    else val = cleanNum(v);
                }
            }
        }
        const idx = ci - startCol;
        if (idx >= 0) out[idx] = val;
    }

    const n = Math.max(out.length, width);
    for (let i = 0; i < n; i++) if (out[i] === undefined) out[i] = '';
    return out;
};

// <dimension ref="A1:I149715"/> se start column, width aur total data rows (header chhodke)
const readDimension = (head) => {
    const m = /<dimension ref="([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?"/.exec(head);
    if (!m) return { startCol: 0, width: 0, total: null };
    const startCol = colIdx(m[1]);
    const endCol = m[3] ? colIdx(m[3]) : startCol;
    const total = m[4] ? Number(m[4]) - Number(m[2]) : 0;
    return { startCol, width: endCol - startCol + 1, total };
};

// rows ko sheet text se nikalne wala feeder. onRow(row) false de to rukna hai
const makeSheetFeeder = (getStr, dateStyles, onRow, onDim) => {
    let carry = '';
    let dim = null;
    return (s) => {
        carry += s;
        if (!dim) {
            const sd = carry.indexOf('<sheetData');
            if (sd < 0) return true;
            dim = readDimension(carry.slice(0, sd));
            onDim && onDim(dim);
        }
        let st = 0;
        let e;
        let keep = true;
        while ((e = carry.indexOf('</row>', st)) !== -1) {
            const row = parseRowXml(carry.slice(st, e), getStr, dateStyles, dim.startCol, dim.width);
            st = e + 6;
            if (row && onRow(row) === false) {
                keep = false;
                break;
            }
        }
        carry = carry.slice(st);
        return keep;
    };
};

// PICK par: header + sample rows + total (poori file inflate nahi hoti, ~1 sec)
const fastXlsxPreview = async (path, size) => {
    const ents = await zipEntries(path, size);
    const sheetEn = await findSheet(path, ents);
    if (!sheetEn) throw new Error('Sheet not found');
    const dateStyles = await loadDateStyles(path, ents);

    const want = PREVIEW_ROWS + 1;
    const rows = [];
    let maxIdx = -1;
    let total = null;
    // shared string abhi nahi mili, placeholder lagao, baad mein replace
    const getStr = (i) => {
        if (i > maxIdx) maxIdx = i;
        return `\u0001${i}\u0001`;
    };

    const feed = makeSheetFeeder(
        getStr,
        dateStyles,
        (row) => {
            if (nonBlankRow(row)) rows.push(row);
            return rows.length < want;
        },
        (d) => {
            total = d.total;
        },
    );
    await streamEntryText(path, sheetEn, {
        block: 64 * 1024,
        onText: feed,
    });

    const sst = [];
    if (maxIdx >= 0 && ents['xl/sharedStrings.xml']) {
        const feedSst = makeSstFeeder(sst);
        await streamEntryText(path, ents['xl/sharedStrings.xml'], {
            block: 64 * 1024,
            onText: (s) => {
                feedSst(s);
                return sst.length <= maxIdx;
            },
        });
    }

    const arr = rows.map((r) =>
        r.map((v) => (v.indexOf('\u0001') >= 0 ? v.replace(/\u0001(\d+)\u0001/g, (m, i) => sst[+i] ?? '') : v)),
    );
    return { arr, total };
};

// SUBMIT par: poori sheet stream hoti hai, CHUNK_SIZE rows ke batch onBatch ko milte hain.
// Phone par sirf ek batch memory mein rehta hai; SheetJS ka bada workbook nahi banta.
const streamXlsx = async (path, size, { batchSize, onBatch, onPrep, onBytes }) => {
    const tAll = Date.now();
    const ents = await zipEntries(path, size);
    const sheetEn = await findSheet(path, ents);
    if (!sheetEn) throw new Error('Sheet not found');
    const dateStyles = await loadDateStyles(path, ents);
    const sstEn = ents['xl/sharedStrings.xml'];
    console.log(`[VFU] zip dir + styles ${Date.now() - tAll}ms`);

    // 1) shared strings (random access chahiye, isliye poori list)
    const sst = [];
    if (sstEn) {
        const tS = Date.now();
        const feedSst = makeSstFeeder(sst);
        let got = 0;
        await streamEntryText(path, sstEn, {
            onText: (s) => {
                feedSst(s);
            },
            onRead: (n) => {
                got += n;
                onPrep && onPrep(got / (sstEn.comp || 1));
            },
        });
        console.log(`[VFU] sst ${sst.length} strings ${Date.now() - tS}ms`);
    }

    // 2) sheet rows
    const tSheet = Date.now();
    let parseMs = 0; // sirf XML parse ka time
    let uploadWaitMs = 0; // batch bhejne mein (server/network) ruka hua time
    const buf = [];
    let skipHeader = true;
    let got = 0;
    const getStr = (i) => sst[i] ?? '';
    const feed = makeSheetFeeder(getStr, dateStyles, (row) => {
        if (!nonBlankRow(row)) return true;
        if (skipHeader) {
            skipHeader = false;
            return true;
        }
        buf.push(row);
        return true;
    });
    const flush = async (force) => {
        while (buf.length >= batchSize || (force && buf.length)) {
            const tU = Date.now();
            await onBatch(buf.splice(0, batchSize));
            uploadWaitMs += Date.now() - tU;
        }
    };
    await streamEntryText(path, sheetEn, {
        onText: (s) => {
            const tP = Date.now();
            feed(s);
            parseMs += Date.now() - tP;
        },
        onRead: (n) => {
            got += n;
            onBytes && onBytes(got / (sheetEn.comp || 1));
        },
        afterBlock: () => flush(false),
    });
    await flush(true);
    console.log(
        `[VFU] sheet total ${Date.now() - tSheet}ms | xml parse ${parseMs}ms | waiting on upload ${uploadWaitMs}ms`,
    );
    console.log(`[VFU] streamXlsx all ${Date.now() - tAll}ms`);
};


/* ---------------- NATIVE UNZIP PATH (react-native-zip-archive) ---------------- */
// File ko native thread par unzip karke XML file ko RNFS.read(utf8) se padhte hain.
// Inflate + UTF-8 decode native mein hota hai, JS sirf XML parse karta hai.

// badi text file ko block-by-block deta hai. Multi-byte char block ke end par kat jaye (U+FFFD) to block 1-3 byte chhota karke dobara padhta hai.
// const streamFileText = async (fp, { onText, onRead, afterBlock, block = BLOCK_SIZE }) => {
//     const size = Number((await RNFS.stat(fp)).size) || 0;
//     let pos = 0;
//     let stop = false;
//     while (pos < size && !stop) {
//         let len = Math.min(block, size - pos);
//         let txt = await RNFS.read(fp, len, pos, 'utf8');
//         let tries = 0;
//         while (pos + len < size && tries < 3 && txt.charCodeAt(txt.length - 1) === 0xfffd) {
//             len -= 1;
//             tries += 1;
//             txt = await RNFS.read(fp, len, pos, 'utf8');
//         }
//         if (pos === 0 && txt.charCodeAt(0) === 0xfeff) txt = txt.slice(1); // BOM
//         pos += len;
//         if (onText(txt) === false) stop = true;
//         onRead && onRead(len, size);
//         if (afterBlock) await afterBlock();
//         await paint(0); // UI ko saans lene do
//     }
// };

/* ---------------- NATIVE UNZIP PATH (react-native-zip-archive) ---------------- */
// File ko native thread par unzip karke XML file ko RNFS.read(utf8) se padhte hain.
// Inflate + UTF-8 decode native mein hota hai, JS sirf XML parse karta hai.

// RNFS.read(..., 'utf8') JS mein (base-64 + utf8 npm libs se) decode karta hai, jo Hermes mein bahut slow hai.
// Isliye base64 mein padhte hain (wo native se seedha aata hai) aur atob + escape trick se khud decode karte hain.
const HAS_ATOB = typeof atob === 'function';

const b64ToLatin1 = (b64) => {
    if (HAS_ATOB) return atob(b64); // native, bytes ko 0-255 chars ki string bana deta hai
    const u8 = base64ToBytes(b64); // atob nahi hai to purana JS decode (slow)
    let s = '';
    for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
    return s;
};

// latin1-bytes string -> asli utf8 text. Block ke end par adhoora multi-byte char agle block ke liye rakh leta hai.
const makeLatin1Utf8 = () => {
    let rem = '';
    return (s, final) => {
        if (rem) {
            s = rem + s;
            rem = '';
        }
        let end = s.length;
        if (!final) {
            let i = end - 1;
            let back = 0;
            while (i >= 0 && back < 3 && (s.charCodeAt(i) & 0xc0) === 0x80) {
                i--;
                back++;
            }
            if (i >= 0) {
                const c = s.charCodeAt(i);
                if (c >= 0xc0) {
                    const need = c >= 0xf0 ? 4 : c >= 0xe0 ? 3 : 2;
                    if (end - i < need) {
                        rem = s.slice(i);
                        end = i;
                    }
                }
            }
        }
        const part = end === s.length ? s : s.slice(0, end);
        if (!/[\x80-\xff]/.test(part)) return part; // pure ASCII
        try {
            return decodeURIComponent(escape(part));
        } catch (e) {
            return part;
        }
    };
};

// badi file ko block-by-block text mein deta hai. onText false de to ruk jata hai.
const streamFileText = async (fp, { onText, onRead, afterBlock, block = BLOCK_SIZE }) => {
    const size = Number((await RNFS.stat(fp)).size) || 0;
    const toText = makeLatin1Utf8();
    let pos = 0;
    let stop = false;
    while (pos < size && !stop) {
        const len = Math.min(block, size - pos);
        const b64 = await RNFS.read(fp, len, pos, 'base64');
        pos += len;
        let txt = toText(b64ToLatin1(b64), pos >= size);
        if (pos === len && txt.charCodeAt(0) === 0xfeff) txt = txt.slice(1); // BOM
        if (onText(txt) === false) stop = true;
        onRead && onRead(len, size);
        if (afterBlock) await afterBlock();
        await paint(0); // UI ko saans lene do
    }
};

// SUBMIT par (native unzip): streamXlsx jaisa hi, bas inflate/decode native hai
const streamXlsxNative = async (path, size, { batchSize, onBatch, onPrep, onBytes }) => {
    const tAll = Date.now();
    const ents = await zipEntries(path, size); // sirf file ke naam/styles ke liye (JS, ~60ms)
    const sheetEn = await findSheet(path, ents);
    if (!sheetEn) throw new Error('Sheet not found');
    const sheetName = Object.keys(ents).find((k) => ents[k] === sheetEn);
    const dateStyles = await loadDateStyles(path, ents);
    const hasSst = !!ents['xl/sharedStrings.xml'];

    const dir = `${RNFS.CachesDirectoryPath}/xlsx_${Date.now()}`;
    try {
        const tU = Date.now();
        await unzip(path, dir);
        console.log(`[VFU] native unzip ${Date.now() - tU}ms, atob native: ${HAS_ATOB}`);

        // 1) shared strings
        const sst = [];
        if (hasSst) {
            const tS = Date.now();
            const feedSst = makeSstFeeder(sst);
            let got = 0;
            await streamFileText(`${dir}/xl/sharedStrings.xml`, {
                onText: (s) => {
                    feedSst(s);
                },
                onRead: (n, tot) => {
                    got += n;
                    onPrep && onPrep(got / (tot || 1));
                },
            });
            console.log(`[VFU] sst(native) ${sst.length} strings ${Date.now() - tS}ms`);
        }

        // 2) sheet rows
        const tSheet = Date.now();
        let parseMs = 0;
        let uploadWaitMs = 0;
        const buf = [];
        let skipHeader = true;
        let got = 0;
        const getStr = (i) => sst[i] ?? '';
        const feed = makeSheetFeeder(getStr, dateStyles, (row) => {
            if (!nonBlankRow(row)) return true;
            if (skipHeader) {
                skipHeader = false;
                return true;
            }
            buf.push(row);
            return true;
        });
        const flush = async (force) => {
            while (buf.length >= batchSize || (force && buf.length)) {
                const t1 = Date.now();
                await onBatch(buf.splice(0, batchSize));
                uploadWaitMs += Date.now() - t1;
            }
        };
        await streamFileText(`${dir}/${sheetName}`, {
            onText: (s) => {
                const t1 = Date.now();
                feed(s);
                parseMs += Date.now() - t1;
            },
            onRead: (n, tot) => {
                got += n;
                onBytes && onBytes(got / (tot || 1));
            },
            afterBlock: () => flush(false),
        });
        await flush(true);
        console.log(`[VFU] sheet(native) ${Date.now() - tSheet}ms | xml parse ${parseMs}ms | waiting on upload ${uploadWaitMs}ms`);
        console.log(`[VFU] streamXlsxNative all ${Date.now() - tAll}ms`);
    } finally {
        RNFS.unlink(dir).catch(() => { }); // temp files hata do
    }
};

/* ---------------- FAST XLS READER (BIFF8, SheetJS ke bina) ---------------- */
const OLE_SIG = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

// OLE2 container se "Workbook" stream nikalta hai
const oleStream = (b) => {
    for (let i = 0; i < 8; i++) if (b[i] !== OLE_SIG[i]) throw new Error('Not an OLE2 file');
    const ss = 1 << u16(b, 30);
    const mss = 1 << u16(b, 32);
    const dirStart = u32(b, 48);
    const cutoff = u32(b, 56);
    const miniStart = u32(b, 60);
    const difatCount = u32(b, 72);
    let ds = u32(b, 68);
    const secOff = (id) => (id + 1) * ss;
    const per = ss / 4;

    const fatSecs = [];
    for (let i = 0; i < 109; i++) {
        const s = u32(b, 76 + i * 4);
        if (s >= 0xfffffffa) break;
        fatSecs.push(s);
    }
    for (let n = 0; n < difatCount && ds < 0xfffffffa; n++) {
        const o = secOff(ds);
        for (let i = 0; i < per - 1; i++) {
            const s = u32(b, o + i * 4);
            if (s < 0xfffffffa) fatSecs.push(s);
        }
        ds = u32(b, o + ss - 4);
    }

    const fat = new Uint32Array(fatSecs.length * per);
    fatSecs.forEach((s, k) => {
        const o = secOff(s);
        for (let i = 0; i < per; i++) fat[k * per + i] = u32(b, o + i * 4);
    });

    const chain = (start, table) => {
        const out = [];
        let s = start;
        while (s < 0xfffffffa && out.length <= table.length) {
            out.push(s);
            s = table[s];
        }
        return out;
    };
    const readSecs = (secs) => {
        const out = new Uint8Array(secs.length * ss);
        secs.forEach((s, i) => out.set(b.subarray(secOff(s), secOff(s) + ss), i * ss));
        return out;
    };

    const dir = readSecs(chain(dirStart, fat));
    let root = null;
    let wb = null;
    for (let o = 0; o + 128 <= dir.length; o += 128) {
        const type = dir[o + 66];
        if (!type) continue;
        const nl = u16(dir, o + 64);
        let name = '';
        for (let k = 0; k < nl - 2; k += 2) name += String.fromCharCode(u16(dir, o + k));
        const e = { start: u32(dir, o + 116), size: u32(dir, o + 120) };
        if (type === 5) root = e;
        else if (type === 2 && (name === 'Workbook' || (name === 'Book' && !wb))) wb = e;
    }
    if (!wb) throw new Error('Workbook stream not found');

    if (wb.size >= cutoff) return readSecs(chain(wb.start, fat)).subarray(0, wb.size);

    // chhoti file: mini stream
    const mb = readSecs(chain(miniStart, fat));
    const mf = new Uint32Array(mb.length / 4);
    for (let i = 0; i < mf.length; i++) mf[i] = u32(mb, i * 4);
    const mini = readSecs(chain(root.start, fat));
    const ms = chain(wb.start, mf);
    const out = new Uint8Array(ms.length * mss);
    ms.forEach((s, i) => out.set(mini.subarray(s * mss, s * mss + mss), i * mss));
    return out.subarray(0, wb.size);
};

const xlsChars = (b, o, cch, hi) => {
    let s = '';
    if (!hi) {
        for (let i = 0; i < cch; i += 8192) {
            s += String.fromCharCode.apply(null, b.subarray(o + i, o + Math.min(cch, i + 8192)));
        }
    } else {
        for (let i = 0; i < cch; i++) s += String.fromCharCode(u16(b, o + i * 2));
    }
    return s;
};

// SST: strings CONTINUE records mein kat sakti hain (kate hue hisse ke start par 1 flag byte aata hai)
const parseXlsSst = (pieces) => {
    const out = [];
    let pi = 0;
    let d = pieces[0];
    let o = 8;
    const unique = u32(d, 4);
    const next = () => { pi++; d = pieces[pi]; o = 0; };
    const rd8 = () => { if (o >= d.length) next(); return d[o++]; };
    const skip = (n) => {
        while (n > 0) {
            if (o >= d.length) next();
            const t = Math.min(n, d.length - o);
            o += t;
            n -= t;
        }
    };

    while (out.length < unique && (o < d.length || pi < pieces.length - 1)) {
        const cch = rd8() | (rd8() << 8);
        const fl = rd8();
        const runs = fl & 8 ? rd8() | (rd8() << 8) : 0;
        let phon = 0;
        if (fl & 4) phon = rd8() | (rd8() << 8) | (rd8() << 16) | (rd8() * 16777216);

        let hi = fl & 1;
        let left = cch;
        let s = '';
        while (left > 0) {
            if (o >= d.length) { next(); hi = d[o++] & 1; }
            const bp = hi ? 2 : 1;
            const n = Math.min(left, ((d.length - o) / bp) | 0);
            if (n <= 0) { o = d.length; continue; }
            s += xlsChars(d, o, n, hi);
            o += n * bp;
            left -= n;
        }
        skip(runs * 4 + phon);
        out.push(s);
    }
    return out;
};

const RK_DV = new DataView(new ArrayBuffer(8));
const rkVal = (rk) => {
    let v;
    if (rk & 2) v = (rk | 0) >> 2;
    else {
        RK_DV.setUint32(0, 0, true);
        RK_DV.setUint32(4, (rk & 0xfffffffc) >>> 0, true);
        v = RK_DV.getFloat64(0, true);
    }
    return rk & 1 ? v / 100 : v;
};

const isDateCode = (code) => {
    const c = code.replace(/"[^"]*"/g, '').replace(/\\./g, '').replace(/\[[^\]]*\]/g, '');
    return /[dmyhs]/i.test(c) && !/^general$/i.test(c);
};

// Pehli sheet ki rows ek-ek karke onRow ko deta hai (false return karo to ruk jata hai)
const xlsWalk = (bytes, { onRow, onDim }) => {
    const b = oleStream(bytes);
    const len = b.length;
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    if (u16(b, 0) !== 0x0809) throw new Error('Bad BIFF');
    if (u16(b, 4) !== 0x0600) throw new Error('Only BIFF8 supported');

    // ---- globals ----
    const xfFmt = [];
    const custom = {};
    let date1904 = false;
    let sheetOff = -1;
    let sstPieces = null;
    let inSst = false;
    let p = 0;
    while (p + 4 <= len) {
        const id = u16(b, p);
        const n = u16(b, p + 2);
        const d = p + 4;
        p = d + n;
        if (id === 0x000a) break;
        if (id === 0x002f) throw new Error('Encrypted xls');
        if (id === 0x00fc) { sstPieces = [b.subarray(d, d + n)]; inSst = true; continue; }
        if (id === 0x003c && inSst) { sstPieces.push(b.subarray(d, d + n)); continue; }
        inSst = false;
        if (id === 0x00e0) xfFmt.push(u16(b, d + 2));
        else if (id === 0x041e) custom[u16(b, d)] = xlsChars(b, d + 5, u16(b, d + 2), b[d + 4] & 1);
        else if (id === 0x0022) date1904 = u16(b, d) === 1;
        else if (id === 0x0085 && sheetOff < 0 && b[d + 5] === 0) sheetOff = u32(b, d);
    }
    if (sheetOff < 0 || u16(b, sheetOff) !== 0x0809) throw new Error('Sheet not found');

    const sst = sstPieces ? parseXlsSst(sstPieces) : [];
    const isDate = xfFmt.map((f) => (f >= 14 && f <= 22) || (f >= 45 && f <= 47) || (!!custom[f] && isDateCode(custom[f])));
    const num2s = (v, xf) => (isDate[xf] ? fmtSerialDate(date1904 ? v + 1462 : v) : cleanNum(String(v)));

    // ---- sheet ----
    let startCol = 0;
    let width = 0;
    let cur = null;
    let curRow = -1;
    let stop = false;
    let pendingStr = null;

    const flush = () => {
        if (!cur) return;
        const n = Math.max(cur.length, width);
        for (let i = 0; i < n; i++) if (cur[i] === undefined) cur[i] = '';
        const row = cur;
        cur = null;
        if (onRow(row) === false) stop = true;
    };
    const put = (r, c, v) => {
        if (r !== curRow) { flush(); curRow = r; cur = []; }
        const i = c - startCol;
        if (i >= 0) cur[i] = v;
    };

    p = sheetOff;
    while (p + 4 <= len && !stop) {
        const id = u16(b, p);
        const n = u16(b, p + 2);
        const d = p + 4;
        p = d + n;
        if (id === 0x000a) break;

        if (id === 0x0200) {
            startCol = u16(b, d + 8);
            width = Math.max(u16(b, d + 10) - startCol, 0);
            onDim && onDim({ total: Math.max(u32(b, d + 4) - u32(b, d) - 1, 0) });
        } else if (id === 0x00fd) {
            put(u16(b, d), u16(b, d + 2), sst[u32(b, d + 6)] ?? '');
        } else if (id === 0x0203) {
            put(u16(b, d), u16(b, d + 2), num2s(dv.getFloat64(d + 6, true), u16(b, d + 4)));
        } else if (id === 0x027e) {
            put(u16(b, d), u16(b, d + 2), num2s(rkVal(u32(b, d + 6)), u16(b, d + 4)));
        } else if (id === 0x00bd) {
            const r = u16(b, d);
            const c0 = u16(b, d + 2);
            const k = ((n - 6) / 6) | 0;
            for (let i = 0; i < k; i++) {
                const o = d + 4 + i * 6;
                put(r, c0 + i, num2s(rkVal(u32(b, o + 2)), u16(b, o)));
            }
        } else if (id === 0x0204) {
            put(u16(b, d), u16(b, d + 2), xlsChars(b, d + 9, u16(b, d + 6), b[d + 8] & 1));
        } else if (id === 0x0205) {
            put(u16(b, d), u16(b, d + 2), b[d + 7] ? '' : b[d + 6] ? 'TRUE' : 'FALSE');
        } else if (id === 0x0006) {
            const r = u16(b, d);
            const c = u16(b, d + 2);
            if (b[d + 12] === 0xff && b[d + 13] === 0xff) {
                const t = b[d + 6];
                if (t === 0) pendingStr = [r, c];
                else if (t === 1) put(r, c, b[d + 8] ? 'TRUE' : 'FALSE');
                else put(r, c, '');
            } else {
                put(r, c, num2s(dv.getFloat64(d + 6, true), u16(b, d + 4)));
            }
        } else if (id === 0x0207 && pendingStr) {
            put(pendingStr[0], pendingStr[1], xlsChars(b, d + 3, u16(b, d), b[d + 2] & 1));
            pendingStr = null;
        }
    }
    if (!stop) flush();
};

// PICK par: header + sample rows + total
const xlsPreview = (bytes) => {
    const rows = [];
    let total = null;
    xlsWalk(bytes, {
        onRow: (r) => {
            if (nonBlankRow(r)) rows.push(r);
            return rows.length < PREVIEW_ROWS + 1;
        },
        onDim: (d) => { total = d.total; },
    });
    return { arr: rows, total };
};

// SUBMIT par: xls max 65,536 rows ki hoti hai, isliye sab rows parse karke batch-by-batch bhejte hain
const streamXls = async (bytes, { batchSize, onBatch, onBytes }) => {
    const all = [];
    let skipHeader = true;
    xlsWalk(bytes, {
        onRow: (r) => {
            if (!nonBlankRow(r)) return true;
            if (skipHeader) { skipHeader = false; return true; }
            all.push(r);
            return true;
        },
    });
    for (let i = 0; i < all.length; i += batchSize) {
        onBytes && onBytes(i / all.length);
        await onBatch(all.slice(i, i + batchSize));
        await paint(0);
    }
    onBytes && onBytes(1);
};
// XHR se upload taki real upload % mil sake
const uploadWithProgress = (url, fd, onProgress) =>
    new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.timeout = 10 * 60 * 1000;
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) onProgress(e.loaded / e.total);
        };
        xhr.onload = () => resolve(xhr.responseText);
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.ontimeout = () => reject(new Error('Upload timeout'));
        xhr.send(fd);
    });


// JS thread block ho tab bhi chalta hai (native driver). Estimated time par dheere-dheere bharta hai.
const EstimatedBar = ({ seconds }) => {
    const p = useRef(new Animated.Value(0)).current;
    const [w, setW] = useState(0);

    useEffect(() => {
        p.setValue(0);
        const anim = Animated.timing(p, {
            toValue: 1,
            duration: Math.max(3, seconds) * 1000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        });
        anim.start();
        return () => anim.stop();
    }, [seconds, p]);

    return (
        <View
            onLayout={(e) => setW(e.nativeEvent.layout.width)}
            style={{ height: 8, alignSelf: 'stretch', backgroundColor: '#E5E7EB', borderRadius: 4, marginTop: 14, overflow: 'hidden' }}
        >
            <Animated.View
                style={{
                    height: 8,
                    width: '100%',
                    backgroundColor: '#16A34A',
                    transform: [{ translateX: p.interpolate({ inputRange: [0, 1], outputRange: [-w, -w * 0.04] }) }],
                }}
            />
        </View>
    );
};
/* ---------------- REUSABLE SELECT MODAL ---------------- */
const SelectModal = ({ visible, title, data, onSelect, onClose, searchable, selectedKey }) => {
    const [q, setQ] = useState('');

    useEffect(() => {
        if (!visible) setQ('');
    }, [visible]);

    const list = q
        ? data.filter((d) => d.label.toLowerCase().includes(q.toLowerCase()))
        : data;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
                <View style={{ backgroundColor: '#fff', borderRadius: 12, maxHeight: '75%', overflow: 'hidden' }}>
                    <View
                        style={{
                            backgroundColor: colors.Brown,
                            paddingVertical: 12,
                            paddingHorizontal: 14,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'Inter-Bold' }}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {searchable && (
                        <View
                            style={{
                                margin: 10,
                                borderWidth: 1,
                                borderColor: '#d3d5d8',
                                borderRadius: 8,
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 8,
                                backgroundColor: '#F9FAFB',
                            }}
                        >
                            <Ionicons name="search-outline" size={16} color="#6B7280" />
                            <TextInput
                                placeholder="Search..."
                                placeholderTextColor="#9CA3AF"
                                value={q}
                                onChangeText={setQ}
                                style={{ flex: 1, paddingVertical: 6, paddingHorizontal: 6, fontFamily: 'Inter-Regular', color: '#111827' }}
                            />
                        </View>
                    )}

                    <FlatList
                        data={list}
                        keyExtractor={(item, i) => `${item.key}_${i}`}
                        keyboardShouldPersistTaps="handled"
                        ListEmptyComponent={
                            <Text style={{ textAlign: 'center', padding: 20, color: '#6B7280', fontFamily: 'Inter-Regular' }}>
                                No data found
                            </Text>
                        }
                        renderItem={({ item }) => {
                            const selected = item.key === selectedKey;
                            return (
                                <TouchableOpacity
                                    disabled={item.disabled}
                                    onPress={() => onSelect(item)}
                                    style={{
                                        paddingVertical: 12,
                                        paddingHorizontal: 14,
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#F3F4F6',
                                        backgroundColor: selected ? '#EFF6FF' : '#fff',
                                        opacity: item.disabled ? 0.4 : 1,
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ fontSize: 13, color: '#111827', fontFamily: 'Inter-Regular', flex: 1 }}>
                                        {item.label}
                                    </Text>
                                    {item.disabled && (
                                        <Text style={{ fontSize: 10, color: '#991B1B', fontFamily: 'Inter-Bold' }}>Used</Text>
                                    )}
                                    {selected && <Ionicons name="checkmark" size={18} color="#2563EB" />}
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </View>
        </Modal>
    );
};

/* ---------------- MAIN SCREEN ---------------- */
const VehicleFileUpload = () => {
    const navigation = useNavigation();
    const route = useRoute();

    // 'excel'  → Add New Excel (mapping wala flow)
    // 'direct' → Add New (CSV ya Excel dono, mapping nahi, seedha upload)
    // purana 'csv' param bhi direct hi maana jayega
    const fileType = route.params?.fileType || 'excel';
    const isDirect = fileType === 'direct' || fileType === 'csv';

    const [loading, setLoading] = useState(false);

    const [financeList, setFinanceList] = useState([]);
    const [selectedFinance, setSelectedFinance] = useState('');

    const [selectedFinanceId, setSelectedFinanceId] = useState('');
    const [showFinanceModal, setShowFinanceModal] = useState(false);

    const [columns, setColumns] = useState([]); // API se aaye db columns

    const [pickedFile, setPickedFile] = useState(null); // { name, uri, ext, size, delim }
    const [parsed, setParsed] = useState(null); // { headers, rows } → rows sirf preview ki hain
    const [totalRows, setTotalRows] = useState(null); // poori file ki rows (header chhodke), null = pata nahi
    const [mapping, setMapping] = useState([]); // index = file header index, value = db column ya ''
    const [pickIndex, setPickIndex] = useState(null); // kaunsa header ka dropdown khula hai

    const [formatMatched, setFormatMatched] = useState(false);
    const [formatErrors, setFormatErrors] = useState([]);

    // Progress modal (reading + uploading dono ke liye)
    const [job, setJob] = useState(null); // { kind: 'reading' | 'uploading', title, note }
    const [prog, setProg] = useState({ pct: null, text: '', sub: '' }); // pct null = indeterminate
    const [startedAt, setStartedAt] = useState(0);
    const [now, setNow] = useState(Date.now());

    const bytesRef = useRef(null); // Excel (mapping flow) ki file bytes, taaki Submit par dobara read/decode na ho

    const busy = !!job;

    useEffect(() => {
        fetchFinanceList();
        fetchColumnList();
        return () => {
            bytesRef.current = null;
        };
    }, []);

    // elapsed timer
    useEffect(() => {
        if (!job) return undefined;
        const t = setInterval(() => setNow(Date.now()), 500);
        return () => clearInterval(t);
    }, [job]);

    const startJob = (j, p = { pct: null, text: '', sub: '' }) => {
        setStartedAt(Date.now());
        setNow(Date.now());
        setProg(p);
        setJob(j);
    };

    // reading modal ka current step badlo (0,1,2)
    const setStep = (n) => setJob((j) => (j ? { ...j, step: n } : j));

    /* ---------- APIs ---------- */
    const fetchFinanceList = async () => {
        let rentAgencyId = 0;
        let staff_id = 0;

        try {
            setLoading(true);
            const response = await fetch(ENDPOINTS.Finance_List(rentAgencyId, staff_id));
            const result = await response.json();

            if (result.code === 200 && Array.isArray(result.payload)) {
                setFinanceList(result.payload);
            } else {
                setFinanceList([]);
                Toast.show({
                    type: 'error',
                    text1: 'No finance data found',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000,
                });
            }
        } catch (error) {
            console.log('Finance list fetch error:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchColumnList = async () => {
        try {
            const staffId = await AsyncStorage.getItem('staff_id'); // 👈 apni key check karo
            console.log('column_list url:', ENDPOINTS.column_list, 'staff_id:', staffId);

            const res = await fetch(ENDPOINTS.column_list, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_id: staffId }),
            });
            const text = await res.text();
            console.log('column_list response:', text);

            const json = JSON.parse(text);
            if (json.code === 200 && Array.isArray(json.columns)) {
                const list = json.columns.filter((c) => !HIDE_COLUMNS.includes(c.column_name));
                setColumns(list);
                return list;
            }

            Toast.show({ type: 'error', text1: json.message || 'Column list not found', position: 'bottom', bottomOffset: 60 });
            return [];
        } catch (e) {
            console.log('Column list error:', e.message);
            Toast.show({ type: 'error', text1: 'Column list API error', position: 'bottom', bottomOffset: 60 });
            return [];
        }
    };

    /* ---------- FILE PICK + PARSE ---------- */
    const autoMatch = (headers, cols) => {
        const used = new Set();
        return headers.map((h) => {
            const nh = norm(h);
            if (!nh) return '';

            // 1) pehle fix format se match
            const fixed = FIXED_FORMAT[nh];
            if (fixed && !used.has(fixed)) {
                used.add(fixed);
                return fixed;
            }

            // 2) nahi mila to column list ke naam se try
            const found = cols.find((c) => {
                if (used.has(c.column_name)) return false;
                const keys = [
                    norm(c.column_name),
                    norm(c.display_column_name),
                    norm(c.column_name.replace(/^vehicle_/, '')),
                ];
                return keys.includes(nh);
            });
            if (found) {
                used.add(found.column_name);
                return found.column_name;
            }
            return '';
        });
    };

    const handlePickFile = async () => {
        if (busy) return;

        if (!selectedFinance) {
            Toast.show({ type: 'error', text1: 'Please select a finance company first.', position: 'bottom', bottomOffset: 60 });
            return;
        }

        try {
            const res = await DocumentPicker.pickSingle({
                type: [DocumentPicker.types.allFiles],
                copyTo: 'cachesDirectory',
            });

            const ext = (res.name || '').split('.').pop().toLowerCase();
            if (!ALLOWED_EXT.includes(ext)) {
                Toast.show({
                    type: 'error',
                    text1: `Please select a valid file (${ALLOWED_EXT.join(', ')}).`,
                    position: 'bottom',
                    bottomOffset: 60,
                });
                return;
            }

            let cols = columns;
            if (!cols.length) {
                setLoading(true);
                cols = await fetchColumnList();
                setLoading(false);
            }
            if (!cols.length) return;

            const fileUri = res.fileCopyUri || res.uri;
            const path = toPath(fileUri);
            const stat = await RNFS.stat(path);
            const size = Number(stat.size) || 0;
            const mb = size / 1048576;
            const isCsv = CSV_EXT.includes(ext);

            bytesRef.current = null; // purani file ka data hatao
            console.log(`[VFU] picked ${res.name} (${mb.toFixed(2)} MB, ext=${ext}, direct=${isDirect})`);

            const excelMaxSec = Math.max(3, Math.ceil(mb * EXCEL_PREVIEW_SEC_PER_MB));

            startJob({
                kind: 'reading',
                title: 'Reading file...',
                steps: isCsv ? null : EXCEL_STEPS,
                step: 0,
                estSec: excelMaxSec,
                note: isCsv
                    ? `File size: ${mb.toFixed(1)} MB`
                    : `File size: ${mb.toFixed(1)} MB. Reading a small preview of the Excel file, this can take up to ~${fmtTime(excelMaxSec)} for large files (CSV is instant). The timer may pause briefly.`,
            });
            await paint();

            const t0 = Date.now();
            let arr = [];
            let total = null;
            let delim = ',';

            if (isCsv) {
                const p = await loadCsvPreview(path, size, ext);
                arr = p.arr;
                delim = p.delim;

                if (arr.length >= 2) {
                    startJob(
                        { kind: 'reading', title: 'Counting rows...', note: `File size: ${mb.toFixed(1)} MB` },
                        { pct: 0, text: 'Counting rows... 0%', sub: '' },
                    );
                    total = await countCsvRows(path, size, (pct) =>
                        setProg({ pct, text: `Counting rows... ${pct}%`, sub: '' }),
                    );
                }
            } else {
                let r = null;
                if (FAST_XLSX_EXT.includes(ext)) {
                    try {
                        setStep(2);
                        r = await fastXlsxPreview(path, size);
                    } catch (e) {
                        console.log('[VFU] fast preview failed, SheetJS fallback:', e.message);
                    }
                }

                if (!r && FAST_XLS_EXT.includes(ext)) {
                    try {
                        const u8x = await loadExcelBytes(path, setStep);
                        const rx = xlsPreview(u8x);
                        if (rx.arr.length >= 2) {
                            r = rx;
                            if (!isDirect) bytesRef.current = u8x; // Submit par dobara read na ho
                        }
                    } catch (e) {
                        console.log('[VFU] fast xls preview failed, SheetJS fallback:', e.message);
                    }
                }


                if (r && r.arr.length >= 2) {
                    arr = r.arr;
                    total = r.total;
                } else {
                    const u8 = await loadExcelBytes(path, setStep);
                    const r2 = readExcelPreview(u8);
                    arr = r2.arr;
                    total = r2.total;
                    if (!isDirect) bytesRef.current = u8;
                }
            }

            console.log(`[VFU] pick/parse total ${Date.now() - t0}ms, rows=${total}`);

            if (!arr.length || arr.length < 2) {
                Toast.show({ type: 'error', text1: 'The file is empty or no data was found.', position: 'bottom', bottomOffset: 60 });
                return;
            }

            const headers = makeHeaders(arr[0]);

            const rows = arr.slice(1, PREVIEW_ROWS + 1).map((r) => {
                const obj = {};
                headers.forEach((h, i) => {
                    obj[h] = cellText(r[i]);
                });
                return obj;
            });

            setTotalRows(total);
            setPickedFile({ name: res.name, uri: fileUri, ext, size, delim });
            setParsed({ headers, rows });

            const autoMap = autoMatch(headers, cols);
            setMapping(autoMap);

            if (isDirect) {
                const errs = checkFormat(headers, autoMap);
                setFormatErrors(errs);
                setFormatMatched(errs.length === 0);
            } else {
                setFormatErrors([]);
                setFormatMatched(false);
            }
        } catch (err) {
            if (!DocumentPicker.isCancel(err)) {
                console.log('Pick/parse error:', err);
                Toast.show({
                    type: 'error',
                    text1: 'Unable to read the file. For very large Excel files, please use CSV.',
                    position: 'bottom',
                    bottomOffset: 60,
                });
            }
        } finally {
            setJob(null);
            setLoading(false);
        }
    };

    /* ---------- MAPPING ---------- */
    const setMap = (index, dbColumn) => {
        setMapping((prev) => {
            const next = [...prev];
            next[index] = dbColumn;
            return next;
        });
    };

    const matchedCount = mapping.filter(Boolean).length;
    const totalCols = parsed?.headers.length || 0;

    const getUploadUrl = () => ENDPOINTS.ajax_vehicle_upload;

    /* ---------- SUBMIT ---------- */
    const postJson = async (body, timeoutMs = 120000) => {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeoutMs);
        const bodyStr = JSON.stringify(body);
        const t0 = Date.now();
        try {
            const res = await fetch(getUploadUrl(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: bodyStr,
                signal: ctrl.signal,
            });
            const text = await res.text();
            console.log(`[VFU] POST ${body.action} ${(bodyStr.length / 1024).toFixed(0)}KB -> ${Date.now() - t0}ms`);
            try {
                return JSON.parse(text);
            } catch (e) {
                console.log('Bad server response:', text.slice(0, 500));
                throw new Error('Invalid server response');
            }
        } catch (e) {
            if (e.name === 'AbortError') throw new Error('Server timeout');
            throw e;
        } finally {
            clearTimeout(timer);
        }
    };

    // Direct flow: CSV ho ya Excel, original file hi seedha csv_excel_file_upload par jati hai
    const handleDirectSubmit = async () => {
        if (!formatMatched) {
            Toast.show({
                type: 'error',
                text1: formatErrors[0] || 'The file format does not match.',
                position: 'bottom',
                bottomOffset: 60,
            });
            return;
        }
        if (!selectedFinanceId) {
            Toast.show({ type: 'error', text1: 'Finance ID not found.', position: 'bottom', bottomOffset: 60 });
            return;
        }

        const mb = (pickedFile.size || 0) / 1048576;

        try {
            startJob(
                {
                    kind: 'uploading',
                    title: 'Uploading file...',
                    note: 'After the upload reaches 100%, the server needs some time to process the file. Please wait.',
                },
                { pct: 0, text: `0.0 / ${mb.toFixed(1)} MB`, sub: '' },
            );

            const fd = new FormData();
            fd.append('finance', String(selectedFinanceId));
            fd.append('vehicle_excel_file', {
                uri: pickedFile.uri, // original file, bina convert kiye
                name: pickedFile.name, // original naam + extension
                type: MIME_TYPES[pickedFile.ext] || 'application/octet-stream',
            });

            let lastPct = -1;
            // Content-Type manually mat set karna, boundary RN khud lagata hai
            const text = await uploadWithProgress(ENDPOINTS.csv_excel_file_upload, fd, (f) => {
                const pct = Math.min(99, Math.round(f * 100));
                if (pct === lastPct) return;
                lastPct = pct;
                setProg({
                    pct,
                    text: `${(f * mb).toFixed(1)} / ${mb.toFixed(1)} MB`,
                    sub: f >= 1 ? 'Server is processing the file...' : '',
                });
            });
            console.log('direct upload response:', text);

            let json;
            try {
                json = JSON.parse(text);
            } catch (e) {
                throw new Error('Invalid server response');
            }

            if (json.status !== true) throw new Error(json.message || 'Upload failed');

            Toast.show({
                type: 'success',
                text1: `${json.inserted} vehicles uploaded${json.failed ? `, ${json.failed} failed` : ''}`,
                position: 'bottom',
                bottomOffset: 60,
            });
            navigation.goBack();
        } catch (e) {
            console.log('Direct upload error:', e.message);
            Toast.show({ type: 'error', text1: e.message || 'Upload failed', position: 'bottom', bottomOffset: 60 });
        } finally {
            setJob(null);
        }
    };

    const handleSubmit = async () => {
        if (busy) return;

        // Button hamesha dikhta hai, isliye yahin check hoga
        if (!selectedFinance || !parsed || !pickedFile) {
            Toast.show({
                type: 'error',
                text1: 'Please select a finance company and a file first.',
                position: 'bottom',
                bottomOffset: 60,
            });
            return;
        }

        if (isDirect) return handleDirectSubmit();

        if (matchedCount === 0) {
            Toast.show({
                type: 'error',
                text1: 'Please map at least one column.',
                position: 'bottom',
                bottomOffset: 60,
            });
            return;
        }

        const { headers } = parsed;
        const column_mapping = headers.map((_, i) => mapping[i] || '');

        // Finance name server khud set karta hai (PHP override karta hai), isliye bhejne ki zarurat nahi
        const sendIdx = headers
            .map((_, i) => i)
            .filter((i) => column_mapping[i] && column_mapping[i] !== 'vehicle_finance_name');

        if (!sendIdx.length) {
            Toast.show({
                type: 'error',
                text1: 'Please map at least one column (other than Finance Name).',
                position: 'bottom',
                bottomOffset: 60,
            });
            return;
        }

        // Chhote keys (c0, c1...) bhejte hain taki payload kam ho. PHP file_headers + column_mapping se hi match
        // karta hai, isliye PHP mein koi change nahi chahiye.
        const keys = sendIdx.map((_, k) => `c${k}`);
        const payloadMapping = sendIdx.map((i) => column_mapping[i]);
        const uploadNumber = `${Date.now()}`; // 👈 agar admin panel mein alag format hai to yahan change karna

        const isCsv = CSV_EXT.includes(pickedFile.ext);

        let total = totalRows || 0;
        let totalChunks = total ? Math.ceil(total / CHUNK_SIZE) : 0;

        let sent = 0; // kitni rows server ko bhej di
        let inserted = 0; // server ne kitni insert ki
        let chunkNo = 0;
        let bytesFrac = 0;

        const pushProg = () => {
            const pct =
                total > 0
                    ? Math.min(99, Math.round((sent / total) * 100))
                    : Math.min(99, Math.round(bytesFrac * 100));
            setProg({
                pct,
                text: total > 0 ? `${fmtNum(sent)} / ${fmtNum(total)} rows` : `${fmtNum(sent)} rows uploaded`,
                sub: totalChunks ? `Batch ${chunkNo} / ${totalChunks}` : `Batch ${chunkNo}`,
            });
        };

        const inflight = new Set(); // abhi chal rahi requests
        let firstError = null;

        // ek batch (array of arrays) server ko bhejo. UPLOAD_PARALLEL tak requests ek saath chalti hain.
        const sendBatch = async (rows) => {
            if (firstError) throw firstError;

            const chunk = rows.map((row) => {
                const o = {};
                for (let k = 0; k < sendIdx.length; k++) {
                    const v = cellText(row[sendIdx[k]]);
                    if (v !== '') o[keys[k]] = v; // khali value nahi bhejte (PHP ?? '' se handle karta hai)
                }
                return o;
            });
            const n = rows.length;

            const p = postJson({
                action: 'insert_chunk',
                finance: selectedFinance,
                file_name: pickedFile.name,
                vehicle_excel_upload_number: uploadNumber,
                file_headers: keys,
                column_mapping: payloadMapping,
                chunk_data: chunk,
            })
                .then((json) => {
                    if (json.status !== 'ok') throw new Error(json.message || 'Chunk upload failed');
                    chunkNo += 1;
                    sent += n;
                    inserted += Number(json.inserted ?? n);
                    pushProg();
                })
                .catch((e) => {
                    if (!firstError) firstError = e;
                })
                .finally(() => inflight.delete(p));

            inflight.add(p);
            if (inflight.size >= UPLOAD_PARALLEL) await Promise.race(inflight);
            if (firstError) throw firstError;
        };

        const drainUploads = async () => {
            await Promise.all([...inflight]);
            if (firstError) throw firstError;
        };

        const t0 = Date.now();

        try {
            startJob(
                {
                    kind: 'uploading',
                    title: 'Uploading...',
                    note: `Data is sent in batches of ${CHUNK_SIZE} rows.`,
                },
                {
                    pct: 0,
                    text: total > 0 ? `0 / ${fmtNum(total)} rows` : '0 rows uploaded',
                    sub: totalChunks ? `Batch 0 / ${totalChunks}` : '',
                },
            );
            await paint(150);

            const runSheetJs = async () => {
                const mbFull = (pickedFile.size || 0) / 1048576;
                const fullMaxSec = Math.max(5, Math.ceil(mbFull * EXCEL_MAX_SEC_PER_MB));
                startJob({
                    kind: 'reading',
                    title: 'Opening Excel file...',
                    steps: EXCEL_STEPS,
                    step: 0,
                    estSec: fullMaxSec,
                    note: `File size: ${mbFull.toFixed(1)} MB. This can take up to ~${fmtTime(fullMaxSec)}. The timer may pause until this step finishes, then the upload progress starts.`,
                });
                await paint();

                let u8 = bytesRef.current;
                if (u8) {
                    setStep(2);
                    await paint(100);
                } else {
                    u8 = await loadExcelBytes(toPath(pickedFile.uri), setStep);
                }
                const { ws, firstRow, lastRow, firstCol, lastCol } = openExcelFull(u8);
                bytesRef.current = null;
                total = Math.max(lastRow - firstRow, 0);
                totalChunks = total ? Math.ceil(total / CHUNK_SIZE) : 0;
                if (total < 1) throw new Error('No data rows found in the file');

                startJob(
                    { kind: 'uploading', title: 'Uploading...', note: `Data is sent in batches of ${CHUNK_SIZE} rows.` },
                    { pct: 0, text: `0 / ${fmtNum(total)} rows`, sub: `Batch 0 / ${totalChunks}` },
                );
                await paint(100);

                for (let start = firstRow + 1; start <= lastRow; start += CHUNK_SIZE) {
                    const end = Math.min(start + CHUNK_SIZE - 1, lastRow);
                    const rows = sheetSlice(ws, start, end, firstCol, lastCol);
                    if (rows.length) await sendBatch(rows);
                    await paint(0);
                }
            };

            if (isCsv) {
                await streamCsv(toPath(pickedFile.uri), pickedFile.size, pickedFile.delim || ',', {
                    batchSize: CHUNK_SIZE,
                    onBytes: (f) => { bytesFrac = f; },
                    onBatch: sendBatch,
                });
            } else if (FAST_XLSX_EXT.includes(pickedFile.ext)) {
                let posted = false;
                const xlsxOpts = {
                    batchSize: CHUNK_SIZE,
                    onPrep: (f) => setProg({ pct: Math.round(f * 100), text: 'Preparing file...', sub: '' }),
                    onBytes: (f) => { bytesFrac = f; },
                    onBatch: async (rows) => { posted = true; await sendBatch(rows); },
                };
                const xlsxPath = toPath(pickedFile.uri);
                try {
                    try {
                        await streamXlsxNative(xlsxPath, pickedFile.size, xlsxOpts); // native unzip
                    } catch (e) {
                        if (posted) throw e;
                        console.log('[VFU] native unzip failed, JS fallback:', e.message);
                        await streamXlsx(xlsxPath, pickedFile.size, xlsxOpts); // JS inflate
                    }
                } catch (e) {
                    if (posted) throw e; // upload shuru ho chuka ho to fallback nahi
                    console.log('[VFU] fast xlsx failed, SheetJS fallback:', e.message);
                    await runSheetJs();
                }
            } else if (FAST_XLS_EXT.includes(pickedFile.ext)) {
                let posted = false;
                try {
                    const u8 = bytesRef.current || (await loadExcelBytes(toPath(pickedFile.uri), () => { }));
                    await streamXls(u8, {
                        batchSize: CHUNK_SIZE,
                        onBytes: (f) => { bytesFrac = f; },
                        onBatch: async (rows) => { posted = true; await sendBatch(rows); },
                    });
                    bytesRef.current = null;
                } catch (e) {
                    if (posted) throw e;
                    console.log('[VFU] fast xls failed, SheetJS fallback:', e.message);
                    await runSheetJs();
                }
            } else {
                await runSheetJs();
            }

            await drainUploads(); // aakhri requests ka wait

            if (sent === 0) throw new Error('No data rows found in the file');

            const finalJson = await postJson({ action: 'final_sync_update' });
            console.log('final_sync_update response:', JSON.stringify(finalJson));
            console.log(`[VFU] upload done: sent=${sent}, inserted=${inserted}, ${Date.now() - t0}ms`);

            setProg({ pct: 100, text: `${fmtNum(sent)} / ${fmtNum(sent)} rows`, sub: 'Done' });

            Toast.show({
                type: 'success',
                text1: `File uploaded successfully (${fmtNum(inserted)} rows)`,
                position: 'bottom',
                bottomOffset: 60,
            });
            bytesRef.current = null;
            navigation.goBack();
        } catch (e) {
            console.log('Upload error:', e.message);
            await Promise.all([...inflight]); // chal rahi requests khatam hone do, taaki count sahi dikhe
            Toast.show({
                type: 'error',
                text1: `${e.message || 'Upload failed'}${sent ? ` (${fmtNum(inserted)} rows were already uploaded)` : ''}`,
                position: 'bottom',
                bottomOffset: 60,
                visibilityTime: 5000,
            });
        } finally {
            setJob(null);
        }
    };

    /* ---------- MODAL DATA ---------- */
    const financeData = financeList.map((f, i) => ({ key: String(i), label: getFinanceName(f) })).filter((f) => f.label);

    const columnData = [
        { key: '', label: '-- Not Mapped --' },
        ...columns.map((c) => ({
            key: c.column_name,
            label: c.column_name,
            disabled: mapping.some((m, idx) => m === c.column_name && idx !== pickIndex),
        })),
    ];

    const readyToSubmit = !!selectedFinance && !!parsed && !!pickedFile;

    const elapsed = job ? Math.max(0, (now - startedAt) / 1000) : 0;
    const eta =
        job && prog.pct !== null && prog.pct > 0 && prog.pct < 100 && elapsed > 3
            ? (elapsed * (100 - prog.pct)) / prog.pct
            : null;

    /* ---------- UI ---------- */
    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* HEADER */}
            <View style={{ backgroundColor: colors.Brown, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' }}>
                <TouchableOpacity
                    style={{ position: 'absolute', left: 10, top: 12, padding: 5 }}
                    onPress={() => navigation.goBack()}
                    disabled={busy}
                >
                    <Ionicons name="arrow-back" color="white" size={26} />
                </TouchableOpacity>
                <Text style={{ color: 'white', fontSize: 20, fontFamily: 'Inter-Bold' }}>
                    {isDirect ? 'Upload File' : 'Upload & Map File'}
                </Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 15, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
                {/* FINANCE */}
                <Text style={{ fontSize: 13, color: '#111827', fontFamily: 'Inter-Bold', marginBottom: 6 }}>
                    Finance Name<Text style={{ color: 'red' }}>*</Text>
                </Text>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setShowFinanceModal(true)}
                    disabled={!!parsed}
                    style={{
                        borderWidth: 1,
                        borderColor: '#d3d5d8',
                        backgroundColor: '#F9FAFB',
                        borderRadius: 10,
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: parsed ? 0.7 : 1,
                    }}
                >
                    <Text
                        style={{ fontSize: 13, fontFamily: 'Inter-Regular', color: selectedFinance ? '#111827' : '#9CA3AF', flex: 1 }}
                        numberOfLines={1}
                    >
                        {selectedFinance || 'Select Finance'}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#6B7280" />
                </TouchableOpacity>

                {/* FILE */}
                <Text style={{ fontSize: 13, color: '#111827', fontFamily: 'Inter-Bold', marginTop: 16, marginBottom: 6 }}>
                    Select Vehicle File (CSV / Excel)
                    <Text style={{ color: 'red' }}>*</Text>
                </Text>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handlePickFile}
                    disabled={busy}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isDirect ? '#2563EB' : '#16A34A',
                        borderRadius: 10,
                        paddingVertical: 12,
                        gap: 8,
                    }}
                >
                    <FontAwesome5 name={isDirect ? 'file-upload' : 'file-excel'} size={15} color="white" />
                    <Text style={{ color: 'white', fontSize: 13, fontFamily: 'Inter-Bold' }}>
                        {pickedFile ? 'Change File' : 'Choose File'}
                    </Text>
                </TouchableOpacity>

                {isDirect && !pickedFile && (
                    <Text style={{ marginTop: 6, fontSize: 11, color: '#6B7280', fontFamily: 'Inter-Regular' }}>
                        CSV, XLS, XLSX and other Excel files are supported. The columns must follow the required format.
                    </Text>
                )}

                {!isDirect && !pickedFile && (
                    <Text style={{ marginTop: 6, fontSize: 11, color: '#6B7280', fontFamily: 'Inter-Regular' }}>
                        Tip: CSV files are read much faster than Excel files, especially for large data.
                    </Text>
                )}

                {pickedFile && parsed && (
                    <View
                        style={{
                            marginTop: 10,
                            backgroundColor: '#EFF6FF',
                            borderRadius: 10,
                            padding: 10,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <Ionicons name="document-text-outline" size={18} color="#2563EB" />
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, color: '#111827', fontFamily: 'Inter-Bold' }} numberOfLines={1}>
                                {pickedFile.name}
                            </Text>
                            <Text style={{ fontSize: 11, color: '#6B7280', fontFamily: 'Inter-Regular' }}>
                                {totalRows !== null && totalRows !== undefined ? fmtNum(totalRows) : `${PREVIEW_ROWS}+`} rows •{' '}
                                {parsed.headers.length} columns • {((pickedFile.size || 0) / 1048576).toFixed(1)} MB
                            </Text>
                        </View>
                    </View>
                )}
                {pickedFile && !CSV_EXT.includes(pickedFile.ext) && !FAST_XLSX_EXT.includes(pickedFile.ext) && !FAST_XLS_EXT.includes(pickedFile.ext) && !isDirect && (pickedFile.size || 0) > 5 * 1048576 && (
                    <Text style={{ marginTop: 8, fontSize: 11, color: '#92400E', fontFamily: 'Inter-Regular' }}>
                        Large Excel file: opening it on Submit can take up to ~
                        {fmtTime(Math.ceil(((pickedFile.size || 0) / 1048576) * EXCEL_MAX_SEC_PER_MB))}. CSV files start uploading instantly.
                    </Text>
                )}

                {/* DIRECT FLOW: sirf format check card, mapping nahi */}
                {parsed && isDirect && (
                    <View
                        style={{
                            marginTop: 20,
                            backgroundColor: formatMatched ? '#F0FDF4' : '#FEF2F2',
                            borderWidth: 1,
                            borderColor: formatMatched ? '#16A34A' : '#DC2626',
                            borderRadius: 10,
                            padding: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <Ionicons
                            name={formatMatched ? 'checkmark-circle' : 'close-circle'}
                            size={24}
                            color={formatMatched ? '#16A34A' : '#DC2626'}
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, color: formatMatched ? '#166534' : '#991B1B', fontFamily: 'Inter-Bold' }}>
                                {formatMatched ? 'Format matched' : 'Format mismatch'}
                            </Text>

                            {formatMatched ? (
                                <Text style={{ fontSize: 11, color: '#166534', fontFamily: 'Inter-Regular', marginTop: 2 }}>
                                    You can submit the file now.
                                </Text>
                            ) : (
                                <View style={{ marginTop: 4 }}>
                                    {formatErrors.slice(0, 6).map((e, i) => (
                                        <Text key={i} style={{ fontSize: 11, color: '#991B1B', fontFamily: 'Inter-Regular', marginTop: 2 }}>
                                            • {e}
                                        </Text>
                                    ))}
                                    {formatErrors.length > 6 && (
                                        <Text style={{ fontSize: 11, color: '#991B1B', fontFamily: 'Inter-Bold', marginTop: 4 }}>
                                            + {formatErrors.length - 6} more errors
                                        </Text>
                                    )}
                                    <Text style={{ fontSize: 11, color: '#6B7280', fontFamily: 'Inter-Regular', marginTop: 6 }}>
                                        Please correct the file or use the "Add New Excel" option to map the columns.
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* EXCEL FLOW: mapping (header + dropdown + sample rows) */}
                {parsed && !isDirect && (
                    <>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 8 }}>
                            <Text style={{ fontSize: 14, color: '#111827', fontFamily: 'Inter-Bold' }}>Map Columns</Text>
                            <View style={{ backgroundColor: matchedCount === totalCols ? '#DCFCE7' : '#FEF3C7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                                <Text style={{ fontSize: 11, fontFamily: 'Inter-Bold', color: matchedCount === totalCols ? '#166534' : '#92400E' }}>
                                    {matchedCount}/{totalCols} mapped
                                </Text>
                            </View>
                        </View>

                        <Text style={{ fontSize: 11, color: '#6B7280', fontFamily: 'Inter-Regular', marginBottom: 8 }}>
                            Select a column from the dropdown for any unmatched columns (yellow). Columns marked "Not Mapped" will not be uploaded.
                            {'\n'}Showing the first {parsed.rows.length} rows as a sample. The full file will be uploaded on Submit.
                        </Text>

                        <ScrollView
                            horizontal
                            nestedScrollEnabled
                            showsHorizontalScrollIndicator
                            style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10 }}
                        >
                            <View>
                                {/* 1) file ke header names */}
                                <View style={{ flexDirection: 'row' }}>
                                    {parsed.headers.map((h, i) => (
                                        <View
                                            key={`h_${h}_${i}`}
                                            style={{
                                                width: COL_W,
                                                paddingVertical: 10,
                                                paddingHorizontal: 8,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: mapping[i] ? '#DCFCE7' : '#fff',
                                                borderRightWidth: 1,
                                                borderBottomWidth: 1,
                                                borderColor: '#E5E7EB',
                                            }}
                                        >
                                            <Text style={{ fontSize: 12, color: '#111827', fontFamily: 'Inter-Bold', textAlign: 'center' }} numberOfLines={2}>
                                                {h}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                {/* 2) har column ka dropdown */}
                                <View style={{ flexDirection: 'row', backgroundColor: '#fff' }}>
                                    {parsed.headers.map((h, i) => {
                                        const mapped = mapping[i];
                                        return (
                                            <View
                                                key={`d_${h}_${i}`}
                                                style={{
                                                    width: COL_W,
                                                    padding: 6,
                                                    borderRightWidth: 1,
                                                    borderBottomWidth: 1,
                                                    borderColor: '#E5E7EB',
                                                }}
                                            >
                                                <TouchableOpacity
                                                    activeOpacity={0.8}
                                                    onPress={() => setPickIndex(i)}
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        borderWidth: 1,
                                                        borderColor: mapped ? '#16A34A' : '#F59E0B',
                                                        backgroundColor: mapped ? '#F0FDF4' : '#FFFBEB',
                                                        borderRadius: 8,
                                                        paddingVertical: 8,
                                                        paddingHorizontal: 8,
                                                    }}
                                                >
                                                    <Text
                                                        style={{ fontSize: 11, fontFamily: 'Inter-Regular', color: mapped ? '#166534' : '#92400E', flex: 1 }}
                                                        numberOfLines={1}
                                                    >
                                                        {mapped || '--Select Column--'}
                                                    </Text>
                                                    <Ionicons name="chevron-down" size={14} color="#6B7280" />
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    })}
                                </View>

                                {/* 3) sample data rows */}
                                {parsed.rows.map((row, ri) => (
                                    <View
                                        key={`r_${ri}`}
                                        style={{ flexDirection: 'row', backgroundColor: ri % 2 === 0 ? '#F3F4F6' : '#fff' }}
                                    >
                                        {parsed.headers.map((h, ci) => (
                                            <View
                                                key={`c_${ri}_${ci}`}
                                                style={{
                                                    width: COL_W,
                                                    paddingVertical: 10,
                                                    paddingHorizontal: 8,
                                                    borderRightWidth: 1,
                                                    borderColor: '#E5E7EB',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Text style={{ fontSize: 11, color: '#111827', fontFamily: 'Inter-Regular' }} numberOfLines={2}>
                                                    {row[h] || '-'}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    </>
                )}
            </ScrollView>

            {/* SUBMIT — hamesha dikhega, dabane par validation toast aayega */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSubmit}
                    disabled={busy}
                    style={{
                        backgroundColor: colors.Brown,
                        borderRadius: 10,
                        paddingVertical: 13,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 8,
                        opacity: readyToSubmit ? 1 : 0.6,
                    }}
                >
                    <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Inter-Bold' }}>Submit</Text>
                </TouchableOpacity>
            </View>

            {/* FINANCE MODAL */}
            <SelectModal
                visible={showFinanceModal}
                title="Select Finance"
                data={financeData}
                searchable
                selectedKey={financeData.find((f) => f.label === selectedFinance)?.key}
                onClose={() => setShowFinanceModal(false)}
                onSelect={(item) => {
                    const f = financeList[Number(item.key)];
                    setSelectedFinance(item.label);
                    setSelectedFinanceId(getFinanceId(f));
                    setShowFinanceModal(false);
                }}
            />

            {/* COLUMN MODAL (sirf Excel mapping flow mein khulega) */}
            <SelectModal
                visible={pickIndex !== null}
                title="Select Column"
                data={columnData}
                searchable
                selectedKey={pickIndex !== null ? mapping[pickIndex] || '' : ''}
                onClose={() => setPickIndex(null)}
                onSelect={(item) => {
                    setMap(pickIndex, item.key);
                    setPickIndex(null);
                }}
            />

            {/* LOADING (finance/column list) */}
            {loading && (
                <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.Brown} />
                </View>
            )}

            {/* PROGRESS MODAL: file reading + upload, dono ke liye */}
            <Modal visible={!!job} transparent animationType="fade" onRequestClose={() => { }}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 30 }}>
                    <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center' }}>
                        <Text style={{ fontSize: 15, fontFamily: 'Inter-Bold', color: '#111827' }}>{job?.title}</Text>

                        {prog.pct === null ? (
                            job?.estSec ? (
                                <>
                                    <EstimatedBar key={startedAt} seconds={job.estSec} />
                                    <Text style={{ marginTop: 6, fontSize: 11, color: '#6B7280', fontFamily: 'Inter-Regular' }}>
                                        Estimated progress (screen may pause briefly)
                                    </Text>
                                </>
                            ) : (
                                <ActivityIndicator size="small" color={colors.Brown} style={{ marginTop: 14 }} />
                            )
                        ) : (
                            <>
                                <View style={{ height: 8, alignSelf: 'stretch', backgroundColor: '#E5E7EB', borderRadius: 4, marginTop: 14, overflow: 'hidden' }}>
                                    <View style={{ height: 8, width: `${prog.pct}%`, backgroundColor: '#16A34A' }} />
                                </View>
                                <Text style={{ marginTop: 8, fontSize: 18, fontFamily: 'Inter-Bold', color: '#111827' }}>{prog.pct}%</Text>
                            </>
                        )}

                        {!!prog.text && (
                            <Text style={{ marginTop: 6, fontSize: 13, color: '#111827', fontFamily: 'Inter-Bold' }}>{prog.text}</Text>
                        )}
                        {!!prog.sub && (
                            <Text style={{ marginTop: 2, fontSize: 12, color: '#6B7280', fontFamily: 'Inter-Regular' }}>{prog.sub}</Text>
                        )}

                        {job?.steps ? (
                            <View style={{ alignSelf: 'stretch', marginTop: 14 }}>
                                {job.steps.map((label, i) => {
                                    const cur = job.step || 0;
                                    const done = i < cur;
                                    const active = i === cur;
                                    return (
                                        <View key={label} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5 }}>
                                            <Ionicons
                                                name={done ? 'checkmark-circle' : active ? 'arrow-forward-circle' : 'ellipse-outline'}
                                                size={18}
                                                color={done ? '#16A34A' : active ? colors.Brown : '#9CA3AF'}
                                            />
                                            <Text
                                                style={{
                                                    marginLeft: 8,
                                                    flex: 1,
                                                    fontSize: 12,
                                                    fontFamily: active ? 'Inter-Bold' : 'Inter-Regular',
                                                    color: done ? '#166534' : active ? '#111827' : '#9CA3AF',
                                                }}
                                            >
                                                {label}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        ) : (
                            <Text style={{ marginTop: 10, fontSize: 12, color: '#374151', fontFamily: 'Inter-Regular' }}>
                                Elapsed {fmtTime(elapsed)}
                                {eta !== null ? `  •  ~${fmtTime(eta)} left` : ''}
                            </Text>
                        )}

                        {!!job?.note && (
                            <Text style={{ marginTop: 8, fontSize: 11, color: '#6B7280', fontFamily: 'Inter-Regular', textAlign: 'center' }}>
                                {job.note}
                            </Text>
                        )}

                        <Text style={{ marginTop: 8, fontSize: 12, color: '#991B1B', fontFamily: 'Inter-Bold' }}>Do not close the app</Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default VehicleFileUpload;