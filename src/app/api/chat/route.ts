import { NextResponse } from 'next/server';
import { Chat } from '@/app/models/Chat';
import dbConnect from '@/app/utils/dbConnect';

// GET all chats
export async function GET() {
  await dbConnect();
  try {
    const chats = await Chat.find({});
    return NextResponse.json({ chats });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}
