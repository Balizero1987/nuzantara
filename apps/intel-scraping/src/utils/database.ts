import { Pool } from 'pg';
import { RawArticle } from '../scraper/types';

export async function saveArticles(
  pool: Pool,
  articles: RawArticle[]
): Promise<void> {
  if (articles.length === 0) return;

  for (const article of articles) {
    try {
      await pool.query(`
        INSERT INTO raw_articles (
          source_id, url, title, content, summary,
          published_date, author, category, tier,
          content_hash, quality_score, word_count, language, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (url) DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          updated_at = CURRENT_TIMESTAMP
      `, [
        article.source_id,
        article.url,
        article.title,
        article.content,
        article.summary,
        article.published_date,
        article.author,
        article.category,
        article.tier,
        article.content_hash,
        article.quality_score,
        article.word_count,
        article.language,
        JSON.stringify(article.metadata)
      ]);
    } catch (error) {
      console.error(`Failed to save article ${article.url}:`, error);
    }
  }
}

