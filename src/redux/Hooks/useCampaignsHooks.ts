import { useCallback, useMemo } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../Store';
import type { CampaignType } from '../Slices/campaignsSlice';
import type { RenewCampaignPayload } from '../../services/campaignServices';
import {
  fetchAllCampaigns,
  fetchMyCampaigns,
  storeCampaign,
  incrementViews,
  incrementClicks,
  renewCampaign,
  clearCampaignsError,
  clearStoreCampaignError,
  clearIncrementViewsError,
  clearIncrementClicksError,
  clearRenewCampaignError,
  resetCampaignsState,
} from '../Slices/campaignsSlice';
import { selectCampaignsViewModel } from '../Selectors/campaignsSelectors';

export const useCampaignsDispatch = () => {
  const dispatch = useDispatch<AppDispatch>();

  const onFetchAllCampaigns = useCallback(
    (type?: CampaignType) => dispatch(fetchAllCampaigns(type)),
    [dispatch],
  );
  const onFetchMyCampaigns = useCallback(() => dispatch(fetchMyCampaigns()), [dispatch]);
  const onStoreCampaign = useCallback(
    (formData: FormData) => dispatch(storeCampaign(formData)),
    [dispatch],
  );
  const onIncrementViews = useCallback(
    (campaignIds: number[]) => dispatch(incrementViews(campaignIds)),
    [dispatch],
  );
  const onIncrementClicks = useCallback(
    (campaignId: number) => dispatch(incrementClicks(campaignId)),
    [dispatch],
  );
  const onRenewCampaign = useCallback(
    (payload: RenewCampaignPayload) => dispatch(renewCampaign(payload)),
    [dispatch],
  );
  const onClearCampaignsError = useCallback(() => dispatch(clearCampaignsError()), [dispatch]);
  const onClearStoreCampaignError = useCallback(() => dispatch(clearStoreCampaignError()), [dispatch]);
  const onClearIncrementViewsError = useCallback(() => dispatch(clearIncrementViewsError()), [dispatch]);
  const onClearIncrementClicksError = useCallback(() => dispatch(clearIncrementClicksError()), [dispatch]);
  const onClearRenewCampaignError = useCallback(() => dispatch(clearRenewCampaignError()), [dispatch]);
  const onResetCampaignsState = useCallback(() => dispatch(resetCampaignsState()), [dispatch]);

  return useMemo(
    () => ({
      fetchAllCampaigns: onFetchAllCampaigns,
      fetchMyCampaigns: onFetchMyCampaigns,
      storeCampaign: onStoreCampaign,
      incrementViews: onIncrementViews,
      incrementClicks: onIncrementClicks,
      renewCampaign: onRenewCampaign,
      clearCampaignsError: onClearCampaignsError,
      clearStoreCampaignError: onClearStoreCampaignError,
      clearIncrementViewsError: onClearIncrementViewsError,
      clearIncrementClicksError: onClearIncrementClicksError,
      clearRenewCampaignError: onClearRenewCampaignError,
      resetCampaignsState: onResetCampaignsState,
    }),
    [
      onFetchAllCampaigns,
      onFetchMyCampaigns,
      onStoreCampaign,
      onIncrementViews,
      onIncrementClicks,
      onRenewCampaign,
      onClearCampaignsError,
      onClearStoreCampaignError,
      onClearIncrementViewsError,
      onClearIncrementClicksError,
      onClearRenewCampaignError,
      onResetCampaignsState,
    ],
  );
};

export const useCampaignsState = () => {
  return useSelector(selectCampaignsViewModel, shallowEqual);
};
