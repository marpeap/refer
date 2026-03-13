import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendMonthlyRecap } from '@/lib/mailer';
import { verifyAdminPassword } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const password = req.headers.get('x-admin-password');
  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Default: last month
  const body = await req.json().catch(() => ({}));
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const month =
    body.month ||
    `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

  const referrers = await query(
    "SELECT id FROM referrers WHERE status = 'active'"
  );

  let sent = 0;
  for (const r of referrers) {
    const [hasActivity] = await query(
      `SELECT 1 FROM sales WHERE referrer_id = $1 AND status = 'confirmed' AND TO_CHAR(created_at, 'YYYY-MM') = $2 LIMIT 1`,
      [r.id, month]
    );
    if (hasActivity) {
      await sendMonthlyRecap(r.id, month);
      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent, month });
}
