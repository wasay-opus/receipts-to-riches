import DarkColors from '../constants/DarkColors';
import LightColors, { type ThemeColors } from '../constants/LightColors';
import { useAppSelector } from '../redux/Hooks/reduxHooks';
import { selectIsDarkMode } from '../redux/Selectors/themeSelectors';

export const useColors = (): ThemeColors => {
  const isDarkMode = useAppSelector(selectIsDarkMode);

  return isDarkMode ? DarkColors : LightColors;
};

export default useColors;
