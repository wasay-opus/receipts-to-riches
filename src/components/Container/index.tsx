import React from 'react';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  isPadding?: boolean;
  children: React.ReactNode;
  maxWidth?: string | number;
}

export const Container: React.FC<ContainerProps> = ({
  isPadding = true,
  children,
  maxWidth = '920px',
  className = '',
  style,
  ...props
}) => {
  return (
    <div
      className={`app-content-container ${className}`.trim()}
      style={{
        width: '100%',
        maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
        margin: '0 auto',
        padding: isPadding ? '28px 16px 48px' : '0',
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default Container;
