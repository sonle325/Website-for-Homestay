/**
 * LAL ANGLE HOMESTAY · BOOKING CORE LOGIC & ANTI-SPAM PIPELINE
 * - Quản lý ngày Check-in, Check-out & Tính giá tự động
 * - Kiểm tra bảo mật đa lớp: Rate Limit, Idempotency Key, Honeypot, Time-Trap, Input Sanitization
 * - Gửi đơn về Telegram & Lưu trữ lịch sử cục bộ
 */

import { 
  checkRateLimit, 
  recordSuccessfulSubmission, 
  generateIdempotencyKey, 
  isIdempotentDuplicate, 
  saveIdempotencyRecord,
  verifyHoneypot, 
  verifyTimeTrap, 
  recordFormInteraction,
  resetTimeTrap,
  sanitizeInput, 
  validateVietnamesePhone 
} from './security.js';
import { getRoomsStatus } from './rooms.js';
import { sendTelegramNotification } from './telegram.js';
import { saveLocalBooking } from './admin.js';

let selectedPricePerNight = 1250000;

export function formatDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateVN(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

export function formatVND(amount) {
  return amount.toLocaleString('vi-VN') + 'đ';
}

/* ==========================================================================
   1. KHỞI TẠO NGÀY MẶC ĐỊNH
   ========================================================================== */
export function initDateDefaults() {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const checkIn = document.getElementById('checkInDate');
  const checkOut = document.getElementById('checkOutDate');

  if (checkIn && checkOut) {
    checkIn.min = formatDateInput(today);
    checkIn.value = formatDateInput(today);

    checkOut.min = formatDateInput(tomorrow);
    checkOut.value = formatDateInput(tomorrow);

    checkIn.addEventListener('change', () => {
      const nextDay = new Date(checkIn.value);
      nextDay.setDate(nextDay.getDate() + 1);
      checkOut.min = formatDateInput(nextDay);
      if (new Date(checkOut.value) <= new Date(checkIn.value)) {
        checkOut.value = formatDateInput(nextDay);
      }
      updatePrice();
    });

    checkOut.addEventListener('change', () => {
      updatePrice();
    });
  }
}

/* ==========================================================================
   2. KHUNG TÌM NHANH TRÊN HERO BANNER
   ========================================================================== */
export function initQuickSearch() {
  const qCheckIn = document.getElementById('quickCheckIn');
  const qCheckOut = document.getElementById('quickCheckOut');
  const qGuests = document.getElementById('quickGuests');
  const btnQuickSearch = document.getElementById('btnQuickSearch');

  if (qCheckIn && qCheckOut) {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    qCheckIn.min = formatDateInput(today);
    qCheckIn.value = formatDateInput(today);
    qCheckOut.min = formatDateInput(tomorrow);
    qCheckOut.value = formatDateInput(tomorrow);

    qCheckIn.addEventListener('change', () => {
      const nextDay = new Date(qCheckIn.value);
      nextDay.setDate(nextDay.getDate() + 1);
      qCheckOut.min = formatDateInput(nextDay);
      if (new Date(qCheckOut.value) <= new Date(qCheckIn.value)) {
        qCheckOut.value = formatDateInput(nextDay);
      }
    });
  }

  if (btnQuickSearch) {
    btnQuickSearch.addEventListener('click', () => {
      const mainCheckIn = document.getElementById('checkInDate');
      const mainCheckOut = document.getElementById('checkOutDate');
      const mainGuests = document.getElementById('guestCount');

      if (qCheckIn && mainCheckIn) mainCheckIn.value = qCheckIn.value;
      if (qCheckOut && mainCheckOut) mainCheckOut.value = qCheckOut.value;
      if (qGuests && mainGuests) {
        // Map số khách
        const val = qGuests.value;
        if (val === '2') mainGuests.value = '2 người lớn';
        else if (val === '4') mainGuests.value = '3 - 4 người lớn';
        else if (val === '6') mainGuests.value = '5 - 6 người lớn';
        else if (val === '12') mainGuests.value = 'Đoàn trên 8 người';
      }

      const target = document.getElementById('rooms') || document.getElementById('booking');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
      updatePrice();
    });
  }
}

/* ==========================================================================
   3. CHỌN PHÒNG & TÍNH TIỀN TỰ ĐỘNG
   ========================================================================== */
export function chooseRoom(roomVal, pricePerNight) {
  // Kiểm tra phòng có đang bị khóa (hết phòng) hay không
  const rooms = getRoomsStatus();
  const matched = rooms.find(r => r.selectValue === roomVal);
  if (matched && matched.status === 'SOLDOUT') {
    alert('Rất tiếc! Gian phòng này hiện đã kín lịch. Bạn vui lòng chọn gian phòng khác hoặc liên hệ hotline để được hỗ trợ nhé.');
    return;
  }

  const roomSelect = document.getElementById('roomType');
  if (roomSelect) {
    roomSelect.value = roomVal;
    selectedPricePerNight = pricePerNight;
    updatePrice();

    const bookingSection = document.getElementById('booking');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

export function initCostCalculator() {
  const roomSelect = document.getElementById('roomType');
  if (roomSelect) {
    roomSelect.addEventListener('change', (e) => {
      const opt = e.target.selectedOptions[0];
      if (opt && opt.dataset.price) {
        selectedPricePerNight = parseInt(opt.dataset.price, 10);
      }
      updatePrice();
    });
  }
}

export function updatePrice() {
  const checkIn = document.getElementById('checkInDate');
  const checkOut = document.getElementById('checkOutDate');
  const calcNightsEl = document.getElementById('calcNights');
  const calcTotalEl = document.getElementById('calcDirectTotal');

  if (!checkIn || !checkOut || !checkIn.value || !checkOut.value) return;

  const d1 = new Date(checkIn.value);
  const d2 = new Date(checkOut.value);
  const diffTime = d2.getTime() - d1.getTime();
  let nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (nights < 1) nights = 1;

  if (calcNightsEl) calcNightsEl.textContent = `${nights} đêm`;

  const total = nights * selectedPricePerNight;
  if (calcTotalEl) calcTotalEl.textContent = formatVND(total);
}

/* ==========================================================================
   4. PIPELINE BẢO MẬT & SUBMIT FORM
   ========================================================================== */
export function initReservationForm() {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  // Lắng nghe tương tác đầu tiên để kích hoạt Time-Trap
  form.addEventListener('focusin', recordFormInteraction, { once: true });
  form.addEventListener('click', recordFormInteraction, { once: true });

  form.addEventListener('submit', handleFormSubmit);
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById('guestName');
  const phoneInput = document.getElementById('guestPhone');
  const roomInput = document.getElementById('roomType');
  const checkInInput = document.getElementById('checkInDate');
  const checkOutInput = document.getElementById('checkOutDate');
  const guestsInput = document.getElementById('guestCount');
  const extraInput = document.getElementById('extraService');
  const notesInput = document.getElementById('specialNotes');

  const btnSubmit = document.getElementById('btnSubmit');
  const btnText = btnSubmit?.querySelector('.btn-text');
  const btnLoading = btnSubmit?.querySelector('.btn-loading');

  // 1. Kiểm tra Honeypot Trap
  if (!verifyHoneypot()) {
    console.warn('[SECURITY] Bot trap detected. Request cancelled.');
    return;
  }

  // 2. Kiểm tra Time-Trap (Chống bot gửi dưới 2s)
  if (!verifyTimeTrap()) {
    alert('Thao tác quá nhanh. Vui lòng kiểm tra lại thông tin trước khi gửi.');
    return;
  }

  // 3. Validation dữ liệu đầu vào & Anti-XSS Sanitization
  const rawName = sanitizeInput(nameInput?.value || '', 60);
  const rawPhone = sanitizeInput(phoneInput?.value || '', 15);
  const rawNotes = sanitizeInput(notesInput?.value || '', 300);

  let hasError = false;

  // Tên
  if (!rawName || rawName.length < 2) {
    setFieldError(nameInput, true);
    hasError = true;
  } else {
    setFieldError(nameInput, false);
  }

  // SĐT Việt Nam
  if (!rawPhone || !validateVietnamesePhone(rawPhone)) {
    setFieldError(phoneInput, true);
    hasError = true;
  } else {
    setFieldError(phoneInput, false);
  }

  // Phòng
  if (!roomInput || !roomInput.value) {
    setFieldError(roomInput, true);
    hasError = true;
  } else {
    // Kiểm tra xem phòng có bị khoá kín lịch hay không
    const rooms = getRoomsStatus();
    const matched = rooms.find(r => r.selectValue === roomInput.value);
    if (matched && matched.status === 'SOLDOUT') {
      alert('Gian phòng bạn chọn hiện đã kín lịch. Vui lòng chọn gian phòng khác.');
      setFieldError(roomInput, true);
      return;
    }
    setFieldError(roomInput, false);
  }

  if (hasError) return;

  // 4. Rate Limiting Check
  const rateLimitStatus = checkRateLimit();
  if (!rateLimitStatus.allowed) {
    alert(rateLimitStatus.message);
    return;
  }

  // Chuẩn bị dữ liệu
  const checkInFormatted = formatDateVN(checkInInput?.value);
  const checkOutFormatted = formatDateVN(checkOutInput?.value);
  const totalMoneyText = document.getElementById('calcDirectTotal')?.textContent || '1.250.000đ';
  const nightsText = document.getElementById('calcNights')?.textContent || '1 đêm';

  const bookingData = {
    name: rawName,
    phone: rawPhone,
    room: roomInput.value,
    checkIn: checkInFormatted,
    checkOut: checkOutFormatted,
    nights: nightsText,
    guests: guestsInput?.value || '2 người lớn',
    extra: extraInput?.value || 'Không có',
    notes: rawNotes || 'Không có',
    total: totalMoneyText,
    time: new Date().toLocaleString('vi-VN', { hour12: false })
  };

  // 5. Idempotency Key Check (Chống trùng lặp đơn khi bấm đúp)
  const idemp = generateIdempotencyKey(bookingData);
  bookingData.idempotencyKey = idemp.key;

  const previousRecord = isIdempotentDuplicate(idemp.signature);
  if (previousRecord) {
    // Đã từng gửi đơn giống hệt trong 15 phút qua -> Hiển thị lại popup thành công, không bắn tin trùng lặp
    console.info('[IDEMPOTENCY] Reusing previous idempotent submission');
    showSuccessPopup(previousRecord);
    return;
  }

  // 6. Khoá nút submit (Anti-Double Click)
  if (btnSubmit) btnSubmit.disabled = true;
  if (btnText) btnText.classList.add('d-none');
  if (btnLoading) btnLoading.classList.remove('d-none');

  try {
    // 7. Gửi thông báo về Telegram
    await sendTelegramNotification(bookingData);

    // 8. Lưu vào lịch sử cục bộ & Idempotency Store
    saveLocalBooking(bookingData);
    saveIdempotencyRecord(idemp.signature, bookingData);
    recordSuccessfulSubmission();

    // 9. Reset Time Trap
    resetTimeTrap();

    // 10. Hiển thị Popup thành công
    showSuccessPopup(bookingData);

    // Reset Form
    const formEl = document.getElementById('bookingForm');
    if (formEl) formEl.reset();
    initDateDefaults();
    updatePrice();

  } catch (err) {
    console.error('Lỗi khi gửi đơn:', err);
    alert('Có lỗi nhỏ xảy ra khi gửi thông báo. Quản lý sẽ chủ động liên hệ bạn qua SĐT/Zalo sớm nhất!');
  } finally {
    if (btnSubmit) btnSubmit.disabled = false;
    if (btnText) btnText.classList.remove('d-none');
    if (btnLoading) btnLoading.classList.add('d-none');
  }
}

function setFieldError(inputEl, isError) {
  if (!inputEl) return;
  const group = inputEl.closest('.form-group');
  if (!group) return;
  if (isError) group.classList.add('has-error');
  else group.classList.remove('has-error');
}

export function showSuccessPopup(data) {
  const modal = document.getElementById('successModal');
  const summaryBox = document.getElementById('modalBookingSummary');

  if (summaryBox) {
    summaryBox.innerHTML = `
      <strong>Khách đặt:</strong> ${data.name} (${data.phone})<br>
      <strong>Phòng:</strong> ${data.room}<br>
      <strong>Lịch trình:</strong> ${data.checkIn} đến ${data.checkOut} (${data.nights})<br>
      <strong>Số khách:</strong> ${data.guests}<br>
      <strong>Dịch vụ thêm:</strong> ${data.extra}<br>
      <strong>Tạm tính:</strong> <span style="color:#a65b35;font-weight:700;">${data.total}</span>
    `;
  }

  if (modal) modal.classList.add('active');
}

export function closeSuccessModal() {
  const modal = document.getElementById('successModal');
  if (modal) modal.classList.remove('active');
}
