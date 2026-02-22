import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (password === process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    return NextResponse.json(
      { error: 'Mot de passe incorrect' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}
