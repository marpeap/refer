import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

function verifyAdminPassword(req: NextRequest): boolean {
  const adminPassword = req.headers.get('x-admin-password');
  return adminPassword === process.env.ADMIN_PASSWORD;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAdminPassword(req)) {
    return NextResponse.json(
      { error: 'Non autorisé' },
      { status: 401 }
    );
  }

  try {
    const { status } = await req.json();

    if (!['pending', 'active', 'suspended'].includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      );
    }

    await sql`
      UPDATE referrers
      SET status = ${status}
      WHERE id = ${params.id}
    `;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}
