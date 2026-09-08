import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { scriptId, action } = body;

        if (!scriptId || !['approve', 'reject', 'delete'].includes(action)) {
            return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
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
