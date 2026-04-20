import type { VercelRequest, VercelResponse } from '@vercel/node';

const TELEGRAM_USER = '@shaker_alnajem';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, patientName, date, time, service, doctor, status } = req.body as Record<string, string>;

  const typeLabel: Record<string, string> = {
    created: '📅 موعد جديد',
    updated: '✏️ تحديث موعد',
    status:  '🔄 تغيير حالة',
  };

  const msg = [
    typeLabel[type] ?? '📅 موعد',
    `👤 ${patientName || '—'}`,
    `📆 ${date || '—'} · ${time || '—'}`,
    service  ? `🦷 ${service}`  : null,
    doctor   ? `👨‍⚕️ ${doctor}`  : null,
    status   ? `📌 ${status}`   : null,
  ].filter(Boolean).join('\n');

  try {
    const url = `https://api.callmebot.com/text.php?user=${TELEGRAM_USER}&text=${encodeURIComponent(msg)}`;
    await fetch(url);
  } catch {
    // fail silently — don't block the user
  }

  return res.status(200).json({ ok: true });
}
