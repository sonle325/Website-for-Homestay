/**
 * LAL ANGLE HOMESTAY · OWNER ADMIN & MANAGEMENT MODULE
 * - Cài đặt cấu hình Bot Telegram
 * - Xem & quản lý sổ đơn khách đặt phòng
 * - Bật / Tắt trạng thái & số lượng phòng (Còn phòng / Đã kín lịch)
 */

import { STORAGE_KEYS, DEFAULT_CONFIG } from './config.js';
import { getRoomsStatus, toggleRoomStatus, syncRoomsUI } from './rooms.js';
import { testTelegramConnection } from './telegram.js';
import { escapeHtml } from './security.js';

export function initOwnerSettings() {
  const openBtn = document.getElementById('btnOpenOwnerSettings');
  const modal = document.getElementById('ownerModal');
  const saveBtn = document.getElementById('btnSaveTelegramConfig');
  const testBtn = document.getElementById('btnTestTelegram');
  const clearBtn = document.getElementById('btnClearHistory');

  const tokenInput = document.getElementById('ownerTelegramToken');
  const chatIdInput = document.getElementById('ownerTelegramChatId');

  // Khởi tạo giá trị ban đầu cho Token và Chat ID
  if (tokenInput) {
    tokenInput.value = localStorage.getItem(STORAGE_KEYS.TELEGRAM_TOKEN) || DEFAULT_CONFIG.TELEGRAM_TOKEN;
  }
  if (chatIdInput) {
    chatIdInput.value = localStorage.getItem(STORAGE_KEYS.TELEGRAM_CHAT_ID) || DEFAULT_CONFIG.TELEGRAM_CHAT_ID;
  }

  // Mở Modal Quản Trị
  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      renderHistory();
      renderRoomStatusTab();
      modal.classList.add('active');
    });
  }

  // Lưu cấu hình Telegram
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const t = tokenInput ? tokenInput.value.trim() : '';
      const c = chatIdInput ? chatIdInput.value.trim() : '';

      if (t) localStorage.setItem(STORAGE_KEYS.TELEGRAM_TOKEN, t);
      else localStorage.removeItem(STORAGE_KEYS.TELEGRAM_TOKEN);

      if (c) localStorage.setItem(STORAGE_KEYS.TELEGRAM_CHAT_ID, c);
      else localStorage.removeItem(STORAGE_KEYS.TELEGRAM_CHAT_ID);

      alert('Đã lưu cấu hình Bot Telegram thành công!');
    });
  }

  // Gửi tin thử nghiệm
  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      const t = tokenInput ? tokenInput.value.trim() : '';
      const c = chatIdInput ? chatIdInput.value.trim() : '';

      if (!t || !c) {
        alert('Vui lòng nhập Bot Token và Chat ID để thử nghiệm!');
        return;
      }

      testBtn.disabled = true;
      testBtn.textContent = 'Đang gửi...';

      try {
        const data = await testTelegramConnection(t, c);
        if (data.ok) {
          alert('Tin nhắn thử nghiệm đã gửi thành công tới Telegram của bạn!');
        } else {
          alert('Lỗi Telegram: ' + (data.description || 'Sai token hoặc chat ID'));
        }
      } catch (err) {
        alert('Lỗi kết nối: ' + err.message);
      } finally {
        testBtn.disabled = false;
        testBtn.textContent = 'Gửi Tin Thử Nghiệm';
      }
    });
  }

  // Xóa lịch sử đơn
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách đơn đặt phòng đã lưu không?')) {
        localStorage.removeItem(STORAGE_KEYS.BOOKINGS_HISTORY);
        renderHistory();
      }
    });
  }

  renderHistory();
  renderRoomStatusTab();
}

export function closeOwnerModal() {
  const modal = document.getElementById('ownerModal');
  if (modal) modal.classList.remove('active');
}

export function switchOwnerTab(tabName) {
  const tabs = document.querySelectorAll('.owner-tabs .tab-btn');
  const paneConfig = document.getElementById('paneConfig');
  const paneHistory = document.getElementById('paneHistory');
  const paneRooms = document.getElementById('paneRooms');

  tabs.forEach(t => t.classList.remove('active'));

  if (paneConfig) paneConfig.classList.remove('active');
  if (paneHistory) paneHistory.classList.remove('active');
  if (paneRooms) paneRooms.classList.remove('active');

  const activeBtn = document.querySelector(`.owner-tabs .tab-btn[data-tab="${tabName}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  if (tabName === 'config' && paneConfig) {
    paneConfig.classList.add('active');
  } else if (tabName === 'history' && paneHistory) {
    paneHistory.classList.add('active');
    renderHistory();
  } else if (tabName === 'rooms' && paneRooms) {
    paneRooms.classList.add('active');
    renderRoomStatusTab();
  }
}

/**
 * Hiển thị bảng bật/tắt trạng thái phòng (Còn phòng / Đã kín lịch)
 */
export function renderRoomStatusTab() {
  const container = document.getElementById('roomStatusList');
  if (!container) return;

  const rooms = getRoomsStatus();
  container.innerHTML = rooms.map(room => {
    const isAvailable = room.status === 'AVAILABLE';
    return `
      <div class="room-status-item ${isAvailable ? '' : 'is-closed'}">
        <div class="room-status-info">
          <h4>${escapeHtml(room.name)}</h4>
          <p>Giá niêm yết: ${room.price.toLocaleString('vi-VN')}đ / đêm</p>
        </div>
        <div class="room-toggle-wrap">
          <span class="status-pill ${isAvailable ? 'available' : 'soldout'}">
            ${isAvailable ? 'Còn phòng' : 'Đã kín lịch'}
          </span>
          <label class="switch-control" title="Nhấn để đổi trạng thái">
            <input type="checkbox" data-room-id="${room.id}" ${isAvailable ? 'checked' : ''} onchange="window.handleRoomToggle('${room.id}')">
            <span class="switch-slider"></span>
          </label>
        </div>
      </div>
    `;
  }).join('');
}

export function handleRoomToggle(roomId) {
  toggleRoomStatus(roomId);
  renderRoomStatusTab();
  syncRoomsUI();
}

/**
 * Lưu đơn hàng vào LocalStorage của thiết bị
 */
export function saveLocalBooking(record) {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS_HISTORY) || '[]');
    list.unshift(record);
    if (list.length > 50) list.pop();
    localStorage.setItem(STORAGE_KEYS.BOOKINGS_HISTORY, JSON.stringify(list));
    renderHistory();
  } catch (e) {}
}

/**
 * Render lịch sử các đơn đặt phòng
 */
export function renderHistory() {
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
      <td><a href="tel:${item.phone}" style="color:#a65b35;font-weight:700;">${escapeHtml(item.phone)}</a></td>
      <td><small>${escapeHtml(item.room)}</small></td>
      <td>${escapeHtml(item.checkIn)} (${escapeHtml(item.nights)})</td>
      <td><strong>${escapeHtml(item.total)}</strong></td>
    </tr>
  `).join('');
}
