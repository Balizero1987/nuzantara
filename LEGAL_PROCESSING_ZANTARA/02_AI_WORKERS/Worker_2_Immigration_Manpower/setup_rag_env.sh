#!/bin/bash

# Setup script for Worker #2 RAG environment
# PostgreSQL + pgvector + Cohere embeddings

echo "🔧 SETTING UP WORKER #2 RAG ENVIRONMENT"
echo "=========================================="

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "🐍 Python version: $python_version"

# Install required Python packages
echo "📦 Installing required Python packages..."

pip3 install --upgrade pip

# Core packages
pip3 install psycopg2-binary
pip3 install cohere
pip3 install python-dotenv

# Optional: for development
pip3 install tqdm
pip3 install rich

echo "✅ Python packages installed"

# Check PostgreSQL connection (optional)
echo ""
echo "🔍 Checking PostgreSQL connection..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL client found"
else
    echo "⚠️  PostgreSQL client not found. Install PostgreSQL client tools."
    echo "   macOS: brew install postgresql"
    echo "   Ubuntu: sudo apt-get install postgresql-client"
fi

# Create environment file template
echo ""
echo "📝 Creating environment file template..."

cat > .env.rag << 'EOF'
# Worker #2 RAG Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zantara_rag
DB_USER=postgres
DB_PASSWORD=your_password_here

# Cohere API Configuration
COHERE_API_KEY=your_cohere_api_key_here

# Optional: Database SSL Configuration
DB_SSLMODE=prefer

# Optional: Connection pool settings
DB_POOL_MIN=1
DB_POOL_MAX=20
EOF

echo "✅ Environment template created: .env.rag"
echo ""
echo "⚠️  IMPORTANT: Edit .env.rag and add your actual credentials!"
echo ""

# Create database setup SQL
echo "📝 Creating database setup SQL..."

cat > setup_worker2_db.sql << 'EOF'
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

EOF

echo "✅ Database setup SQL created: setup_worker2_db.sql"

# Create migration runner script
echo ""
echo "📝 Creating migration runner script..."

cat > run_migration.sh << 'EOF'
#!/bin/bash

# Worker #2 Migration Runner
# Run migration to RAG database

echo "🚀 WORKER #2 RAG MIGRATION"
echo "==========================="

# Load environment variables
if [ -f .env.rag ]; then
    export $(cat .env.rag | xargs)
    echo "✅ Environment variables loaded from .env.rag"
else
    echo "❌ .env.rag file not found!"
    echo "Please create .env.rag with your database and API credentials."
    exit 1
fi

# Check required variables
if [ -z "$DB_HOST" ] || [ -z "$COHERE_API_KEY" ]; then
    echo "❌ Required environment variables not set!"
    echo "Please check your .env.rag file."
    exit 1
fi

# Run migration
echo "📊 Starting migration..."
python3 migrate_to_rag_worker2.py

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"

    # Run tests if migration succeeded
    echo ""
    echo "🧪 Running RAG tests..."
    python3 test_worker2_rag.py
else
    echo "❌ Migration failed!"
    exit 1
fi

EOF

chmod +x run_migration.sh
echo "✅ Migration runner created: run_migration.sh"

echo ""
echo "🎉 SETUP COMPLETED!"
echo "==================="
echo ""
echo "Next steps:"
echo "1. Edit .env.rag with your actual credentials"
echo "2. Ensure PostgreSQL is running with pgvector extension"
echo "3. Run: ./run_migration.sh"
echo ""
echo "Files created:"
echo "  - .env.rag (environment variables template)"
echo "  - setup_worker2_db.sql (database setup script)"
echo "  - run_migration.sh (migration runner script)"
echo "  - migrate_to_rag_worker2.py (migration script)"
echo "  - test_worker2_rag.py (testing script)"