import { ReactNode } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <button className={`px-4 py-2 bg-blue-600 text-white rounded ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
