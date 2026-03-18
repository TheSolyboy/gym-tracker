import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listEntryDates, readEntry } from '@/lib/storage';

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

    const entries = await Promise.all(
      dates.map(async (date) => {
        const entry = await readEntry(userId, date);
        if (!entry) return null;

        const result: Record<string, unknown> = { date };
        const fields = [
          'weight', 'height', 'bodyFat',
          'leftBicep', 'rightBicep',
          'chest', 'waist', 'hips', 'neck',
          'leftThigh', 'rightThigh',
        ];
        for (const field of fields) {
          if (entry[field] !== undefined && entry[field] !== null) {
            result[field] = entry[field];
          }
        }
        return result;
      })
    );

    const filtered = entries.filter(Boolean);
    return NextResponse.json({ entries: filtered });
  } catch (error) {
    console.error('GET /api/analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
