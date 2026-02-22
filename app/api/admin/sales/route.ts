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
        s.id,
        s.client_name,
        s.service,
        s.amount,
        s.admin_note,
        s.created_at,
        r.full_name as referrer_name
      FROM sales s
      JOIN referrers r ON s.referrer_id = r.id
      ORDER BY s.created_at DESC
    `;

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des ventes' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!verifyAdminPassword(req)) {
    return NextResponse.json(
      { error: 'Non autorisé' },
      { status: 401 }
    );
  }

  try {
    const { referrer_code, client_name, service, amount, admin_note } = await req.json();

    if (!referrer_code || !client_name || !service || !amount) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires sont requis' },
        { status: 400 }
      );
    }

    const referrerResult = await sql`
      SELECT id FROM referrers WHERE code = ${referrer_code}
    `;

    if (referrerResult.length === 0) {
      return NextResponse.json(
        { error: 'Apporteur non trouvé' },
        { status: 404 }
      );
    }

    const referrer_id = referrerResult[0].id;

    const saleResult = await sql`
      INSERT INTO sales (id, referrer_id, client_name, service, amount, admin_note, created_at)
      VALUES (gen_random_uuid(), ${referrer_id}, ${client_name}, ${service}, ${amount}, ${admin_note}, NOW())
      RETURNING id, referrer_id, client_name, service, amount, admin_note, created_at
    `;

    return NextResponse.json(saleResult[0], { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la création de la vente' },
      { status: 500 }
    );
  }
}
