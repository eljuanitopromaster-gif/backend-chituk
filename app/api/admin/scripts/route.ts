import { NextResponse } from 'next/server';
import { requireStaff } from '@/app/lib/server/auth';
import { supabaseAdmin as supabase } from '@/app/lib/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const auth = await requireStaff(request);
    if (!auth.ok) return auth.response;

    // Fetch pending scripts
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'pending')
        .order('createdAt', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function POST(request: Request) {
    const auth = await requireStaff(request);
    if (!auth.ok) return auth.response;

    try {
        const body = await request.json();
        const { projectId, action } = body;

        if (!projectId || !action) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        if (action === 'approve') {
            const { error } = await supabase.from('projects').update({ status: 'approved' }).eq('id', projectId);
            if (error) throw error;
        } else if (action === 'reject') {
            const { error } = await supabase.from('projects').update({ status: 'rejected' }).eq('id', projectId);
            if (error) throw error;
        } else if (action === 'delete') {
            const { error } = await supabase.from('projects').delete().eq('id', projectId);
            if (error) throw error;
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
