import { requireStaff } from '@/app/lib/server/auth';
import { deleteGame, getGame, updateGame } from '@/app/lib/server/games';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  return getGame((await params).id);
}

export async function PUT(request: Request, { params }: Context) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  return updateGame(request, (await params).id);
}

export async function DELETE(request: Request, { params }: Context) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  return deleteGame((await params).id);
}
