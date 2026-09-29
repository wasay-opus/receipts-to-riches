import React, { PropsWithChildren, useEffect, useSyncExternalStore } from 'react';
import { useDispatch } from 'react-redux';
import { CoinRain } from '../../components/CoinRain';
import { showToast } from '../../components/Toast';
import { AppDispatch } from '../../redux/Store';
import { fetchUser } from '../../redux/Slices/userSlice';
import { fetchUnlockedMiniGames } from '../../redux/Slices/gamesSlice';
import { fetchWallet } from '../../redux/Slices/walletSlice';
import { CoinRainController } from './CoinRainController';
import { RewardManager } from './RewardManager';
import { SoundManager } from './SoundManager';

const RewardOverlay = () => {
  const triggerKey = useSyncExternalStore(
    CoinRainController.subscribe,
    CoinRainController.getSnapshot,
    CoinRainController.getSnapshot,
  );

  return <CoinRain active={triggerKey > 0} />;
};

export const RewardProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    RewardManager.configure({
      showToast,
      refreshWallet: () => dispatch(fetchWallet()).unwrap(),
      refreshUserProfile: () => dispatch(fetchUser()).unwrap(),
      refreshUnlockedMiniGames: () => dispatch(fetchUnlockedMiniGames()).unwrap(),
    });

    SoundManager.preloadRewardSound().catch(() => {});

    return () => {
      RewardManager.reset();
      SoundManager.release();
      CoinRainController.reset();
    };
  }, [dispatch]);

  return (
    <>
      {children}
      <RewardOverlay />
    </>
  );
};

export default RewardProvider;
