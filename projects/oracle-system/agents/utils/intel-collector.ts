import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';
import { RawIntelRecord } from './intel-processor';

export interface IntelSource {
  id: string;
  label: string;
  url: string;
  type: 'html' | 'json' | 'rss';
  frequencyMinutes: number;
  selectors?: {
    item: string;
    title?: string;
    summary?: string;
    content?: string;
    link?: string;
    date?: string;
  };
  transform?: (payload: unknown) => RawIntelRecord[];
  headers?: Record<string, string>;
  strictTLS?: boolean;
}

export interface FetchContext {
  now?: Date;
}

export async function fetchSource(
  source: IntelSource,
  context: FetchContext = {}
): Promise<RawIntelRecord[]> {
  const timestamp = (context.now ?? new Date()).toISOString();

  if (source.transform) {
    const response = await axios.get(source.url, { timeout: 15000 });
    return source.transform(response.data);
  }

  switch (source.type) {
    case 'json':
      return fetchJsonSource(source, timestamp);
    case 'rss':
      return fetchRssSource(source, timestamp);
    default:
      return fetchHtmlSource(source, timestamp);
  }
}

async function fetchJsonSource(source: IntelSource, collectedAt: string): Promise<RawIntelRecord[]> {
  const response = await axios.get(source.url, {
    timeout: 15000,
    headers: source.headers,
    httpsAgent: source.strictTLS === false ? new https.Agent({ rejectUnauthorized: false }) : undefined,
  });
  const data = Array.isArray(response.data) ? response.data : [response.data];

  return data.map((entry, index) => ({
    source: source.label,
    title: entry.title || `Untitled Record ${index + 1}`,
    summary: entry.summary || entry.description,
    content: entry.content || JSON.stringify(entry),
    url: entry.url || entry.link,
    publishedAt: entry.publishedAt || entry.date,
    collectedAt,
    tags: Array.isArray(entry.tags) ? entry.tags : undefined,
    priority: entry.priority
  }));
}

async function fetchHtmlSource(source: IntelSource, collectedAt: string): Promise<RawIntelRecord[]> {
  if (!source.selectors?.item) {
    throw new Error(`HTML source ${source.id} missing item selector`);
  }

  const response = await axios.get(source.url, {
    timeout: 15000,
    headers: source.headers,
    httpsAgent: source.strictTLS === false ? new https.Agent({ rejectUnauthorized: false }) : undefined,
  });
  const $ = cheerio.load(response.data);
  const items: RawIntelRecord[] = [];

  $(source.selectors.item).each((index, element) => {
    const title = source.selectors?.title ? $(element).find(source.selectors.title).text().trim() : $(element).text().trim();
    if (!title) {
      return;
    }

    const summary = source.selectors?.summary ? $(element).find(source.selectors.summary).text().trim() : undefined;
    const content = source.selectors?.content ? $(element).find(source.selectors.content).text().trim() : summary || title;
    const link = source.selectors?.link ? $(element).find(source.selectors.link).attr('href') : undefined;
    const date = source.selectors?.date ? $(element).find(source.selectors.date).text().trim() : undefined;

    items.push({
      source: source.label,
      title,
      summary,
      content,
      url: link ? new URL(link, source.url).toString() : undefined,
      publishedAt: date,
      collectedAt,
      tags: [],
    });
  });

  return items;
}

async function fetchRssSource(source: IntelSource, collectedAt: string): Promise<RawIntelRecord[]> {
  const response = await axios.get(source.url, {
    timeout: 15000,
    headers: source.headers,
    httpsAgent: source.strictTLS === false ? new https.Agent({ rejectUnauthorized: false }) : undefined,
  });
  const $ = cheerio.load(response.data, { xmlMode: true });
  const items: RawIntelRecord[] = [];

  $('item').each((index, element) => {
    const title = $(element).find('title').text().trim();
    if (!title) {
      return;
    }

    items.push({
      source: source.label,
      title,
      summary: $(element).find('description').text().trim(),
      content: $(element).find('content\\:encoded').text().trim() || $(element).find('description').text().trim(),
      url: $(element).find('link').text().trim(),
      publishedAt: $(element).find('pubDate').text().trim(),
      collectedAt,
      tags: [],
    });
  });

  return items;
}
