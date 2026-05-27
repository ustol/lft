export interface ApiSuccess<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: { message: string; code?: string };
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

export interface LFTIDSearchResult {
  id: string;
  lftid: string;
  display_name: string;
  avatar_url: string | null;
  tree_visibility: string;
}
