import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = '/data';
const PHOTO_EXTS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

export function getUserDir(userId: string): string {
  return path.join(DATA_DIR, 'users', userId);
}

export function getEntriesDir(userId: string): string {
  return path.join(getUserDir(userId), 'entries');
}

export function getPhotosDir(userId: string): string {
  return path.join(getUserDir(userId), 'photos');
}

export function getPhotoPath(userId: string, date: string): string {
  return path.join(getPhotosDir(userId), `${date}.jpg`);
}

export function getPhotoPathById(userId: string, date: string, photoId: string, ext = '.jpg'): string {
  return path.join(getPhotosDir(userId), `${date}__${photoId}${ext}`);
}

export async function ensureUserDir(userId: string): Promise<void> {
  await fs.mkdir(getUserDir(userId), { recursive: true });
  await fs.mkdir(getEntriesDir(userId), { recursive: true });
  await fs.mkdir(getPhotosDir(userId), { recursive: true });
}

export async function readEntry(userId: string, date: string): Promise<Record<string, unknown> | null> {
  const filePath = path.join(getEntriesDir(userId), `${date}.json`);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function writeEntry(userId: string, date: string, data: Record<string, unknown>): Promise<void> {
  await ensureUserDir(userId);
  const filePath = path.join(getEntriesDir(userId), `${date}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function readProfile(userId: string): Promise<Record<string, unknown> | null> {
  const filePath = path.join(getUserDir(userId), 'profile.json');
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function writeProfile(userId: string, data: Record<string, unknown>): Promise<void> {
  await ensureUserDir(userId);
  const filePath = path.join(getUserDir(userId), 'profile.json');
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function hasPhoto(userId: string, date: string): Promise<boolean> {
  const photos = await listPhotos(userId, date);
  return photos.length > 0;
}

function getExtensionFromMimeType(mimeType: string | undefined): string {
  switch (mimeType) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    default:
      return '.jpg';
  }
}

export async function savePhoto(userId: string, date: string, buffer: Buffer, mimeType?: string): Promise<{ id: string; path: string }> {
  await ensureUserDir(userId);

  const ext = getExtensionFromMimeType(mimeType);
  const photoId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const filePath = getPhotoPathById(userId, date, photoId, ext);
  await fs.writeFile(filePath, buffer);

  return { id: photoId, path: filePath };
}

export async function listEntryDates(userId: string): Promise<string[]> {
  const entriesDir = getEntriesDir(userId);
  try {
    const files = await fs.readdir(entriesDir);
    return files
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''))
      .sort();
  } catch {
    return [];
  }
}

export async function listPhotos(userId: string, date: string): Promise<Array<{ id: string; urlId: string; ext: string; path: string }>> {
  const photosDir = getPhotosDir(userId);
  try {
    const files = await fs.readdir(photosDir);
    const prefix = `${date}__`;

    const multiPhotos = files
      .filter((f) => f.startsWith(prefix) && PHOTO_EXTS.some((ext) => f.endsWith(ext)))
      .map((f) => {
        const ext = path.extname(f);
        const base = f.slice(0, -ext.length);
        const id = base.slice(prefix.length);
        return { id, urlId: id, ext, path: path.join(photosDir, f) };
      })
      .sort((a, b) => a.id.localeCompare(b.id));

    if (multiPhotos.length > 0) {
      return multiPhotos;
    }

    for (const ext of PHOTO_EXTS) {
      const legacyPath = path.join(photosDir, `${date}${ext}`);
      try {
        await fs.access(legacyPath);
        return [{ id: 'legacy', urlId: 'legacy', ext, path: legacyPath }];
      } catch {
        // continue
      }
    }

    return [];
  } catch {
    return [];
  }
}

export async function getPhotoById(userId: string, date: string, photoId?: string | null): Promise<{ path: string; ext: string } | null> {
  const photos = await listPhotos(userId, date);
  if (photos.length === 0) return null;

  if (!photoId) {
    const first = photos[0];
    return { path: first.path, ext: first.ext };
  }

  const match = photos.find((photo) => photo.urlId === photoId);
  if (!match) return null;

  return { path: match.path, ext: match.ext };
}

export async function listPhotoDates(userId: string): Promise<string[]> {
  const photosDir = getPhotosDir(userId);
  try {
    const files = await fs.readdir(photosDir);
    const dates = new Set<string>();

    for (const file of files) {
      if (!PHOTO_EXTS.some((ext) => file.endsWith(ext))) continue;

      const ext = path.extname(file);
      const base = file.slice(0, -ext.length);
      const date = base.includes('__') ? base.split('__')[0] : base;
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        dates.add(date);
      }
    }

    return Array.from(dates).sort();
  } catch {
    return [];
  }
}
