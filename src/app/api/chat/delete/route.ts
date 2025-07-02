import { NextRequest, NextResponse } from 'next/server';
import { Chat } from '@/app/models/Chat';
import dbConnect from '@/app/utils/dbConnect';

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get('id');

  if (!chatId) {
    return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
  }

  await dbConnect();

  // Delete the chat by its ID
  const deletedChat = await Chat.findByIdAndDelete(chatId);

  if (!deletedChat) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Chat deleted successfully' });
}
