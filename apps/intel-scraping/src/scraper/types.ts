export interface Source {
  id: string;
  url: string;
  name: string;
  category: string;
  tier: 'T1' | 'T2' | 'T3';
  language?: string;
  reliability_score: number;
  scrape_frequency: string;
  selectors?: {
    title?: string;
    content?: string;
    date?: string;
    author?: string;
    summary?: string;
    link?: string;
  };
  headers?: Record<string, string>;
  active: boolean;
}

export interface RawArticle {
  source_id: string;
  url: string;
  title: string;
  content: string;
  summary?: string | null;
  published_date?: Date | null;
  author?: string | null;
  category: string;
  tier: string;
  content_hash: string;
  quality_score?: number;
  word_count: number;
  language: string;
  metadata?: Record<string, any>;
}

