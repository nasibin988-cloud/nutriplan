import { NextRequest, NextResponse } from 'next/server';
import { chat, startConversation, clearConversation, generateNextWeek } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, message } = body;

    if (!sessionId && action !== 'generateWeek') {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    switch (action) {
      case 'start': {
        const response = await startConversation(sessionId);
        return NextResponse.json(response);
      }

      case 'chat': {
        if (!message) {
          return NextResponse.json({ error: 'Message required' }, { status: 400 });
        }
        const response = await chat(sessionId, message);
        return NextResponse.json(response);
      }

      case 'clear': {
        clearConversation(sessionId);
        return NextResponse.json({ success: true });
      }

      case 'generateWeek': {
        const { profile, currentWeek } = body;
        if (!profile) {
          return NextResponse.json({ error: 'Profile required' }, { status: 400 });
        }
        const result = await generateNextWeek(profile, currentWeek || 1);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request. Please try again.' },
      { status: 500 }
    );
  }
}
