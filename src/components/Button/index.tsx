import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title?: string;
  variant?: 'primary' | 'secondary' | 'gold' | 'outline' | 'ghost';
  loading?: boolean;
  icon?: React.ReactNode;
  width?: string | number;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  children,
  variant = 'primary',
  loading = false,
  icon,
  className = '',
  disabled,
  style,
  width,
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'secondary':
        return 'btn-secondary';
      case 'gold':
        return 'btn-gold';
      case 'outline':
        return 'btn-secondary border-green-600 text-green-500';
      case 'ghost':
        return 'bg-transparent text-current hover:bg-black/5 dark:hover:bg-white/5';
      case 'primary':
      default:
        return 'btn-primary';
    }
  };

  const dynamicStyle = {
    ...style,
    ...(width ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
  };

  return (
    <button
      className={`${getVariantClass()} ${className}`}
      style={dynamicStyle}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={18} style={{ animation: 'spin 0.9s linear infinite' }} />
      ) : (
        icon && <span className="button-icon">{icon}</span>
      )}

      <span>{title || children}</span>
    </button>
  );
};

export default Button;
