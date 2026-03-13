import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword } from '@/lib/admin-auth';

export const runtime = 'nodejs';

function checkAdmin(req: NextRequest): boolean {
  const adminPassword = req.headers.get('x-admin-password');
  return verifyAdminPassword(adminPassword);
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json(
      { error: 'Non autorisé' },
      { status: 401 }
    );
  }

  try {
    const result = await query(`
      SELECT 
        r.id,
        r.full_name,
        r.email,
        r.phone,
        r.code,
        r.status,
        r.created_at,
        COUNT(s.id) as sales_count
      FROM referrers r
      LEFT JOIN sales s ON s.referrer_id = r.id AND s.status = 'confirmed'
      GROUP BY r.id, r.full_name, r.email, r.phone, r.code, r.status, r.created_at
      ORDER BY r.created_at DESC
    `);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des apporteurs' },
      { status: 500 }
    );
  }
}
