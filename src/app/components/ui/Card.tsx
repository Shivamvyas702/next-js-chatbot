import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return <div className={`p-4 border rounded shadow ${className}`}>{children}</div>;
};

export default Card;
