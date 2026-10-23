/**
 * LAL ANGLE HOMESTAY · SECURE BOOKING PIPELINE
 * - Xác thực ngày đến, ngày đi chặt chẽ (Check-out > Check-in >= Hôm nay)
 * - Gửi dữ liệu tới Serverless API (/api/booking) để tính giá và gửi Telegram an toàn
 * - Xử lý phản hồi lỗi trung thực: Chỉ báo thành công khi server xác nhận ok
 * - Anti-Spam & Anti-Bot: Honeypot, Time-Trap, Client Debounce
 */

import { 
  verifyHoneypot, 
  verifyTimeTrap, 
  recordFormInteraction,
  resetTimeTrap,
  sanitizeInput, 
  validateVietnamesePhone,
  generateIdempotencyKey
} from './security.js';
import { getRoomsStatus } from './rooms.js';
import { submitBookingToApi } from './telegram.js';
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
   1. KHỞI TẠO NGÀY MẶC ĐỊNH & KIỂM SOÁT TÍNH HỢP LỆ
   ========================================================================== */
export function initDateDefaults() {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const checkIn = document.getElementById('checkInDate');
  const checkOut = document.getElementById('checkOutDate');

  if (checkIn && checkOut) {
    const todayStr = formatDateInput(today);
    const tomorrowStr = formatDateInput(tomorrow);

    checkIn.min = todayStr;
    checkIn.value = todayStr;

    checkOut.min = tomorrowStr;
    checkOut.value = tomorrowStr;

    checkIn.addEventListener('change', () => {
      if (!checkIn.value) return;
      const dIn = new Date(checkIn.value);
      const nextDay = new Date(dIn);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = formatDateInput(nextDay);

      checkOut.min = nextDayStr;
      if (new Date(checkOut.value) <= dIn) {
        checkOut.value = nextDayStr;
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
   3. CHỌN PHÒNG & TÍNH TIỀN TẠM TÍNH TRÊN CLIENT
   ========================================================================== */
export function chooseRoom(roomVal, pricePerNight) {
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
   4. PIPELINE XÁC THỰC VÀ GỬI ĐƠN AN TOÀN
   ========================================================================== */
export function initReservationForm() {
  const form = document.getElementById('bookingForm');
  if (!form) return;

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
    console.warn('[SECURITY] Bot trap detected. Request ignored.');
    return;
  }

  // 2. Kiểm tra Time-Trap
  if (!verifyTimeTrap()) {
    alert('Thao tác quá nhanh. Vui lòng kiểm tra lại thông tin trước khi gửi.');
    return;
  }

  // 3. Validation dữ liệu phía Client
  const rawName = sanitizeInput(nameInput?.value || '', 60);
  const rawPhone = sanitizeInput(phoneInput?.value || '', 15);
  const rawNotes = sanitizeInput(notesInput?.value || '', 300);

  let hasError = false;

  // Họ tên
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
    const rooms = getRoomsStatus();
    const matched = rooms.find(r => r.selectValue === roomInput.value);
    if (matched && matched.status === 'SOLDOUT') {
      alert('Gian phòng bạn chọn hiện đã kín lịch. Vui lòng chọn gian phòng khác.');
      setFieldError(roomInput, true);
      return;
    }
    setFieldError(roomInput, false);
  }

  // Ngày đến và Ngày đi (Validation chặt chẽ chống ngày âm / ngày trong quá khứ)
  const dIn = checkInInput?.value ? new Date(checkInInput.value) : null;
  const dOut = checkOutInput?.value ? new Date(checkOutInput.value) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!dIn || isNaN(dIn.getTime()) || dIn < today) {
    setFieldError(checkInInput, true);
    hasError = true;
  } else {
    setFieldError(checkInInput, false);
  }

  if (!dOut || isNaN(dOut.getTime()) || !dIn || dOut <= dIn) {
    setFieldError(checkOutInput, true);
    hasError = true;
  } else {
    setFieldError(checkOutInput, false);
  }

  if (hasError) return;

  // 4. Tạo Idempotency Key & Dữ liệu gửi đi
  const hpEl = document.getElementById('website_hp_check');
  const idempotency = generateIdempotencyKey({
    phone: rawPhone,
    room: roomInput.value,
    checkIn: checkInInput.value,
    checkOut: checkOutInput.value
  });

  const bookingPayload = {
    name: rawName,
    phone: rawPhone,
    room: roomInput.value,
    checkIn: checkInInput.value,
    checkOut: checkOutInput.value,
    guests: guestsInput?.value || '2 người lớn',
    extra: extraInput?.value || 'Chỉ phòng & Bữa sáng tặng kèm',
    notes: rawNotes || 'Không có',
    website_hp_check: hpEl ? hpEl.value : '',
    form_fill_time: Date.now() - (window._formStartTime || Date.now() - 3000),
    idempotencyKey: idempotency.key
  };

  // 5. Khóa nút submit chống bấm đúp
  if (btnSubmit) btnSubmit.disabled = true;
  if (btnText) btnText.classList.add('d-none');
  if (btnLoading) btnLoading.classList.remove('d-none');

  try {
    // 6. Gửi tới Serverless API (/api/booking)
    const apiResult = await submitBookingToApi(bookingPayload);

    // 7. Xử lý phản hồi từ Server (Chỉ báo thành công khi server xác nhận OK)
    if (!apiResult.ok) {
      const errMsg = apiResult.data?.error || 'Không thể gửi đơn đặt phòng lúc này.';
      alert(`⚠️ ${errMsg}\nBạn vui lòng gọi trực tiếp Hotline 0938 126 899 (Ms. An) để được giữ phòng ngay nhé!`);
      return;
    }

    // 8. Lưu lịch sử cục bộ với thông tin chuẩn từ server
    const confirmedRecord = {
      name: rawName,
      phone: rawPhone,
      room: apiResult.data?.roomName || roomInput.value,
      checkIn: formatDateVN(checkInInput.value),
      checkOut: formatDateVN(checkOutInput.value),
      nights: apiResult.data?.nights || '1 đêm',
      guests: bookingPayload.guests,
      extra: bookingPayload.extra,
      total: apiResult.data?.total || '1.250.000đ',
      time: new Date().toLocaleString('vi-VN', { hour12: false })
    };

    saveLocalBooking(confirmedRecord);
    resetTimeTrap();

    // 9. Hiển thị Popup xác nhận thành công
    showSuccessPopup(confirmedRecord, apiResult.data?.bookingId);

    // Reset Form
    const formEl = document.getElementById('bookingForm');
    if (formEl) formEl.reset();
    initDateDefaults();
    updatePrice();

  } catch (err) {
    console.error('[BOOKING PIPELINE ERROR]', err);
    alert('Có sự cố kết nối tới hệ thống. Bạn vui lòng liên hệ hotline 0938 126 899 để chốt phòng tức thì!');
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

export function showSuccessPopup(data, bookingId = '') {
  const modal = document.getElementById('successModal');
  const summaryBox = document.getElementById('modalBookingSummary');

  if (summaryBox) {
    summaryBox.innerHTML = `
      ${bookingId ? `<div style="font-size:0.78rem;color:#718096;margin-bottom:6px;">Mã đơn: <strong>${bookingId}</strong></div>` : ''}
      <strong>Khách đặt:</strong> ${data.name} (${data.phone})<br>
      <strong>Gian phòng:</strong> ${data.room}<br>
      <strong>Lịch trình:</strong> ${data.checkIn} đến ${data.checkOut} (${data.nights})<br>
      <strong>Số khách:</strong> ${data.guests}<br>
      <strong>Tổng tiền xác nhận:</strong> <span style="color:#a65b35;font-weight:700;">${data.total}</span>
    `;
  }

  if (modal) modal.classList.add('active');
}

export function closeSuccessModal() {
  const modal = document.getElementById('successModal');
  if (modal) modal.classList.remove('active');
}
