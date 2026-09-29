import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../Store';
import { ApiCampaign } from '../Slices/campaignsSlice';

const selectCampaignsSlice = (state: RootState) => state.campaigns;

const selectCampaignList = createSelector(
  [selectCampaignsSlice],
  campaignsState => campaignsState.allCampaigns.length > 0
    ? campaignsState.allCampaigns
    : campaignsState.campaigns,
);

export const selectImageCampaigns = createSelector(
  [selectCampaignList],
  (campaigns): ApiCampaign[] =>
    campaigns.filter(
      campaign =>
        campaign.type.trim().toLowerCase() === 'image' &&
        campaign.is_active === 1,
    ),
);

export const selectVideoCampaigns = createSelector(
  [selectCampaignList],
  (campaigns): ApiCampaign[] =>
    campaigns.filter(
      campaign =>
        campaign.type.trim().toLowerCase() === 'video' &&
        campaign.is_active === 1,
    ),
);

export const selectCampaignsViewModel = createSelector(
  [selectCampaignsSlice, selectImageCampaigns, selectVideoCampaigns],
  (campaignsState, imageCampaigns, videoCampaigns) => ({
    ...campaignsState,
    imageCampaigns,
    videoCampaigns,
  }),
);
