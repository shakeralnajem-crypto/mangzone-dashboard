import type { VercelRequest, VercelResponse } from '@vercel/node';

const TELEGRAM_CHAT_ID = '6575119160';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { fullName, phone, clinicName, teamSize, notes } = req.body as Record<string, string>;

  const results = { telegram: false, sheets: false, errors: [] as string[] };

  // Telegram via CallMeBot
  try {
    const text = encodeURIComponent(
      `🦷 تسجيل جديد - Mangzone\n\n👤 الاسم: ${fullName}\n📞 الهاتف: ${phone}\n🏥 العيادة: ${clinicName || '-'}\n👥 حجم الفريق: ${teamSize || '-'}\n📝 ملاحظات: ${notes || '-'}`
    );
    const tgUrl = `https://api.callmebot.com/text.php?user=${TELEGRAM_CHAT_ID}&text=${text}`;
    const tgRes = await fetch(tgUrl);
    results.telegram = tgRes.ok;
    if (!tgRes.ok) results.errors.push(`Telegram: ${tgRes.status}`);
  } catch (e) {
    results.errors.push(`Telegram: ${String(e)}`);
  }

  // Google Sheets via Apps Script webhook
  const sheetsUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (sheetsUrl) {
    try {
      const sheetsRes = await fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phone, clinicName, teamSize, notes }),
      });
      results.sheets = sheetsRes.ok;
      if (!sheetsRes.ok) results.errors.push(`Sheets: ${sheetsRes.status}`);
    } catch (e) {
      results.errors.push(`Sheets: ${String(e)}`);
    }
  } else {
    results.errors.push('Sheets: GOOGLE_SHEETS_WEBHOOK_URL not set');
  }

  return res.status(200).json({ success: true, results });
}
