import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dir = searchParams.get('dir') || '';

    // Target directory under /public. Prevent path traversal by normalizing.
    const safeDir = path.normalize(dir).replace(/^\/+|\/+$|\.\.+/g, '');
    const publicDir = path.join(process.cwd(), 'public', safeDir);

    // Ensure directory exists
    if (!fs.existsSync(publicDir)) {
      return NextResponse.json([], { status: 200 });
    }

    const files = fs.readdirSync(publicDir);
    const csvFiles = files.filter((file) => file.endsWith('.csv'));

    return NextResponse.json(csvFiles);
  } catch (error) {
    console.error('Error reading CSV files:', error);
    return NextResponse.json({ error: 'Failed to read CSV files' }, { status: 500 });
  }
} 