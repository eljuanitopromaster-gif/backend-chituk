import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        const body = await request.json();
        const { theme, id } = body;

        if (!theme) {
            return NextResponse.json({ error: "Missing theme" }, { status: 400 });
        }

        let userId = id;

        if (token) {
            const { data: { user } } = await supabase.auth.getUser(token);
            if (user) {
                userId = user.id;
            }
        }

        if (userId) {
            const { data, error } = await supabase
                .from('users')
                .update({ theme })
                .eq('id', userId)
                .select();

            if (error) {
                console.error("Error updating user theme in database:", error.message);
                return NextResponse.json({ success: true, warning: error.message, theme });
            }

            return NextResponse.json({ success: true, data, theme });
        }

        return NextResponse.json({ success: true, theme });
    } catch (error: any) {
        console.error("Error in POST /api/users/theme:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
