import React from 'react';

// --- Card ---
interface CardProps {
  children?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`bg-white border-2 border-neo-black shadow-neo rounded-xl p-6 ${className}`}>
    {children}
  </div>
);

// --- Button ---
interface ButtonProps extends React.ComponentProps<'button'> {
  variant?: 'primary' | 'secondary' | 'neutral' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
  tooltipPosition?: 'top' | 'bottom';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  tooltip,
  tooltipPosition = 'top',
  ...props 
}) => {
  const baseStyle = "group relative font-bold border-2 border-neo-black rounded-lg transition-all active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-neo-yellow text-neo-black shadow-neo hover:bg-yellow-300",
    secondary: "bg-neo-blue text-white shadow-neo hover:bg-blue-300",
    neutral: "bg-white text-neo-black shadow-neo hover:bg-gray-50",
    danger: "bg-red-400 text-white shadow-neo hover:bg-red-500",
  };

  const sizes = {
    sm: "px-3 py-1 text-sm shadow-neo-sm",
    md: "px-5 py-2.5 text-base shadow-neo",
    lg: "px-8 py-3 text-lg shadow-neo-lg",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
      {tooltip && (
        <div 
            className={`absolute left-1/2 -translate-x-1/2 px-2 py-1.5 bg-neo-black text-white text-[10px] tracking-wide font-bold rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 ${tooltipPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`}
        >
            {tooltip}
            {/* Tiny arrow pointing to button */}
            <div 
                className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-neo-black transform rotate-45 ${tooltipPosition === 'top' ? 'bottom-[-3px]' : 'top-[-3px]'}`}
            ></div>
        </div>
      )}
    </button>
  );
};

// --- Input ---
export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className="w-full border-2 border-neo-black rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-neo-yellow bg-neo-offwhite shadow-neo-sm"
    {...props}
  />
);

export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="relative">
    <select
      className="w-full appearance-none border-2 border-neo-black rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-neo-yellow bg-neo-offwhite shadow-neo-sm"
      {...props}
    />
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neo-black">
      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
      </svg>
    </div>
  </div>
);

// --- ProgressBar ---
export const ProgressBar = ({ current, total, colorClass = "bg-neo-black" }: { current: number, total: number, colorClass?: string }) => {
  const percentage = Math.min(100, Math.max(0, total > 0 ? (current / total) * 100 : 0));
  
  return (
    <div className="w-full bg-gray-200 border-2 border-neo-black rounded-full h-4 overflow-hidden relative">
      <div 
        className={`h-full ${colorClass} transition-all duration-500 ease-out`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};