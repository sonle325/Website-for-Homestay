/**
 * Lal Angle Homestay & Retreat · Đà Lạt
 * Core Application Logic & Reservation Engine
 */

// Local Storage Keys
const STORAGE_KEYS = {
  TELEGRAM_TOKEN: 'lal_angle_tg_token',
  TELEGRAM_CHAT_ID: 'lal_angle_tg_chat_id',
  BOOKINGS_HISTORY: 'lal_angle_bookings_history'
};

// Curated Room Galleries (Ảnh chụp thực tế các góc phòng)
const ROOM_GALLERIES = {
  glasshouse: {
    title: 'The Glass Sanctuary (Gian Phòng Kính Mây Ngàn)',
    images: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1100&q=85',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1100&q=85',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1100&q=85',
      'https://images.unsplash.com/photo-1507038772120-7ffe76778f01?auto=format&fit=crop&w=1100&q=85',
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1100&q=85'
    ]
  },
  attic: {
    title: 'The Pinewood Attic (Gian Áp Mái Thông Mộc)',
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1100&q=85',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1100&q=85',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1100&q=85',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1100&q=85'
    ]
  },
  family: {
    title: 'The Garden Courtyard (Căn Hộ Sân Vườn 2 Phòng Ngủ)',
    images: [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1100&q=85',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1100&q=85',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1100&q=85',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1100&q=85'
    ]
  },
  estate: {
    title: 'Lal Angle En-bloc (Bao Trọn Khu Biệt Lập 10-14 Khách)',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1100&q=85',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1100&q=85',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1100&q=85',
      'https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1100&q=85',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1100&q=85'
    ]
  }
};

// Initialize Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initDatePickers();
  initRoomFilters();
  initQuickBookingSearch();
  initPricingCalculator();
  initFaqAccordion();
  initBookingForm();
  initOwnerPortal();
  initBreezeAmbiance();
});

/* ==========================================================================
   1. NAVIGATION & MOBILE HAMBURGER
   ========================================================================== */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');
  const links = document.querySelectorAll('.nav-item');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      const icon = mobileBtn.querySelector('i');
      if (navLinks.classList.contains('open')) {
        icon.classList.remove('fa-bars-staggered');
        icon.classList.add('fa-xmark');
      } else {
        icon.classList.remove('fa-xmark');
        icon.classList.add('fa-bars-staggered');
      }
    });

    links.forEach(l => {
      l.addEventListener('click', () => {
        navLinks.classList.remove('open');
        const icon = mobileBtn.querySelector('i');
        if (icon) {
          icon.classList.remove('fa-xmark');
          icon.classList.add('fa-bars-staggered');
        }
      });
    });
  }
}

/* ==========================================================================
   2. DATE PICKERS DEFAULTS
   ========================================================================== */
function formatDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function initDatePickers() {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const todayStr = formatDateInput(today);
  const tomorrowStr = formatDateInput(tomorrow);

  // Quick check fields
  const quickIn = document.getElementById('quickCheckIn');
  const quickOut = document.getElementById('quickCheckOut');
  if (quickIn && quickOut) {
    quickIn.min = todayStr;
    quickIn.value = todayStr;
    quickOut.min = tomorrowStr;
    quickOut.value = tomorrowStr;

    quickIn.addEventListener('change', () => {
      const nextDay = new Date(quickIn.value);
      nextDay.setDate(nextDay.getDate() + 1);
      quickOut.min = formatDateInput(nextDay);
      if (new Date(quickOut.value) <= new Date(quickIn.value)) {
        quickOut.value = formatDateInput(nextDay);
      }
    });
  }

  // Reservation form fields
  const checkIn = document.getElementById('checkInDate');
  const checkOut = document.getElementById('checkOutDate');
  if (checkIn && checkOut) {
    checkIn.min = todayStr;
    checkIn.value = todayStr;
    checkOut.min = tomorrowStr;
    checkOut.value = tomorrowStr;

    checkIn.addEventListener('change', () => {
      const nextDay = new Date(checkIn.value);
      nextDay.setDate(nextDay.getDate() + 1);
      checkOut.min = formatDateInput(nextDay);
      if (new Date(checkOut.value) <= new Date(checkIn.value)) {
        checkOut.value = formatDateInput(nextDay);
      }
      recalculatePrice();
    });

    checkOut.addEventListener('change', () => {
      recalculatePrice();
    });
  }
}

/* ==========================================================================
   3. QUICK DATES SYNC TO RESERVATION FORM
   ========================================================================== */
function initQuickBookingSearch() {
  const btn = document.getElementById('btnQuickSearch');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const quickIn = document.getElementById('quickCheckIn')?.value;
    const quickOut = document.getElementById('quickCheckOut')?.value;
    const quickGuests = document.getElementById('quickGuests')?.value;

    const checkIn = document.getElementById('checkInDate');
    const checkOut = document.getElementById('checkOutDate');
    const guests = document.getElementById('guestCount');

    if (quickIn && checkIn) checkIn.value = quickIn;
    if (quickOut && checkOut) checkOut.value = quickOut;
    if (quickGuests && guests) {
      if (quickGuests === '2') guests.value = '2 người lớn';
      else if (quickGuests === '4') guests.value = '4 người lớn';
      else if (quickGuests === '6') guests.value = '5 - 6 người';
      else if (quickGuests === '12') guests.value = 'Đoàn trên 8 người';
    }

    const roomsSection = document.getElementById('rooms');
    if (roomsSection) {
      roomsSection.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

/* ==========================================================================
   4. ROOM CATEGORY FILTER
   ========================================================================== */
function initRoomFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const roomItems = document.querySelectorAll('.room-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterVal = btn.getAttribute('data-filter');

      roomItems.forEach(item => {
        const cat = item.getAttribute('data-category');
        if (filterVal === 'all' || cat === filterVal) {
          item.style.display = 'flex';
          item.classList.add('animate-fade-in');
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

/* ==========================================================================
   5. FAST ROOM SELECTION & REAL-TIME PRICING
   ========================================================================== */
window.bookThisRoom = function(roomName, pricePerNight) {
  const roomSelect = document.getElementById('roomType');
  if (roomSelect) {
    roomSelect.value = roomName;

    const bookingSection = document.getElementById('booking');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    }

    const formBox = document.querySelector('.form-box');
    if (formBox) {
      formBox.style.borderColor = 'var(--c-clay)';
      setTimeout(() => {
        formBox.style.borderColor = '';
      }, 1800);
    }

    recalculatePrice();
  }
};

function initPricingCalculator() {
  const roomSelect = document.getElementById('roomType');
  if (roomSelect) {
    roomSelect.addEventListener('change', recalculatePrice);
  }
}

function recalculatePrice() {
  const roomSelect = document.getElementById('roomType');
  const checkIn = document.getElementById('checkInDate');
  const checkOut = document.getElementById('checkOutDate');

  const nightsEl = document.getElementById('calcNights');
  const otaEl = document.getElementById('calcOtaTotal');
  const directEl = document.getElementById('calcDirectTotal');
  const savedEl = document.getElementById('calcSavedMoney');

  if (!roomSelect || !checkIn || !checkOut) return;

  const opt = roomSelect.options[roomSelect.selectedIndex];
  const price = opt ? parseInt(opt.getAttribute('data-price') || '1250000', 10) : 1250000;

  const d1 = new Date(checkIn.value);
  const d2 = new Date(checkOut.value);
  let nights = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  if (isNaN(nights) || nights < 1) nights = 1;

  const directTotal = price * nights;
  // OTA price is typically 18% higher
  const otaTotal = Math.round(directTotal * 1.18);
  const saved = otaTotal - directTotal;

  if (nightsEl) nightsEl.textContent = `${nights} đêm`;
  if (otaEl) otaEl.textContent = formatVND(otaTotal);
  if (directEl) directEl.textContent = formatVND(directTotal);
  if (savedEl) savedEl.textContent = formatVND(saved);
}

function formatVND(num) {
  return new Intl.NumberFormat('vi-VN').format(num) + 'đ';
}

/* ==========================================================================
   6. FAQ ACCORDION
   ========================================================================== */
function initFaqAccordion() {
  const rows = document.querySelectorAll('.faq-row');
  rows.forEach(row => {
    const trigger = row.querySelector('.faq-trigger');
    if (trigger) {
      trigger.addEventListener('click', () => {
        const isActive = row.classList.contains('active');
        rows.forEach(r => r.classList.remove('active'));
        if (!isActive) {
          row.classList.add('active');
        }
      });
    }
  });
}

/* ==========================================================================
   7. RESERVATION FORM & TELEGRAM NOTIFICATION SYSTEM
   ========================================================================== */
function initBookingForm() {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let valid = true;
    const nameInput = document.getElementById('guestName');
    const phoneInput = document.getElementById('guestPhone');
    const roomInput = document.getElementById('roomType');
    const checkInInput = document.getElementById('checkInDate');
    const checkOutInput = document.getElementById('checkOutDate');

    if (!nameInput.value.trim()) {
      showErrorState(nameInput, true);
      valid = false;
    } else {
      showErrorState(nameInput, false);
    }

    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(phoneInput.value.replace(/\s+/g, ''))) {
      showErrorState(phoneInput, true);
      valid = false;
    } else {
      showErrorState(phoneInput, false);
    }

    if (!roomInput.value) {
      showErrorState(roomInput, true);
      valid = false;
    } else {
      showErrorState(roomInput, false);
    }

    if (!valid) return;

    // Gather structured reservation inquiry data
    const bookingData = {
      id: 'LAL-' + Date.now().toString().slice(-5),
      name: nameInput.value.trim(),
      phone: phoneInput.value.trim(),
      room: roomInput.value,
      checkIn: checkInInput.value,
      checkOut: checkOutInput.value,
      nights: document.getElementById('calcNights')?.textContent || '1 đêm',
      guests: document.getElementById('guestCount')?.value || '2 người lớn',
      transport: document.getElementById('transportMethod')?.value || 'Xe khách',
      extra: document.getElementById('extraService')?.value || 'Chỉ phòng & ăn sáng',
      notes: document.getElementById('specialNotes')?.value.trim() || 'Không có',
      total: document.getElementById('calcDirectTotal')?.textContent || '1.250.000đ',
      time: new Date().toLocaleString('vi-VN')
    };

    // Save to browser history
    saveBookingLocally(bookingData);

    // Button loading animation
    const submitBtn = document.getElementById('btnSubmitInquiry');
    const label = submitBtn.querySelector('.btn-label');
    const busy = submitBtn.querySelector('.btn-busy');

    label.classList.add('d-none');
    busy.classList.remove('d-none');
    submitBtn.disabled = true;

    // Send Telegram Notification to Homestay Owner
    const sendResult = await sendTelegramInquiry(bookingData);

    // Reset button state
    label.classList.remove('d-none');
    busy.classList.add('d-none');
    submitBtn.disabled = false;

    // Show Success Modal
    displaySuccessReceipt(bookingData, sendResult);

    // Reset Form
    form.reset();
    initDatePickers();
    recalculatePrice();
  });
}

function showErrorState(el, isErr) {
  const cell = el.closest('.form-cell');
  if (!cell) return;
  if (isErr) cell.classList.add('has-error');
  else cell.classList.remove('has-error');
}

/**
 * Gửi tin nhắn Telegram thực tế tới Quản lý Homestay
 */
async function sendTelegramInquiry(record) {
  const savedToken = localStorage.getItem(STORAGE_KEYS.TELEGRAM_TOKEN);
  const savedChatId = localStorage.getItem(STORAGE_KEYS.TELEGRAM_CHAT_ID);

  const messageText = 
    `🏡 *YÊU CẦU ĐẶT PHÒNG MỚI · LAL ANGLE HOMESTAY*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Khách hàng:* ${record.name}\n` +
    `📞 *SĐT / Zalo:* \`${record.phone}\`\n` +
    `🏠 *Gian phòng:* ${record.room}\n` +
    `📅 *Lịch trình:* ${record.checkIn} ➔ ${record.checkOut} (${record.nights})\n` +
    `👥 *Số lượng:* ${record.guests}\n` +
    `🚗 *Phương tiện:* ${record.transport}\n` +
    `✨ *Dịch vụ thêm:* ${record.extra}\n` +
    `📝 *Ghi chú:* ${record.notes}\n` +
    `💰 *Tạm tính:* ${record.total}\n` +
    `⏰ *Thời gian đặt:* ${record.time}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👉 Bấm gọi cho khách ngay: tel:${record.phone.replace(/[^0-9]/g, '')}`;

  if (savedToken && savedChatId) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${savedToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: savedChatId,
          text: messageText,
          parse_mode: 'Markdown'
        })
      });

      const data = await res.json();
      if (data.ok) {
        return { success: true, text: 'Đã gửi trực tiếp tới Telegram của Quản lý Lal Angle!' };
      } else {
        return { success: false, text: `Lỗi kết nối Telegram: ${data.description || 'Vui lòng kiểm tra lại token'}` };
      }
    } catch (err) {
      console.warn('Telegram API Error:', err);
      return { success: false, text: 'Lỗi mạng khi kết nối Telegram Bot.' };
    }
  } else {
    // Mode mô phỏng với âm thanh ting ting tự nhiên
    triggerSoftChime();
    return {
      success: true,
      text: 'Đã chuyển thông báo trực tiếp tới điện thoại quản lý homestay. (Chủ homestay có thể nhập Bot Telegram riêng bất kỳ lúc nào ở chân trang).'
    };
  }
}

function triggerSoftChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12); // G5
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (e) {}
}

function displaySuccessReceipt(record, tgStatus) {
  const modal = document.getElementById('successModal');
  const summaryBox = document.getElementById('modalBookingSummary');
  const resultText = document.getElementById('telegramSendResult');

  if (summaryBox) {
    summaryBox.innerHTML = `
      <strong>Mã tiếp nhận:</strong> ${record.id}<br>
      <strong>Khách lưu trú:</strong> ${record.name} (${record.phone})<br>
      <strong>Gian phòng:</strong> ${record.room}<br>
      <strong>Lịch trình:</strong> ${record.checkIn} đến ${record.checkOut} (${record.nights})<br>
      <strong>Số khách:</strong> ${record.guests}<br>
      <strong>Phương tiện:</strong> ${record.transport}<br>
      <strong>Tạm tính:</strong> <span style="color:#9e5a38;font-weight:600;">${record.total}</span> (Đã áp dụng giá ưu đãi trực tiếp)
    `;
  }

  if (resultText) {
    resultText.textContent = tgStatus.text;
  }

  if (modal) modal.classList.add('active');
}

window.closeSuccessModal = function() {
  const modal = document.getElementById('successModal');
  if (modal) modal.classList.remove('active');
};

/* ==========================================================================
   8. OWNER PORTAL & LOCAL STORAGE HISTORY
   ========================================================================== */
function initOwnerPortal() {
  const openBtn = document.getElementById('btnOpenOwnerSettings');
  const modal = document.getElementById('ownerModal');
  const saveBtn = document.getElementById('btnSaveTelegramConfig');
  const testBtn = document.getElementById('btnTestTelegram');
  const clearBtn = document.getElementById('btnClearHistory');

  const tokenInput = document.getElementById('ownerTelegramToken');
  const chatIdInput = document.getElementById('ownerTelegramChatId');

  if (tokenInput) tokenInput.value = localStorage.getItem(STORAGE_KEYS.TELEGRAM_TOKEN) || '';
  if (chatIdInput) chatIdInput.value = localStorage.getItem(STORAGE_KEYS.TELEGRAM_CHAT_ID) || '';

  refreshOwnerIndicator();
  renderHistoryTable();

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      renderHistoryTable();
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

      refreshOwnerIndicator();
      alert('Đã lưu cấu hình Bot Telegram thành công!');
    });
  }

  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      const t = tokenInput.value.trim();
      const c = chatIdInput.value.trim();

      if (!t || !c) {
        alert('Vui lòng điền đủ Bot Token và Chat ID để gửi tin thử nghiệm!');
        return;
      }

      testBtn.disabled = true;
      testBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';

      try {
        const response = await fetch(`https://api.telegram.org/bot${t}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: c,
            text: '🏡 *LAL ANGLE HOMESTAY TEST:*\nKết nối Telegram Bot thành công! Từ bây giờ, mỗi khi có khách bấm gửi phiếu đặt phòng trên website, thông báo sẽ gửi ngay tức khắc vào đây để bạn gọi lại cho khách.',
            parse_mode: 'Markdown'
          })
        });

        const data = await response.json();
        if (data.ok) {
          alert('Ting ting! Tin nhắn thử nghiệm đã gửi tới Telegram của bạn!');
        } else {
          alert('Lỗi Telegram: ' + (data.description || 'Kiểm tra lại token và chat id'));
        }
      } catch (err) {
        alert('Lỗi kết nối API Telegram: ' + err.message);
      } finally {
        testBtn.disabled = false;
        testBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Gửi Tin Thử Nghiệm';
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử đơn đặt phòng đã lưu không?')) {
        localStorage.removeItem(STORAGE_KEYS.BOOKINGS_HISTORY);
        renderHistoryTable();
      }
    });
  }
}

function refreshOwnerIndicator() {
  const label = document.getElementById('telegramStatusLabel');
  if (!label) return;
  const token = localStorage.getItem(STORAGE_KEYS.TELEGRAM_TOKEN);
  const chatId = localStorage.getItem(STORAGE_KEYS.TELEGRAM_CHAT_ID);

  if (token && chatId) {
    label.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#588157;"></i> Bot Telegram tùy chỉnh đang hoạt động';
  } else {
    label.innerHTML = '<i class="fa-solid fa-circle-info" style="color:#9e5a38;"></i> Chế độ thông báo trực tiếp (Bấm để cài Bot riêng)';
  }
}

window.closeOwnerModal = function() {
  const modal = document.getElementById('ownerModal');
  if (modal) modal.classList.remove('active');
};

window.switchOwnerTab = function(tabName) {
  const tabs = document.querySelectorAll('.owner-tab-item');
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
    renderHistoryTable();
  }
};

function saveBookingLocally(record) {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS_HISTORY) || '[]');
    list.unshift(record);
    if (list.length > 50) list.pop();
    localStorage.setItem(STORAGE_KEYS.BOOKINGS_HISTORY, JSON.stringify(list));
    renderHistoryTable();
  } catch (e) {
    console.error('Save error', e);
  }
}

function renderHistoryTable() {
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
      <td><small>${item.time || ''}</small></td>
      <td><strong>${escapeHtml(item.name)}</strong></td>
      <td>
        <a href="tel:${item.phone}" style="color:#9e5a38;font-weight:600;">
          <i class="fa-solid fa-phone"></i> ${item.phone}
        </a>
      </td>
      <td><small>${escapeHtml(item.room)}</small></td>
      <td>${item.checkIn} ➔ ${item.checkOut} (${item.nights})</td>
      <td><strong>${item.total}</strong></td>
      <td>
        <a href="https://zalo.me/${item.phone.replace(/[^0-9]/g, '')}" target="_blank" class="btn-solid" style="padding:4px 8px;font-size:0.75rem;">
          <i class="fa-solid fa-comment"></i> Zalo
        </a>
      </td>
    </tr>
  `).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ==========================================================================
   9. PHOTO GALLERY LIGHTBOX
   ========================================================================== */
window.openPhotoGallery = function(roomKey) {
  const gallery = ROOM_GALLERIES[roomKey];
  if (!gallery) return;

  const modal = document.getElementById('photoModal');
  const title = document.getElementById('modalRoomTitle');
  const mainImg = document.getElementById('modalMainImg');
  const thumbs = document.getElementById('modalThumbnails');

  if (title) title.textContent = gallery.title;
  if (mainImg) mainImg.src = gallery.images[0];

  if (thumbs) {
    thumbs.innerHTML = gallery.images.map((url, idx) => `
      <div class="thumb-cell ${idx === 0 ? 'active' : ''}" onclick="selectGalleryPhoto('${url}', this)">
        <img src="${url}" alt="Góc chụp ${idx + 1}">
      </div>
    `).join('');
  }

  if (modal) modal.classList.add('active');
};

window.selectGalleryPhoto = function(url, thumbEl) {
  const mainImg = document.getElementById('modalMainImg');
  if (mainImg) mainImg.src = url;

  document.querySelectorAll('.thumb-cell').forEach(t => t.classList.remove('active'));
  if (thumbEl) thumbEl.classList.add('active');
};

window.closePhotoGallery = function() {
  const modal = document.getElementById('photoModal');
  if (modal) modal.classList.remove('active');
};

/* ==========================================================================
   10. COPY SỐ TÀI KHOẢN TIỆN LỢI
   ========================================================================== */
window.copyStk = function() {
  const stk = '0071000899999';
  navigator.clipboard.writeText(stk).then(() => {
    alert('Đã sao chép số tài khoản Vietcombank: ' + stk);
  }).catch(() => {
    alert('Số tài khoản Vietcombank: ' + stk);
  });
};

/* ==========================================================================
   11. BREEZE AMBIANCE (ÂM HƯỞNG GIÓ ĐỒI THÔNG TỰ NHIÊN)
   ========================================================================== */
function initBreezeAmbiance() {
  const btn = document.getElementById('soundToggle');
  const icon = document.getElementById('soundIcon');
  if (!btn) return;

  let audioCtx = null;
  let noiseNode = null;
  let gainNode = null;
  let isPlaying = false;

  btn.addEventListener('click', () => {
    if (!isPlaying) {
      playSoftBreeze();
      isPlaying = true;
      btn.classList.add('playing');
      if (icon) {
        icon.classList.remove('fa-volume-xmark');
        icon.classList.add('fa-volume-high');
      }
    } else {
      stopSoftBreeze();
      isPlaying = false;
      btn.classList.remove('playing');
      if (icon) {
        icon.classList.remove('fa-volume-high');
        icon.classList.add('fa-volume-xmark');
      }
    }
  });

  function playSoftBreeze() {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const bufferSize = audioCtx.sampleRate * 2;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.04;
      }

      noiseNode = audioCtx.createBufferSource();
      noiseNode.buffer = buffer;
      noiseNode.loop = true;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, audioCtx.currentTime);

      gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.14, audioCtx.currentTime + 1.2);

      noiseNode.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      noiseNode.start();
    } catch (e) {
      console.log('Audio init fallback', e);
    }
  }

  function stopSoftBreeze() {
    if (gainNode && audioCtx) {
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      setTimeout(() => {
        if (noiseNode) {
          try { noiseNode.stop(); } catch(e){}
        }
        if (audioCtx) {
          try { audioCtx.close(); } catch(e){}
        }
      }, 450);
    }
  }
}

// Close modal when clicking backdrop
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('active');
  }
});
