-- Setup script for Worker #2 RAG database
-- PostgreSQL + pgvector setup

-- Create database (if needed)
-- CREATE DATABASE zantara_rag;

-- Connect to the database and run these commands:

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create schema for Worker #2
CREATE SCHEMA IF NOT EXISTS worker2;

-- Main table for legal content
CREATE TABLE worker2_immigration_manpower (
    id SERIAL PRIMARY KEY,
    chunk_id VARCHAR(255) UNIQUE NOT NULL,
    law_id VARCHAR(100) NOT NULL,
    law_type VARCHAR(100) NOT NULL,
    chunk_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL,
    signals JSONB NOT NULL,
    embedding vector(1024),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_worker2_law_id ON worker2_immigration_manpower(law_id);
CREATE INDEX idx_worker2_law_type ON worker2_immigration_manpower(law_type);
CREATE INDEX idx_worker2_chunk_type ON worker2_immigration_manpower(chunk_type);

-- Vector index for similarity search
CREATE INDEX idx_worker2_embedding ON worker2_immigration_manpower
USING ivfflat (embedding vector_cosine_ops);

-- Full-text search index
CREATE INDEX idx_worker2_content_fts ON worker2_immigration_manpower
USING gin(to_tsvector('indonesian', content));

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_worker2_updated_at
BEFORE UPDATE ON worker2_immigration_manpower
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA worker2 TO your_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA worker2 TO your_user;

