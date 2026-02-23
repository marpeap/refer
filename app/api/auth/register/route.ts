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
  console.log('=== REGISTER START ===');
  try {
    const body = await req.json();
    console.log('Body reçu:', body);
    
    const { full_name, email, phone, password } = body;
    console.log('DATABASE_URL défini:', !!process.env.DATABASE_URL);

    if (!full_name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    console.log('Tentative hash password...');
    const password_hash = await bcrypt.hash(password, 10);
    console.log('Hash OK');
    
    const code = generateCode(full_name);
    console.log('Code généré:', code);

    console.log('Tentative insertion SQL...');
    await sql`
      INSERT INTO referrers (id, full_name, email, phone, password_hash, code, status, created_at)
      VALUES (gen_random_uuid(), ${full_name}, ${email}, ${phone}, ${password_hash}, ${code}, 'pending', NOW())
    `;
    console.log('Insertion OK');

    return NextResponse.json(
      { message: 'Demande envoyée. Notre équipe vous contactera sous 48h.' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('=== REGISTER ERROR ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription', detail: error.message },
      { status: 500 }
    );
  }
}
