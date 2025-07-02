import { sendMessageToGemini } from '../../services/geminiApi';
import { NextResponse } from 'next/server';

export async function GET(message:string) {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Call the Gemini API (or any other API you're using) to get the actual response
        const { response: botReply } = await sendMessageToGemini(message);

        const encoder = new TextEncoder();
        let done = false;
        let chunkSize = 1000; // Adjust chunk size if needed

        // Simulate sending the bot response in chunks
        for (let i = 0; i < botReply.length; i += chunkSize) {
          const chunk = botReply.slice(i, i + chunkSize);
          controller.enqueue(encoder.encode(chunk));
          await new Promise(resolve => setTimeout(resolve, 100)); // Simulate a delay for streaming
        }

        controller.close(); // Close the stream once done

      } catch (error) {
        console.error('Error during streaming:', error);
        controller.error(error);
      }
    },
  });

  return new NextResponse(stream);
}
