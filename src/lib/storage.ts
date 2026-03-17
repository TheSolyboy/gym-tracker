import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = '/data';

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
  const exts = ['.jpg', '.jpeg', '.png', '.webp'];
  for (const ext of exts) {
    try {
      await fs.access(path.join(getPhotosDir(userId), `${date}${ext}`));
      return true;
    } catch {
      // continue
    }
  }
  return false;
}

export async function savePhoto(userId: string, date: string, buffer: Buffer): Promise<void> {
  await ensureUserDir(userId);
  const filePath = getPhotoPath(userId, date);
  await fs.writeFile(filePath, buffer);
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

export async function listPhotoDates(userId: string): Promise<string[]> {
  const photosDir = getPhotosDir(userId);
  try {
    const files = await fs.readdir(photosDir);
    const exts = ['.jpg', '.jpeg', '.png', '.webp'];
    return files
      .filter((f) => exts.some((ext) => f.endsWith(ext)))
      .map((f) => f.replace(/\.[^/.]+$/, ''))
      .sort();
  } catch {
    return [];
  }
}
