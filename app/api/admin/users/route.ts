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
    const { data: publicUsers, error } = await supabase
        .from('users')
        .select('*')
        .order('createdAt', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch auth users to merge email
    const emailMap: Record<string, string> = {};
    const missingAuthUsers: any[] = [];

    try {
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        if (!authError && authData?.users) {
            const existingIds = new Set((publicUsers || []).map(u => u.id));

            authData.users.forEach(au => {
                if (au.id && au.email) {
                    emailMap[au.id] = au.email;
                }
                if (!existingIds.has(au.id)) {
                    missingAuthUsers.push({
                        id: au.id,
                        username: au.user_metadata?.username || au.email?.split('@')[0] || 'Usuario Auth',
                        email: au.email,
                        role: 'user',
                        is_verified: false,
                        banned: !!au.banned_until,
                        createdAt: au.created_at,
                        avatar: au.user_metadata?.avatar || null
                    });
                }
            });
        }
    } catch (authErr) {
        console.warn("Could not fetch auth emails:", authErr);
    }

    const enrichedUsers = (publicUsers || []).map(u => ({
        ...u,
        email: u.email || emailMap[u.id] || null
    }));

    return NextResponse.json([...enrichedUsers, ...missingAuthUsers]);
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
        } else if (action === 'email') {
            const { email } = body;
            if (!email || typeof email !== 'string' || !email.includes('@')) {
                return NextResponse.json({ error: 'Correo electrónico inválido' }, { status: 400 });
            }
            // 1. Actualizar en Supabase Auth si existe
            try {
                await supabase.auth.admin.updateUserById(targetUserId, { email: email.trim() });
            } catch (authErr) {
                console.warn("Auth user email update notice:", authErr);
            }
            // 2. Actualizar en tabla users
            try {
                await supabase.from('users').update({ email: email.trim() }).eq('id', targetUserId);
            } catch (dbErr) {
                console.warn("Public user email update notice:", dbErr);
            }
        } else if (action === 'ban') {
            const { isBanned, reason } = body;

            if (targetUserId === userId) {
                return NextResponse.json({ error: 'No puedes banear tu propia cuenta.' }, { status: 400 });
            }

            // Validar que un no-owner no pueda banear a un owner
            const { data: targetUser } = await supabase
                .from('users')
                .select('role')
                .eq('id', targetUserId)
                .single();

            if (targetUser?.role === 'owner' && user.role !== 'owner') {
                return NextResponse.json({ error: 'Solo un Propietario (Owner) puede sancionar a otro Propietario.' }, { status: 403 });
            }

            // Actualizar tabla users
            const { error: banError } = await supabase
                .from('users')
                .update({ 
                    banned: !!isBanned, 
                    banReason: isBanned ? (reason || 'Suspendido por la administración') : null 
                })
                .eq('id', targetUserId);

            if (banError) throw banError;

            // Sincronizar ban en Supabase Auth para revocar sesión y acceso
            try {
                await supabase.auth.admin.updateUserById(targetUserId, {
                    ban_duration: isBanned ? '876000h' : 'none'
                });
            } catch (authErr) {
                console.warn("Auth ban sync error:", authErr);
            }
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}
