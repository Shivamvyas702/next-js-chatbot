import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'bot'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
  title: { type: String, required: true }, // "New Chat" or first user message
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now }
});

export const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);
