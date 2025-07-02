import { NextRequest, NextResponse } from 'next/server';
import { Chat } from '@/app/models/Chat';
import dbConnect from '@/app/utils/dbConnect';

export async function PUT(req: NextRequest) {
  const { chatId, title } = await req.json();

  if (!chatId || !title) {
    return NextResponse.json({ error: 'Chat ID and title are required' }, { status: 400 });
  }

  await dbConnect();

  // Update the chat title by chatId
  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { title: title },
    { new: true } // This will return the updated document
  );

  if (!updatedChat) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
  }

  return NextResponse.json({ chat: updatedChat });
}
