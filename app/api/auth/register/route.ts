import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { signToken } from '@/lib/jwt';
import { NextRequest, NextResponse } from 'next/server';

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

    const password_hash = await bcrypt.hash(password, 10);
    const code = generateCode(full_name);

    await sql`
      INSERT INTO referrers (id, full_name, email, phone, password_hash, code, status, created_at)
      VALUES (gen_random_uuid(), ${full_name}, ${email}, ${phone}, ${password_hash}, ${code}, 'pending', NOW())
    `;

    return NextResponse.json(
      { message: 'Demande envoyée. Notre équipe vous contactera sous 48h.' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message?.includes('unique constraint')) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    );
  }
}
