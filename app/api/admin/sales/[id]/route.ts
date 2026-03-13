import { query } from '@/lib/db';

export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword } from '@/lib/admin-auth';

function checkAdmin(req: NextRequest): boolean {
  const adminPassword = req.headers.get('x-admin-password');
  return verifyAdminPassword(adminPassword);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { commission_paid } = await req.json();

    if (commission_paid === true) {
      await query(
        'UPDATE sales SET commission_paid = true, paid_at = NOW() WHERE id = $1',
        [params.id]
      );
    } else {
      await query(
        'UPDATE sales SET commission_paid = false, paid_at = NULL WHERE id = $1',
        [params.id]
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    await query('DELETE FROM sales WHERE id = $1', [params.id]);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
