// src/app/services/geminiApi.ts
import axios from 'axios';

// export const sendMessageToGemini = async (message: string): Promise<string> => {
//   try {
//     const response = await axios.post('/api/chatbot', { message });
//     console.log(response,'responsee');
//     return response.data.response; // Assuming Gemini API sends back a response under `response` key
//   } catch (error) {
//     console.error('Error sending message to Gemini:', error);
//     throw new Error('Could not get response from Gemini.');
//   }
// };

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

