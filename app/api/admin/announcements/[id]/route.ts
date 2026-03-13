import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAdminPassword } from '@/lib/admin-auth';

export const runtime = 'nodejs';

function checkAdmin(req: NextRequest) {
  return verifyAdminPassword(req.headers.get('x-admin-password'));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { active, title, content, type, expires_at } = body;

  await query(`
    UPDATE announcements
    SET
      active = COALESCE($2, active),
      title = COALESCE($3, title),
      content = COALESCE($4, content),
      type = COALESCE($5, type),
      expires_at = COALESCE($6, expires_at)
    WHERE id = $1
  `, [params.id, active ?? null, title ?? null, content ?? null, type ?? null, expires_at ?? null]);

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await query('DELETE FROM announcements WHERE id = $1', [params.id]);
  return NextResponse.json({ ok: true });
}
