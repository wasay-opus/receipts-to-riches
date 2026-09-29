import 'react-native-gesture-handler';
import React, { useEffect, useMemo, useRef } from 'react';
import SplashScreen from 'react-native-splash-screen';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import MainNavigator from './src/navigation/Stack/MainNavigator';
import { CustomStatusBar, CustomToast, showToast } from './src/components';
import type { ThemeColors } from './src/constants/LightColors';
import useColors from './src/hooks/useColors';
import { useAppSelector } from './src/redux/Hooks/reduxHooks';
import { selectIsDarkMode } from './src/redux/Selectors/themeSelectors';
import { store } from './src/redux/Store';
import { initializeNotifications } from './src/services/notificationServices/notificationService';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/services/i18n/i18n';
import RewardProvider from './src/services/rewards/RewardProvider';
import runWhenIdle from './src/utils/runWhenIdle';

if (!__DEV__) {
  console.log = () => { };
}

function AppShell(): React.JSX.Element {
  const COLORS = useColors();
  const isDarkMode = useAppSelector(selectIsDarkMode);
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  return (
    <SafeAreaProvider>
      <CustomStatusBar
        backgroundColor={COLORS.header}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      <SafeAreaView
        style={styles.container}
        edges={['bottom', 'left', 'right']}
      >
        <BottomSheetModalProvider>
          <RewardProvider>
            <MainNavigator />
          </RewardProvider>
          <CustomToast />
        </BottomSheetModalProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function App(): React.JSX.Element {
  const adsInitialized = useRef(false);

  useEffect(() => {
    SplashScreen.hide();
  }, []);

  // Initialize Push Notifications
  useEffect(() => {
    let cleanup: () => void = () => { };
    const setup = async () => {
      cleanup = await initializeNotifications();
    };
    setup();
    return () => cleanup();
  }, []);

  // Initialize Google Mobile Ads SDK once on app startup
  useEffect(() => {
    if (adsInitialized.current) {
      return;
    }
    adsInitialized.current = true;

    let cancelled = false;
    const cancelIdleTask = runWhenIdle(() => {
      const initializeAds = async () => {
        try {
          const { default: MobileAds } = await import(
            'react-native-google-mobile-ads'
          );

          if (cancelled) {
            return;
          }

          await MobileAds().initialize();
          console.log('[AdMob] SDK initialized successfully');
        } catch (error) {
          console.warn('[AdMob] SDK initialization failed:', error);
        }
      };

      initializeAds();
    });

    return () => {
      cancelled = true;
      cancelIdleTask();
    };
  }, []);

  useEffect(() => {
    const errorUtils = (globalThis as any)?.ErrorUtils;
    const defaultGlobalHandler =
      typeof errorUtils?.getGlobalHandler === 'function'
        ? errorUtils.getGlobalHandler()
        : null;

    const timeoutAwareHandler = (error: any, isFatal?: boolean) => {
      const rawMessage =
        typeof error?.message === 'string'
          ? error.message
          : String(error ?? '');
      const normalizedMessage = rawMessage.toLowerCase();
      const isTimeoutError =
        normalizedMessage.includes('timeout') &&
        normalizedMessage.includes('20000');

      if (isTimeoutError) {
        showToast({
          type: 'error',
          text1: 'Request Timed Out',
          text2: 'Please check your internet and try again.',
          visibilityTime: 3500,
        });
        Alert.alert(
          'Connection Timeout',
          'The server did not respond in time. Please try again.',
        );
      }

      if (typeof defaultGlobalHandler === 'function') {
        defaultGlobalHandler(error, isFatal);
      }
    };

    if (typeof errorUtils?.setGlobalHandler === 'function') {
      errorUtils.setGlobalHandler(timeoutAwareHandler);
    }

    return () => {
      if (
        typeof errorUtils?.setGlobalHandler === 'function' &&
        typeof defaultGlobalHandler === 'function'
      ) {
        errorUtils.setGlobalHandler(defaultGlobalHandler);
      }
    };
  }, []);

  return (
    <GestureHandlerRootView style={rootStyles.root}>
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <AppShell />
        </I18nextProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}

const createStyles = (COLORS: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.bottomStack,
    },
  });

const rootStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
