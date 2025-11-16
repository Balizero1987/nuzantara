export const defaultSelectors: Record<string, {
  title: string[];
  content: string[];
  date: string[];
  author: string[];
  summary: string[];
}> = {
  default: {
    title: ['h1', 'title', '.post-title', '.article-title', '.entry-title'],
    content: ['article', 'main', '.content', '.post-content', '.entry-content'],
    date: ['.date', '.published', 'time', '[datetime]'],
    author: ['.author', '.byline', '[rel="author"]'],
    summary: ['.summary', '.excerpt', '.lead']
  },
  immigration: {
    title: ['h1', '.news-title', '.article-title'],
    content: ['.news-content', '.article-body', 'article'],
    date: ['.publish-date', '.date', 'time'],
    author: ['.author', '.byline'],
    summary: ['.summary', '.excerpt']
  },
  business: {
    title: ['h1', '.headline', '.title'],
    content: ['.article-body', '.content', 'main'],
    date: ['.date', '.published-date', 'time'],
    author: ['.author', '.byline'],
    summary: ['.summary', '.excerpt']
  },
  tax: {
    title: ['h1', '.news-title', '.article-title'],
    content: ['.news-content', '.article-body', 'article'],
    date: ['.publish-date', '.date', 'time'],
    author: ['.author', '.byline'],
    summary: ['.summary', '.excerpt']
  },
  property: {
    title: ['h1', '.post-title', '.article-title'],
    content: ['.post-content', '.article-body', 'article'],
    date: ['.date', '.published', 'time'],
    author: ['.author', '.byline'],
    summary: ['.summary', '.excerpt']
  },
  bali_news: {
    title: ['h1', '.headline', '.title'],
    content: ['.article-body', '.content', 'main'],
    date: ['.date', '.published-date', 'time'],
    author: ['.author', '.byline'],
    summary: ['.summary', '.excerpt']
  },
  ai_indonesia: {
    title: ['h1', '.post-title', '.article-title'],
    content: ['.post-content', '.article-body', 'article'],
    date: ['.date', '.published', 'time'],
    author: ['.author', '.byline'],
    summary: ['.summary', '.excerpt']
  },
  finance: {
    title: ['h1', '.headline', '.title'],
    content: ['.article-body', '.content', 'main'],
    date: ['.date', '.published-date', 'time'],
    author: ['.author', '.byline'],
    summary: ['.summary', '.excerpt']
  }
};

