import type { VercelRequest, VercelResponse } from '@vercel/node';

const TELEGRAM_USER = '@shaker_alnajem';

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
    const msg = [
      'New Lead - Mangzone',
      `Name: ${fullName}`,
      `Phone: ${phone}`,
      `Clinic: ${clinicName || '-'}`,
      `Team: ${teamSize || '-'}`,
      `Notes: ${notes || '-'}`,
    ].join(' | ');
    const tgUrl = `https://api.callmebot.com/text.php?user=${encodeURIComponent(TELEGRAM_USER)}&text=${encodeURIComponent(msg)}`;
    const tgRes = await fetch(tgUrl);
    const tgBody = await tgRes.text();
    results.telegram = tgRes.ok;
    if (!tgRes.ok) results.errors.push(`Telegram: ${tgRes.status} - ${tgBody}`);
    else results.errors.push(`Telegram OK: ${tgBody}`);
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
