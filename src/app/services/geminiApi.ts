// src/app/services/geminiApi.ts
import axios from 'axios';



export const sendMessageToGemini = async (message: string, chatId?: string): Promise<{ response: string, chatId: string }> => {
  const response = await axios.post('/api/chatbot', { message });
  const botReply = response.data.response;

  // Save both messages to DB
  const saveRes = await axios.post('/api/chat/save', {
    chatId,
    message: { role: 'user', content: message },
  });

  const updated = await axios.post('/api/chat/save', {
    chatId: saveRes.data.chat._id,
    message: { role: 'bot', content: botReply },
  });

  return { response: botReply, chatId: updated.data.chat._id };
};

