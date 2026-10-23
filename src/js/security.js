/**
 * LAL ANGLE HOMESTAY · SECURITY & ANTI-SPAM MODULE
 * - Rate Limiting (Giới hạn tần suất gửi)
 * - Idempotency Key (Khóa bất biến chống trùng lặp đơn)
 * - Honeypot Trap (Bẫy bot ngầm)
 * - Time-Trap (Chống auto-fill bot siêu tốc)
 * - Anti-XSS Input Sanitization
 */

import { STORAGE_KEYS, SECURITY_CONFIG } from './config.js';

let formInteractionStartTime = 0;

/* ==========================================================================
   1. TIME-TRAP (CHỐNG BOT ĐIỀN FORM SIÊU TỐC)
   ========================================================================== */
export function recordFormInteraction() {
  if (!formInteractionStartTime) {
    formInteractionStartTime = Date.now();
  }
}

export function verifyTimeTrap() {
  if (!formInteractionStartTime) return false;
  const elapsed = Date.now() - formInteractionStartTime;
  // Bot thường gửi trong vòng vài mili-giây
  return elapsed >= SECURITY_CONFIG.MIN_FORM_FILL_TIME_MS;
}

export function resetTimeTrap() {
  formInteractionStartTime = 0;
}

/* ==========================================================================
   2. HONEYPOT TRAP (BẪY BOT TỰ ĐỘNG ĐIỀN INPUT ẨN)
   ========================================================================== */
export function verifyHoneypot() {
  const hpInput = document.getElementById('website_hp_check');
  if (hpInput && hpInput.value && hpInput.value.trim().length > 0) {
    console.warn('[SECURITY] Honeypot triggered. Suspicious bot activity.');
    return false; // Phát hiện bot
  }
  return true;
}

/* ==========================================================================
   3. RATE LIMITING (GIỚI HẠN TẦN SUẤT GỬI ĐƠN)
   ========================================================================== */
export function checkRateLimit() {
  const now = Date.now();
  
  // 3.1. Kiểm tra Cooldown giữa 2 lần gửi liên tiếp (15 giây)
  const lastSubmit = parseInt(localStorage.getItem(STORAGE_KEYS.RATE_LIMIT_TIMESTAMP) || '0', 10);
  const diffSeconds = Math.floor((now - lastSubmit) / 1000);
  if (diffSeconds < SECURITY_CONFIG.COOLDOWN_SECONDS) {
    const remaining = SECURITY_CONFIG.COOLDOWN_SECONDS - diffSeconds;
    return {
      allowed: false,
      reason: 'cooldown',
      remainingSeconds: remaining,
      message: `Bạn vừa gửi một yêu cầu. Vui lòng chờ ${remaining} giây trước khi gửi tiếp để tránh trùng lặp.`
    };
  }

  // 3.2. Kiểm tra Sliding Window (Tối đa 3 đơn / 5 phút)
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem(STORAGE_KEYS.RATE_LIMIT_HISTORY) || '[]');
  } catch (e) {
    history = [];
  }

  // Lọc các lần gửi còn nằm trong khung thời gian 5 phút
  const validHistory = history.filter(ts => (now - ts) < SECURITY_CONFIG.WINDOW_TIME_MS);
  if (validHistory.length >= SECURITY_CONFIG.MAX_SUBMISSIONS_WINDOW) {
    const oldestInWindow = validHistory[0];
    const waitSeconds = Math.ceil((SECURITY_CONFIG.WINDOW_TIME_MS - (now - oldestInWindow)) / 1000);
    return {
      allowed: false,
      reason: 'window_exceeded',
      remainingSeconds: waitSeconds,
      message: `Hệ thống ghi nhận bạn đã gửi ${validHistory.length} đơn liên tiếp. Để bảo mật, vui lòng chờ ${Math.ceil(waitSeconds / 60)} phút trước khi gửi thêm.`
    };
  }

  return { allowed: true };
}

export function recordSuccessfulSubmission() {
  const now = Date.now();
  localStorage.setItem(STORAGE_KEYS.RATE_LIMIT_TIMESTAMP, now.toString());

  let history = [];
  try {
    history = JSON.parse(localStorage.getItem(STORAGE_KEYS.RATE_LIMIT_HISTORY) || '[]');
  } catch (e) {
    history = [];
  }
  history.push(now);
  // Giữ tối đa 10 phần tử gần nhất
  if (history.length > 10) history = history.slice(-10);
  localStorage.setItem(STORAGE_KEYS.RATE_LIMIT_HISTORY, JSON.stringify(history));
}

/* ==========================================================================
   4. IDEMPOTENCY KEY (CHỐNG TRÙNG LẶP ĐƠN DO DOUBLE-CLICK HOẶC MẠNG RETRY)
   ========================================================================== */
export function generateIdempotencyKey(data) {
  // Tạo hash nội dung đơn (SĐT + Phòng + Ngày đến + Ngày đi)
  const signature = `${data.phone}_${data.room}_${data.checkIn}_${data.checkOut}`.replace(/\s+/g, '');
  
  // Tạo UUID ngẫu nhiên
  let uuid = '';
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    uuid = crypto.randomUUID();
  } else {
    uuid = 'idemp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  }
  return {
    key: uuid,
    signature: signature
  };
}

export function isIdempotentDuplicate(signature) {
  try {
    const store = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.IDEMPOTENCY_STORE) || '{}');
    const existing = store[signature];
    if (existing && (Date.now() - existing.timestamp < 15 * 60 * 1000)) {
      // Đã gửi trong vòng 15 phút
      return existing.record;
    }
  } catch (e) {}
  return null;
}

export function saveIdempotencyRecord(signature, record) {
  try {
    const store = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.IDEMPOTENCY_STORE) || '{}');
    store[signature] = {
      timestamp: Date.now(),
      record: record
    };
    sessionStorage.setItem(STORAGE_KEYS.IDEMPOTENCY_STORE, JSON.stringify(store));
  } catch (e) {}
}

/* ==========================================================================
   5. SANITIZATION & INPUT VALIDATION (ANTI-XSS)
   ========================================================================== */
export function sanitizeInput(str, maxLength = 100) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '') // Loại bỏ thẻ HTML nguy hiểm
    .trim()
    .slice(0, maxLength);
}

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function escapeTelegramMarkdown(text) {
  if (!text) return '';
  // Thoát ký tự nhạy cảm của cú pháp Markdown
  return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

export function validateVietnamesePhone(phone) {
  const cleaned = phone.replace(/[\s\.\-\(\)]/g, '');
  // Đầu số 03, 05, 07, 08, 09 kèm 8 số sau (chuẩn 10 số VN)
  const regex = /^(0[3|5|7|8|9])[0-9]{8}$/;
  return regex.test(cleaned);
}
