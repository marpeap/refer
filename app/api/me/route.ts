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
      'SELECT full_name, email, phone, code FROM referrers WHERE id = $1',
      [payload.id]
    );

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Token invalide' },
      { status: 401 }
    );
  }
}
