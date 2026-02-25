import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendMonthlyRecap } from '@/lib/mailer';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const password = req.headers.get('x-admin-password');
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Default: last month
  const body = await req.json().catch(() => ({}));
  const now = new Date();
  const month =
    body.month ||
    `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`; // previous month

  const referrers = await query(
    "SELECT id FROM referrers WHERE status = 'active'"
  );

  let sent = 0;
  for (const r of referrers) {
    const [hasActivity] = await query(
      `SELECT 1 FROM sales WHERE referrer_id = $1 AND TO_CHAR(created_at, 'YYYY-MM') = $2 LIMIT 1`,
      [r.id, month]
    );
    if (hasActivity) {
      await sendMonthlyRecap(r.id, month);
      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent, month });
}
