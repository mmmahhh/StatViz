import React from 'react';

type ButtonVariant = 'ghost' | 'primary' | 'icon' | 'badge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'ghost', children, ...props }, ref) => {
    let variantClasses = '';
    
    switch (variant) {
      case 'ghost':
        variantClasses = 'bg-white/5 border border-white/10 text-linear-primary hover:bg-white/10 transition-colors px-3 py-1.5 rounded-md text-[13px] font-linear-emphasis shadow-sm';
        break;
      case 'primary':
        variantClasses = 'bg-linear-brand hover:bg-linear-brandHover text-white px-4 py-1.5 rounded-md text-[14px] font-linear-emphasis transition-colors shadow-sm';
        break;
      case 'icon':
        variantClasses = 'bg-white/5 border border-white/10 text-linear-primary hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-colors';
        break;
      case 'badge':
        variantClasses = 'bg-white/5 border border-white/5 text-linear-primary hover:bg-white/10 px-2 py-0.5 rounded-[2px] text-[10px] font-linear-emphasis uppercase tracking-wider transition-colors';
        break;
    }

    return (
      <button
        ref={ref}
        className={`focus:outline-none focus:ring-2 focus:ring-linear-brand/50 ${variantClasses} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
