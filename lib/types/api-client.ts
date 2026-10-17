/**
 * Shared client API option contracts (drishx-client-api skill).
 * No response → TData = void. No payload → TVariables = null.
 */

export type QueryOptions<TData> = {
  enabled?: boolean;
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
};

export type MutationOptions<TData, TVariables> = {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
};

/** Standard list envelope for table/list endpoints. */
export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  hasMore: boolean;
  total?: number;
};
