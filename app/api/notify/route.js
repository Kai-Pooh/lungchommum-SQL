// API Route (รันบนเซิร์ฟเวอร์ของ Vercel เท่านั้น)
// รับข้อความจากฝั่ง client แล้วยิงต่อไปยัง Telegram Bot API
// Bot Token อ่านจาก process.env ตรงนี้ (ไม่มี NEXT_PUBLIC_ นำหน้า)
// จึงไม่ถูกรวมเข้าไปใน JavaScript ที่ส่งไปหา browser

export async function POST(request) {
  try {
    const { text } = await request.json();

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return Response.json(
        { ok: false, error: "ยังไม่ได้ตั้งค่า TELEGRAM_BOT_TOKEN หรือ TELEGRAM_CHAT_ID" },
        { status: 500 }
      );
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      return Response.json({ ok: false, error: data.description || "Telegram API error" }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
