import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const password = req.headers.get('x-admin-password');
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Commissions non versées groupées par apporteur
  const rows = await query(`
    SELECT
      r.full_name AS referrer_name,
      r.code AS referrer_code,
      r.email,
      COALESCE(SUM(s.commission_amount), 0) AS pending_commission,
      COALESCE(
        (SELECT SUM(cc.amount) FROM cascade_commissions cc WHERE cc.referrer_id = r.id AND cc.paid = false),
        0
      ) AS pending_cascade,
      COUNT(s.id) AS sales_count
    FROM referrers r
    LEFT JOIN sales s ON s.referrer_id = r.id AND s.paid = false
    WHERE r.status = 'active'
    GROUP BY r.id, r.full_name, r.code, r.email
    HAVING COALESCE(SUM(s.commission_amount), 0) > 0
       OR COALESCE(
            (SELECT SUM(cc.amount) FROM cascade_commissions cc WHERE cc.referrer_id = r.id AND cc.paid = false),
            0
          ) > 0
    ORDER BY pending_commission DESC
  `);

  // Next payment date: 1st of next month
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextPaymentDate = nextMonth.toISOString().split('T')[0];

  const payments = rows.map((r: any) => ({
    referrer_name: r.referrer_name,
    referrer_code: r.referrer_code,
    email: r.email,
    pending_commission: Number(r.pending_commission),
    pending_cascade: Number(r.pending_cascade),
    pending_amount: Number(r.pending_commission) + Number(r.pending_cascade),
    sales_count: Number(r.sales_count),
    next_payment_date: nextPaymentDate,
  }));

  return NextResponse.json({ payments, next_payment_date: nextPaymentDate });
}
