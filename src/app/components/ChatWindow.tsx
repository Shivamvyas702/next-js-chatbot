// src/app/components/ChatWindow.tsx
import Message from './Message';

interface ChatWindowProps {
  messages: string[];
}

const ChatWindow = ({ messages }: ChatWindowProps) => {
  return (
    <div className="chat-window">
      {messages.map((msg, index) => (
        <Message key={index} message={msg}  />
        
      ))}
    </div>
  );
};

export default ChatWindow;
