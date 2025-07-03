// src/app/services/geminiApi.ts
import axios from 'axios';

export const sendMessageToGemini = async (
  message: string,
  chatId?: string,
  botReply?: string  // ✅ allow direct injection of response
): Promise<{ response: string, chatId: string }> => {
  // ✅ Only fetch if not passed from server
  const reply = botReply ?? (await axios.post('/api/chatbot', { message })).data.response;

  // Save messages
  const saveRes = await axios.post('/api/chat/save', {
    chatId,
    message: { role: 'user', content: message },
  });

  const updated = await axios.post('/api/chat/save', {
    chatId: saveRes.data.chat._id,
    message: { role: 'bot', content: reply },
  });

  return { response: reply, chatId: updated.data.chat._id };
};
