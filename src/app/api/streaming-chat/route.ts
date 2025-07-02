import { sendMessageToGemini } from '../../services/geminiApi';
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
        const { response: botReply } = await sendMessageToGemini(message);

        const encoder = new TextEncoder();
        const chunkSize = 1000;

        for (let i = 0; i < botReply.length; i += chunkSize) {
          const chunk = botReply.slice(i, i + chunkSize);
          controller.enqueue(encoder.encode(chunk));
          await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
        }

        controller.close();
      } catch (error) {
        console.error('Error during streaming:', error);
        controller.error(error);
      }
    },
  });

  return new NextResponse(stream);
}
