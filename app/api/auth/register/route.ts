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
    const { full_name, email, phone, password } = await req.json();

    if (!full_name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    const password_hash = await hash(password, 10);
    const code = generateCode(full_name);

    await query(
      `INSERT INTO referrers (id, full_name, email, phone, password_hash, code, status, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'pending', NOW())`,
      [full_name, email, phone, password_hash, code]
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
