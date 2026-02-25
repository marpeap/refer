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
  const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

  const challenges = await query(`
    SELECT
      c.id, c.title, c.description, c.month, c.condition_type,
      c.condition_value, c.bonus_amount,
      cc.completed_at, cc.bonus_paid
    FROM challenges c
    LEFT JOIN challenge_completions cc ON cc.challenge_id = c.id AND cc.referrer_id = $1
    WHERE c.active = true AND c.month = $2
    ORDER BY c.created_at ASC
  `, [referrerId, currentMonth]);

  return NextResponse.json({
    challenges: challenges.map((c: any) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      month: c.month,
      condition_type: c.condition_type,
      condition_value: c.condition_value,
      bonus_amount: Number(c.bonus_amount),
      completed: !!c.completed_at,
      completion_date: c.completed_at || null,
      bonus_paid: !!c.bonus_paid,
    })),
  });
}
