import { NextResponse } from 'next/server';
import { generateCaptcha, verifyCaptcha } from '@/app/lib/captcha';

// Disable caching for captcha endpoint
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const challenge = generateCaptcha();
    return NextResponse.json(challenge, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error generating captcha:', error);
    return NextResponse.json({ error: 'Error al generar el captcha' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { token, answer, honeypot } = await req.json();
    const result = verifyCaptcha(token, answer, honeypot);

    if (!result.valid) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error verifying captcha:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
