import { query } from './db';

export interface BadgeDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  condition: {
    type: 'sales_count' | 'service_sold' | 'tier' | 'commission_total' | 'filleuls_count';
    value: number | string;
  };
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first_sale',
    name: 'Premier client',
    icon: '🎯',
    description: 'Vous avez réalisé votre première vente',
    condition: { type: 'sales_count', value: 1 },
  },
  {
    id: 'five_sales',
    name: '5 clients signés',
    icon: '⭐',
    description: 'Vous avez signé 5 clients',
    condition: { type: 'sales_count', value: 5 },
  },
  {
    id: 'ten_sales',
    name: 'Vétéran',
    icon: '🏆',
    description: 'Vous avez signé 10 clients',
    condition: { type: 'sales_count', value: 10 },
  },
  {
    id: 'mcorp_sold',
    name: 'Big Deal',
    icon: '💎',
    description: 'Vous avez vendu un pack M-CORP',
    condition: { type: 'service_sold', value: 'M-CORP' },
  },
  {
    id: 'gold_tier',
    name: 'Gold Member',
    icon: '🥇',
    description: 'Vous avez atteint le tier Gold',
    condition: { type: 'tier', value: 'gold' },
  },
  {
    id: 'club_500',
    name: 'Club 500€',
    icon: '💰',
    description: 'Vous avez cumulé 500€ de commissions',
    condition: { type: 'commission_total', value: 500 },
  },
  {
    id: 'club_1000',
    name: 'Club 1000€',
    icon: '💸',
    description: 'Vous avez cumulé 1000€ de commissions',
    condition: { type: 'commission_total', value: 1000 },
  },
  {
    id: 'recruiter',
    name: 'Recruteur',
    icon: '🤝',
    description: 'Vous avez recruté votre premier filleul',
    condition: { type: 'filleuls_count', value: 1 },
  },
];

export async function checkAndAwardBadges(referrerId: string): Promise<string[]> {
  const newBadges: string[] = [];

  // Fetch referrer stats
  const [salesCountRow] = await query(
    'SELECT COUNT(*) as cnt FROM sales WHERE referrer_id = $1',
    [referrerId]
  );
  const salesCount = Number(salesCountRow?.cnt ?? 0);

  const [commissionRow] = await query(
    'SELECT COALESCE(SUM(commission_amount), 0) as total FROM sales WHERE referrer_id = $1',
    [referrerId]
  );
  const commissionTotal = Number(commissionRow?.total ?? 0);

  const [referrerRow] = await query(
    'SELECT tier FROM referrers WHERE id = $1',
    [referrerId]
  );
  const tier = referrerRow?.tier ?? 'bronze';

  const servicesRows = await query(
    'SELECT DISTINCT service FROM sales WHERE referrer_id = $1',
    [referrerId]
  );
  const services = servicesRows.map((r: any) => r.service);

  const [filialsRow] = await query(
    'SELECT COUNT(*) as cnt FROM referrers WHERE referred_by = $1',
    [referrerId]
  );
  const filialsCount = Number(filialsRow?.cnt ?? 0);

  // Already earned badges
  const earnedRows = await query(
    'SELECT badge_id FROM referrer_badges WHERE referrer_id = $1',
    [referrerId]
  );
  const alreadyEarned = new Set(earnedRows.map((r: any) => r.badge_id));

  for (const badge of BADGE_DEFINITIONS) {
    if (alreadyEarned.has(badge.id)) continue;

    let earned = false;
    const { type, value } = badge.condition;

    if (type === 'sales_count') earned = salesCount >= (value as number);
    else if (type === 'commission_total') earned = commissionTotal >= (value as number);
    else if (type === 'tier') earned = tier === value;
    else if (type === 'service_sold') earned = services.includes(value as string);
    else if (type === 'filleuls_count') earned = filialsCount >= (value as number);

    if (earned) {
      await query(
        'INSERT INTO referrer_badges (referrer_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [referrerId, badge.id]
      );
      newBadges.push(badge.id);
    }
  }

  return newBadges;
}
