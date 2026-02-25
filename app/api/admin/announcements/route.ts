import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendPushToAll } from '@/lib/push';

export const runtime = 'nodejs';

function checkAdmin(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const announcements = await query(`
    SELECT id, title, content, type, active, created_at, expires_at
    FROM announcements
    ORDER BY created_at DESC
  `);

  return NextResponse.json({ announcements });
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, content, type = 'info', expires_at, push_all = false } = await req.json();
  if (!title || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const rows = await query(`
    INSERT INTO announcements (title, content, type, expires_at)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `, [title, content, type, expires_at || null]);

  if (push_all) {
    const typeEmoji: Record<string, string> = { info: 'ℹ️', success: '✅', warning: '⚠️', promo: '🎁' };
    sendPushToAll(`${typeEmoji[type] || '📢'} ${title}`, content.slice(0, 120)).catch(() => {});
  }

  return NextResponse.json({ id: rows[0].id });
}
