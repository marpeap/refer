import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

function checkAdmin(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  // mark-paid action
  if (body.action === 'mark-paid' && body.referrer_id) {
    await query(`
      UPDATE challenge_completions SET bonus_paid = true
      WHERE challenge_id = $1 AND referrer_id = $2
    `, [params.id, body.referrer_id]);
    return NextResponse.json({ ok: true });
  }

  // Toggle active or update fields
  const { active, title, description, bonus_amount } = body;
  await query(`
    UPDATE challenges
    SET
      active = COALESCE($2, active),
      title = COALESCE($3, title),
      description = COALESCE($4, description),
      bonus_amount = COALESCE($5, bonus_amount)
    WHERE id = $1
  `, [params.id, active ?? null, title ?? null, description ?? null, bonus_amount ?? null]);

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await query('DELETE FROM challenges WHERE id = $1', [params.id]);
  return NextResponse.json({ ok: true });
}
