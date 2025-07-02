import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  throw new Error('GEMINI_API_KEY is not defined in .env.local');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

    const payload = {
      contents: [{ parts: [{ text: message }] }],
    };

    const headers = {
      'Content-Type': 'application/json',
    };

    const response = await axios.post(geminiApiUrl, payload, { headers });

    const rawText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received';

    // ✅ Detect code and wrap in markdown if needed
    const formattedResponse = formatGeminiResponse(rawText);

    return res.status(200).json({ response: formattedResponse });
  } catch (error) {
    console.error('Error from Gemini API:', error);

    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json({ error: error.response.data });
    }

    return res.status(500).json({ error: 'Failed to get a response from Gemini' });
  }
}

// 🔧 Utility to auto-format Gemini output for frontend code block display
function formatGeminiResponse(text: string): string {
  const isCode = text.includes(';') || text.includes('function') || text.includes('```');

  // already formatted
  if (text.includes('```')) return text;

  if (isCode) {
    return `\`\`\`ts\n${text.trim()}\n\`\`\``;
  }

  return text;
}
