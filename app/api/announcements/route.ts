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

  const announcements = await query(`
    SELECT id, title, content, type, created_at
    FROM announcements
    WHERE active = true AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY created_at DESC
    LIMIT 5
  `);

  return NextResponse.json({ announcements });
}
