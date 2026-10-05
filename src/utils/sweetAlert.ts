import Swal, { SweetAlertIcon } from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

type AppAlertType = 'success' | 'error' | 'info' | 'warning' | 'question';

const isDarkTheme = () => document.documentElement.classList.contains('dark');

const getPopupClass = () =>
  `r2r-swal-popup${isDarkTheme() ? ' r2r-swal-popup--dark' : ''}`;

export const showAppToast = ({
  type = 'info',
  title,
  text,
  timer = 3000,
}: {
  type?: AppAlertType;
  title?: string;
  text?: string;
  timer?: number;
}) => {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: type as SweetAlertIcon,
    title,
    text,
    timer,
    timerProgressBar: true,
    showConfirmButton: false,
    background: isDarkTheme() ? '#0E1528' : '#FFFFFF',
    color: isDarkTheme() ? '#F8FAFC' : '#0F172A',
    customClass: {
      popup: getPopupClass(),
      timerProgressBar: 'r2r-swal-timer',
    },
  });
};

export const confirmAppAction = async ({
  title,
  text,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  icon = 'warning',
}: {
  title: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  icon?: SweetAlertIcon;
}) => {
  const result = await Swal.fire({
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    background: isDarkTheme() ? '#0E1528' : '#FFFFFF',
    color: isDarkTheme() ? '#F8FAFC' : '#0F172A',
    confirmButtonColor: '#00674D',
    cancelButtonColor: '#64748B',
    customClass: {
      popup: getPopupClass(),
    },
  });

  return result.isConfirmed;
};

export const promptAppInput = async ({
  title,
  inputLabel,
  inputValue = '',
  placeholder,
  confirmButtonText = 'Save',
  input = 'text',
}: {
  title: string;
  inputLabel?: string;
  inputValue?: string;
  placeholder?: string;
  confirmButtonText?: string;
  input?: 'text' | 'textarea' | 'date' | 'number';
}) => {
  const result = await Swal.fire({
    title,
    input,
    inputLabel,
    inputValue,
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: 'Cancel',
    background: isDarkTheme() ? '#0E1528' : '#FFFFFF',
    color: isDarkTheme() ? '#F8FAFC' : '#0F172A',
    confirmButtonColor: '#00674D',
    cancelButtonColor: '#64748B',
    customClass: {
      popup: getPopupClass(),
      input: 'r2r-swal-input',
    },
    inputValidator: (value) => {
      if (!String(value ?? '').trim()) {
        return 'This field is required.';
      }
      return null;
    },
  });

  return result.isConfirmed ? String(result.value ?? '').trim() : '';
};

export const confirmUnsavedChanges = async ({
  title = 'Unsaved Changes',
  text = 'You have unsaved changes. Would you like to save them before leaving?',
  saveButtonText = 'Save Changes',
  discardButtonText = 'Discard Changes',
  keepEditingButtonText = 'Keep Editing',
}: {
  title?: string;
  text?: string;
  saveButtonText?: string;
  discardButtonText?: string;
  keepEditingButtonText?: string;
} = {}): Promise<'save' | 'discard' | 'stay'> => {
  const result = await Swal.fire({
    icon: 'question',
    title,
    text,
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: saveButtonText,
    denyButtonText: discardButtonText,
    cancelButtonText: keepEditingButtonText,
    confirmButtonColor: '#00674D',
    denyButtonColor: '#EF4444',
    cancelButtonColor: '#64748B',
    reverseButtons: false,
    background: isDarkTheme() ? '#0E1528' : '#FFFFFF',
    color: isDarkTheme() ? '#F8FAFC' : '#0F172A',
    customClass: {
      popup: getPopupClass(),
    },
  });

  if (result.isConfirmed) return 'save';
  if (result.isDenied) return 'discard';
  return 'stay';
};

