"""
ZANTARA Spark KBLI Data Processor
Integrates with existing PostgreSQL + ChromaDB + Redis architecture
"""

from pyspark.sql import SparkSession
from pyspark.sql.functions import col, when, count, sum as spark_sum
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, FloatType
import psycopg2
import redis
import requests
import json
import os
from datetime import datetime

class ZantaraSparkProcessor:
    def __init__(self):
        # Initialize Spark
        self.spark = SparkSession.builder \
            .appName("ZANTARA_KBLI_Processor") \
            .config("spark.sql.adaptive.enabled", "true") \
            .config("spark.sql.adaptive.coalescePartitions.enabled", "true") \
            .getOrCreate()
        
        # Database connections
        self.pg_conn = None
        self.redis_client = None
        self.chroma_url = os.getenv('CHROMADB_URL', 'http://localhost:8000')
        
    def connect_to_postgresql(self):
        """Connect to existing PostgreSQL database"""
        try:
            self.pg_conn = psycopg2.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                database=os.getenv('DB_NAME', 'zantara'),
                user=os.getenv('DB_USER', 'postgres'),
                password=os.getenv('DB_PASSWORD')
            )
            print("✅ Connected to PostgreSQL")
        except Exception as e:
            print(f"❌ PostgreSQL connection failed: {e}")
            
    def connect_to_redis(self):
        """Connect to existing Redis cache"""
        try:
            self.redis_client = redis.Redis(
                host=os.getenv('REDIS_HOST', 'localhost'),
                port=int(os.getenv('REDIS_PORT', 6379)),
                decode_responses=True
            )
            self.redis_client.ping()
            print("✅ Connected to Redis")
        except Exception as e:
            print(f"❌ Redis connection failed: {e}")
    
    def process_kbli_data(self, data_path):
        """
        Process KBLI business classification data
        Input: CSV/JSON files with KBLI classifications
        Output: Structured data in PostgreSQL + embeddings in ChromaDB
        """
        
        # Define schema for KBLI data
        schema = StructType([
            StructField("kbli_code", StringType(), True),
            StructField("category", StringType(), True),
            StructField("description", StringType(), True),
            StructField("business_type", StringType(), True),
            StructField("risk_level", StringType(), True),
            StructField("capital_requirement", FloatType(), True)
        ])
        
        # Load data with Spark
        df = self.spark.read.csv(data_path, header=True, schema=schema)
        
        print(f"📊 Loaded {df.count()} KBLI records")
        
        # Data processing with Spark
        processed_df = df \
            .filter(col("kbli_code").isNotNull()) \
            .withColumn("risk_score", 
                when(col("risk_level") == "High", 3)
                .when(col("risk_level") == "Medium", 2)
                .otherwise(1)
            ) \
            .withColumn("complexity_level", 
                when(col("capital_requirement") > 1000000000, "High")
                .when(col("capital_requirement") > 100000000, "Medium")
                .otherwise("Low")
            )
        
        # Analytics with Spark
        print("🔍 Running KBLI analytics...")
        
        # Category distribution
        category_stats = processed_df.groupBy("category").agg(
            count("*").alias("total_businesses"),
            spark_sum("capital_requirement").alias("total_capital")
        ).orderBy(col("total_businesses").desc())
        
        print("📈 Top 10 Business Categories:")
        category_stats.show(10, truncate=False)
        
        # Risk analysis
        risk_analysis = processed_df.groupBy("risk_level").agg(
            count("*").alias("count"),
            spark_sum("capital_requirement").alias("total_capital_at_risk")
        )
        
        print("⚠️ Risk Analysis:")
        risk_analysis.show()
        
        return processed_df
    
    def save_to_postgresql(self, df):
        """Save processed data to PostgreSQL"""
        if not self.pg_conn:
            self.connect_to_postgresql()
            
        try:
            cursor = self.pg_conn.cursor()
            
            # Convert Spark DataFrame to pandas for easier insertion
            pandas_df = df.toPandas()
            
            # Create table if not exists
            create_table_query = """
            CREATE TABLE IF NOT EXISTS kbli_classifications (
                id SERIAL PRIMARY KEY,
                kbli_code VARCHAR(20) UNIQUE,
                category VARCHAR(100),
                description TEXT,
                business_type VARCHAR(100),
                risk_level VARCHAR(20),
                capital_requirement DECIMAL(15,2),
                risk_score INTEGER,
                complexity_level VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
            cursor.execute(create_table_query)
            
            # Insert data
            for _, row in pandas_df.iterrows():
                insert_query = """
                INSERT INTO kbli_classifications 
                (kbli_code, category, description, business_type, risk_level, 
                 capital_requirement, risk_score, complexity_level)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (kbli_code) DO UPDATE SET
                    category = EXCLUDED.category,
                    description = EXCLUDED.description,
                    business_type = EXCLUDED.business_type,
                    risk_level = EXCLUDED.risk_level,
                    capital_requirement = EXCLUDED.capital_requirement,
                    risk_score = EXCLUDED.risk_score,
                    complexity_level = EXCLUDED.complexity_level,
                    updated_at = CURRENT_TIMESTAMP
                """
                cursor.execute(insert_query, (
                    row['kbli_code'], row['category'], row['description'],
                    row['business_type'], row['risk_level'], 
                    row['capital_requirement'], row['risk_score'], 
                    row['complexity_level']
                ))
            
            self.pg_conn.commit()
            cursor.close()
            print(f"✅ Saved {len(pandas_df)} records to PostgreSQL")
            
        except Exception as e:
            print(f"❌ Error saving to PostgreSQL: {e}")
            if self.pg_conn:
                self.pg_conn.rollback()
    
    def generate_embeddings_for_chromadb(self, df):
        """Generate embeddings and save to ChromaDB"""
        print("🧠 Generating embeddings for ChromaDB...")
        
        # Convert to pandas for easier processing
        pandas_df = df.toPandas()
        
        for _, row in pandas_df.iterrows():
            # Create text for embedding
            text_content = f"""
            KBLI Code: {row['kbli_code']}
            Category: {row['category']}
            Description: {row['description']}
            Business Type: {row['business_type']}
            Risk Level: {row['risk_level']}
            Capital Requirement: {row['capital_requirement']}
            """
            
            # Call your existing embedding service
            try:
                response = requests.post(
                    f"{os.getenv('RAG_BACKEND_URL', 'http://localhost:8080')}/api/embeddings",
                    json={
                        "text": text_content.strip(),
                        "metadata": {
                            "kbli_code": row['kbli_code'],
                            "category": row['category'],
                            "risk_level": row['risk_level'],
                            "business_type": row['business_type']
                        }
                    }
                )
                
                if response.status_code == 200:
                    print(f"✅ Embedded: {row['kbli_code']} - {row['category']}")
                else:
                    print(f"❌ Failed to embed: {row['kbli_code']}")
                    
            except Exception as e:
                print(f"❌ Embedding error for {row['kbli_code']}: {e}")
    
    def cache_popular_categories(self, df):
        """Cache popular categories in Redis"""
        if not self.redis_client:
            self.connect_to_redis()
            
        try:
            # Get top categories
            top_categories = df.groupBy("category").count().orderBy(col("count").desc()).limit(20)
            
            for row in top_categories.collect():
                cache_key = f"kbli:category:{row['category']}"
                cache_data = {
                    "category": row['category'],
                    "count": row['count'],
                    "cached_at": datetime.now().isoformat()
                }
                
                self.redis_client.setex(
                    cache_key, 
                    3600,  # 1 hour cache
                    json.dumps(cache_data)
                )
            
            print("✅ Cached top 20 KBLI categories in Redis")
            
        except Exception as e:
            print(f"❌ Redis caching error: {e}")
    
    def run_business_intelligence_analysis(self, df):
        """Run advanced BI analysis with Spark SQL"""
        print("📊 Running Business Intelligence Analysis...")
        
        # Create temporary view for SQL queries
        df.createOrReplaceTempView("kbli_data")
        
        # Complex SQL queries
        analyses = {}
        
        # 1. High Capital, High Risk businesses
        analyses['high_capital_high_risk'] = self.spark.sql("""
            SELECT category, COUNT(*) as count, AVG(capital_requirement) as avg_capital
            FROM kbli_data 
            WHERE risk_level = 'High' AND capital_requirement > 500000000
            GROUP BY category
            ORDER BY avg_capital DESC
        """)
        
        # 2. Business density by risk level
        analyses['risk_distribution'] = self.spark.sql("""
            SELECT risk_level, 
                   COUNT(*) as total_businesses,
                   ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
            FROM kbli_data
            GROUP BY risk_level
            ORDER BY total_businesses DESC
        """)
        
        # 3. Capital requirements by business type
        analyses['capital_by_type'] = self.spark.sql("""
            SELECT business_type,
                   COUNT(*) as count,
                   MIN(capital_requirement) as min_capital,
                   MAX(capital_requirement) as max_capital,
                   AVG(capital_requirement) as avg_capital
            FROM kbli_data
            GROUP BY business_type
            ORDER BY count DESC
        """)
        
        # Display results
        for name, result_df in analyses.items():
            print(f"\n📈 {name.replace('_', ' ').title()}:")
            result_df.show(10, truncate=False)
        
        return analyses
    
    def cleanup(self):
        """Cleanup resources"""
        if self.pg_conn:
            self.pg_conn.close()
        if self.spark:
            self.spark.stop()
        print("🧹 Cleanup completed")

# Usage example
if __name__ == "__main__":
    processor = ZantaraSparkProcessor()
    
    try:
        # Process KBLI data
        df = processor.process_kbli_data("data/kbli_classifications.csv")
        
        # Save to PostgreSQL
        processor.save_to_postgresql(df)
        
        # Generate embeddings for ChromaDB
        processor.generate_embeddings_for_chromadb(df)
        
        # Cache popular categories
        processor.cache_popular_categories(df)
        
        # Run BI analysis
        analyses = processor.run_business_intelligence_analysis(df)
        
        print("🎉 Spark KBLI processing completed successfully!")
        
    except Exception as e:
        print(f"❌ Processing failed: {e}")
    finally:
        processor.cleanup()