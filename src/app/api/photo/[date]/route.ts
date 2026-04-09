import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPhotoById } from '@/lib/storage';
import fs from 'fs/promises';

export async function GET(
  req: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return new NextResponse('No user ID', { status: 400 });
    }

    const { date } = params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return new NextResponse('Invalid date format', { status: 400 });
    }

    const photoId = req.nextUrl.searchParams.get('id');
    const photo = await getPhotoById(userId, date, photoId);

    if (!photo) {
      return new NextResponse('Not found', { status: 404 });
    }

    const fileBuffer = await fs.readFile(photo.path);
    const contentTypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const contentType = contentTypeMap[photo.ext] || 'image/jpeg';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('GET /api/photo error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
