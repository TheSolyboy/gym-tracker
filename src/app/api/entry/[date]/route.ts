import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readEntry, writeEntry, hasPhoto, readProfile, writeProfile } from '@/lib/storage';

export async function GET(
  _req: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'No user ID' }, { status: 400 });
    }

    const { date } = params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const entry = await readEntry(userId, date);
    const profile = await readProfile(userId);
    const photoExists = await hasPhoto(userId, date);

    // Auto-fill height from profile if not in entry
    const mergedEntry = {
      ...entry,
      height: entry?.height ?? profile?.height,
    };

    return NextResponse.json({ entry: mergedEntry, hasPhoto: photoExists });
  } catch (error) {
    console.error('GET /api/entry error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'No user ID' }, { status: 400 });
    }

    const { date } = params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const body = await req.json();
    await writeEntry(userId, date, body);

    // If height provided, update profile
    if (body.height) {
      const profile = await readProfile(userId) || {};
      await writeProfile(userId, { ...profile, height: body.height });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/entry error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
