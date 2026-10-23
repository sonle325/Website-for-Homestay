/**
 * LAL ANGLE HOMESTAY · ROOM INVENTORY MANAGEMENT MODULE
 * - Quản lý số lượng & trạng thái phòng (Còn phòng / Đã kín lịch)
 * - Đồng bộ tức thì giao diện Room Cards & Select Form
 */

import { STORAGE_KEYS, INITIAL_ROOMS } from './config.js';

export function getRoomsStatus() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ROOMS_STATUS);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Kết hợp dữ liệu mặc định với dữ liệu đã lưu
      return INITIAL_ROOMS.map(r => {
        const match = parsed.find(p => p.id === r.id);
        return match ? { ...r, status: match.status } : r;
      });
    }
  } catch (e) {
    console.warn('Lỗi đọc trạng thái phòng', e);
  }
  return [...INITIAL_ROOMS];
}

export function saveRoomsStatus(rooms) {
  try {
    const minimal = rooms.map(r => ({ id: r.id, status: r.status }));
    localStorage.setItem(STORAGE_KEYS.ROOMS_STATUS, JSON.stringify(minimal));
    syncRoomsUI();
  } catch (e) {
    console.error('Lỗi lưu trạng thái phòng', e);
  }
}

export function toggleRoomStatus(roomId) {
  const rooms = getRoomsStatus();
  const room = rooms.find(r => r.id === roomId);
  if (room) {
    room.status = room.status === 'SOLDOUT' ? 'AVAILABLE' : 'SOLDOUT';
    saveRoomsStatus(rooms);
    return room.status;
  }
  return 'AVAILABLE';
}

/**
 * Đồng bộ giao diện thực tế trên website:
 * 1. Danh sách Card phòng ở trang chủ
 * 2. Dropdown chọn phòng ở Form đặt phòng
 */
export function syncRoomsUI() {
  const rooms = getRoomsStatus();
  const roomCards = document.querySelectorAll('.room-card');
  const roomSelect = document.getElementById('roomType');

  // 1. Cập nhật các Card phòng trên website
  roomCards.forEach((card, index) => {
    const room = rooms[index];
    if (!room) return;

    card.setAttribute('data-room-id', room.id);
    const badge = card.querySelector('.room-badge');
    const selectBtn = card.querySelector('.btn-select');

    if (room.status === 'SOLDOUT') {
      card.classList.add('is-sold-out');
      if (badge) {
        badge.textContent = 'ĐÃ KÍN LỊCH';
        badge.className = 'room-badge sold-out-badge';
      }
      if (selectBtn) {
        selectBtn.disabled = true;
        selectBtn.innerHTML = '<i class="fa-solid fa-lock"></i> <span>Tạm hết phòng</span>';
      }
    } else {
      card.classList.remove('is-sold-out');
      if (badge) {
        badge.textContent = room.badgeText || 'Đang mở đón khách';
        badge.className = 'room-badge ' + (room.badgeClass || '');
        if (!room.badgeText) {
          badge.classList.add('d-none');
        } else {
          badge.classList.remove('d-none');
        }
      }
      if (selectBtn) {
        selectBtn.disabled = false;
        selectBtn.innerHTML = `<span>${room.id === 'room-4' ? 'Chọn thuê trọn khu' : 'Chọn phòng này'}</span> <i class="fa-solid fa-arrow-right"></i>`;
      }
    }
  });

  // 2. Cập nhật Dropdown Select trong Form đặt
  if (roomSelect) {
    const options = roomSelect.querySelectorAll('option');
    options.forEach(opt => {
      const optVal = opt.value;
      const matched = rooms.find(r => r.selectValue === optVal);
      if (matched) {
        if (matched.status === 'SOLDOUT') {
          opt.disabled = true;
          if (!opt.text.includes('[HẾT PHÒNG]')) {
            opt.text = `[HẾT PHÒNG] ${opt.text}`;
          }
          // Nếu khách đang chọn đúng phòng vừa bị khóa -> reset
          if (roomSelect.value === optVal) {
            roomSelect.value = '';
          }
        } else {
          opt.disabled = false;
          opt.text = opt.text.replace('[HẾT PHÒNG] ', '');
        }
      }
    });
  }
}
