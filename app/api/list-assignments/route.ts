import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const baseDir = path.join(process.cwd(), 'public');
    const languages = ['Java', 'Python'];
    const result: Array<{ language: string; assignment: string; path: string }> = [];

    languages.forEach((lang) => {
      const langDir = path.join(baseDir, lang);
      if (!fs.existsSync(langDir)) return;

      const subDirs = fs
        .readdirSync(langDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);

      subDirs.forEach((assignment) => {
        result.push({ language: lang, assignment, path: `${lang}/${assignment}` });
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error reading assignment directories:', error);
    return NextResponse.json({ error: 'Failed to list assignments' }, { status: 500 });
  }
} 