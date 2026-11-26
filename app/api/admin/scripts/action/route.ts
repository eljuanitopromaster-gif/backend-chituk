import { NextResponse } from 'next/server';
import { requireStaff } from '@/app/lib/server/auth';
import { supabaseAdmin as supabase } from '@/app/lib/server/supabaseAdmin';

export async function POST(request: Request) {
    const auth = await requireStaff(request);
    if (!auth.ok) return auth.response;

    try {
        const body = await request.json();
        const { scriptId, action } = body;

        if (!scriptId || !['approve', 'reject', 'delete'].includes(action)) {
            return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
        }

        if (action === 'delete') {
            const { error: deleteError } = await supabase
                .from('projects')
                .delete()
                .eq('id', scriptId);

            if (deleteError) throw deleteError;
        } else {
            const status = action === 'approve' ? 'approved' : 'rejected';
            const { error: updateError } = await supabase
                .from('projects')
                .update({ status })
                .eq('id', scriptId);

            if (updateError) throw updateError;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
