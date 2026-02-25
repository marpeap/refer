import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { BADGE_DEFINITIONS } from '@/lib/badges';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const payload = verifyToken(auth.slice(7));
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const referrerId = payload.id;

  const earnedRows = await query(
    'SELECT badge_id, earned_at FROM referrer_badges WHERE referrer_id = $1 ORDER BY earned_at DESC',
    [referrerId]
  );
  const earnedSet = new Map(earnedRows.map((r: any) => [r.badge_id, r.earned_at]));

  // Current stats for progress calculation
  const [salesRow] = await query('SELECT COUNT(*) AS cnt FROM sales WHERE referrer_id = $1', [referrerId]);
  const salesCount = Number(salesRow?.cnt ?? 0);

  const [commRow] = await query('SELECT COALESCE(SUM(commission_amount),0) AS total FROM sales WHERE referrer_id = $1', [referrerId]);
  const commTotal = Number(commRow?.total ?? 0);

  const [refRow] = await query('SELECT tier FROM referrers WHERE id = $1', [referrerId]);
  const tier = refRow?.tier ?? 'bronze';

  const servRows = await query('SELECT DISTINCT service FROM sales WHERE referrer_id = $1', [referrerId]);
  const services = servRows.map((r: any) => r.service);

  const [filRow] = await query('SELECT COUNT(*) AS cnt FROM referrers WHERE referred_by = $1', [referrerId]);
  const filialsCount = Number(filRow?.cnt ?? 0);

  const earned = [];
  const available = [];

  for (const badge of BADGE_DEFINITIONS) {
    if (earnedSet.has(badge.id)) {
      earned.push({ id: badge.id, name: badge.name, icon: badge.icon, description: badge.description, earned_at: earnedSet.get(badge.id) });
    } else {
      // Compute progress
      const { type, value } = badge.condition;
      let current = 0;
      let target = typeof value === 'number' ? value : 1;

      if (type === 'sales_count') current = salesCount;
      else if (type === 'commission_total') current = commTotal;
      else if (type === 'tier') current = tier === value ? 1 : 0;
      else if (type === 'service_sold') current = services.includes(value as string) ? 1 : 0;
      else if (type === 'filleuls_count') current = filialsCount;

      available.push({
        id: badge.id,
        name: badge.name,
        icon: badge.icon,
        description: badge.description,
        progress: { current: Math.min(current, target), target },
      });
    }
  }

  return NextResponse.json({ earned, available });
}
