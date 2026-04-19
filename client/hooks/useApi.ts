import axios from 'axios';
import { useAuth } from '@clerk/clerk-expo';
import { useMemo } from 'react';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const useApi = () => {
  const { getToken } = useAuth();

  const api = useMemo(() => {
    const instance = axios.create({ baseURL: API_URL });

    instance.interceptors.request.use(async (config) => {
      const token = await getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return instance;
  }, [getToken]);

  return api;
};
