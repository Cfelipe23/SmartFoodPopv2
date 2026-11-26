import { request } from './httpClient';
import { isHealth } from './responseGuards';

export const healthApi = {
  getHealth: () => request('/health', isHealth)
};
