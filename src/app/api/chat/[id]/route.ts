import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/utils/dbConnect';
import { Chat } from '@/app/models/Chat';

export async function PUT(req: NextRequest, context: any) {
  await dbConnect();

  try {
    const { id } = context.params;
    const { title } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const updated = await Chat.findByIdAndUpdate(id, { title }, { new: true });

    if (!updated) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json({ updated });
  } catch (error) {
    console.error('PUT chat error:', error);
    return NextResponse.json({ error: 'Failed to update chat' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: any) {
  await dbConnect();

  try {
    const { id } = context.params;
    const deletedChat = await Chat.findByIdAndDelete(id);

    if (!deletedChat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('DELETE chat error:', error);
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}
