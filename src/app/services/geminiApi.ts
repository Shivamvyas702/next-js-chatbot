// src/app/services/geminiApi.ts
import axios from 'axios';

export const sendMessageToGemini = async (message: string): Promise<string> => {
  try {
    const response = await axios.post('/api/chatbot', { message });
    console.log(response,'responsee');
    return response.data.response; // Assuming Gemini API sends back a response under `response` key
  } catch (error) {
    console.error('Error sending message to Gemini:', error);
    throw new Error('Could not get response from Gemini.');
  }
};
