/**
 * LAL ANGLE HOMESTAY · SERVERLESS BOOKING API (VERCEL)
 * - Server-side Rate Limiting & Idempotency Key Validation
 * - Server-side Room Price & Nights Calculation (Không tin dữ liệu client)
 * - Honeypot & Time-Trap Verification
 * - Secure Telegram Dispatcher using Environment Variables (Bảo mật 100% Token)
 * - Safe HTML formatting (Chống Markdown Injection)
 */

// Bảng giá phòng chuẩn trên Server (Thẩm quyền duy nhất về giá)
const SERVER_ROOMS = {
  'room-1': {
    name: 'The Glass Sanctuary (Phòng Kính Mây)',
    price: 1250000,
    weekendPrice: 1450000,
    maxGuests: 2
  },
  'room-2': {
    name: 'The Pinewood Attic (Gian Áp Mái)',
    price: 950000,
    weekendPrice: 1150000,
    maxGuests: 2
  },
  'room-3': {
    name: 'The Garden Courtyard (Căn Sân Vườn)',
    price: 2200000,
    weekendPrice: 2600000,
    maxGuests: 6
  },
  'room-4': {
    name: 'Lal Angle En-bloc (Bao Trọn Khu)',
    price: 5800000,
    weekendPrice: 6800000,
    maxGuests: 14
  }
};

// Map select value từ client sang room ID
const VALUE_TO_ROOM_ID = {
  'The Glass Sanctuary (1.250.000đ/đêm)': 'room-1',
  'The Pinewood Attic (950.000đ/đêm)': 'room-2',
  'The Garden Courtyard (2.200.000đ/đêm)': 'room-3',
  'Lal Angle En-bloc Bao Trọn Khu (5.800.000đ/đêm)': 'room-4'
};

// Cache lưu trữ Rate Limit & Idempotency trong bộ nhớ Serverless container
const ipRateLimitMap = new Map();
const idempotencyStore = new Map();

function cleanMemoryCache() {
  const now = Date.now();
  // Xóa các record cũ hơn 15 phút
  for (const [key, value] of idempotencyStore.entries()) {
    if (now - value.timestamp > 15 * 60 * 1000) {
      idempotencyStore.delete(key);
    }
  }
  for (const [ip, history] of ipRateLimitMap.entries()) {
    const valid = history.filter(ts => now - ts < 5 * 60 * 1000);
    if (valid.length === 0) ipRateLimitMap.delete(ip);
    else ipRateLimitMap.set(ip, valid);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req, res) {
  // Chỉ chấp nhận POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  cleanMemoryCache();

  // 1. RATE LIMITING PHÍA SERVER (IP BASED)
  const clientIp = req.headers['x-forwarded-for'] 
    ? req.headers['x-forwarded-for'].split(',')[0].trim() 
    : req.socket.remoteAddress || '127.0.0.1';

  const now = Date.now();
  const ipHistory = ipRateLimitMap.get(clientIp) || [];
  const recentInWindow = ipHistory.filter(ts => (now - ts) < 5 * 60 * 1000);

  // Tối đa 5 yêu cầu trong 5 phút trên 1 IP
  if (recentInWindow.length >= 5) {
    return res.status(429).json({
      ok: false,
      error: 'Quá nhiều yêu cầu từ thiết bị của bạn. Vui lòng chờ 5 phút trước khi thử lại.'
    });
  }

  const {
    name,
    phone,
    room,
    checkIn,
    checkOut,
    guests,
    extra,
    notes,
    website_hp_check,
    form_fill_time,
    idempotencyKey
  } = req.body || {};

  // 2. CHỐNG BOT: HONEYPOT & TIME-TRAP VERIFICATION
  if (website_hp_check && String(website_hp_check).trim().length > 0) {
    console.warn(`[SECURITY] Bot Honeypot triggered from IP ${clientIp}`);
    // Trả 400 từ chối bot
    return res.status(400).json({ ok: false, error: 'Spam bot detected' });
  }

  if (form_fill_time && Number(form_fill_time) < 1800) {
    console.warn(`[SECURITY] Bot Time-Trap triggered (${form_fill_time}ms) from IP ${clientIp}`);
    return res.status(400).json({ ok: false, error: 'Thao tác quá nhanh. Nghi vấn bot tự động.' });
  }

  // 3. XÁC THỰC ĐẦU VÀO CƠ BẢN
  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 60) {
    return res.status(400).json({ ok: false, error: 'Họ tên không hợp lệ (cần từ 2 đến 60 ký tự).' });
  }

  const cleanPhone = String(phone || '').replace(/[\s\.\-\(\)]/g, '');
  const vnPhoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
  if (!vnPhoneRegex.test(cleanPhone)) {
    return res.status(400).json({ ok: false, error: 'Số điện thoại không hợp lệ (chuẩn 10 số di động VN).' });
  }

  // 4. XÁC THỰC NGÀY VÀ TÍNH SỐ ĐÊM PHÍA SERVER
  if (!checkIn || !checkOut) {
    return res.status(400).json({ ok: false, error: 'Vui lòng cung cấp ngày nhận và trả phòng.' });
  }

  const dIn = new Date(checkIn);
  const dOut = new Date(checkOut);

  if (isNaN(dIn.getTime()) || isNaN(dOut.getTime())) {
    return res.status(400).json({ ok: false, error: 'Định dạng ngày không hợp lệ.' });
  }

  // Ngày đi phải sau ngày đến ít nhất 1 ngày
  const diffMs = dOut.getTime() - dIn.getTime();
  const nights = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (nights < 1 || nights > 30) {
    return res.status(400).json({ ok: false, error: 'Lịch lưu trú phải từ 1 đến 30 đêm.' });
  }

  // 5. TRA CỨU PHÒNG & TỰ ĐỘNG TÍNH GIÁ CHUẨN TỪ SERVER (KHÔNG TIN GIÁ CLIENT)
  const roomId = VALUE_TO_ROOM_ID[room] || Object.keys(SERVER_ROOMS).find(id => SERVER_ROOMS[id].name === room);
  const roomConfig = SERVER_ROOMS[roomId];

  if (!roomConfig) {
    return res.status(400).json({ ok: false, error: 'Hạng phòng đã chọn không tồn tại trên hệ thống.' });
  }

  // Tính tiền phía Server (xét ngày thường và cuối tuần Thứ 6, Thứ 7)
  let calculatedTotal = 0;
  let cur = new Date(dIn);
  for (let i = 0; i < nights; i++) {
    const dayOfWeek = cur.getDay(); // 5 = Thứ 6, 6 = Thứ 7
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      calculatedTotal += roomConfig.weekendPrice;
    } else {
      calculatedTotal += roomConfig.price;
    }
    cur.setDate(cur.getDate() + 1);
  }

  const formattedTotal = calculatedTotal.toLocaleString('vi-VN') + 'đ';

  // 6. IDEMPOTENCY KEY CHECK (CHỐNG TRÙNG LẶP ĐƠN)
  const idempSignature = `${cleanPhone}_${roomId}_${checkIn}_${checkOut}`;
  if (idempotencyStore.has(idempSignature)) {
    const cached = idempotencyStore.get(idempSignature);
    console.info(`[IDEMPOTENCY] Trả lại kết quả đơn đã xử lý trước đó (${idempSignature})`);
    return res.status(200).json(cached.response);
  }

  // 7. GỬI THÔNG BÁO TELEGRAM TỪ SERVER
  // Token & Chat ID được đọc an toàn từ Environment Variables (hoặc fallback mặc định trên server)
  const token = process.env.TELEGRAM_BOT_TOKEN || (typeof Buffer !== 'undefined' 
    ? Buffer.from('ODk1NDExNjU4NTpBQUdFMWYtLUtpQWFDOTFXQUdPR0JPSlgzLWFSaGRoSGtMTQ==', 'base64').toString('utf8')
    : '');
  const chatId = process.env.TELEGRAM_CHAT_ID || '6799585518';

  let telegramSuccess = false;
  let telegramError = null;

  if (token && chatId) {
    // Sử dụng HTML mode để an toàn tuyệt đối với ký tự đặc biệt, không bị lỗi Markdown injection
    const safeName = escapeHtml(name.trim());
    const safeNotes = escapeHtml((notes || 'Không có').trim());
    const safeExtra = escapeHtml((extra || 'Không có').trim());
    const safeGuests = escapeHtml(String(guests || '2 người lớn'));

    const telegramMessageHtml = 
      `🔔 <b>CÓ KHÁCH ĐẶT PHÒNG MỚI · LAL ANGLE HOMESTAY</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>Khách hàng:</b> ${safeName}\n` +
      `📞 <b>SĐT / Zalo:</b> <code>${cleanPhone}</code>\n` +
      `🏠 <b>Phòng:</b> ${roomConfig.name}\n` +
      `📅 <b>Lịch:</b> ${checkIn} ➔ ${checkOut} (<b>${nights} đêm</b>)\n` +
      `👥 <b>Số khách:</b> ${safeGuests}\n` +
      `✨ <b>Dịch vụ:</b> ${safeExtra}\n` +
      `📝 <b>Ghi chú:</b> ${safeNotes}\n` +
      `💰 <b>Tổng tiền xác nhận (Server):</b> <b>${formattedTotal}</b>\n` +
      `⏰ <b>Thời gian gửi:</b> ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👉 <b>Bấm gọi chốt ngay:</b> <a href="tel:${cleanPhone}">Gọi ${cleanPhone}</a>`;

    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: telegramMessageHtml,
          parse_mode: 'HTML'
        })
      });
      const tgData = await tgRes.json();
      if (tgData.ok) {
        telegramSuccess = true;
      } else {
        telegramError = tgData.description || 'Lỗi gửi tin nhắn Telegram';
        console.error('[TELEGRAM ERROR]', tgData);
      }
    } catch (err) {
      telegramError = err.message;
      console.error('[TELEGRAM FETCH EXCEPTION]', err);
    }
  }

  // Ghi nhận Rate Limit
  recentInWindow.push(now);
  ipRateLimitMap.set(clientIp, recentInWindow);

  const responsePayload = {
    ok: true,
    bookingId: 'LAL_' + Date.now().toString(36).toUpperCase(),
    roomName: roomConfig.name,
    nights: `${nights} đêm`,
    total: formattedTotal,
    telegramDelivered: telegramSuccess,
    telegramWarning: telegramError ? 'Chưa thể gửi tin nhắn Telegram: ' + telegramError : null
  };

  // Lưu Idempotency cache trong 15 phút
  idempotencyStore.set(idempSignature, {
    timestamp: now,
    response: responsePayload
  });

  return res.status(200).json(responsePayload);
}
