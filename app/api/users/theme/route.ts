import { NextResponse } from 'next/server';
import { requireActiveUser } from '@/app/lib/server/auth';
import { supabaseAdmin as supabase } from '@/app/lib/server/supabaseAdmin';

export async function POST(request: Request) {
    try {
        const auth = await requireActiveUser(request);
        if (!auth.ok) return auth.response;

        const { theme } = await request.json();

        if (!theme || typeof theme !== 'string') {
            return NextResponse.json({ error: 'Falta el tema.' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('users')
            .update({ theme })
            .eq('id', auth.user.id)
            .select();

        if (error) {
            console.error('Error updating user theme in database:', error.message);
            return NextResponse.json({ error: 'No se pudo guardar el tema.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data, theme });
    } catch (error: any) {
        console.error("Error in POST /api/users/theme:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
