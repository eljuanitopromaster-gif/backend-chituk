import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { data: publicUser } = await supabase.from('users').select('username').eq('id', user.id).single();
    const username = publicUser?.username;

    let query = supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20);
    
    if (username) {
      query = query.or(`user_id.eq.${user.id},user_id.eq.${username}`);
    } else {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { data: publicUser } = await supabase.from('users').select('username').eq('id', user.id).single();
    const username = publicUser?.username;

    let matchStr = `user_id.eq.${user.id}`;
    if (username) matchStr += `,user_id.eq.${username}`;

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .or(matchStr)
      .eq('read', false)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, updated: data.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
