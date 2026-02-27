import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const password = req.headers.get('x-admin-password');
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Referrer counts by status
  const referrerCounts = await query(`
    SELECT status, COUNT(*) AS cnt FROM referrers GROUP BY status
  `);
  const refMap: Record<string, number> = {};
  referrerCounts.forEach((r: any) => { refMap[r.status] = Number(r.cnt); });

  // Sales stats
  const salesMonth = await query(
    "SELECT COUNT(*) AS cnt FROM sales WHERE created_at >= date_trunc('month', NOW())"
  );
  const salesAll = await query('SELECT COUNT(*) AS cnt FROM sales');

  // Commission stats
  const commMonth = await query(
    "SELECT COALESCE(SUM(commission_amount), 0) AS total FROM sales WHERE created_at >= date_trunc('month', NOW())"
  );
  const commAll = await query('SELECT COALESCE(SUM(commission_amount), 0) AS total FROM sales');
  const commPending = await query(
    "SELECT COALESCE(SUM(commission_amount), 0) AS total FROM sales WHERE commission_paid = false"
  );

  // Top referrer this month
  const topReferrer = await query(`
    SELECT r.full_name AS name, COUNT(s.id) AS sales_count, COALESCE(SUM(s.commission_amount), 0) AS commission
    FROM referrers r
    JOIN sales s ON s.referrer_id = r.id
    WHERE s.created_at >= date_trunc('month', NOW())
    GROUP BY r.id, r.full_name
    ORDER BY commission DESC
    LIMIT 1
  `);

  // Monthly series (last 6 months)
  const monthlySeries = await query(`
    SELECT
      TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') AS month,
      COUNT(*) AS sales,
      COALESCE(SUM(commission_amount), 0) AS commission
    FROM sales
    WHERE created_at >= NOW() - INTERVAL '6 months'
    GROUP BY TO_CHAR(date_trunc('month', created_at), 'YYYY-MM')
    ORDER BY month ASC
  `);

  // By service
  const byService = await query(`
    SELECT service, COUNT(*) AS count, COALESCE(SUM(commission_amount), 0) AS commission
    FROM sales
    GROUP BY service
    ORDER BY count DESC
  `);

  return NextResponse.json({
    referrers: {
      total: Object.values(refMap).reduce((a, b) => a + b, 0),
      active: refMap['active'] ?? 0,
      pending: refMap['pending'] ?? 0,
      suspended: refMap['suspended'] ?? 0,
    },
    sales: {
      this_month: Number(salesMonth[0]?.cnt ?? 0),
      all_time: Number(salesAll[0]?.cnt ?? 0),
    },
    commissions: {
      this_month: Number(commMonth[0]?.total ?? 0),
      all_time: Number(commAll[0]?.total ?? 0),
      pending: Number(commPending[0]?.total ?? 0),
    },
    top_referrer: topReferrer[0]
      ? {
          name: topReferrer[0].name,
          sales: Number(topReferrer[0].sales_count),
          commission: Number(topReferrer[0].commission),
        }
      : null,
    series_monthly: monthlySeries.map((r: any) => ({
      month: r.month,
      sales: Number(r.sales),
      commission: Number(r.commission),
    })),
    by_service: byService.map((r: any) => ({
      service: r.service,
      count: Number(r.count),
      commission: Number(r.commission),
    })),
  });
}
