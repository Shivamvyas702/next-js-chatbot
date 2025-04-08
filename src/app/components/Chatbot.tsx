'use client';
import { useState, useEffect } from 'react';
import { sendMessageToGemini } from '../services/geminiApi';
import { Menu, MessageSquare, Settings } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import Prism from 'prismjs'; 
import 'prismjs/themes/prism-tomorrow.css'; 

const Chatbot = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false); 

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
  
    setMessages((prev) => [...prev, `You: ${message}`]);
  
    setIsTyping(true);
  
    try {
      const botResponse = await sendMessageToGemini(message);
  
      setMessages((prev) => [...prev, `Bot: ${botResponse}`]);
    } catch (error) {
      console.error('Error communicating with Gemini:', error);
  
      setMessages((prev) => [...prev, 'Bot: Sorry, I couldn\'t understand that.']);
    } finally {
      setIsTyping(false);
    }
  };
  

  useEffect(() => {
    Prism.highlightAll();
  }, [messages]); 

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-5 flex flex-col">
        <h2 className="text-2xl font-bold mb-6">Chatbot</h2>
        <nav className="flex flex-col gap-4">
          <Button className="flex items-center gap-2 text-gray-300 bg-transparent hover:bg-gray-200">
            <MessageSquare size={20} /> Chats
          </Button>

          <Button className="flex items-center gap-2 text-gray-300 bg-transparent hover:bg-gray-200">
            <Settings size={20} /> Settings
          </Button>
        </nav>
      </aside>
      
      {/* Chat Area */}
      <div className="flex flex-col flex-1 p-6 bg-white shadow-md rounded-lg">
        <div className="flex-1 overflow-y-auto space-y-2 p-4">
          {messages.map((msg, index) => (
            <Card key={index} className={`p-4 ${msg.startsWith('You:') ? 'bg-blue-100' : 'bg-gray-100'}`}>
              {msg.startsWith('Bot:') && msg.includes(' ') ? (
                <pre className="bg-black text-white p-4 rounded-lg">
                  <code className="language-js">{msg.replace('Bot: ', '')}</code>
                </pre>
              ) : (
                <p>{msg}</p>
              )}
            </Card>
          ))}
          {/* Show typing indicator */}
          {isTyping && (
            <div className="text-gray-500">Bot is typing...</div>
          )}
        </div>
        
        {/* Input Field */}
        <div className="flex items-center border-t p-4">
          <input
            type="text"
            className="flex-1 p-3 border rounded-lg shadow-sm focus:outline-none"
            placeholder="Type a message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage((e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = '';
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Chatbot;