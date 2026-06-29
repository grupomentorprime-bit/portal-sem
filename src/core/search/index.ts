export interface SearchQuery {
  tenantId: string;
  q: string;
  collections?: string[];
  limit?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  href: string;
  collection: string;
}

export interface SearchService {
  search(query: SearchQuery): Promise<SearchResult[]>;
}
