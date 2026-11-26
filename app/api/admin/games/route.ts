import { requireStaff } from '@/app/lib/server/auth';
import { createGame, deleteGame, listGamesWithCounts, updateGame } from '@/app/lib/server/games';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  return listGamesWithCounts();
}

export async function POST(request: Request) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  return createGame(request);
}

export async function PUT(request: Request) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  return updateGame(request);
}

export async function DELETE(request: Request) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  let id = new URL(request.url).searchParams.get('id');
  if (!id) {
    const body = await request.json().catch(() => null);
    id = body?.id || null;
  }
  return deleteGame(id || '');
}
