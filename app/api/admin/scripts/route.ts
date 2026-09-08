import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
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
        
    if (userError || !user || (user.role !== 'owner' && user.role !== 'mod')) {
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
