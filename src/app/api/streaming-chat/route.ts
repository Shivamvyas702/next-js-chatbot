import { getGeminiReply } from '@/lib/gemini';
import { sendMessageToGemini } from '@/app/services/geminiApi';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const message = searchParams.get('message');

  if (!message) {
    return new NextResponse('Message is required', { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const chunkSize = 1000;

     const botReply = await getGeminiReply(message);
const encoder = new TextEncoder();

for (let i = 0; i < botReply.length; i++) {
  const char = botReply[i];
  controller.enqueue(encoder.encode(char));
  await new Promise(resolve => setTimeout(resolve, 15)); // smaller delay, more fluid
}


        // ✅ Save to DB (optional)
        await sendMessageToGemini(message, undefined, botReply);

        controller.close();
      } catch (error) {
        console.error('Streaming error:', error);
        controller.error(error);
      }
    },
  });

  return new NextResponse(stream);
}
