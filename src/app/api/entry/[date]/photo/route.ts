import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { savePhoto } from '@/lib/storage';

export const config = {
  api: {
    bodyParser: false,
  },
};

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

    const formData = await req.formData();
    const file = formData.get('photo') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await savePhoto(userId, date, buffer);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/entry/photo error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
