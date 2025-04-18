'use client';
import { useState, useEffect } from 'react';
import { sendMessageToGemini } from '../services/geminiApi';
import { Menu, MessageSquare, Settings } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
// Add more as needed
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Components } from 'react-markdown';
import { ReactNode } from 'react';

const markdownComponents: Components = {
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');

    if (inline) {
      return (
        <code className="bg-gray-200 text-sm px-1 py-0.5 rounded">
          {children}
        </code>
      );
    }

    return (
      <pre className="rounded-lg overflow-x-auto text-left">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    );
  },
};



interface Chat {
  _id: string;
  title: string;
  messages: { role: string; content: string }[];
}


const Chatbot = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);


  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    setMessages((prev) => [...prev, `You: ${message}`]);
    setIsTyping(true);

    try {
      const botResponse = await sendMessageToGemini(message);
      setMessages((prev) => [...prev, `Bot: ${botResponse.response}`]);

    } catch (error) {
      console.error('Error communicating with Gemini:', error);
      setMessages((prev) => [...prev, "Bot: Sorry, I couldn't understand that."]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    Prism.highlightAll();
  }, [messages]);


  const [inputValue, setInputValue] = useState('');

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    handleSendMessage(inputValue);
    setInputValue('');
  };

  const [chatId, setChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);


  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await fetch('/api/chat');
        if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
        const data = await res.json();
        setChatHistory(data.chats);
      } catch (err) {
        console.error('Failed to fetch chats:', err);
      }
    };
    fetchChats();
  }, []);


  

  return (
    <div className="h-screen overflow-hidden">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 bg-gray-900 text-white shadow-md h-16">
        <h1 className="text-xl font-semibold">My Chatbot</h1>
        <h2 className="btn bg-slate-600 p-2 rounded-full">Profile</h2>
        <Menu size={24} className="cursor-pointer sm:hidden" />
      </header>

      <div className="flex pt-16 h-full">
        {/* Fixed Sidebar */}
        <aside className="hidden sm:flex flex-col w-64 bg-gray-800 text-white p-5 overflow-y-auto fixed top-16 bottom-0 left-0">
          <nav className="flex flex-col gap-4">
            <Button
              className="flex items-center gap-2 text-gray-300 bg-transparent hover:bg-gray-600"
              onClick={() => {
                setChatId(null);
                setMessages([]);
              }}
            >
              <MessageSquare size={20} /> New Chats
            </Button>

            {chatHistory.map((chat: any) => (
              <div key={chat._id} className="flex items-center justify-between gap-2">
                <Button
                  className="flex items-center gap-2 w-full px-2 py-1 text-white bg-transparent hover:bg-gray-600 truncate"
                  onClick={() => {
                    setChatId(chat._id);
                    const formatted = chat.messages.map((m: any) => `${m.role === 'user' ? 'You' : 'Bot'}: ${m.content}`);
                    setMessages(formatted);
                  }}
                >
                  <MessageSquare size={18} className="flex-shrink-0" />
                  <span className="truncate">{chat.title}</span>
                </Button>
              </div>
            ))}


            <Button className="flex items-center gap-2 text-gray-300 bg-transparent hover:bg-gray-600">
              <Settings size={20} /> Settings
            </Button>

          </nav>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 ml-0 sm:ml-64 h-[calc(100vh-4rem)] flex flex-col bg-white">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
            {messages.length === 0 && (
              <div className="text-slate-300 pt-8 text-center">Ask Me Something...</div>
            )}

            {messages.map((msg, index) => {
              const isUser = msg.startsWith('You:');
              const messageText = msg.replace(/^(You:|Bot:)\s*/, '');

              return (
                <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`${isUser ? 'bg-blue-100' : 'bg-green-50'} p-4 rounded-lg w-full sm:w-3/4`}>
                    {msg.startsWith('Bot:') ? (
                      <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
                        <ReactMarkdown
                     remarkPlugins={[remarkGfm]}
                     components={markdownComponents}
                    >
                          {messageText}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{messageText}</p>
                    )}
                  </div>
                </div>
              );
            })}

            {isTyping && <div className="text-gray-500">Bot is typing...</div>}
          </div>

          {/* Input Field */}
          <div className="border-t pt-4 px-4 sm:px-6 pb-4">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                }}
                className="w-full p-3 pr-12 border rounded-lg shadow-sm focus:outline-none"
                placeholder="Ask me anything..."
              />
              <button
                onClick={handleSubmit}
                className="absolute right-3 text-blue-500 hover:text-blue-700"
              >
                <Send size={32} />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Chatbot;

