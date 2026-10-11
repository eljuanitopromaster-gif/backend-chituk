import crypto from 'crypto';

const CAPTCHA_SECRET =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.CAPTCHA_SECRET ||
  'chituk_anti_bot_security_key_2026';

// Store used token IDs in memory to prevent replay attacks
const consumedTokens = new Map<string, number>();

// Clean up expired tokens periodically
function cleanupConsumedTokens() {
  const now = Date.now();
  for (const [id, exp] of consumedTokens.entries()) {
    if (exp < now) {
      consumedTokens.delete(id);
    }
  }
}

// Characters that are easy to distinguish (excluding 0, O, 1, I, L)
const CHAR_POOL = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function getRandomChar(): string {
  return CHAR_POOL[Math.floor(Math.random() * CHAR_POOL.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface CaptchaChallenge {
  token: string;
  svg: string;
}

export function generateCaptcha(): CaptchaChallenge {
  cleanupConsumedTokens();

  // Generate 5-character random code
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += getRandomChar();
  }

  const width = 190;
  const height = 50;

  // Colors for characters (neon gaming cyber aesthetic)
  const colors = ['#38bdf8', '#a855f7', '#34d399', '#f472b6', '#facc15', '#60a5fa'];

  // Generate noise lines
  let linesSvg = '';
  for (let i = 0; i < 4; i++) {
    const x1 = getRandomInt(5, 50);
    const y1 = getRandomInt(5, height - 5);
    const x2 = getRandomInt(width - 50, width - 5);
    const y2 = getRandomInt(5, height - 5);
    const cx = getRandomInt(60, 130);
    const cy = getRandomInt(5, height - 5);
    const stroke = colors[i % colors.length];
    linesSvg += `<path d="M${x1},${y1} Q${cx},${cy} ${x2},${y2}" stroke="${stroke}" stroke-width="1.5" fill="none" opacity="0.35" />`;
  }

  // Generate noise dots
  let dotsSvg = '';
  for (let i = 0; i < 25; i++) {
    const cx = getRandomInt(5, width - 5);
    const cy = getRandomInt(5, height - 5);
    const r = (Math.random() * 1.5 + 0.8).toFixed(1);
    const dotColor = colors[getRandomInt(0, colors.length - 1)];
    dotsSvg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${dotColor}" opacity="0.3" />`;
  }

  // Generate characters with distortion (rotation, vertical offset)
  let charsSvg = '';
  const charSpacing = (width - 40) / 5;
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const x = 20 + i * charSpacing + getRandomInt(-2, 3);
    const y = 34 + getRandomInt(-4, 4);
    const rot = getRandomInt(-18, 18);
    const color = colors[i % colors.length];
    const fontSize = getRandomInt(24, 28);
    charsSvg += `<text x="${x}" y="${y}" font-family="monospace, sans-serif" font-weight="900" font-size="${fontSize}" fill="${color}" transform="rotate(${rot}, ${x}, ${y})" letter-spacing="2">${char}</text>`;
  }

  // Slicing slash line
  const sliceY1 = getRandomInt(15, 35);
  const sliceY2 = getRandomInt(15, 35);
  const sliceLine = `<line x1="10" y1="${sliceY1}" x2="${width - 10}" y2="${sliceY2}" stroke="rgba(255,255,255,0.2)" stroke-dasharray="4,3" stroke-width="1" />`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="captchaBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0a0f1d" />
        <stop offset="50%" stop-color="#111827" />
        <stop offset="100%" stop-color="#0b1120" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" rx="8" fill="url(#captchaBg)" stroke="#1f293d" stroke-width="1" />
    ${linesSvg}
    ${dotsSvg}
    ${sliceLine}
    ${charsSvg}
  </svg>`;

  const codeHash = crypto
    .createHash('sha256')
    .update(code.toUpperCase())
    .digest('hex');

  const exp = Date.now() + 5 * 60 * 1000; // 5 min
  const payload = {
    id: crypto.randomUUID(),
    codeHash,
    exp,
  };

  const payloadStr = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadStr).toString('base64url');

  const signature = crypto
    .createHmac('sha256', CAPTCHA_SECRET)
    .update(payloadStr)
    .digest('hex');

  const token = `${payloadBase64}.${signature}`;

  return {
    token,
    svg,
  };
}

export function verifyCaptcha(
  token?: string,
  answer?: string,
  honeypot?: string
): { valid: boolean; error?: string } {
  // 1. Bot honeypot check
  if (honeypot && honeypot.trim().length > 0) {
    return { valid: false, error: 'Solicitud sospechosa detectada.' };
  }

  // 2. Presence check
  if (!token || !answer || answer.trim().length === 0) {
    return { valid: false, error: 'Debes completar la verificación anti-bot.' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Token de seguridad inválido.' };
  }

  const [payloadBase64, signature] = parts;

  let payloadStr: string;
  let payload: { id: string; codeHash: string; exp: number };

  try {
    payloadStr = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
    payload = JSON.parse(payloadStr);
  } catch {
    return { valid: false, error: 'Token de seguridad corrupto.' };
  }

  // 3. Verify HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', CAPTCHA_SECRET)
    .update(payloadStr)
    .digest('hex');

  if (signature !== expectedSignature) {
    return { valid: false, error: 'Firma de seguridad no válida.' };
  }

  // 4. Verify expiration
  if (Date.now() > payload.exp) {
    return { valid: false, error: 'El código de seguridad ha expirado. Por favor genera uno nuevo.' };
  }

  // 5. Verify replay attack
  if (consumedTokens.has(payload.id)) {
    return { valid: false, error: 'Este código ya ha sido utilizado. Genera uno nuevo.' };
  }

  // 6. Compare hashes
  const cleanAnswer = answer.trim().toUpperCase();
  const providedHash = crypto
    .createHash('sha256')
    .update(cleanAnswer)
    .digest('hex');

  if (providedHash !== payload.codeHash) {
    return { valid: false, error: 'Código de seguridad incorrecto.' };
  }

  // Mark token as consumed
  consumedTokens.set(payload.id, payload.exp);

  return { valid: true };
}
