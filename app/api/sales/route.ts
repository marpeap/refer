import { query } from '@/lib/db';

export const runtime = 'nodejs';
import { verifyToken } from '@/lib/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    const result = await query(
      'SELECT id, client_name, service, amount, admin_note, created_at FROM sales WHERE referrer_id = $1 ORDER BY created_at DESC',
      [payload.id]
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Token invalide' },
      { status: 401 }
    );
  }
}
