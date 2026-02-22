import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import PDFDocument from 'pdfkit';
import { Resend } from 'resend';
import crypto from 'crypto';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD as string;
const STORAGE_URL = process.env.STORAGE_URL as string;
const UPLOAD_SECRET = process.env.UPLOAD_SECRET as string;
const RESEND_API_KEY = process.env.RESEND_API_KEY as string;

const resend = new Resend(RESEND_API_KEY);

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function calculateHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export async function POST(request: NextRequest) {
  const password = request.headers.get('x-admin-password');
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const referrerId = formData.get('referrer_id') as string;
    const pdfFile = formData.get('pdf') as File | null;
    const pdfText = formData.get('pdf_text') as string | null;

    if (!referrerId) {
      return NextResponse.json({ error: 'Missing referrer_id' }, { status: 400 });
    }

    // Get referrer info
    const referrerResult = await sql`SELECT * FROM referrers WHERE id = ${referrerId}`;
    if (referrerResult.length === 0) {
      return NextResponse.json({ error: 'Referrer not found' }, { status: 404 });
    }
    const referrer = referrerResult[0];

    let pdfBuffer: Buffer;
    let pdfFilename: string;

    if (pdfFile) {
      // Use uploaded PDF
      const arrayBuffer = await pdfFile.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);
      pdfFilename = `contract_${referrer.code}_${Date.now()}.pdf`;
    } else if (pdfText) {
      // Generate PDF from text
      pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        const doc = new PDFDocument();
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.fontSize(12);
        doc.text(pdfText, 50, 50, { width: 500 });
        doc.end();
      });
      pdfFilename = `contract_${referrer.code}_${Date.now()}.pdf`;
    } else {
      return NextResponse.json({ error: 'Missing pdf or pdf_text' }, { status: 400 });
    }

    // Calculate hash
    const pdfHashBefore = calculateHash(pdfBuffer);

    // Upload to storage
    const uploadFormData = new FormData();
    uploadFormData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), pdfFilename);
    uploadFormData.append('secret', UPLOAD_SECRET);
    uploadFormData.append('folder', 'contracts');

    const uploadRes = await fetch(`${STORAGE_URL}/upload`, {
      method: 'POST',
      headers: { 'secret': UPLOAD_SECRET },
      body: uploadFormData,
    });

    if (!uploadRes.ok) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Generate OTP
    const otpCode = generateOTP();
    const otpSentAt = new Date().toISOString();

    // Insert contract
    const contractResult = await sql`
      INSERT INTO contracts (referrer_id, pdf_filename, pdf_hash_before, status, otp_code, otp_sent_at)
      VALUES (${referrerId}, ${pdfFilename}, ${pdfHashBefore}, 'sent', ${otpCode}, ${otpSentAt})
      RETURNING id
    `;
    const contractId = contractResult[0].id;

    // Log audit
    await sql`
      INSERT INTO contract_audit (contract_id, action)
      VALUES (${contractId}, 'sent')
    `;

    // Send email with OTP and PDF attachment
    const pdfBase64 = pdfBuffer.toString('base64');
    
    await resend.emails.send({
      from: 'Marpeap <noreply@marpeap.digital>',
      to: referrer.email,
      subject: 'Votre contrat Marpeap',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #5B6EF5;">Bonjour ${referrer.full_name},</h2>
          <p>Votre contrat Marpeap est prêt à être signé.</p>
          <p>Voici votre code de vérification à 6 chiffres :</p>
          <div style="background: #5B6EF5; color: white; font-size: 48px; font-weight: bold; text-align: center; padding: 30px; border-radius: 12px; margin: 20px 0; letter-spacing: 8px;">
            ${otpCode}
          </div>
          <p>Ce code est valable 24 heures.</p>
          <p>Connectez-vous à votre espace pour signer le contrat : <a href="https://refer.marpeap.digital/dashboard" style="color: #5B6EF5;">Tableau de bord</a></p>
          <p>Le PDF du contrat est joint à cet email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
          <p style="color: #666; font-size: 12px;">Marpeap - Programme d'apporteurs d'affaires</p>
        </div>
      `,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfBase64,
        },
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Contract send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
