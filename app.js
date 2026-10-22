/**
 * Lal Angle Homestay · Đà Lạt
 * Core Logic: Đơn giản, mượt mà, hỗ trợ điện thoại 100%
 */

const STORAGE_KEYS = {
  TELEGRAM_TOKEN: 'lal_angle_tg_token',
  TELEGRAM_CHAT_ID: 'lal_angle_tg_chat_id',
  BOOKINGS_HISTORY: 'lal_angle_bookings_history'
};

// Cấu hình Telegram mặc định (Tự động gửi về điện thoại của bạn trên Vercel)
const DEFAULT_CONFIG = {
  TELEGRAM_TOKEN: '8954116585:AAGE1f--KiAaC91WAGOGBOJX3-aRhdhHkLM',
  TELEGRAM_CHAT_ID: '6799585518'
};

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initDateDefaults();
  initQuickSearch();
  initCostCalculator();
  initReservationForm();
  initOwnerSettings();
});

/* ==========================================================================
   1. MENU TRÊN ĐIỆN THOẠI
   ========================================================================== */
function initMobileMenu() {
  const toggleBtn = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');
  const navItems = document.querySelectorAll('.nav-item');

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const icon = toggleBtn.querySelector('i');
      if (navMenu.classList.contains('open')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-xmark');
      } else {
        icon.classList.remove('fa-xmark');
        icon.classList.add('fa-bars');
      }
    });

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navMenu.classList.remove('open');
        const icon = toggleBtn.querySelector('i');
        if (icon) {
          icon.classList.remove('fa-xmark');
          icon.classList.add('fa-bars');
        }
      });
    });
  }
}

/* ==========================================================================
   2. NGÀY CHECK-IN / CHECK-OUT MẶC ĐỊNH
   ========================================================================== */
function formatDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function initDateDefaults() {
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
   2.1. TÌM PHÒNG NHANH TRÊN BANNER (QUICK SEARCH)
   ========================================================================== */
function initQuickSearch() {
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
      if (qGuests && mainGuests) mainGuests.value = qGuests.value;

      const target = document.getElementById('rooms') || document.getElementById('booking');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
      if (typeof updatePrice === 'function') {
        updatePrice();
      }
    });
  }
}

/* ==========================================================================
   3. CHỌN PHÒNG & TỰ ĐỘNG TÍNH TIỀN
   ========================================================================== */
window.chooseRoom = function(roomVal, pricePerNight) {
  const roomSelect = document.getElementById('roomType');
  if (roomSelect) {
    roomSelect.value = roomVal;

    const bookingSec = document.getElementById('booking');
    if (bookingSec) {
      bookingSec.scrollIntoView({ behavior: 'smooth' });
    }

    updatePrice();
  }
};

function initCostCalculator() {
  const roomSelect = document.getElementById('roomType');
  if (roomSelect) {
    roomSelect.addEventListener('change', updatePrice);
  }
}

function updatePrice() {
  const roomSelect = document.getElementById('roomType');
  const checkIn = document.getElementById('checkInDate');
  const checkOut = document.getElementById('checkOutDate');

  const nightsEl = document.getElementById('calcNights');
  const totalEl = document.getElementById('calcDirectTotal');

  if (!roomSelect || !checkIn || !checkOut) return;

  const opt = roomSelect.options[roomSelect.selectedIndex];
  const price = opt ? parseInt(opt.getAttribute('data-price') || '1250000', 10) : 1250000;

  const d1 = new Date(checkIn.value);
  const d2 = new Date(checkOut.value);
  let nights = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  if (isNaN(nights) || nights < 1) nights = 1;

  const total = price * nights;

  if (nightsEl) nightsEl.textContent = `${nights} đêm`;
  if (totalEl) totalEl.textContent = new Intl.NumberFormat('vi-VN').format(total) + 'đ';
}

/* ==========================================================================
   4. FORM GỬI ĐẶT PHÒNG & THÔNG BÁO TELEGRAM
   ========================================================================== */
function initReservationForm() {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let valid = true;
    const nameInput = document.getElementById('guestName');
    const phoneInput = document.getElementById('guestPhone');
    const roomInput = document.getElementById('roomType');

    // Kiểm tra tên
    if (!nameInput.value.trim()) {
      markError(nameInput, true);
      valid = false;
    } else {
      markError(nameInput, false);
    }

    // Kiểm tra số điện thoại VN
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(phoneInput.value.replace(/\s+/g, ''))) {
      markError(phoneInput, true);
      valid = false;
    } else {
      markError(phoneInput, false);
    }

    // Kiểm tra phòng
    if (!roomInput.value) {
      markError(roomInput, true);
      valid = false;
    } else {
      markError(roomInput, false);
    }

    if (!valid) return;

    const booking = {
      name: nameInput.value.trim(),
      phone: phoneInput.value.trim(),
      room: roomInput.value,
      checkIn: document.getElementById('checkInDate')?.value || '',
      checkOut: document.getElementById('checkOutDate')?.value || '',
      nights: document.getElementById('calcNights')?.textContent || '1 đêm',
      guests: document.getElementById('guestCount')?.value || '2 người',
      extra: document.getElementById('extraService')?.value || 'Chỉ phòng',
      notes: document.getElementById('specialNotes')?.value.trim() || 'Không có',
      total: document.getElementById('calcDirectTotal')?.textContent || '1.250.000đ',
      time: new Date().toLocaleTimeString('vi-VN') + ' - ' + new Date().toLocaleDateString('vi-VN')
    };

    // Lưu vào lịch sử local
    saveLocalBooking(booking);

    // Hiệu ứng gửi
    const submitBtn = document.getElementById('btnSubmit');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    btnText.classList.add('d-none');
    btnLoading.classList.remove('d-none');
    submitBtn.disabled = true;

    // Gửi Telegram
    await sendTelegramMessage(booking);

    btnText.classList.remove('d-none');
    btnLoading.classList.add('d-none');
    submitBtn.disabled = false;

    // Hiển thị Popup xác nhận
    showSuccessPopup(booking);

    // Reset Form
    form.reset();
    initDateDefaults();
    updatePrice();
  });
}

function markError(inputEl, isError) {
  const group = inputEl.closest('.form-group');
  if (!group) return;
  if (isError) group.classList.add('has-error');
  else group.classList.remove('has-error');
}

async function sendTelegramMessage(data) {
  const token = localStorage.getItem(STORAGE_KEYS.TELEGRAM_TOKEN) || DEFAULT_CONFIG.TELEGRAM_TOKEN;
  const chatId = localStorage.getItem(STORAGE_KEYS.TELEGRAM_CHAT_ID) || DEFAULT_CONFIG.TELEGRAM_CHAT_ID;

  const text = 
    `🔔 *CÓ KHÁCH ĐẶT PHÒNG MỚI · LAL ANGLE HOMESTAY*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Khách hàng:* ${data.name}\n` +
    `📞 *SĐT / Zalo:* \`${data.phone}\`\n` +
    `🏠 *Phòng:* ${data.room}\n` +
    `📅 *Lịch:* ${data.checkIn} ➔ ${data.checkOut} (${data.nights})\n` +
    `👥 *Khách:* ${data.guests}\n` +
    `✨ *Dịch vụ:* ${data.extra}\n` +
    `📝 *Ghi chú:* ${data.notes}\n` +
    `💰 *Tạm tính:* ${data.total}\n` +
    `⏰ *Thời gian:* ${data.time}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👉 Bấm gọi chốt ngay: tel:${data.phone.replace(/[^0-9]/g, '')}`;

  playChime();

  if (token && chatId) {
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'Markdown'
        })
      });
    } catch (e) {
      console.warn('Telegram send error', e);
    }
  }
}

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

function showSuccessPopup(data) {
  const modal = document.getElementById('successModal');
  const summaryBox = document.getElementById('modalBookingSummary');

  if (summaryBox) {
    summaryBox.innerHTML = `
      <strong>Khách đặt:</strong> ${data.name} (${data.phone})<br>
      <strong>Phòng:</strong> ${data.room}<br>
      <strong>Ngày:</strong> ${data.checkIn} đến ${data.checkOut} (${data.nights})<br>
      <strong>Số khách:</strong> ${data.guests}<br>
      <strong>Tạm tính:</strong> <span style="color:#a65b35;font-weight:700;">${data.total}</span>
    `;
  }

  if (modal) modal.classList.add('active');
}

window.closeSuccessModal = function() {
  const modal = document.getElementById('successModal');
  if (modal) modal.classList.remove('active');
};

/* ==========================================================================
   5. QUẢN LÝ DÀNH CHO CHỦ HOMESTAY
   ========================================================================== */
function initOwnerSettings() {
  const openBtn = document.getElementById('btnOpenOwnerSettings');
  const modal = document.getElementById('ownerModal');
  const saveBtn = document.getElementById('btnSaveTelegramConfig');
  const testBtn = document.getElementById('btnTestTelegram');
  const clearBtn = document.getElementById('btnClearHistory');

  const tokenInput = document.getElementById('ownerTelegramToken');
  const chatIdInput = document.getElementById('ownerTelegramChatId');

  if (tokenInput) tokenInput.value = localStorage.getItem(STORAGE_KEYS.TELEGRAM_TOKEN) || DEFAULT_CONFIG.TELEGRAM_TOKEN;
  if (chatIdInput) chatIdInput.value = localStorage.getItem(STORAGE_KEYS.TELEGRAM_CHAT_ID) || DEFAULT_CONFIG.TELEGRAM_CHAT_ID;

  renderHistory();

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      renderHistory();
      modal.classList.add('active');
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const t = tokenInput.value.trim();
      const c = chatIdInput.value.trim();

      if (t) localStorage.setItem(STORAGE_KEYS.TELEGRAM_TOKEN, t);
      else localStorage.removeItem(STORAGE_KEYS.TELEGRAM_TOKEN);

      if (c) localStorage.setItem(STORAGE_KEYS.TELEGRAM_CHAT_ID, c);
      else localStorage.removeItem(STORAGE_KEYS.TELEGRAM_CHAT_ID);

      alert('Đã lưu cấu hình Bot Telegram!');
    });
  }

  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      const t = tokenInput.value.trim();
      const c = chatIdInput.value.trim();

      if (!t || !c) {
        alert('Vui lòng nhập Bot Token và Chat ID để thử nghiệm!');
        return;
      }

      try {
        const res = await fetch(`https://api.telegram.org/bot${t}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: c,
            text: '🎉 *LAL ANGLE TEST:*\nKết nối Telegram thành công! Khi có khách đặt phòng trên web, thông báo sẽ gửi ngay vào đây.',
            parse_mode: 'Markdown'
          })
        });
        const data = await res.json();
        if (data.ok) alert('Tin nhắn đã gửi tới Telegram của bạn!');
        else alert('Lỗi: ' + (data.description || 'Sai token hoặc chat id'));
      } catch (err) {
        alert('Lỗi kết nối API: ' + err.message);
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Bạn có muốn xóa toàn bộ lịch sử đơn không?')) {
        localStorage.removeItem(STORAGE_KEYS.BOOKINGS_HISTORY);
        renderHistory();
      }
    });
  }
}

window.closeOwnerModal = function() {
  const modal = document.getElementById('ownerModal');
  if (modal) modal.classList.remove('active');
};

window.switchOwnerTab = function(tabName) {
  const tabs = document.querySelectorAll('.tab-btn');
  const paneConfig = document.getElementById('paneConfig');
  const paneHistory = document.getElementById('paneHistory');

  tabs.forEach(t => t.classList.remove('active'));

  if (tabName === 'config') {
    tabs[0].classList.add('active');
    paneConfig.classList.add('active');
    paneHistory.classList.remove('active');
  } else {
    tabs[1].classList.add('active');
    paneConfig.classList.remove('active');
    paneHistory.classList.add('active');
    renderHistory();
  }
};

function saveLocalBooking(record) {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS_HISTORY) || '[]');
    list.unshift(record);
    if (list.length > 50) list.pop();
    localStorage.setItem(STORAGE_KEYS.BOOKINGS_HISTORY, JSON.stringify(list));
    renderHistory();
  } catch (e) {}
}

function renderHistory() {
  const tbody = document.getElementById('bookingTableBody');
  const empty = document.getElementById('noBookingsMsg');
  const badge = document.getElementById('bookingCountBadge');
  if (!tbody) return;

  const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS_HISTORY) || '[]');
  if (badge) badge.textContent = list.length;

  if (list.length === 0) {
    tbody.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';

  tbody.innerHTML = list.map(item => `
    <tr>
      <td><strong>${escapeHtml(item.name)}</strong></td>
      <td><a href="tel:${item.phone}" style="color:#a65b35;font-weight:700;">${item.phone}</a></td>
      <td><small>${escapeHtml(item.room)}</small></td>
      <td>${item.checkIn} (${item.nights})</td>
      <td><strong>${item.total}</strong></td>
    </tr>
  `).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});
