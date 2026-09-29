import endPoints from '../../redux/constants/endPoints';
import { fetchApi } from '../../utils/helper';

interface IApiResponse {
  [key: string]: any;
}

export interface ZipLocation {
  city: string;
  state: string;
  stateCode: string;
}

type ZippopotamPlace = {
  'place name'?: unknown;
  state?: unknown;
  'state abbreviation'?: unknown;
};

type ZippopotamResponse = {
  places?: ZippopotamPlace[];
};

const INVALID_US_ZIP_CODE_ERROR = 'INVALID_US_ZIP_CODE';

class LocationServices {
  getLocationByZip = async (zipCode: string): Promise<ZipLocation> => {
    const normalizedZip = zipCode.trim();

    if (!/^\d{5}$/.test(normalizedZip)) {
      throw new Error(INVALID_US_ZIP_CODE_ERROR);
    }

    const response = await fetch(`https://api.zippopotam.us/us/${normalizedZip}`);

    if (!response.ok) {
      throw new Error(INVALID_US_ZIP_CODE_ERROR);
    }

    const payload = (await response.json()) as ZippopotamResponse;
    const firstPlace = payload?.places?.[0];
    const city = typeof firstPlace?.['place name'] === 'string' ? firstPlace['place name'].trim() : '';
    const state = typeof firstPlace?.state === 'string' ? firstPlace.state.trim() : '';
    const stateCode =
      typeof firstPlace?.['state abbreviation'] === 'string'
        ? firstPlace['state abbreviation'].trim()
        : '';

    if (!city || !state || !stateCode) {
      throw new Error(INVALID_US_ZIP_CODE_ERROR);
    }

    return {
      city,
      state,
      stateCode,
    };
  };

  getAllStates = async (): Promise<IApiResponse> => {
    try {
      if (__DEV__) {
        console.log('[LocationAPI] Request -> GET', endPoints.ALL_STATES);
      }
      const response = await fetchApi({
        method: 'GET',
        endPoint: endPoints.ALL_STATES,
        data: undefined,
        params: undefined,
        token: true,
      });
      if (__DEV__) {
        console.log('[LocationAPI] Success -> GET states', {
          status: response?.status,
        });
      }
      return response;
    } catch (error) {
      console.error('[LocationAPI] Error -> GET states', error);
      throw error;
    }
  };

  getCitiesByState = async (stateId: number | string): Promise<IApiResponse> => {
    try {
      if (__DEV__) {
        console.log('[LocationAPI] Request -> GET', `${endPoints.ALL_CITIES}/${stateId}`);
      }
      const response = await fetchApi({
        method: 'GET',
        endPoint: `${endPoints.ALL_CITIES}/${stateId}`,
        data: undefined,
        params: undefined,
        token: true,
      });
      if (__DEV__) {
        console.log('[LocationAPI] Success -> GET cities', {
          status: response?.status,
          stateId,
        });
      }
      return response;
    } catch (error) {
      console.error('[LocationAPI] Error -> GET cities', error);
      throw error;
    }
  };

  getZipCodesByCity = async (cityId: number | string): Promise<IApiResponse> => {
    try {
      if (__DEV__) {
        console.log('[LocationAPI] Request -> GET', `${endPoints.ALL_ZIPCODES}/${cityId}`);
      }
      const response = await fetchApi({
        method: 'GET',
        endPoint: `${endPoints.ALL_ZIPCODES}/${cityId}`,
        data: undefined,
        params: undefined,
        token: true,
      });
      if (__DEV__) {
        console.log('[LocationAPI] Success -> GET zip codes', {
          status: response?.status,
          cityId,
        });
      }
      return response;
    } catch (error) {
      console.error('[LocationAPI] Error -> GET zip codes', error);
      throw error;
    }
  };

  getCitiesWithZipCodes = async (state: string): Promise<IApiResponse> => {
    try {
      if (__DEV__) {
        console.log('[LocationAPI] Request -> GET', endPoints.CITIES_WITH_ZIPS, { state });
      }
      const response = await fetchApi({
        method: 'GET',
        endPoint: endPoints.CITIES_WITH_ZIPS,
        data: undefined,
        params: { state },
        token: true,
      });
      if (__DEV__) {
        console.log('[LocationAPI] Success -> GET cities-with-zips', {
          status: response?.status,
          state,
        });
      }
      return response;
    } catch (error) {
      console.error('[LocationAPI] Error -> GET cities-with-zips', error);
      throw error;
    }
  };
}

const locationServices = new LocationServices();

export default locationServices;
