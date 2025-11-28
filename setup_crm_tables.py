#!/usr/bin/env python3
"""
Script to create CRM tables in PostgreSQL database for ZANTARA
"""

import psycopg2
import os
from psycopg2.extras import RealDictCursor
import sys

def get_database_url():
    """Get database URL from environment or Fly.io secrets"""
    # Try to get from environment first
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL not found in environment")
        print("Please run: fly -a nuzantara-rag secrets set DATABASE_URL='your_connection_string'")
        return None
    return database_url

def create_crm_tables():
    """Create all CRM tables in the database"""

    database_url = get_database_url()
    if not database_url:
        return False

    try:
        print("🔗 Connecting to PostgreSQL database...")
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()

        print("✅ Connected successfully!")

        # Create extensions if they don't exist
        print("📦 Creating extensions...")
        cursor.execute("""
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            CREATE EXTENSION IF NOT EXISTS "pgcrypto";
        """)

        # Create clients table
        print("👥 Creating clients table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS clients (
                id SERIAL PRIMARY KEY,
                uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE,
                phone VARCHAR(50),
                whatsapp VARCHAR(50),
                nationality VARCHAR(100),
                passport_number VARCHAR(100),
                assigned_to VARCHAR(255), -- Team member email
                status VARCHAR(50) DEFAULT 'active', -- active, inactive, prospect
                tags TEXT[], -- Array of tags
                metadata JSONB DEFAULT '{}', -- Flexible metadata storage
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(255), -- User who created this record
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_by VARCHAR(255), -- User who last updated this record
                deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
                deleted_by VARCHAR(255) -- User who deleted this record
            );

            -- Indexes for performance
            CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
            CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
            CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON clients(assigned_to);
            CREATE INDEX IF NOT EXISTS idx_clients_tags ON clients USING GIN(tags);
            CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
        """)

        # Create practice_types table first
        print("📋 Creating practice_types table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS practice_types (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'kitas_application', 'pt_pma_setup'
                name VARCHAR(255) NOT NULL, -- e.g., 'KITAS Visa Application'
                description TEXT,
                category VARCHAR(100), -- 'visa', 'corporate', 'property', 'tax', 'legal'
                base_price DECIMAL(12, 2), -- Base price for this practice type
                typical_duration_days INTEGER, -- Typical duration in days
                required_documents TEXT[], -- Required documents list
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            -- Insert some initial practice types
            INSERT INTO practice_types (code, name, description, category, base_price, typical_duration_days, required_documents) VALUES
            ('kitas_application', 'KITAS Visa Application', 'Indonesian limited stay visa application', 'visa', 1500.00, 30, ARRAY['passport', 'photos', 'sponsor_letter', 'bank_statement']),
            ('kitap_application', 'KITAP Permanent Permit', 'Indonesian permanent stay permit application', 'visa', 2500.00, 60, ARRAY['passport', 'kitas', 'photos', 'tax_reports']),
            ('pt_pma_setup', 'PT PMA Company Setup', 'Foreign investment company establishment', 'corporate', 3000.00, 45, ARRAY['passport', 'ktp', 'npwp', 'company_plan']),
            ('property_purchase', 'Property Purchase', 'Real estate transaction assistance', 'property', 2000.00, 30, ARRAY['passport', 'npwp', 'identity_card']),
            ('tax_consulting', 'Tax Consulting', 'Tax planning and compliance services', 'tax', 1000.00, 14, ARRAY['financial_documents', 'previous_tax_returns'])
            ON CONFLICT (code) DO NOTHING;

            CREATE INDEX IF NOT EXISTS idx_practice_types_code ON practice_types(code);
            CREATE INDEX IF NOT EXISTS idx_practice_types_category ON practice_types(category);
            CREATE INDEX IF NOT EXISTS idx_practice_types_active ON practice_types(is_active);
        """)

        # Create practices table
        print("⚖️ Creating practices table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS practices (
                id SERIAL PRIMARY KEY,
                uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
                client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
                practice_type_code VARCHAR(50) REFERENCES practice_types(code),
                title VARCHAR(255), -- Custom title for this specific practice
                description TEXT,
                status VARCHAR(50) DEFAULT 'inquiry', -- inquiry, quotation_sent, payment_pending, in_progress, waiting_documents, submitted_to_gov, approved, completed, cancelled
                priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
                quoted_price DECIMAL(12, 2),
                final_price DECIMAL(12, 2),
                currency VARCHAR(3) DEFAULT 'USD',
                assigned_to VARCHAR(255), -- Team member email handling this practice
                start_date DATE,
                expected_completion_date DATE,
                actual_completion_date DATE,
                notes TEXT,
                metadata JSONB DEFAULT '{}', -- Flexible metadata storage
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(255),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_by VARCHAR(255)
            );

            -- Indexes
            CREATE INDEX IF NOT EXISTS idx_practices_client_id ON practices(client_id);
            CREATE INDEX IF NOT EXISTS idx_practices_status ON practices(status);
            CREATE INDEX IF NOT EXISTS idx_practices_type_code ON practices(practice_type_code);
            CREATE INDEX IF NOT EXISTS idx_practices_assigned_to ON practices(assigned_to);
            CREATE INDEX IF NOT EXISTS idx_practices_created_at ON practices(created_at);
        """)

        # Create interactions table
        print("💬 Creating interactions table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS interactions (
                id SERIAL PRIMARY KEY,
                uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
                client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
                practice_id INTEGER REFERENCES practices(id) ON DELETE SET NULL, -- Optional, can be general interaction
                type VARCHAR(50) NOT NULL, -- chat, email, whatsapp, call, meeting, note
                channel VARCHAR(50) DEFAULT 'web_chat', -- web_chat, gmail, whatsapp, phone, in_person
                title VARCHAR(255),
                content TEXT NOT NULL,
                direction VARCHAR(20) DEFAULT 'inbound', -- inbound, outbound, internal
                sentiment VARCHAR(20), -- positive, neutral, negative
                priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
                duration_minutes INTEGER, -- For calls/meetings
                metadata JSONB DEFAULT '{}', -- Store additional data (message IDs, thread references, etc.)
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(255) -- Who created this interaction
            );

            -- Indexes
            CREATE INDEX IF NOT EXISTS idx_interactions_client_id ON interactions(client_id);
            CREATE INDEX IF NOT EXISTS idx_interactions_practice_id ON interactions(practice_id);
            CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(type);
            CREATE INDEX IF NOT EXISTS idx_interactions_channel ON interactions(channel);
            CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON interactions(created_at);
            CREATE INDEX IF NOT EXISTS idx_interactions_direction ON interactions(direction);
        """)

        # Create conversation_messages table
        print("📨 Creating conversation_messages table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS conversation_messages (
                id SERIAL PRIMARY KEY,
                uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
                client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
                session_id VARCHAR(255), -- Chat session identifier
                role VARCHAR(50) NOT NULL, -- user, assistant, system
                content TEXT NOT NULL,
                metadata JSONB DEFAULT '{}', -- Store model info, tokens, etc.
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            -- Indexes
            CREATE INDEX IF NOT EXISTS idx_conversation_messages_client_id ON conversation_messages(client_id);
            CREATE INDEX IF NOT EXISTS idx_conversation_messages_session_id ON conversation_messages(session_id);
            CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(created_at);
            CREATE INDEX IF NOT EXISTS idx_conversation_messages_role ON conversation_messages(role);
        """)

        # Create practice_documents table
        print("📄 Creating practice_documents table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS practice_documents (
                id SERIAL PRIMARY KEY,
                uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
                practice_id INTEGER REFERENCES practices(id) ON DELETE CASCADE,
                document_name VARCHAR(255) NOT NULL, -- e.g., "Passport Copy", "Company Registration"
                description TEXT,
                file_type VARCHAR(100), -- pdf, jpg, docx, etc.
                file_size BIGINT,
                drive_file_id VARCHAR(255), -- Google Drive file ID
                drive_url TEXT,
                is_required BOOLEAN DEFAULT FALSE,
                is_submitted BOOLEAN DEFAULT FALSE,
                submitted_at TIMESTAMP WITH TIME ZONE,
                verified BOOLEAN DEFAULT FALSE,
                verified_at TIMESTAMP WITH TIME ZONE,
                verified_by VARCHAR(255),
                notes TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(255)
            );

            -- Indexes
            CREATE INDEX IF NOT EXISTS idx_practice_documents_practice_id ON practice_documents(practice_id);
            CREATE INDEX IF NOT EXISTS idx_practice_documents_is_required ON practice_documents(is_required);
            CREATE INDEX IF NOT EXISTS idx_practice_documents_is_submitted ON practice_documents(is_submitted);
        """)

        # Create compliance_tracking table
        print("⏰ Creating compliance_tracking table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS compliance_tracking (
                id SERIAL PRIMARY KEY,
                uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
                client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
                practice_id INTEGER REFERENCES practices(id) ON DELETE SET NULL,
                compliance_type VARCHAR(100) NOT NULL, -- visa_expiry, tax_filing, license_renewal
                description TEXT,
                due_date DATE NOT NULL,
                priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
                status VARCHAR(50) DEFAULT 'pending', -- pending, alerted, completed, overdue
                alert_sent_days INTEGER[], -- Days when alerts were sent (60, 30, 7)
                completed_at TIMESTAMP WITH TIME ZONE,
                notes TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(255),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_by VARCHAR(255)
            );

            -- Indexes
            CREATE INDEX IF NOT EXISTS idx_compliance_client_id ON compliance_tracking(client_id);
            CREATE INDEX IF NOT EXISTS idx_compliance_practice_id ON compliance_tracking(practice_id);
            CREATE INDEX IF NOT EXISTS idx_compliance_type ON compliance_tracking(compliance_type);
            CREATE INDEX IF NOT EXISTS idx_compliance_due_date ON compliance_tracking(due_date);
            CREATE INDEX IF NOT EXISTS idx_compliance_status ON compliance_tracking(status);
        """)

        # Create triggers for updated_at timestamps
        print("🔧 Creating triggers...")
        cursor.execute("""
            -- Function to update updated_at column
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';

            -- Create triggers for all tables with updated_at
            CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

            CREATE TRIGGER update_practice_types_updated_at BEFORE UPDATE ON practice_types
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

            CREATE TRIGGER update_practices_updated_at BEFORE UPDATE ON practices
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

            CREATE TRIGGER update_compliance_tracking_updated_at BEFORE UPDATE ON compliance_tracking
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """)

        # Commit all changes
        conn.commit()
        print("✅ All CRM tables created successfully!")

        # Show table information
        print("\n📊 Database Tables Created:")
        cursor.execute("""
            SELECT table_name, column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name IN ('clients', 'practices', 'interactions', 'conversation_messages', 'practice_documents', 'practice_types', 'compliance_tracking')
            ORDER BY table_name, ordinal_position;
        """)

        tables = cursor.fetchall()
        current_table = None
        for row in tables:
            if row[0] != current_table:
                print(f"\n🗃️ {row[0].upper()}:")
                current_table = row[0]
            nullable = "NULL" if row[3] == "YES" else "NOT NULL"
            default = f" DEFAULT {row[4]}" if row[4] else ""
            print(f"  • {row[1]}: {row[2]} {nullable}{default}")

        # Close connection
        cursor.close()
        conn.close()

        print("\n🎉 CRM database setup completed successfully!")
        return True

    except Exception as e:
        print(f"❌ Error creating CRM tables: {str(e)}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

if __name__ == "__main__":
    print("🚀 Starting CRM table creation for ZANTARA...")
    success = create_crm_tables()

    if success:
        print("\n✅ CRM tables are ready for use!")
        print("You can now test the CRM endpoints:")
        print("  • GET /api/crm/clients/ - List clients")
        print("  • POST /api/crm/clients/ - Create client")
        print("  • GET /api/crm/practices/ - List practices")
        print("  • POST /api/crm/practices/ - Create practice")
        sys.exit(0)
    else:
        print("\n❌ Failed to create CRM tables. Please check the error above.")
        sys.exit(1)