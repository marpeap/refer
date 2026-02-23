import { verify } from '@node-rs/bcrypt';
import { sql } from '@/lib/db';
import { signToken } from '@/lib/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    const result = await sql`
      SELECT id, full_name, email, code, password_hash, status
      FROM referrers
      WHERE email = ${email}
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    const referrer = result[0];

    if (referrer.status === 'pending') {
      return NextResponse.json(
        { error: 'Votre compte est en attente de validation.' },
        { status: 403 }
      );
    }

    if (referrer.status === 'suspended') {
      return NextResponse.json(
        { error: 'Votre compte a été suspendu.' },
        { status: 403 }
      );
    }

    const isValid = await verify(password, referrer.password_hash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    const token = signToken({
      id: referrer.id,
      email: referrer.email,
      code: referrer.code,
      full_name: referrer.full_name,
    });

    return NextResponse.json({ token }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la connexion' },
      { status: 500 }
    );
  }
}
