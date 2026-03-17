import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listEntryDates } from '@/lib/storage';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'No user ID' }, { status: 400 });
    }

    const dates = await listEntryDates(userId);
    return NextResponse.json({ dates });
  } catch (error) {
    console.error('GET /api/entries error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
