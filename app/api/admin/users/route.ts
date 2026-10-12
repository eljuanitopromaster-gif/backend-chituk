import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

    const allowedRoles = ['owner', 'admin', 'creator'];
    if (userError || !user || !allowedRoles.includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden. Owner or Admin only.' }, { status: 403 });
    }

    // Fetch all users using service role (bypasses RLS)
    const { data, error } = await supabase
        .from('users')
        .select('*')
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
        
    const allowedRoles = ['owner', 'admin', 'creator'];
    if (userError || !user || !allowedRoles.includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden. Owner or Admin only.' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { targetUserId, action, value } = body;

        if (!targetUserId || !action) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        if (action === 'role') {
            const { error } = await supabase.from('users').update({ role: value }).eq('id', targetUserId);
            if (error) throw error;
        } else if (action === 'verify') {
            const { error } = await supabase.from('users').update({ is_verified: value }).eq('id', targetUserId);
            if (error) throw error;
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}
