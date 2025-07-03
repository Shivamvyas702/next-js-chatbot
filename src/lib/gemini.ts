import axios from 'axios';

export const getGeminiReply = async (message: string): Promise<string> => {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        contents: [{ parts: [{ text: `Answer concisely. ${message}` }] }],
        generationConfig: {
          maxOutputTokens: message.toLowerCase().includes('code') ? 800 : 250,
          temperature: 0.7,
          topK: 40,
          topP: 0.9,
        },

      }
    );

    const reply =
      res.data.candidates?.[0]?.content?.parts?.[0]?.text ??
      "Sorry, I couldn't understand that.";

    return reply;
  } catch (err) {
    console.error('Gemini API error:', err);
    return "Oops, Gemini couldn't reply!";
  }
};
