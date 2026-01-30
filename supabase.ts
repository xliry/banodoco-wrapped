
const SUPABASE_URL = 'https://ujlwuvkrxlvoswwkerdf.supabase.co/rest/v1';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHd1dmtyeGx2b3N3d2tlcmRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNzcyMzcsImV4cCI6MjA4MjczNzIzN30.XSTztghf_6a_bpR62wZdoA4S4oafJFDMoPQDRR4dT08';

const BASE_HEADERS: Record<string, string> = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

interface FetchParams {
  table: string;
  select?: string;
  filters?: string;
  order?: string;
  limit?: number;
  offset?: number;
  count?: boolean;
}

interface FetchResult<T> {
  data: T[];
  totalCount: number | null;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function supabaseFetch<T>(params: FetchParams): Promise<FetchResult<T>> {
  const { table, select, filters, order, limit, offset, count } = params;

  const queryParts: string[] = [];
  if (select) queryParts.push(`select=${select}`);
  if (filters) queryParts.push(filters);
  if (order) queryParts.push(`order=${order}`);
  if (limit !== undefined) queryParts.push(`limit=${limit}`);
  if (offset !== undefined) queryParts.push(`offset=${offset}`);

  const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const url = `${SUPABASE_URL}/${table}${query}`;

  const headers: Record<string, string> = { ...BASE_HEADERS };
  if (count) {
    headers['Prefer'] = 'count=exact';
    headers['Range-Unit'] = 'items';
    headers['Range'] = `${offset ?? 0}-${(offset ?? 0) + (limit ?? 0)}`;
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { headers });

      if (response.status === 429) {
        const backoff = Math.pow(2, attempt) * 1000;
        await sleep(backoff);
        continue;
      }

      if (!response.ok) {
        throw new Error(`Supabase error ${response.status}: ${response.statusText}`);
      }

      const data: T[] = await response.json();
      let totalCount: number | null = null;

      if (count) {
        const contentRange = response.headers.get('content-range');
        if (contentRange) {
          const match = contentRange.match(/\/(\d+)/);
          if (match) totalCount = parseInt(match[1], 10);
        }
      }

      return { data, totalCount };
    } catch (err) {
      lastError = err as Error;
      if (attempt < 2) {
        const backoff = Math.pow(2, attempt) * 1000;
        await sleep(backoff);
      }
    }
  }

  throw lastError ?? new Error('supabaseFetch failed after 3 attempts');
}

export async function getTotalCount(table: string): Promise<number> {
  const result = await supabaseFetch({
    table,
    select: '*',
    limit: 1,
    offset: 0,
    count: true,
  });
  return result.totalCount ?? 0;
}

export async function fetchAll<T>(params: Omit<FetchParams, 'limit' | 'offset'>): Promise<T[]> {
  const PAGE_SIZE = 1000;
  const allData: T[] = [];
  let offset = 0;

  while (true) {
    const { data } = await supabaseFetch<T>({ ...params, limit: PAGE_SIZE, offset });
    allData.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allData;
}

export interface StreamingParams extends Omit<FetchParams, 'limit' | 'offset' | 'count'> {
  onPage: (rows: any[]) => void;
  onProgress?: (fetched: number, total: number) => void;
  concurrency?: number;
  totalCount?: number;
}

export async function fetchAllPagesStreaming(params: StreamingParams): Promise<void> {
  const { onPage, onProgress, concurrency = 5, totalCount: knownTotal, ...fetchParams } = params;
  const PAGE_SIZE = 1000;

  let total = knownTotal;
  if (total === undefined) {
    total = await getTotalCount(fetchParams.table);
  }

  if (total === 0) return;

  const totalPages = Math.ceil(total / PAGE_SIZE);
  let completedPages = 0;

  const pageOffsets: number[] = [];
  for (let i = 0; i < totalPages; i++) {
    pageOffsets.push(i * PAGE_SIZE);
  }

  await withConcurrency(
    pageOffsets,
    async (offset) => {
      const { data } = await supabaseFetch<any>({
        ...fetchParams,
        limit: PAGE_SIZE,
        offset,
      });
      onPage(data);
      completedPages++;
      if (onProgress) {
        onProgress(Math.min(completedPages * PAGE_SIZE, total!), total!);
      }
    },
    concurrency,
  );
}

export async function withConcurrency<T>(
  items: T[],
  task: (item: T) => Promise<void>,
  max: number,
): Promise<void> {
  let index = 0;

  async function worker(): Promise<void> {
    while (index < items.length) {
      const currentIndex = index++;
      await task(items[currentIndex]);
    }
  }

  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(max, items.length); i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
}

export async function fetchLikeSearch<T>(
  table: string,
  column: string,
  pattern: string,
  select: string = '*',
): Promise<T[]> {
  return fetchAll<T>({
    table,
    select,
    filters: `${column}=ilike.*${pattern}*`,
  });
}
