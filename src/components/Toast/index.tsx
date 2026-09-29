import React from 'react';
import { showAppToast } from '../../utils/sweetAlert';

export interface ToastProps {
  type?: 'success' | 'error' | 'info' | 'warning';
  text1?: string;
  text2?: string;
  visibilityTime?: number;
  autoHide?: boolean;
}

export const showToast = ({
  type = 'info',
  text1,
  text2,
  visibilityTime = 3000,
}: ToastProps) => {
  showAppToast({
    type,
    title: text1,
    text: text2,
    timer: visibilityTime,
  });
};

export const CustomToast: React.FC = () => {
  return null;
};

export default CustomToast;
