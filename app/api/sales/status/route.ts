import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }
    const payload = verifyToken(authHeader.substring(7));

    const sessionId = req.nextUrl.searchParams.get('session_id');
    if (!sessionId) {
      return NextResponse.json({ error: 'session_id requis' }, { status: 400 });
    }

    const [sale] = await query(
      'SELECT status FROM sales WHERE checkout_session_id = $1 AND referrer_id = $2',
      [sessionId, payload.id]
    );

    if (!sale) {
      return NextResponse.json({ error: 'Vente non trouvee' }, { status: 404 });
    }

    return NextResponse.json({ status: sale.status });
  } catch {
    return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
  }
}
