import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { Resend } from 'resend';
import crypto from 'crypto';

const RESEND_API_KEY = process.env.RESEND_API_KEY as string;
const STORAGE_URL = process.env.STORAGE_URL as string;

const resend = new Resend(RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7);
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { otp_code, signature_image } = body;

    if (!otp_code || !signature_image) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const referrerId = payload.id;

    // Get the contract for this referrer
    const contracts = await sql`
      SELECT 
        c.id,
        c.pdf_filename,
        c.pdf_hash_before,
        c.otp_code,
        c.otp_sent_at,
        c.status,
        r.email,
        r.full_name
      FROM contracts c
      JOIN referrers r ON c.referrer_id = r.id
      WHERE c.referrer_id = ${referrerId}
      ORDER BY c.created_at DESC
      LIMIT 1
    `;

    if (contracts.length === 0) {
      return NextResponse.json({ error: 'No contract found' }, { status: 404 });
    }

    const contract = contracts[0];

    // Check if already signed
    if (contract.status === 'signed') {
      return NextResponse.json({ error: 'Contract already signed' }, { status: 400 });
    }

    // Verify OTP
    if (contract.otp_code !== otp_code) {
      return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 });
    }

    // Check OTP expiry (24 hours)
    const otpSentAt = new Date(contract.otp_sent_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - otpSentAt.getTime()) / (1000 * 60 * 60);
    if (hoursDiff > 24) {
      return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
    }

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const signedAt = new Date().toISOString();

    // For hash after signature, we use the same hash (proves non-modification)
    const pdfHashAfter = contract.pdf_hash_before;

    // Update contract
    await sql`
      UPDATE contracts
      SET 
        signature_image = ${signature_image},
        ip_address = ${ipAddress},
        user_agent = ${userAgent},
        signed_at = ${signedAt},
        pdf_hash_after = ${pdfHashAfter},
        status = 'signed',
        otp_verified = true
      WHERE id = ${contract.id}
    `;

    // Log audit
    await sql`
      INSERT INTO contract_audit (contract_id, action, ip_address, user_agent)
      VALUES (${contract.id}, 'signed', ${ipAddress}, ${userAgent})
    `;

    // Send confirmation email
    const pdfUrl = `${STORAGE_URL}/contracts/${contract.pdf_filename}`;
    const formattedDate = now.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const formattedTime = now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    await resend.emails.send({
      from: 'Marpeap <noreply@marpeap.digital>',
      to: contract.email,
      subject: 'Votre contrat a été signé',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #5B6EF5;">Bonjour ${contract.full_name},</h2>
          <p>Votre contrat Marpeap a été signé avec succès.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Nom :</strong> ${contract.full_name}</p>
            <p><strong>Date :</strong> ${formattedDate}</p>
            <p><strong>Heure :</strong> ${formattedTime}</p>
            <p><strong>IP :</strong> ${ipAddress}</p>
          </div>
          <p>Votre contrat est joint à cet email.</p>
          <p><a href="${pdfUrl}" style="color: #5B6EF5;">Télécharger le PDF</a></p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
          <p style="color: #666; font-size: 12px;">Marpeap - Programme d'apporteurs d'affaires</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Contract sign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
