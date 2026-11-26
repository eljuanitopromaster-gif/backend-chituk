import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Cliente privilegiado (Service Role). Solo puede importarse desde código de servidor.
// Nunca llamar a signIn* sobre este cliente: compartiría la sesión entre peticiones.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
