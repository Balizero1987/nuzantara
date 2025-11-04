import sqlite3
conn = sqlite3.connect('/data/chroma_db_FULL_deploy/chroma.sqlite3')
cursor = conn.execute("""
    SELECT c.name, COUNT(DISTINCT e.embedding_id) as count
    FROM collections c
    JOIN segments s ON c.id = s.collection
    LEFT JOIN embeddings e ON s.id = e.segment_id
    WHERE c.name = 'kbli_unified'
    GROUP BY c.name
""")
result = cursor.fetchone()
if result:
    print(f"{result[0]}: {result[1]} documents")
else:
    print("kbli_unified: NOT FOUND")
conn.close()
