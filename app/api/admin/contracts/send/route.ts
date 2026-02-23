import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
import { PDFDocument, StandardFonts } from 'pdf-lib';
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
    const referrerResult = await query('SELECT * FROM referrers WHERE id = $1', [referrerId]);
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
      // Generate PDF from text using pdf-lib
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      const { width, height } = page.getSize();
      const fontSize = 12;
      const margin = 50;
      const maxWidth = width - 2 * margin;
      
      // Simple text wrapping
      const words = pdfText.split(' ');
      let currentLine = '';
      const lines: string[] = [];
      
      for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        
        if (testWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      
      // Draw text
      let y = height - margin;
      for (const line of lines) {
        page.drawText(line, {
          x: margin,
          y,
          size: fontSize,
          font,
        });
        y -= fontSize + 4;
      }
      
      pdfBuffer = Buffer.from(await pdfDoc.save());
      pdfFilename = `contract_${referrer.code}_${Date.now()}.pdf`;
    } else {
      return NextResponse.json({ error: 'Missing pdf or pdf_text' }, { status: 400 });
    }

    // Calculate hash
    const pdfHashBefore = calculateHash(pdfBuffer);

    // Upload to storage
    const uploadFormData = new FormData();
    uploadFormData.append(
      'file', 
      new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' }), 
      pdfFilename
    );

    const uploadRes = await fetch(
      `${STORAGE_URL}/upload?secret=${UPLOAD_SECRET}`, 
      {
        method: 'POST',
        body: uploadFormData,
      }
    );

    if (!uploadRes.ok) {
      const uploadError = await uploadRes.text();
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError}` }, 
        { status: 500 }
      );
    }

    const uploadData = await uploadRes.json();
    const storedFilename = uploadData.filename;

    // Generate OTP
    const otpCode = generateOTP();
    const otpSentAt = new Date().toISOString();

    // Insert contract
    const contractResult = await query(
      'INSERT INTO contracts (referrer_id, pdf_filename, pdf_hash_before, status, otp_code, otp_sent_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [referrerId, storedFilename, pdfHashBefore, 'sent', otpCode, otpSentAt]
    );
    const contractId = contractResult[0].id;

    // Log audit
    await query(
      'INSERT INTO contract_audit (contract_id, action) VALUES ($1, $2)',
      [contractId, 'sent']
    );

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
          filename: storedFilename,
          content: pdfBase64,
        },
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Contract send error:', error.message);
    console.error('Stack:', error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
