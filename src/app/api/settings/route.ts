import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readProfile, writeProfile } from '@/lib/storage';

export interface UserSettings {
  weightUnit: 'kg' | 'lbs';
  measurementUnit: 'cm' | 'in';
  firstDayOfWeek: 'Monday' | 'Sunday';
  height?: number;
}

const DEFAULTS: UserSettings = {
  weightUnit: 'kg',
  measurementUnit: 'cm',
  firstDayOfWeek: 'Monday',
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: 'No user ID' }, { status: 400 });
  }

  const profile = (await readProfile(userId)) ?? {};
  const settings: UserSettings = {
    weightUnit: (profile.weightUnit as UserSettings['weightUnit']) ?? DEFAULTS.weightUnit,
    measurementUnit: (profile.measurementUnit as UserSettings['measurementUnit']) ?? DEFAULTS.measurementUnit,
    firstDayOfWeek: (profile.firstDayOfWeek as UserSettings['firstDayOfWeek']) ?? DEFAULTS.firstDayOfWeek,
    height: (profile.height as number | undefined),
  };

  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: 'No user ID' }, { status: 400 });
  }

  let body: Partial<UserSettings>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const profile = (await readProfile(userId)) ?? {};

  if (body.weightUnit !== undefined) profile.weightUnit = body.weightUnit;
  if (body.measurementUnit !== undefined) profile.measurementUnit = body.measurementUnit;
  if (body.firstDayOfWeek !== undefined) profile.firstDayOfWeek = body.firstDayOfWeek;
  if (body.height !== undefined) profile.height = body.height;

  await writeProfile(userId, profile);

  return NextResponse.json({ ok: true });
}
