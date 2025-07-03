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

  // Refs for detecting click outside
  const sidebarRef = useRef<HTMLDivElement>(null);
  const updateRef = useRef<HTMLDivElement>(null);  // or another suitable type depending on the element

  // Fetch chat history
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
    const response = await fetch(`/api/streaming-chat?message=${encodeURIComponent(message)}`);


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
      const response = await fetch('/api/chat/update', {
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
        const response = await fetch(`/api/chat/delete?id=${chatId}`, {
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


  return (
    // <div className="h-screen overflow-hidden">
    <div className="h-[100dvh] flex flex-col overflow-hidden">

      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 bg-gray-900 text-white shadow-md h-16">
        <h1 className="text-xl font-semibold">My Chatbot</h1>
        <h2 className="btn bg-slate-600 p-2 rounded-full">Profile</h2>
        <Menu
          size={24}
          className="cursor-pointer sm:hidden"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </header>

      <div className="flex pt-16 h-full">
        {/* Fixed Sidebar */}
        <aside
          ref={sidebarRef}
          className={`fixed top-16 bottom-0 left-0 w-64 bg-gray-800 text-white p-5 overflow-y-auto z-20 ${isSidebarOpen ? 'block' : 'hidden'
            } sm:block`}
        >
          <nav className="flex flex-col gap-4">
            <Button
              className="flex items-center gap-2 text-gray-300 bg-transparent hover:bg-gray-600"
              onClick={() => {
                setChatId(null);
                setMessages([]);
                setIsSidebarOpen(false);
              }}
            >
              <MessageSquare size={20} /> New Chats
            </Button>

            {chatHistory.map((chat) => (
              <div key={chat._id} className="flex items-center justify-between gap-2">
                <Button
                  className="flex items-center gap-2 w-full px-2 py-1 text-white bg-transparent hover:bg-gray-600 truncate"
                  onClick={() => {
                    setChatId(chat._id);
                    const formatted = chat.messages.map(
                      (m) => `${m.role === 'user' ? 'You' : 'Bot'}: ${m.content}`
                    );
                    setMessages(formatted);
                    setIsSidebarOpen(false);
                  }}
                >
                  <MessageSquare size={18} className="flex-shrink-0" />
                  <span className="truncate">{chat.title}</span>
                </Button>

                {/* Three dots menu for update and delete */}
                <div className="relative" ref={updateRef}>
                  <button
                    className="text-white cursor-pointer hover:bg-slate-700 p-2"
                    onClick={() => {
                      if (chat._id === isUpdatingTitle) {
                        setIsUpdatingTitle(null);
                      } else {
                        setIsUpdatingTitle(chat._id);
                        setNewTitle(chat.title);
                      }
                    }}

                  >
                    <MoreHorizontal size={20} />
                  </button>
                  {isUpdatingTitle === chat._id && (
                    <div className="absolute right-0 top-0 mt-2 bg-gray-700 p-2 rounded-md shadow-md">
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="bg-gray-800 text-white px-2 py-1 rounded mb-2"
                        placeholder="Update title"
                      />
                      <Button onClick={() => handleUpdateChatTitle(chat._id, newTitle)} className='text-xs p-2 mr-2 bg-indigo-500'>Update</Button>
                      <Button onClick={() => handleDeleteChat(chat._id)} className='text-xs p-2 bg-rose-500 '>Delete</Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <Button className="flex items-center gap-2 text-gray-300 bg-transparent hover:bg-gray-600">
              <Settings size={20} /> Settings
            </Button>
          </nav>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 ml-0 sm:ml-64 flex flex-col bg-white">

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
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
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
            <div ref={messagesEndRef} />

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
