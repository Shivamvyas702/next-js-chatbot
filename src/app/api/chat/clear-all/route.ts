import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/utils/dbConnect';
import { Chat } from '@/app/models/Chat';

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();

    const result = await Chat.deleteMany({});

    return NextResponse.json(
      { message: 'All chats deleted successfully', deletedCount: result.deletedCount },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error clearing chats:', error);
    return NextResponse.json({ error: 'Failed to delete all chats' }, { status: 500 });
  }
}
