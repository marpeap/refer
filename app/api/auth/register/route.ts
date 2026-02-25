import { NextRequest, NextResponse } from 'next/server';
import { hash } from '@node-rs/bcrypt';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

function generateCode(fullName: string): string {
  const initials = fullName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${initials}-${random}`;
}

export async function POST(req: NextRequest) {
  try {
    const { full_name, email, phone, password, referred_by_code } = await req.json();

    if (!full_name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    const password_hash = await hash(password, 10);
    const code = generateCode(full_name);

    // Resolve referred_by_code → UUID
    let referredById: string | null = null;
    if (referred_by_code) {
      const parrains = await query(
        "SELECT id FROM referrers WHERE code = $1 AND status = 'active'",
        [referred_by_code.toUpperCase()]
      );
      if (parrains.length > 0) {
        referredById = parrains[0].id;
      }
    }

    await query(
      `INSERT INTO referrers (id, full_name, email, phone, password_hash, code, status, referred_by, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'pending', $6, NOW())`,
      [full_name, email, phone, password_hash, code, referredById]
    );

    return NextResponse.json(
      { message: 'Demande envoyée. Notre équipe vous contactera sous 48h.' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message?.includes('unique')) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
