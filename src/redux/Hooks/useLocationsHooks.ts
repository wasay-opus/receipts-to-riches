import { useCallback, useMemo } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../Store';
import {
  fetchAllStates,
  fetchCitiesByState,
  fetchZipCodesByCity,
  clearCities,
  clearZipCodes,
  resetLocationsState,
} from '../Slices/locationsSlice';
import { selectLocationsViewModel } from '../Selectors/locationsSelectors';

export const useLocationsDispatch = () => {
  const dispatch = useDispatch<AppDispatch>();

  const onFetchAllStates = useCallback(
    () => dispatch(fetchAllStates()),
    [dispatch],
  );

  const onFetchCitiesByState = useCallback(
    (stateId: number | string) => dispatch(fetchCitiesByState(stateId)),
    [dispatch],
  );

  const onFetchZipCodesByCity = useCallback(
    (cityId: number | string) => dispatch(fetchZipCodesByCity(cityId)),
    [dispatch],
  );

  const onClearCities = useCallback(() => dispatch(clearCities()), [dispatch]);

  const onClearZipCodes = useCallback(() => dispatch(clearZipCodes()), [dispatch]);

  const onResetLocationsState = useCallback(
    () => dispatch(resetLocationsState()),
    [dispatch],
  );

  return useMemo(
    () => ({
      fetchAllStates: onFetchAllStates,
      fetchCitiesByState: onFetchCitiesByState,
      fetchZipCodesByCity: onFetchZipCodesByCity,
      clearCities: onClearCities,
      clearZipCodes: onClearZipCodes,
      resetLocationsState: onResetLocationsState,
    }),
    [
      onFetchAllStates,
      onFetchCitiesByState,
      onFetchZipCodesByCity,
      onClearCities,
      onClearZipCodes,
      onResetLocationsState,
    ],
  );
};

export const useLocationsState = () => {
  return useSelector(selectLocationsViewModel, shallowEqual);
};
