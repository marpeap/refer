import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

function checkAdmin(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const challenges = await query(`
    SELECT
      c.*,
      (SELECT COUNT(*) FROM challenge_completions cc WHERE cc.challenge_id = c.id) AS completions_count,
      (SELECT JSON_AGG(JSON_BUILD_OBJECT(
        'referrer_id', cc.referrer_id,
        'referrer_name', r.full_name,
        'referrer_code', r.code,
        'completed_at', cc.completed_at,
        'bonus_paid', cc.bonus_paid
      ))
       FROM challenge_completions cc
       JOIN referrers r ON r.id = cc.referrer_id
       WHERE cc.challenge_id = c.id
      ) AS completions
    FROM challenges c
    ORDER BY c.created_at DESC
  `);

  return NextResponse.json({ challenges });
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, description, month, condition_type, condition_value, bonus_amount } = await req.json();
  if (!title || !month || !condition_type || !condition_value || bonus_amount === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const rows = await query(`
    INSERT INTO challenges (title, description, month, condition_type, condition_value, bonus_amount)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id
  `, [title, description || null, month, condition_type, JSON.stringify(condition_value), bonus_amount]);

  return NextResponse.json({ id: rows[0].id });
}
