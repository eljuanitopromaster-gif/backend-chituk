import { NextResponse } from 'next/server';
import { requireUserAdmin } from '@/app/lib/server/auth';
import { supabaseAdmin as supabase } from '@/app/lib/server/supabaseAdmin';
import { canAssignRole, canModifyUser, ASSIGNABLE_ROLES } from '@/app/lib/userPermissions';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const auth = await requireUserAdmin(request);
    if (!auth.ok) return auth.response;

    // Fetch all users using service role (bypasses RLS)
    const { data: publicUsers, error } = await supabase
        .from('users')
        .select('*');

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch auth users to merge email and creation date
    const emailMap: Record<string, string> = {};
    const createdMap: Record<string, string> = {};
    const missingAuthUsers: any[] = [];

    try {
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        if (!authError && authData?.users) {
            const existingIds = new Set((publicUsers || []).map(u => u.id));

            authData.users.forEach(au => {
                if (au.id) {
                    if (au.email) emailMap[au.id] = au.email;
                    if (au.created_at) createdMap[au.id] = au.created_at;
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
                        created_at: au.created_at,
                        avatar: au.user_metadata?.avatar || null
                    });
                }
            });
        }
    } catch (authErr) {
        console.warn("Could not fetch auth emails/dates:", authErr);
    }

    const enrichedUsers = (publicUsers || []).map(u => {
        const creationDate = u.createdAt || u.created_at || createdMap[u.id] || null;
        return {
            ...u,
            email: u.email || emailMap[u.id] || null,
            createdAt: creationDate,
            created_at: creationDate
        };
    });

    const allUsers = [...enrichedUsers, ...missingAuthUsers].sort((a, b) => {
        const timeA = new Date(a.createdAt || a.created_at || 0).getTime();
        const timeB = new Date(b.createdAt || b.created_at || 0).getTime();
        return timeB - timeA;
    });

    return NextResponse.json(allUsers);
}

export async function POST(request: Request) {
    const auth = await requireUserAdmin(request);
    if (!auth.ok) return auth.response;
    const actor = auth.user;

    try {
        const body = await request.json();
        const { targetUserId, action, value } = body;

        if (!targetUserId || typeof targetUserId !== 'string' || !action) {
            return NextResponse.json({ error: 'Faltan parámetros.' }, { status: 400 });
        }

        // Jerarquía: se comprueba el rol actual del objetivo antes de cualquier acción
        const { data: targetUser, error: targetError } = await supabase
            .from('users')
            .select('role')
            .eq('id', targetUserId)
            .maybeSingle();

        if (targetError) throw targetError;

        if (!canModifyUser(actor.role, targetUser?.role)) {
            return NextResponse.json({ error: 'Solo un propietario puede modificar a otro propietario.' }, { status: 403 });
        }

        // Rol y verificación viven en public.users: sin perfil no hay nada que actualizar
        if ((action === 'role' || action === 'verify') && !targetUser) {
            return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
        }

        if (action === 'role') {
            if (targetUserId === actor.id) {
                return NextResponse.json({ error: 'No puedes cambiar tu propio rol.' }, { status: 400 });
            }
            if (!(ASSIGNABLE_ROLES as readonly string[]).includes(value)) {
                return NextResponse.json({ error: 'Rol no válido.' }, { status: 400 });
            }
            if (!canAssignRole(actor.role, value)) {
                return NextResponse.json({ error: 'Solo un propietario puede asignar el rol de propietario.' }, { status: 403 });
            }
            const { error } = await supabase.from('users').update({ role: value }).eq('id', targetUserId);
            if (error) throw error;
        } else if (action === 'verify') {
            if (typeof value !== 'boolean') {
                return NextResponse.json({ error: 'Valor de verificación no válido.' }, { status: 400 });
            }
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

            if (targetUserId === actor.id) {
                return NextResponse.json({ error: 'No puedes banear tu propia cuenta.' }, { status: 400 });
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
            return NextResponse.json({ error: 'Acción no válida.' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Error desconocido.' }, { status: 500 });
    }
}
