import { NextResponse } from 'next/server';
import { Chat } from '@/app/models/Chat';
import dbConnect from '@/app/utils/dbConnect';

export async function POST(req: Request) {
  await dbConnect();
  const { chatId, message } = await req.json();

  if (!chatId) {
    // create a new chat if no ID provided
    const newChat = await Chat.create({
      title: message.content.slice(0, 20),
      messages: [message]
    });
    return NextResponse.json({ chat: newChat });
  }

  // else update existing
  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { $push: { messages: message } },
    { new: true }
  );
  return NextResponse.json({ chat: updatedChat });
}

