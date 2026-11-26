import { NextResponse } from 'next/server';
import { requireActiveUser } from '@/app/lib/server/auth';
import { supabaseAdmin as supabase } from '@/app/lib/server/supabaseAdmin';

export async function POST(request: Request) {
    try {
        const auth = await requireActiveUser(request);
        if (!auth.ok) return auth.response;

        const { data, error } = await supabase
            .from('users')
            .update({ terms_accepted: true })
            .eq('id', auth.user.id)
            .select();

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
