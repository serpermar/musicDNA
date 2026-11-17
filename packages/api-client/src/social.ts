import type {
  CreateComparisonInput,
  CreateShareInput,
  CreateShareResult,
  MusicProfile,
  ProfileComparison,
  Recommendation,
  SharedProfileView,
} from '@musicdna/shared';
import type { ApiClient } from './index';

export interface SocialApi {
  getRecommendations(): Promise<{ recommendations: Recommendation[] }>;
  getProfileHistory(): Promise<{ profiles: MusicProfile[] }>;
  createShare(input: CreateShareInput): Promise<CreateShareResult>;
  getSharedProfile(slug: string): Promise<{ profile: SharedProfileView }>;
  createComparison(input: CreateComparisonInput): Promise<{ comparison: ProfileComparison }>;
  getSpotifyStatus(): Promise<{ status: 'ACTIVE' | 'DISCONNECTED' | 'EXPIRED' }>;
}

/** Recomendaciones, historial, enlaces compartidos y comparador. */
export function createSocialApi(client: ApiClient): SocialApi {
  return {
    getRecommendations() {
      return client.get<{ recommendations: Recommendation[] }>('/recommendations/me');
    },
    getProfileHistory() {
      return client.get<{ profiles: MusicProfile[] }>('/profiles/history');
    },
    createShare(input) {
      return client.post<CreateShareResult>('/shares', input);
    },
    getSharedProfile(slug) {
      return client.get<{ profile: SharedProfileView }>(`/shares/${encodeURIComponent(slug)}`);
    },
    createComparison(input) {
      return client.post<{ comparison: ProfileComparison }>('/comparisons', input);
    },
    getSpotifyStatus() {
      return client.get<{ status: 'ACTIVE' | 'DISCONNECTED' | 'EXPIRED' }>('/spotify/status');
    },
  };
}
