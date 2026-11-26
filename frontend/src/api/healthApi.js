import { request } from './httpClient';

export const healthApi = {
  getHealth: () => request('/health')
};
