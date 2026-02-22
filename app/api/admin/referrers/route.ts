import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

function verifyAdminPassword(req: NextRequest): boolean {
  const adminPassword = req.headers.get('x-admin-password');
  return adminPassword === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!verifyAdminPassword(req)) {
    return NextResponse.json(
      { error: 'Non autorisé' },
      { status: 401 }
    );
  }

  try {
    const result = await sql`
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
      LEFT JOIN sales s ON s.referrer_id = r.id
      GROUP BY r.id, r.full_name, r.email, r.phone, r.code, r.status, r.created_at
      ORDER BY r.created_at DESC
    `;

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des apporteurs' },
      { status: 500 }
    );
  }
}
