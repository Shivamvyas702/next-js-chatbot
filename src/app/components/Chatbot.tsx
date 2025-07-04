'use client'
import React, { useState, useEffect, useRef } from 'react';
import { sendMessageToGemini } from '../services/geminiApi';
import { Menu, MessageSquare, Settings, MoreHorizontal } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Components } from 'react-markdown';
import { ComponentProps } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';



const markdownComponents: Components = {
  // Override <p> rendering
  p({ children }) {
    const isOnlyCode = React.Children.toArray(children).some((child) => {
      if (!React.isValidElement(child)) return false;

      return child.type === 'code' || child.type === 'pre' || child.type === 'div';
    });

    // If it's just a code block or div (pre-wrapped), skip the <p> wrapper
    if (isOnlyCode) {
      return <>{children}</>;
    }

    return <p className="my-2">{children}</p>;
  },

  code({
    node,
    inline,
    className = '',
    children,
    ...props
  }: ComponentProps<'code'> & {
    inline?: boolean;
    node?: any;
  }) {
    if (inline) {
      return (
        <code className="bg-gray-200 text-sm px-1 py-0.5 rounded" {...props}>
          {children}
        </code>
      );
    }

    return (
      <pre className={`rounded-lg overflow-x-auto text-left ${className}`}>
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
  const [inputValue, setInputValue] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUpdatingTitle, setIsUpdatingTitle] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  // Refs for detecting click outside
  const sidebarRef = useRef<HTMLDivElement>(null);
  const updateRef = useRef<HTMLDivElement>(null);  // or another suitable type depending on the element

  // Fetch chat history

  const fetchChats = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/chat`);
      if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
      const data = await res.json();
      setChatHistory(data.chats);
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);


  useEffect(() => {
    // Detect click outside to close input and update/delete options
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        updateRef.current &&
        !updateRef.current.contains(event.target as Node)
      ) {
        setIsUpdatingTitle(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    // Clean up the event listener on component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to handle sending messages
  // const handleSendMessage = async (message: string) => {
  //   if (!message.trim()) return;

  //   setMessages((prev) => [...prev, `You: ${message}`]);
  //   setIsTyping(true);

  //   try {
  //     const botResponse = await sendMessageToGemini(message);
  //     setMessages((prev) => [...prev, `Bot: ${botResponse.response}`]);
  //   } catch (error) {
  //     console.error('Error communicating with Gemini:', error);
  //     setMessages((prev) => [...prev, "Bot: Sorry, I couldn't understand that."]);
  //   } finally {
  //     setIsTyping(false);
  //   }
  // };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    setMessages((prev) => [...prev, `You: ${message}`]);
    setIsTyping(true);

    try {
      const response = await fetch(`api/streaming-chat?message=${encodeURIComponent(message)}`);


      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullText = '';
      let done = false;

      // Start partial "Bot:" message
      setMessages((prev) => [...prev, `Bot:`]);

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        const chunk = decoder.decode(value || new Uint8Array(), { stream: true });

        fullText += chunk;

        setMessages((prev) => {
          // Replace last "Bot:" with current streamed response
          const updated = [...prev];
          updated[updated.length - 1] = `Bot: ${fullText}`;
          return updated;
        });
      }
    } catch (err) {
      console.error('Streaming error:', err);
      setMessages((prev) => [...prev, "Bot: Sorry, something went wrong."]);
    } finally {
      setIsTyping(false);
    }
  };




  // Function to handle chat title update
  const handleUpdateChatTitle = async (chatId: string, newTitle: string) => {
    try {
      const response = await fetch(`${BASE_URL}//api/chat/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, title: newTitle }),
      });

      if (response.ok) {
        const updatedChat = await response.json();
        setChatHistory(
          chatHistory.map((chat) =>
            chat._id === chatId ? { ...chat, title: updatedChat.chat.title } : chat
          )
        );
        setIsUpdatingTitle(null);
        setNewTitle('');
        await fetchChats();
      } else {
        const error = await response.json();
        console.error('Error updating chat:', error);
      }
    } catch (error) {
      console.error('Error communicating with update API:', error);
    }
  };

  // Function to handle chat deletion
  const handleDeleteChat = async (chatId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This chat will be permanently deleted!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48', // rose-600
      cancelButtonColor: '#64748b',  // slate-500
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-lg',
        confirmButton: 'swal2-confirm btn btn-danger',
        cancelButton: 'swal2-cancel btn btn-secondary'
      },
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${BASE_URL}/api/chat/delete?id=${chatId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setChatHistory(chatHistory.filter((chat) => chat._id !== chatId));
          Swal.fire('Deleted!', 'Your chat has been removed.', 'success');

        } else {
          const error = await response.json();
          console.error('Error deleting chat:', error);
          Swal.fire('Oops!', 'Failed to delete chat.', 'error');
        }
        await fetchChats(); // refresh state from server

      } catch (error) {
        console.error('Error communicating with delete API:', error);
        Swal.fire('Oops!', 'Something went wrong.', 'error');
      }
    }
  };


  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    handleSendMessage(inputValue);
    setInputValue('');
  };

  useEffect(() => {
    Prism.highlightAll();
  }, [messages]);


  const messagesEndRef = useRef<HTMLDivElement | null>(null);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isTyping) {
      const timeout = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timeout);
    }
  }, [isTyping]);

  const [showSettings, setShowSettings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // optional if you want a dark mode toggle
  const [fontSize, setFontSize] = useState("md"); // optional for font size setting
  const clearChatHistory = () => {
    setChatHistory([]);
    setMessages([]);
    setChatId(null);
    setShowSettings(false);
  };

  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const fontSizeClass = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }[fontSize];


  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50 text-gray-900 font-sans">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6 py-4 bg-slate-900 text-white shadow-md h-16">
        <h1 className="text-xl font-bold tracking-tight">My Chatbot</h1>
        <Menu
          size={24}
          className="cursor-pointer sm:hidden"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </header>

      <div className="flex flex-1 pt-16 relative overflow-hidden">

        {/* Sidebar */}
        <aside
          ref={sidebarRef}
          className={`z-30 sm:z-10 sm:relative sm:translate-x-0 w-64 bg-slate-800 text-white p-4 overflow-y-auto
      fixed top-16 bottom-0 left-0 transition-transform duration-300 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } sm:static`}
        >
          <nav className="flex flex-col gap-4">
            <Button
              className="flex items-center gap-2 bg-slate-700 hover:bg-indigo-600 text-white"
              onClick={() => {
                setChatId(null);
                setMessages([]);
                setIsSidebarOpen(false);
              }}
            >
              <MessageSquare size={20} /> New Chat
            </Button>

            <div className="mt-4 space-y-2">
              {chatHistory.map((chat) => (
                <div key={chat._id} className="flex items-center justify-between gap-1">
                  <Button
                    className="flex items-center gap-2 w-full px-2 py-1 bg-slate-700 hover:bg-slate-600 truncate"
                    onClick={() => {
                      setChatId(chat._id);
                      const formatted = chat.messages.map((m) => `${m.role === 'user' ? 'You' : 'Bot'}: ${m.content}`);
                      setMessages(formatted);
                      setIsSidebarOpen(false);
                    }}
                  >
                    <MessageSquare size={16} />
                    <span className="truncate">{chat.title}</span>
                  </Button>

                  {/* Edit/Delete menu */}
                  <div className="relative" ref={updateRef}>
                    <button
                      className="hover:bg-slate-700 p-2 rounded"
                      onClick={() => {
                        setIsUpdatingTitle(chat._id === isUpdatingTitle ? null : chat._id);
                        setNewTitle(chat.title);
                      }}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {isUpdatingTitle === chat._id && (
                      <div className="absolute right-0 top-0 mt-2 bg-slate-700 p-3 rounded-md shadow-md w-48 z-30">
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="w-full mb-2 px-2 py-1 bg-slate-800 text-white rounded"
                          placeholder="Update title"
                        />
                        <div className="flex justify-end gap-2">
                          <Button onClick={() => handleUpdateChatTitle(chat._id, newTitle)} className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-700">Update</Button>
                          <Button onClick={() => handleDeleteChat(chat._id)} className="text-xs px-3 py-1 bg-rose-600 hover:bg-rose-700">Delete</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Settings */}
            <Button
              className="flex items-center gap-2 text-gray-300 bg-transparent hover:bg-slate-700"
              onClick={() => setShowSettings(true)}
            >
              <Settings size={20} /> Settings
            </Button>

          </nav>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col bg-white">

          {/* Messages */}
          <div className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-${fontSize}`}>

            {messages.length === 0 ? (
              <div className="text-slate-400 pt-8 text-center text-base">Ask me something...</div>
            ) : (
              messages.map((msg, index) => {
                const isUser = msg.startsWith('You:');
                const messageText = msg.replace(/^(You:|Bot:)\s*/, '');
                return (
                  <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
                    <div className={`${isUser ? 'bg-indigo-100' : 'bg-slate-100'} p-3 rounded-xl shadow-sm max-w-[75%] sm:max-w-[60%] break-words`}>
                      {msg.startsWith('Bot:') ? (
                        <div className="prose prose-sm sm:prose-base max-w-none text-gray-800">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {messageText}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-gray-700 whitespace-pre-wrap text-right">{messageText}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
            {isTyping && <div className="text-gray-400 italic text-sm">Bot is typing...</div>}
          </div>

          {/* Input */}
          <div className="border-t pt-3 pb-4 px-4 sm:px-6 bg-white">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                }}
                className="w-full p-3 pr-12 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                placeholder="Ask me anything..."
              />
              <button
                onClick={handleSubmit}
                className="absolute right-3 text-indigo-500 hover:text-indigo-700"
              >
                <Send size={24} />
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Settings Modal (optional — basic example) */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-80 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>

            {/* Dark mode toggle */}
            <label className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-200">Dark Mode</span>
              <input
                type="checkbox"
                checked={isDarkMode}
                onChange={(e) => setIsDarkMode(e.target.checked)}
                className="ml-2"
              />
            </label>

            {/* Font Size Selector */}
            <label className="flex flex-col text-sm text-gray-700 dark:text-gray-200">
              Font Size
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="mt-1 p-2 rounded border dark:bg-gray-700 dark:text-white"
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </label>

            {/* Clear chat history */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-300 dark:border-gray-600">
  <button
    onClick={clearChatHistory}
    className="text-sm text-red-600 hover:text-red-700 px-3 py-2 rounded transition-colors"
  >
    🗑 Clear All Chats
  </button>

  <button
    onClick={() => setShowSettings(false)}
    className="text-sm text-blue-600 hover:text-blue-700 px-3 py-2 rounded transition-colors"
  >
    ✖ Close
  </button>
</div>

          </div>
        </div>
      )}


    </div>


  );
};

export default Chatbot;
