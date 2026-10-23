/**
 * LAL ANGLE HOMESTAY · OWNER ADMIN & MANAGEMENT MODULE
 * - Bảo vệ bằng mã PIN bảo mật (Tránh khách lạ tò mò mở cổng quản trị)
 * - Quản lý số lượng & trạng thái phòng (Còn phòng / Đã kín lịch)
 * - Hướng dẫn biến môi trường Vercel & Quản lý lịch sử đơn
 */

import { STORAGE_KEYS, DEFAULT_ADMIN_PIN } from './config.js';
import { getRoomsStatus, toggleRoomStatus, syncRoomsUI } from './rooms.js';
import { escapeHtml } from './security.js';

export function initOwnerSettings() {
  const openBtn = document.getElementById('btnOpenOwnerSettings');
  const modal = document.getElementById('ownerModal');
  const clearBtn = document.getElementById('btnClearHistory');
  const closeBtn = document.getElementById('btnCloseOwnerModal');

  // Mở Modal Quản Trị với xác thực mã PIN
  if (openBtn && modal) {
    openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const isAuthenticated = sessionStorage.getItem(STORAGE_KEYS.ADMIN_SESSION) === 'true';
      if (!isAuthenticated) {
        const inputPin = prompt('🔐 CỔNG QUẢN TRỊ LAL ANGLE HOMESTAY\nVui lòng nhập mã PIN quản lý để truy cập (Mặc định: 1234):');
        if (!inputPin) return;

        const storedPin = localStorage.getItem('lal_angle_admin_pin') || DEFAULT_ADMIN_PIN;
        if (inputPin.trim() !== storedPin) {
          alert('❌ Mã PIN không chính xác! Quyền truy cập bị từ chối.');
          return;
        }

        // Lưu phiên đăng nhập trong tab hiện tại
        sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'true');
      }

      renderHistory();
      renderRoomStatusTab();
      modal.classList.add('active');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeOwnerModal);
  }

  // Đổi mã PIN quản lý
  const changePinBtn = document.getElementById('btnChangeAdminPin');
  if (changePinBtn) {
    changePinBtn.addEventListener('click', () => {
      const newPin = prompt('Nhập mã PIN quản lý mới (4 - 6 số):');
      if (newPin && newPin.trim().length >= 4) {
        localStorage.setItem('lal_angle_admin_pin', newPin.trim());
        alert('Đã cập nhật mã PIN quản lý thành công!');
      } else if (newPin !== null) {
        alert('Mã PIN phải có ít nhất 4 ký tự.');
      }
    });
  }

  // Xóa lịch sử đơn
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách đơn đặt phòng đã lưu trên thiết bị này không?')) {
        localStorage.removeItem(STORAGE_KEYS.BOOKINGS_HISTORY);
        renderHistory();
      }
    });
  }

  // Đăng ký event delegation cho các tab trong Owner modal
  const tabsContainer = document.querySelector('.owner-tabs');
  if (tabsContainer) {
    tabsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (btn && btn.dataset.tab) {
        switchOwnerTab(btn.dataset.tab);
      }
    });
  }

  renderHistory();
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
            <input type="checkbox" data-room-id="${room.id}" class="room-status-checkbox" ${isAvailable ? 'checked' : ''}>
            <span class="switch-slider"></span>
          </label>
        </div>
      </div>
    `;
  }).join('');

  // Gắn event listener trực tiếp (thay thế inline onchange)
  const checkboxes = container.querySelectorAll('.room-status-checkbox');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', (e) => {
      const roomId = e.target.dataset.roomId;
      if (roomId) {
        handleRoomToggle(roomId);
      }
    });
  });
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
