import { NextResponse } from 'next/server';

type SimilarityReq = {
  code1: string;
  code2: string;
  parser?: 'Python' | 'Java';
};

export async function POST(request: Request) {
  try {
    const { code1, code2, parser }: SimilarityReq = await request.json();

    if (!code1 || !code2) {
      return NextResponse.json(
        { error: 'Both code snippets are required', similarity: 0 },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_FLASK_API;
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_FLASK_API env var not set', similarity: 0 },
        { status: 500 }
      );
    }

    const flaskRes = await fetch(`${baseUrl}/similarity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code1, code2, lang: parser }),
    });

    const contentType = flaskRes.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      const text = await flaskRes.text();
      return NextResponse.json(
        { error: 'Flask returned non-JSON', detail: text, similarity: 0 },
        { status: flaskRes.status }
      );
    }

    const data: { similarity: number; error?: string } = await flaskRes.json();

    if (!flaskRes.ok || data.error) {
      return NextResponse.json(
        { error: data.error ?? `Flask error ${flaskRes.status}`, similarity: 0 },
        { status: flaskRes.status }
      );
    }

    return NextResponse.json({ similarity: data.similarity });
  /* eslint-disable @typescript-eslint/no-explicit-any */
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Unknown error', similarity: 0 },
      { status: 500 }
    );
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
