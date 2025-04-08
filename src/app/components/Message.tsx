// src/app/components/Message.tsx
interface MessageProps {
    message: string;
  }
  
  const Message = ({ message }: MessageProps) => {
    return (
      <div className="message">
        <p>{message}</p>
      </div>
    );
  };
  
  export default Message;
  