"""
🕸️ KNOWLEDGE GRAPH AUTO-BUILDER
Automatically builds and maintains a knowledge graph from all data sources
"""


import psycopg2

try:
    from llm.zantara_ai_client import ZantaraAIClient

    ZANTARA_AVAILABLE = True
except ImportError:
    ZantaraAIClient = None
    ZANTARA_AVAILABLE = False
import json
from datetime import datetime


class KnowledgeGraphBuilder:
    """
    Autonomous agent that:
    1. Extracts entities from conversations (topics, laws, companies, people)
    2. Identifies relationships between entities
    3. Builds knowledge graph in PostgreSQL
    4. Enables semantic search across all data
    5. Auto-discovers insights
    """

    def __init__(self):
        from app.core.config import settings

        self.db_url = settings.database_url
        self.zantara_client = ZantaraAIClient() if ZANTARA_AVAILABLE else None

    async def init_graph_schema(self):
        """Create knowledge graph tables"""
        conn = psycopg2.connect(self.db_url)
        cursor = conn.cursor()

        # Entities table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS kg_entities (
                id SERIAL PRIMARY KEY,
                type VARCHAR(50) NOT NULL,  -- 'law', 'topic', 'company', 'person', 'location', 'practice_type'
                name TEXT NOT NULL,
                canonical_name TEXT,  -- Normalized name
                metadata JSONB DEFAULT '{}',
                mention_count INTEGER DEFAULT 1,
                first_seen_at TIMESTAMP DEFAULT NOW(),
                last_seen_at TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(type, canonical_name)
            );

            CREATE INDEX IF NOT EXISTS idx_kg_entities_type ON kg_entities(type);
            CREATE INDEX IF NOT EXISTS idx_kg_entities_canonical ON kg_entities(canonical_name);
        """
        )

        # Relationships table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS kg_relationships (
                id SERIAL PRIMARY KEY,
                source_entity_id INTEGER REFERENCES kg_entities(id),
                target_entity_id INTEGER REFERENCES kg_entities(id),
                relationship_type VARCHAR(50) NOT NULL,  -- 'relates_to', 'requires', 'conflicts_with', 'example_of'
                strength FLOAT DEFAULT 1.0,  -- Relationship strength (0-1)
                evidence TEXT[],  -- Array of evidence snippets
                source_references JSONB DEFAULT '[]',  -- [{type: 'conversation', id: '123'}, ...]
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(source_entity_id, target_entity_id, relationship_type)
            );

            CREATE INDEX IF NOT EXISTS idx_kg_rel_source ON kg_relationships(source_entity_id);
            CREATE INDEX IF NOT EXISTS idx_kg_rel_target ON kg_relationships(target_entity_id);
        """
        )

        # Entity mentions (link back to source data)
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS kg_entity_mentions (
                id SERIAL PRIMARY KEY,
                entity_id INTEGER REFERENCES kg_entities(id),
                source_type VARCHAR(50) NOT NULL,  -- 'conversation', 'practice', 'document'
                source_id TEXT NOT NULL,
                context TEXT,  -- Surrounding text
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_kg_mentions_entity ON kg_entity_mentions(entity_id);
            CREATE INDEX IF NOT EXISTS idx_kg_mentions_source ON kg_entity_mentions(source_type, source_id);
        """
        )

        conn.commit()
        cursor.close()
        conn.close()

        print("✅ Knowledge graph schema initialized")

    async def extract_entities_from_text(self, text: str) -> list[dict]:
        """Extract entities using Claude"""

        prompt = f"""Extract structured entities from this legal/business conversation:

Text:
{text[:4000]}  # Limit to avoid token limits

Extract:
1. **Laws/Regulations**: Specific laws, articles, regulations mentioned
2. **Topics**: Main legal/business topics (e.g., "Investment License", "Tax Compliance")
3. **Companies**: Company names mentioned
4. **Locations**: Cities, provinces, countries
5. **Practice Types**: Types of legal work (e.g., "Due Diligence", "Contract Review")
6. **Key Concepts**: Important legal concepts

Return JSON array:
[
  {{
    "type": "law|topic|company|location|practice_type|concept",
    "name": "exact mention",
    "canonical_name": "normalized version",
    "context": "brief context where mentioned"
  }}
]

Be precise. Only extract clear entities."""

        text = await self.zantara_client.generate_text(
            prompt=prompt, max_tokens=2048, temperature=0.2
        )

        try:
            # Extract JSON from response
            json_start = text.find("[")
            json_end = text.rfind("]") + 1
            if json_start >= 0 and json_end > json_start:
                return json.loads(text[json_start:json_end])
            return []
        except Exception as e:
            print(f"Error parsing entities: {e}")
            return []

    async def extract_relationships(self, entities: list[dict], text: str) -> list[dict]:
        """Extract relationships between entities"""

        if len(entities) < 2:
            return []

        entity_names = [e["name"] for e in entities]

        prompt = f"""Given these entities from a legal conversation:
{json.dumps(entity_names, indent=2)}

And this context:
{text[:3000]}

Identify meaningful relationships between entities.

Return JSON array:
[
  {{
    "source": "entity name",
    "target": "entity name",
    "relationship": "relates_to|requires|conflicts_with|example_of|governed_by",
    "strength": 0.8,  # confidence 0-1
    "evidence": "quote from text showing this relationship"
  }}
]

Only include clear, meaningful relationships."""

        text = await self.zantara_client.generate_text(
            prompt=prompt, max_tokens=2048, temperature=0.2
        )

        try:
            json_start = text.find("[")
            json_end = text.rfind("]") + 1
            if json_start >= 0 and json_end > json_start:
                return json.loads(text[json_start:json_end])
            return []
        except Exception as e:
            print(f"Error parsing relationships: {e}")
            return []

    async def upsert_entity(
        self, entity_type: str, name: str, canonical_name: str, metadata: dict, cursor
    ) -> int:
        """Insert or update entity, return entity_id"""

        cursor.execute(
            """
            INSERT INTO kg_entities (type, name, canonical_name, metadata, mention_count, last_seen_at)
            VALUES (%s, %s, %s, %s, 1, NOW())
            ON CONFLICT (type, canonical_name)
            DO UPDATE SET
                mention_count = kg_entities.mention_count + 1,
                last_seen_at = NOW(),
                metadata = kg_entities.metadata || EXCLUDED.metadata
            RETURNING id
        """,
            (entity_type, name, canonical_name, json.dumps(metadata)),
        )

        return cursor.fetchone()[0]

    async def upsert_relationship(
        self,
        source_id: int,
        target_id: int,
        rel_type: str,
        strength: float,
        evidence: str,
        source_ref: dict,
        cursor,
    ):
        """Insert or update relationship"""

        cursor.execute(
            """
            INSERT INTO kg_relationships (
                source_entity_id, target_entity_id, relationship_type,
                strength, evidence, source_references
            )
            VALUES (%s, %s, %s, %s, ARRAY[%s], %s::jsonb)
            ON CONFLICT (source_entity_id, target_entity_id, relationship_type)
            DO UPDATE SET
                strength = (kg_relationships.strength + EXCLUDED.strength) / 2,  -- Average strength
                evidence = array_append(kg_relationships.evidence, EXCLUDED.evidence[1]),
                source_references = kg_relationships.source_references || EXCLUDED.source_references,
                updated_at = NOW()
        """,
            (source_id, target_id, rel_type, strength, evidence, json.dumps([source_ref])),
        )

    async def process_conversation(self, conversation_id: str):
        """Extract entities and relationships from a conversation"""

        conn = psycopg2.connect(self.db_url)
        cursor = conn.cursor()

        # Get conversation
        cursor.execute(
            """
            SELECT messages, client_id, created_at
            FROM conversations
            WHERE conversation_id = %s
        """,
            (conversation_id,),
        )

        row = cursor.fetchone()
        if not row:
            cursor.close()
            conn.close()
            return

        messages_json, client_id, created_at = row

        # Combine all messages into text
        try:
            messages = (
                json.loads(messages_json) if isinstance(messages_json, str) else messages_json
            )
            full_text = "\n".join(
                [f"{msg.get('role', 'user')}: {msg.get('content', '')}" for msg in messages]
            )
        except:
            full_text = str(messages_json)

        # 1. Extract entities
        entities = await self.extract_entities_from_text(full_text)

        entity_map = {}  # name -> entity_id

        for entity in entities:
            entity_id = await self.upsert_entity(
                entity_type=entity["type"],
                name=entity["name"],
                canonical_name=entity["canonical_name"],
                metadata={"context": entity.get("context", "")},
                cursor=cursor,
            )

            entity_map[entity["canonical_name"]] = entity_id

            # Add mention
            cursor.execute(
                """
                INSERT INTO kg_entity_mentions (entity_id, source_type, source_id, context)
                VALUES (%s, 'conversation', %s, %s)
            """,
                (entity_id, conversation_id, entity.get("context", "")[:500]),
            )

        # 2. Extract relationships
        if len(entities) >= 2:
            relationships = await self.extract_relationships(entities, full_text)

            for rel in relationships:
                source_canonical = next(
                    (e["canonical_name"] for e in entities if e["name"] == rel["source"]), None
                )
                target_canonical = next(
                    (e["canonical_name"] for e in entities if e["name"] == rel["target"]), None
                )

                if source_canonical and target_canonical:
                    source_id = entity_map.get(source_canonical)
                    target_id = entity_map.get(target_canonical)

                    if source_id and target_id:
                        await self.upsert_relationship(
                            source_id=source_id,
                            target_id=target_id,
                            rel_type=rel["relationship"],
                            strength=rel.get("strength", 0.7),
                            evidence=rel.get("evidence", ""),
                            source_ref={"type": "conversation", "id": conversation_id},
                            cursor=cursor,
                        )

        conn.commit()
        cursor.close()
        conn.close()

        print(
            f"✅ Processed conversation {conversation_id}: {len(entities)} entities, {len(relationships) if len(entities) >= 2 else 0} relationships"
        )

    async def build_graph_from_all_conversations(self, days_back: int = 30):
        """Process all recent conversations"""

        conn = psycopg2.connect(self.db_url)
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT conversation_id
            FROM conversations
            WHERE created_at >= NOW() - INTERVAL '%s days'
            ORDER BY created_at DESC
        """,
            (days_back,),
        )

        conversation_ids = [row[0] for row in cursor.fetchall()]
        cursor.close()
        conn.close()

        print(f"Processing {len(conversation_ids)} conversations...")

        for conv_id in conversation_ids:
            try:
                await self.process_conversation(conv_id)
            except Exception as e:
                print(f"Error processing {conv_id}: {e}")

        print(f"✅ Knowledge graph built from {len(conversation_ids)} conversations")

    async def get_entity_insights(self, top_n: int = 20) -> dict:
        """Get insights from knowledge graph"""

        conn = psycopg2.connect(self.db_url)
        cursor = conn.cursor()

        # Top entities by type
        cursor.execute(
            """
            SELECT type, name, mention_count
            FROM kg_entities
            ORDER BY mention_count DESC
            LIMIT %s
        """,
            (top_n,),
        )

        top_entities = [
            {"type": row[0], "name": row[1], "mentions": row[2]} for row in cursor.fetchall()
        ]

        # Most connected entities (hub analysis)
        cursor.execute(
            """
            SELECT
                e.type,
                e.name,
                COUNT(DISTINCT r.id) as connection_count
            FROM kg_entities e
            JOIN kg_relationships r ON e.id = r.source_entity_id OR e.id = r.target_entity_id
            GROUP BY e.id, e.type, e.name
            ORDER BY connection_count DESC
            LIMIT %s
        """,
            (top_n,),
        )

        hubs = [
            {"type": row[0], "name": row[1], "connections": row[2]} for row in cursor.fetchall()
        ]

        # Relationship insights
        cursor.execute(
            """
            SELECT relationship_type, COUNT(*) as count
            FROM kg_relationships
            GROUP BY relationship_type
            ORDER BY count DESC
        """
        )

        rel_types = {row[0]: row[1] for row in cursor.fetchall()}

        cursor.close()
        conn.close()

        return {
            "top_entities": top_entities,
            "hubs": hubs,
            "relationship_types": rel_types,
            "generated_at": datetime.now().isoformat(),
        }

    async def semantic_search_entities(self, query: str, top_k: int = 10) -> list[dict]:
        """Search entities semantically"""

        conn = psycopg2.connect(self.db_url)
        cursor = conn.cursor()

        # Simple text search for now (can be enhanced with embeddings)
        cursor.execute(
            """
            SELECT
                e.id,
                e.type,
                e.name,
                e.mention_count,
                e.metadata,
                COUNT(DISTINCT m.id) as mention_count_in_sources
            FROM kg_entities e
            LEFT JOIN kg_entity_mentions m ON e.id = m.entity_id
            WHERE
                e.name ILIKE %s
                OR e.canonical_name ILIKE %s
                OR e.metadata::text ILIKE %s
            GROUP BY e.id, e.type, e.name, e.mention_count, e.metadata
            ORDER BY mention_count_in_sources DESC
            LIMIT %s
        """,
            (f"%{query}%", f"%{query}%", f"%{query}%", top_k),
        )

        results = [
            {
                "entity_id": row[0],
                "type": row[1],
                "name": row[2],
                "mentions": row[3],
                "metadata": row[4],
                "source_mentions": row[5],
            }
            for row in cursor.fetchall()
        ]

        cursor.close()
        conn.close()

        return results


# Cron entry
# CRON_BUILD_KNOWLEDGE_GRAPH="0 4 * * *"  # Daily at 4 AM
