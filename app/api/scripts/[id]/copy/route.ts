import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { data: script, error: fetchError } = await supabase
      .from('projects')
      .select('copies')
      .eq('id', id)
      .single();

    if (fetchError || !script) {
      return NextResponse.json({ error: 'Script no encontrado' }, { status: 404 });
    }

    const currentCopies = script.copies || 0;
    const { error: updateError } = await supabase
      .from('projects')
      .update({ copies: currentCopies + 1 })
      .eq('id', id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, copies: currentCopies + 1 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
