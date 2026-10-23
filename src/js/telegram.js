/**
 * LAL ANGLE HOMESTAY · TELEGRAM NOTIFICATION DISPATCHER
 * Modular Source Architecture
 */

import { STORAGE_KEYS, DEFAULT_CONFIG } from './config.js';
import { escapeTelegramMarkdown } from './security.js';

export async function sendTelegramNotification(data) {
  const token = localStorage.getItem(STORAGE_KEYS.TELEGRAM_TOKEN) || DEFAULT_CONFIG.TELEGRAM_TOKEN;
  const chatId = localStorage.getItem(STORAGE_KEYS.TELEGRAM_CHAT_ID) || DEFAULT_CONFIG.TELEGRAM_CHAT_ID;

  playNotificationChime();

  if (!token || !chatId) {
    console.info('[TELEGRAM] Chưa cấu hình Token hoặc Chat ID. Đơn đã được lưu vào lịch sử local.');
    return { ok: true, simulated: true };
  }

  const cleanPhoneDigits = data.phone.replace(/[^0-9]/g, '');

  const messageText = 
    `🔔 *CÓ KHÁCH ĐẶT PHÒNG MỚI · LAL ANGLE HOMESTAY*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Khách hàng:* ${data.name}\n` +
    `📞 *SĐT / Zalo:* \`${data.phone}\`\n` +
    `🏠 *Phòng:* ${data.room}\n` +
    `📅 *Lịch:* ${data.checkIn} ➔ ${data.checkOut} (${data.nights})\n` +
    `👥 *Khách:* ${data.guests}\n` +
    `✨ *Dịch vụ:* ${data.extra}\n` +
    `📝 *Ghi chú:* ${data.notes || 'Không có'}\n` +
    `💰 *Tạm tính:* ${data.total}\n` +
    `🔐 *Idempotency:* \`${data.idempotencyKey || 'N/A'}\`\n` +
    `⏰ *Thời gian:* ${data.time}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👉 Bấm gọi chốt ngay: tel:${cleanPhoneDigits}`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: 'Markdown'
      })
    });

    const result = await response.json();
    if (!result.ok) {
      console.warn('[TELEGRAM] API response error:', result.description);
      return { ok: false, error: result.description };
    }
    return { ok: true, messageId: result.result?.message_id };
  } catch (error) {
    console.error('[TELEGRAM] Network fetch exception:', error);
    return { ok: false, error: error.message };
  }
}

export async function testTelegramConnection(token, chatId) {
  if (!token || !chatId) {
    throw new Error('Vui lòng nhập đầy đủ Bot Token và Chat ID');
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: '🎉 *LAL ANGLE TEST:*\nKết nối Telegram thành công! Khi có khách đặt phòng trên web/Vercel, thông báo sẽ gửi ngay vào đây.',
      parse_mode: 'Markdown'
    })
  });

  return await res.json();
}

export function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
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
