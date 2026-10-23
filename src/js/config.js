/**
 * LAL ANGLE HOMESTAY · CLIENT CONFIGURATION & CONSTANTS
 * Secure Architecture: Không chứa Token hoặc Secret trong Frontend!
 */

export const STORAGE_KEYS = {
  BOOKINGS_HISTORY: 'lal_angle_bookings_history',
  ROOMS_STATUS: 'lal_angle_rooms_status',
  ADMIN_SESSION: 'lal_angle_admin_session',
  RATE_LIMIT_TIMESTAMP: 'lal_angle_rate_limit_ts',
  RATE_LIMIT_HISTORY: 'lal_angle_rate_limit_history',
  IDEMPOTENCY_STORE: 'lal_angle_idempotency_store'
};

// Cấu hình bảo mật chống Spam & Rate Limiting
export const SECURITY_CONFIG = {
  COOLDOWN_SECONDS: 15,
  MAX_SUBMISSIONS_WINDOW: 3,
  WINDOW_TIME_MS: 5 * 60 * 1000,
  MIN_FORM_FILL_TIME_MS: 1500,
  MAX_NAME_LENGTH: 60,
  MAX_PHONE_LENGTH: 15,
  MAX_NOTES_LENGTH: 300
};

// Cấu hình mã PIN bảo vệ trang Quản lý Homestay (Chủ homestay tự đổi được)
export const DEFAULT_ADMIN_PIN = '1234';

// Danh sách 4 hạng phòng mặc định của Lal Angle Homestay
export const INITIAL_ROOMS = [
  {
    id: 'room-1',
    name: 'The Glass Sanctuary (Phòng Kính Mây)',
    selectValue: 'The Glass Sanctuary (1.250.000đ/đêm)',
    price: 1250000,
    weekendPrice: 1450000,
    badgeText: 'Được yêu thích nhất',
    badgeClass: '',
    status: 'AVAILABLE'
  },
  {
    id: 'room-2',
    name: 'The Pinewood Attic (Gian Áp Mái)',
    selectValue: 'The Pinewood Attic (950.000đ/đêm)',
    price: 950000,
    weekendPrice: 1150000,
    badgeText: '',
    badgeClass: '',
    status: 'AVAILABLE'
  },
  {
    id: 'room-3',
    name: 'The Garden Courtyard (Căn Sân Vườn)',
    selectValue: 'The Garden Courtyard (2.200.000đ/đêm)',
    price: 2200000,
    weekendPrice: 2600000,
    badgeText: 'Cho gia đình & nhóm',
    badgeClass: 'blue-badge',
    status: 'AVAILABLE'
  },
  {
    id: 'room-4',
    name: 'Lal Angle En-bloc (Bao Trọn Khu)',
    selectValue: 'Lal Angle En-bloc Bao Trọn Khu (5.800.000đ/đêm)',
    price: 5800000,
    weekendPrice: 6800000,
    badgeText: 'Bao trọn khu',
    badgeClass: 'dark-badge',
    status: 'AVAILABLE'
  }
];
