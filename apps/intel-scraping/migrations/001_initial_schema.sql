-- Create database: bali_zero_journal
-- Note: Run this manually: CREATE DATABASE bali_zero_journal;

-- Table 1: News Sources (600+ verified sources)
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url VARCHAR(500) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'immigration', 'business', 'tax', 'property',
        'bali_news', 'ai_indonesia', 'finance'
    )),
    tier VARCHAR(2) NOT NULL CHECK (tier IN ('T1', 'T2', 'T3')),
    language VARCHAR(2) CHECK (language IN ('en', 'id')),
    reliability_score DECIMAL(3,1) DEFAULT 5.0 CHECK (reliability_score >= 0 AND reliability_score <= 10),
    last_scraped TIMESTAMP,
    scrape_frequency VARCHAR(10) DEFAULT '48h' CHECK (scrape_frequency IN ('24h', '48h', 'weekly')),
    selectors JSONB DEFAULT '{}',
    headers JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: Raw Articles
CREATE TABLE IF NOT EXISTS raw_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES sources(id),
    url VARCHAR(1000) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    published_date TIMESTAMP,
    scraped_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    author VARCHAR(200),
    category VARCHAR(50),
    tier VARCHAR(2),
    content_hash VARCHAR(64) NOT NULL, -- SHA-256 for deduplication
    quality_score DECIMAL(3,1),
    word_count INTEGER,
    language VARCHAR(2),
    processed BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 3: Processed Articles
CREATE TABLE IF NOT EXISTS processed_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_article_ids UUID[] NOT NULL,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    key_points TEXT[],
    tags TEXT[],
    sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
    relevance_score DECIMAL(3,1),
    ai_model_used VARCHAR(100),
    processing_cost DECIMAL(10,4),
    cover_image_url TEXT,
    published BOOLEAN DEFAULT false,
    published_date TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 4: Scraping Metrics
CREATE TABLE IF NOT EXISTS scraping_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    category VARCHAR(50),
    source_id UUID REFERENCES sources(id),
    articles_scraped INTEGER DEFAULT 0,
    articles_processed INTEGER DEFAULT 0,
    articles_published INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    avg_quality_score DECIMAL(3,1),
    total_cost DECIMAL(10,4) DEFAULT 0,
    scraping_duration_seconds INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sources_category ON sources(category);
CREATE INDEX IF NOT EXISTS idx_sources_tier ON sources(tier);
CREATE INDEX IF NOT EXISTS idx_sources_active ON sources(active);
CREATE INDEX IF NOT EXISTS idx_raw_articles_hash ON raw_articles(content_hash);
CREATE INDEX IF NOT EXISTS idx_raw_articles_processed ON raw_articles(processed);
CREATE INDEX IF NOT EXISTS idx_raw_articles_published_date ON raw_articles(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_processed_articles_published ON processed_articles(published);
CREATE INDEX IF NOT EXISTS idx_processed_articles_category ON processed_articles(category);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_sources_updated_at ON sources;
CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_processed_articles_updated_at ON processed_articles;
CREATE TRIGGER update_processed_articles_updated_at BEFORE UPDATE ON processed_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

