import { NextResponse } from 'next/server';
import { grokChat } from '@/ai/flows/grok-chat';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { history, prompt } = body ?? {};

    if (!prompt || !Array.isArray(history)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ response: 'AI is not configured. Please set GEMINI_API_KEY.' }, { status: 200 });
    }

    const result = await grokChat({ history, prompt });
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}


