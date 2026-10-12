import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const allowedRoles = ['owner', 'admin', 'creator', 'mod'];

export async function GET(request: Request) {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate user role
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
        
    if (userError || !user || !allowedRoles.includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate user role
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
        
    if (userError || !user || !allowedRoles.includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
