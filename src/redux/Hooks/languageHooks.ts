import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../Store';
import { setLanguage } from '../Slices/languageSlice';
import i18n from '../../services/i18n/i18n';

export const useLanguageDispatch = () => {
  const dispatch = useDispatch<AppDispatch>();

  return {
    changeLanguage: (lang: 'en' | 'es') => {
      // Instantly switch i18n language
      i18n.changeLanguage(lang);
      // Dispatch state update to Redux
      return dispatch(setLanguage(lang));
    },
  };
};

export const useLanguageState = () => {
  return useSelector((state: RootState) => state.language);
};
