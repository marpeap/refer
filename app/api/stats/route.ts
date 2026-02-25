import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const payload = verifyToken(auth.slice(7));
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const referrerId = payload.id;

  // Weekly series (last 8 weeks)
  const weeklySeries = await query(`
    SELECT
      TO_CHAR(date_trunc('week', created_at), 'IYYY-"W"IW') AS week,
      COUNT(*) AS sales,
      COALESCE(SUM(commission_amount), 0) AS commission
    FROM sales
    WHERE referrer_id = $1
      AND created_at >= NOW() - INTERVAL '8 weeks'
    GROUP BY week
    ORDER BY week ASC
  `, [referrerId]);

  // By service
  const byService = await query(`
    SELECT service, COUNT(*) AS count, COALESCE(SUM(commission_amount), 0) AS commission
    FROM sales
    WHERE referrer_id = $1
    GROUP BY service
    ORDER BY count DESC
  `, [referrerId]);

  // Monthly totals for projection
  const monthlyStats = await query(`
    SELECT
      TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') AS month,
      COALESCE(SUM(commission_amount), 0) AS total
    FROM sales
    WHERE referrer_id = $1
      AND created_at >= NOW() - INTERVAL '3 months'
    GROUP BY month
    ORDER BY month DESC
    LIMIT 3
  `, [referrerId]);

  // Projection: avg of last 3 months, trend
  let monthlyEstimate = 0;
  let trend = 'stable';
  if (monthlyStats.length > 0) {
    const totals = monthlyStats.map((r: any) => Number(r.total));
    monthlyEstimate = Math.round(totals.reduce((a: number, b: number) => a + b, 0) / totals.length);
    if (totals.length >= 2) {
      trend = totals[0] > totals[1] ? 'up' : totals[0] < totals[1] ? 'down' : 'stable';
    }
  }

  // Click stats
  const clicksTotal = await query(
    'SELECT COUNT(*) AS cnt FROM link_clicks WHERE referrer_id = $1',
    [referrerId]
  );
  const clicksMonth = await query(
    "SELECT COUNT(*) AS cnt FROM link_clicks WHERE referrer_id = $1 AND created_at >= date_trunc('month', NOW())",
    [referrerId]
  );
  const salesMonth = await query(
    "SELECT COUNT(*) AS cnt FROM sales WHERE referrer_id = $1 AND created_at >= date_trunc('month', NOW())",
    [referrerId]
  );
  const totalClicks = Number(clicksTotal[0]?.cnt ?? 0);
  const monthClicks = Number(clicksMonth[0]?.cnt ?? 0);
  const monthSales = Number(salesMonth[0]?.cnt ?? 0);
  const conversionRate = monthClicks > 0 ? Math.round((monthSales / monthClicks) * 100) / 100 : 0;

  // Cascade stats
  const cascadeStats = await query(`
    SELECT
      COUNT(DISTINCT r.id) AS filleuls_count,
      COALESCE(SUM(cc.amount), 0) AS total_cascade_earned,
      COALESCE(SUM(CASE WHEN cc.paid = false THEN cc.amount ELSE 0 END), 0) AS pending_cascade
    FROM referrers r
    LEFT JOIN cascade_commissions cc ON cc.referrer_id = $1 AND cc.filleul_id = r.id
    WHERE r.referred_by = $1
  `, [referrerId]);

  const cascade = cascadeStats[0] ?? {};

  return NextResponse.json({
    series_weekly: weeklySeries.map((r: any) => ({
      week: r.week,
      sales: Number(r.sales),
      commission: Number(r.commission),
    })),
    by_service: byService.map((r: any) => ({
      service: r.service,
      count: Number(r.count),
      commission: Number(r.commission),
    })),
    projection: {
      monthly_estimate: monthlyEstimate,
      trend,
    },
    clicks: {
      total: totalClicks,
      this_month: monthClicks,
      conversion_rate: conversionRate,
    },
    cascade: {
      filleuls_count: Number(cascade.filleuls_count ?? 0),
      total_cascade_earned: Number(cascade.total_cascade_earned ?? 0),
      pending_cascade: Number(cascade.pending_cascade ?? 0),
    },
  });
}
