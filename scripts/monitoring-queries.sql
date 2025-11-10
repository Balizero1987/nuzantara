--------------------------------------------------------------------------------
-- NUZANTARA - AI AGENTS MONITORING QUERIES
-- Query SQL per monitoraggio metriche e performance degli agenti AI
--------------------------------------------------------------------------------

-- ============================================================================
-- 1. CONVERSATION TRAINER METRICS
-- ============================================================================

-- 1.1 Prompt Improvements Performance
-- Mostra l'efficacia dei miglioramenti automatici al prompt
SELECT
    DATE(created_at) as improvement_date,
    COUNT(*) as improvements_count,
    AVG(avg_rating_before) as avg_rating_before,
    AVG(avg_rating_after) as avg_rating_after,
    AVG(avg_rating_after - avg_rating_before) as rating_improvement
FROM prompt_improvements
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY improvement_date DESC;

-- 1.2 Top Rated Conversations (Source Data)
-- Identifica le conversazioni che alimentano il trainer
SELECT
    conversation_id,
    rating,
    client_feedback,
    LENGTH(messages::text) as conversation_length,
    created_at
FROM conversations
WHERE rating >= 4
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY rating DESC, created_at DESC
LIMIT 50;

-- 1.3 Prompt Version Performance
-- Compara performance tra versioni del prompt
WITH prompt_versions AS (
    SELECT
        prompt_version,
        COUNT(*) as conversation_count,
        AVG(rating) as avg_rating,
        AVG(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) * 100 as high_rating_pct,
        MIN(created_at) as version_start_date,
        MAX(created_at) as version_end_date
    FROM conversations
    WHERE prompt_version IS NOT NULL
      AND created_at >= NOW() - INTERVAL '180 days'
    GROUP BY prompt_version
)
SELECT
    prompt_version,
    conversation_count,
    ROUND(avg_rating::numeric, 2) as avg_rating,
    ROUND(high_rating_pct::numeric, 1) as high_rating_pct,
    version_start_date,
    version_end_date,
    EXTRACT(DAYS FROM version_end_date - version_start_date) as days_active
FROM prompt_versions
ORDER BY version_start_date DESC;


-- ============================================================================
-- 2. CLIENT VALUE PREDICTOR METRICS
-- ============================================================================

-- 2.1 Client Segmentation Overview
-- Distribuzione clienti per segmento e rischio
SELECT
    metadata->>'segment' as segment,
    metadata->>'risk_level' as risk_level,
    COUNT(*) as client_count,
    AVG((metadata->>'ltv_score')::float) as avg_ltv_score,
    AVG(EXTRACT(DAYS FROM NOW() - last_interaction)) as avg_days_inactive
FROM crm_clients
WHERE metadata ? 'ltv_score'
  AND status = 'active'
GROUP BY metadata->>'segment', metadata->>'risk_level'
ORDER BY
    CASE metadata->>'segment'
        WHEN 'VIP' THEN 1
        WHEN 'HIGH_VALUE' THEN 2
        WHEN 'MEDIUM_VALUE' THEN 3
        ELSE 4
    END;

-- 2.2 Nurturing Campaign Effectiveness
-- Efficacia delle campagne WhatsApp automatiche
WITH nurturing_stats AS (
    SELECT
        client_id,
        COUNT(*) as nurture_messages_sent,
        MIN(created_at) as first_nurture,
        MAX(created_at) as last_nurture,
        -- Count responses within 48h of nurture
        COUNT(CASE
            WHEN EXISTS (
                SELECT 1 FROM crm_interactions i2
                WHERE i2.client_id = crm_interactions.client_id
                  AND i2.type = 'inbound_message'
                  AND i2.created_at BETWEEN crm_interactions.created_at AND crm_interactions.created_at + INTERVAL '48 hours'
            ) THEN 1
        END) as responses_received
    FROM crm_interactions
    WHERE type = 'whatsapp_nurture'
      AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY client_id
)
SELECT
    COUNT(DISTINCT ns.client_id) as clients_nurtured,
    SUM(nurture_messages_sent) as total_messages,
    AVG(nurture_messages_sent) as avg_messages_per_client,
    SUM(responses_received) as total_responses,
    ROUND(AVG(CASE WHEN nurture_messages_sent > 0 THEN responses_received::float / nurture_messages_sent * 100 ELSE 0 END), 1) as response_rate_pct
FROM nurturing_stats ns;

-- 2.3 LTV Score Distribution
-- Distribuzione dei punteggi LTV
SELECT
    CASE
        WHEN (metadata->>'ltv_score')::float >= 80 THEN '80-100 (VIP)'
        WHEN (metadata->>'ltv_score')::float >= 60 THEN '60-79 (HIGH)'
        WHEN (metadata->>'ltv_score')::float >= 40 THEN '40-59 (MEDIUM)'
        ELSE '0-39 (LOW)'
    END as ltv_bracket,
    COUNT(*) as client_count,
    AVG((metadata->>'ltv_score')::float) as avg_ltv,
    MIN((metadata->>'ltv_score')::float) as min_ltv,
    MAX((metadata->>'ltv_score')::float) as max_ltv
FROM crm_clients
WHERE metadata ? 'ltv_score'
  AND status = 'active'
GROUP BY ltv_bracket
ORDER BY ltv_bracket DESC;

-- 2.4 High-Risk VIP Clients (Action Required)
-- Clienti VIP ad alto rischio che necessitano attenzione
SELECT
    c.id,
    c.name,
    c.email,
    c.phone,
    (c.metadata->>'ltv_score')::float as ltv_score,
    c.metadata->>'risk_level' as risk_level,
    EXTRACT(DAYS FROM NOW() - c.last_interaction) as days_inactive,
    COUNT(DISTINCT i.id) as total_interactions,
    MAX(i.created_at) as last_contact_attempt
FROM crm_clients c
LEFT JOIN crm_interactions i ON c.id = i.client_id
WHERE c.metadata->>'segment' = 'VIP'
  AND c.metadata->>'risk_level' = 'HIGH_RISK'
  AND c.status = 'active'
GROUP BY c.id, c.name, c.email, c.phone, c.metadata, c.last_interaction
ORDER BY (c.metadata->>'ltv_score')::float DESC, days_inactive DESC;


-- ============================================================================
-- 3. KNOWLEDGE GRAPH METRICS
-- ============================================================================

-- 3.1 Knowledge Graph Growth
-- Crescita del grafo nel tempo
SELECT
    DATE_TRUNC('week', created_at) as week,
    entity_type,
    COUNT(*) as new_entities
FROM kg_entities
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('week', created_at), entity_type
ORDER BY week DESC, new_entities DESC;

-- 3.2 Most Connected Entities (Hubs)
-- Entità più connesse nel grafo (hub di conoscenza)
SELECT
    e.entity_name,
    e.entity_type,
    COUNT(DISTINCT r.id) as connection_count,
    COUNT(DISTINCT CASE WHEN r.relationship_type = 'relates_to' THEN r.id END) as relates_to,
    COUNT(DISTINCT CASE WHEN r.relationship_type = 'requires' THEN r.id END) as requires,
    COUNT(DISTINCT CASE WHEN r.relationship_type = 'conflicts_with' THEN r.id END) as conflicts
FROM kg_entities e
LEFT JOIN kg_relationships r ON (e.id = r.entity_from_id OR e.id = r.entity_to_id)
GROUP BY e.id, e.entity_name, e.entity_type
HAVING COUNT(DISTINCT r.id) > 0
ORDER BY connection_count DESC
LIMIT 50;

-- 3.3 Entity Mention Frequency
-- Entità più menzionate nelle conversazioni
SELECT
    e.entity_name,
    e.entity_type,
    COUNT(DISTINCT m.id) as mention_count,
    COUNT(DISTINCT m.source_id) as unique_sources,
    MAX(m.created_at) as last_mentioned
FROM kg_entities e
JOIN kg_entity_mentions m ON e.id = m.entity_id
WHERE m.created_at >= NOW() - INTERVAL '30 days'
GROUP BY e.id, e.entity_name, e.entity_type
ORDER BY mention_count DESC
LIMIT 30;

-- 3.4 Relationship Type Distribution
-- Distribuzione dei tipi di relazioni nel grafo
SELECT
    relationship_type,
    COUNT(*) as relationship_count,
    AVG(strength) as avg_strength,
    COUNT(DISTINCT entity_from_id) as unique_sources,
    COUNT(DISTINCT entity_to_id) as unique_targets
FROM kg_relationships
GROUP BY relationship_type
ORDER BY relationship_count DESC;

-- 3.5 Knowledge Graph Coverage by Topic
-- Copertura del grafo per argomento
SELECT
    entity_type,
    COUNT(DISTINCT entity_name) as unique_entities,
    COUNT(DISTINCT m.source_id) as sources_covered,
    AVG(connection_count) as avg_connections
FROM kg_entities e
LEFT JOIN kg_entity_mentions m ON e.id = m.entity_id
LEFT JOIN (
    SELECT entity_from_id as entity_id, COUNT(*) as connection_count
    FROM kg_relationships
    GROUP BY entity_from_id
) r ON e.id = r.entity_id
GROUP BY entity_type
ORDER BY unique_entities DESC;


-- ============================================================================
-- 4. COMPLIANCE MONITOR METRICS
-- ============================================================================

-- 4.1 Active Compliance Items by Type
-- Overview degli item di compliance attivi
SELECT
    compliance_type,
    COUNT(*) as total_items,
    COUNT(CASE WHEN deadline >= NOW() + INTERVAL '60 days' THEN 1 END) as safe,
    COUNT(CASE WHEN deadline BETWEEN NOW() + INTERVAL '30 days' AND NOW() + INTERVAL '60 days' THEN 1 END) as warning,
    COUNT(CASE WHEN deadline BETWEEN NOW() + INTERVAL '7 days' AND NOW() + INTERVAL '30 days' THEN 1 END) as urgent,
    COUNT(CASE WHEN deadline < NOW() + INTERVAL '7 days' THEN 1 END) as critical,
    COUNT(CASE WHEN deadline < NOW() THEN 1 END) as overdue
FROM compliance_items
WHERE status = 'active'
GROUP BY compliance_type
ORDER BY critical DESC, urgent DESC;

-- 4.2 Compliance Alert Effectiveness
-- Efficacia degli alert automatici
SELECT
    compliance_type,
    severity,
    COUNT(*) as alerts_sent,
    COUNT(CASE WHEN resolved THEN 1 END) as resolved_count,
    ROUND(AVG(CASE WHEN resolved THEN 1 ELSE 0 END) * 100, 1) as resolution_rate_pct,
    AVG(EXTRACT(DAYS FROM resolved_at - created_at)) as avg_days_to_resolve
FROM compliance_alerts
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY compliance_type, severity
ORDER BY
    CASE severity
        WHEN 'CRITICAL' THEN 1
        WHEN 'URGENT' THEN 2
        WHEN 'WARNING' THEN 3
        ELSE 4
    END,
    resolution_rate_pct DESC;

-- 4.3 Clients with Multiple Upcoming Deadlines
-- Clienti con più scadenze imminenti
SELECT
    c.id,
    c.name,
    c.email,
    COUNT(DISTINCT ci.id) as upcoming_deadlines,
    STRING_AGG(DISTINCT ci.compliance_type, ', ') as compliance_types,
    MIN(ci.deadline) as nearest_deadline,
    EXTRACT(DAYS FROM MIN(ci.deadline) - NOW()) as days_to_nearest_deadline
FROM crm_clients c
JOIN compliance_items ci ON c.id = ci.client_id
WHERE ci.status = 'active'
  AND ci.deadline <= NOW() + INTERVAL '30 days'
GROUP BY c.id, c.name, c.email
HAVING COUNT(DISTINCT ci.id) > 1
ORDER BY days_to_nearest_deadline, upcoming_deadlines DESC;

-- 4.4 Compliance Status by Client Segment
-- Status compliance per segmento cliente
SELECT
    c.metadata->>'segment' as client_segment,
    COUNT(DISTINCT c.id) as clients_in_segment,
    COUNT(DISTINCT ci.id) as compliance_items,
    AVG(CASE WHEN ci.deadline >= NOW() THEN 1 ELSE 0 END) * 100 as compliance_rate_pct,
    COUNT(DISTINCT CASE WHEN ci.deadline < NOW() THEN ci.id END) as overdue_items
FROM crm_clients c
LEFT JOIN compliance_items ci ON c.id = ci.client_id AND ci.status = 'active'
WHERE c.status = 'active'
  AND c.metadata ? 'segment'
GROUP BY c.metadata->>'segment'
ORDER BY
    CASE c.metadata->>'segment'
        WHEN 'VIP' THEN 1
        WHEN 'HIGH_VALUE' THEN 2
        WHEN 'MEDIUM_VALUE' THEN 3
        ELSE 4
    END;


-- ============================================================================
-- 5. CLIENT JOURNEY METRICS
-- ============================================================================

-- 5.1 Journey Completion Rates
-- Tassi di completamento per template
SELECT
    template,
    COUNT(*) as total_journeys,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
    COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked,
    ROUND(AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100, 1) as completion_rate_pct,
    AVG(CASE WHEN completed_at IS NOT NULL THEN EXTRACT(DAYS FROM completed_at - created_at) END) as avg_days_to_complete
FROM client_journeys
WHERE created_at >= NOW() - INTERVAL '180 days'
GROUP BY template
ORDER BY total_journeys DESC;

-- 5.2 Journey Step Bottlenecks
-- Step con maggior tempo di completamento (bottleneck)
SELECT
    j.template,
    s.step_name,
    s.step_order,
    COUNT(*) as times_reached,
    COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as times_completed,
    ROUND(AVG(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) * 100, 1) as completion_rate_pct,
    AVG(CASE WHEN s.completed_at IS NOT NULL THEN EXTRACT(DAYS FROM s.completed_at - s.started_at) END) as avg_days_on_step
FROM client_journeys j
JOIN journey_steps s ON j.id = s.journey_id
WHERE j.created_at >= NOW() - INTERVAL '90 days'
GROUP BY j.template, s.step_name, s.step_order
HAVING COUNT(*) >= 3
ORDER BY j.template, s.step_order;

-- 5.3 Active Journeys by Client
-- Journey attivi per cliente
SELECT
    c.name,
    c.email,
    j.template,
    j.status,
    j.current_step,
    EXTRACT(DAYS FROM NOW() - j.last_updated) as days_stale,
    j.created_at
FROM client_journeys j
JOIN crm_clients c ON j.client_id = c.id
WHERE j.status IN ('in_progress', 'blocked')
ORDER BY days_stale DESC, c.name;


-- ============================================================================
-- 6. AUTONOMOUS RESEARCH METRICS
-- ============================================================================

-- 6.1 Research Query Performance
-- Performance delle ricerche autonome
SELECT
    DATE(created_at) as research_date,
    COUNT(*) as total_queries,
    AVG(iterations_count) as avg_iterations,
    AVG(confidence_score) as avg_final_confidence,
    AVG(total_duration_seconds) as avg_duration_seconds,
    COUNT(CASE WHEN confidence_score >= 0.7 THEN 1 END) as high_confidence_count
FROM autonomous_research_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY research_date DESC;

-- 6.2 Most Queried Topics
-- Topic più ricercati
SELECT
    LOWER(TRIM(topic)) as topic,
    COUNT(*) as query_count,
    AVG(confidence_score) as avg_confidence,
    AVG(iterations_count) as avg_iterations
FROM autonomous_research_logs,
     LATERAL unnest(string_to_array(query_text, ' ')) as topic
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND LENGTH(topic) > 4  -- Filter out short words
GROUP BY LOWER(TRIM(topic))
ORDER BY query_count DESC
LIMIT 30;


-- ============================================================================
-- 7. GENERAL AI AGENTS PERFORMANCE
-- ============================================================================

-- 7.1 Agent Execution Summary (Last 30 Days)
-- Sommario esecuzioni agenti
SELECT
    agent_name,
    COUNT(*) as total_executions,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
    ROUND(AVG(CASE WHEN status = 'success' THEN 1 ELSE 0 END) * 100, 1) as success_rate_pct,
    AVG(duration_seconds) as avg_duration_seconds,
    MAX(executed_at) as last_execution
FROM agent_execution_logs
WHERE executed_at >= NOW() - INTERVAL '30 days'
GROUP BY agent_name
ORDER BY total_executions DESC;

-- 7.2 Agent Errors and Failures
-- Errori degli agenti per debugging
SELECT
    agent_name,
    error_type,
    COUNT(*) as error_count,
    MAX(executed_at) as last_occurrence,
    STRING_AGG(DISTINCT error_message, ' | ') as sample_messages
FROM agent_execution_logs
WHERE status = 'failed'
  AND executed_at >= NOW() - INTERVAL '7 days'
GROUP BY agent_name, error_type
ORDER BY error_count DESC, last_occurrence DESC;

-- 7.3 Daily Agent Activity Heatmap
-- Heatmap attività agenti per ora del giorno
SELECT
    agent_name,
    EXTRACT(HOUR FROM executed_at) as hour_of_day,
    COUNT(*) as execution_count,
    AVG(duration_seconds) as avg_duration
FROM agent_execution_logs
WHERE executed_at >= NOW() - INTERVAL '7 days'
GROUP BY agent_name, EXTRACT(HOUR FROM executed_at)
ORDER BY agent_name, hour_of_day;

-- 7.4 Cost Tracking (AI API Usage)
-- Tracking costi chiamate AI
SELECT
    DATE(created_at) as usage_date,
    model_name,
    COUNT(*) as api_calls,
    SUM(tokens_used) as total_tokens,
    SUM(cost_usd) as total_cost_usd,
    AVG(response_time_ms) as avg_response_time_ms
FROM ai_api_usage_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), model_name
ORDER BY usage_date DESC, total_cost_usd DESC;


-- ============================================================================
-- 8. CONVERSATION QUALITY METRICS
-- ============================================================================

-- 8.1 Conversation Rating Trends
-- Trend delle valutazioni conversazioni
SELECT
    DATE_TRUNC('week', created_at) as week,
    COUNT(*) as total_conversations,
    AVG(rating) as avg_rating,
    COUNT(CASE WHEN rating >= 4 THEN 1 END) as high_rated_count,
    ROUND(AVG(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) * 100, 1) as high_rating_pct,
    AVG(LENGTH(messages::text)) as avg_conversation_length
FROM conversations
WHERE created_at >= NOW() - INTERVAL '90 days'
  AND rating IS NOT NULL
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week DESC;

-- 8.2 Sentiment Analysis Over Time
-- Analisi sentiment nel tempo
SELECT
    DATE(created_at) as conversation_date,
    AVG(sentiment_score) as avg_sentiment,
    COUNT(CASE WHEN sentiment_score > 0.5 THEN 1 END) as positive_count,
    COUNT(CASE WHEN sentiment_score < -0.5 THEN 1 END) as negative_count,
    COUNT(*) as total_conversations
FROM conversations
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND sentiment_score IS NOT NULL
GROUP BY DATE(created_at)
ORDER BY conversation_date DESC;


-- ============================================================================
-- 9. REFACTORING & TEST GENERATION METRICS (TypeScript Agents)
-- ============================================================================

-- 9.1 Code Refactoring Activity
-- Attività di refactoring automatico
SELECT
    DATE(timestamp) as refactoring_date,
    COUNT(*) as files_refactored,
    AVG(complexity_before) as avg_complexity_before,
    AVG(complexity_after) as avg_complexity_after,
    AVG(complexity_before - complexity_after) as avg_complexity_reduction,
    COUNT(CASE WHEN tests_passed THEN 1 END) as successful_refactors
FROM refactoring_history
WHERE timestamp >= NOW() - INTERVAL '90 days'
GROUP BY DATE(timestamp)
ORDER BY refactoring_date DESC;

-- 9.2 Test Coverage Growth
-- Crescita coverage test
SELECT
    DATE(timestamp) as test_gen_date,
    COUNT(*) as tests_generated,
    AVG(coverage_before) as avg_coverage_before,
    AVG(coverage_after) as avg_coverage_after,
    AVG(coverage_after - coverage_before) as avg_coverage_increase
FROM test_generation_history
WHERE timestamp >= NOW() - INTERVAL '90 days'
GROUP BY DATE(timestamp)
ORDER BY test_gen_date DESC;

-- 9.3 Files with Most Refactorings (Potential Issues)
-- File con più refactoring (potrebbero avere problemi)
SELECT
    file_path,
    COUNT(*) as refactoring_count,
    MAX(timestamp) as last_refactored,
    AVG(complexity_after) as avg_final_complexity,
    COUNT(CASE WHEN error_count > 0 THEN 1 END) as failed_attempts
FROM refactoring_history
WHERE timestamp >= NOW() - INTERVAL '180 days'
GROUP BY file_path
HAVING COUNT(*) >= 3
ORDER BY refactoring_count DESC, failed_attempts DESC
LIMIT 20;


-- ============================================================================
-- 10. EXECUTIVE DASHBOARD QUERY
-- ============================================================================

-- 10.1 Complete AI Agents Performance Dashboard
-- Dashboard completo performance agenti (SINGLE QUERY)
WITH agent_stats AS (
    SELECT
        COUNT(*) FILTER (WHERE agent_name = 'conversation_trainer') as trainer_executions,
        COUNT(*) FILTER (WHERE agent_name = 'client_value_predictor') as predictor_executions,
        COUNT(*) FILTER (WHERE agent_name = 'knowledge_graph_builder') as kg_executions,
        COUNT(*) FILTER (WHERE agent_name = 'compliance_monitor') as compliance_executions,
        AVG(duration_seconds) as avg_execution_time,
        COUNT(*) FILTER (WHERE status = 'failed') as total_failures
    FROM agent_execution_logs
    WHERE executed_at >= NOW() - INTERVAL '7 days'
),
client_stats AS (
    SELECT
        COUNT(*) as total_clients,
        COUNT(*) FILTER (WHERE metadata->>'segment' = 'VIP') as vip_clients,
        COUNT(*) FILTER (WHERE metadata->>'risk_level' = 'HIGH_RISK') as high_risk_clients,
        AVG((metadata->>'ltv_score')::float) as avg_ltv_score
    FROM crm_clients
    WHERE status = 'active' AND metadata ? 'ltv_score'
),
conversation_stats AS (
    SELECT
        COUNT(*) as conversations_last_7d,
        AVG(rating) as avg_rating,
        COUNT(*) FILTER (WHERE rating >= 4) as high_rated_count
    FROM conversations
    WHERE created_at >= NOW() - INTERVAL '7 days'
),
compliance_stats AS (
    SELECT
        COUNT(*) as total_compliance_items,
        COUNT(*) FILTER (WHERE deadline < NOW() + INTERVAL '7 days') as critical_items,
        COUNT(*) FILTER (WHERE deadline < NOW()) as overdue_items
    FROM compliance_items
    WHERE status = 'active'
),
kg_stats AS (
    SELECT
        COUNT(*) as total_entities,
        COUNT(DISTINCT entity_type) as entity_types
    FROM kg_entities
)
SELECT
    -- Agent Execution Stats
    a.trainer_executions,
    a.predictor_executions,
    a.kg_executions,
    a.compliance_executions,
    ROUND(a.avg_execution_time, 2) as avg_agent_execution_seconds,
    a.total_failures as agent_failures_7d,

    -- Client Stats
    cl.total_clients,
    cl.vip_clients,
    cl.high_risk_clients,
    ROUND(cl.avg_ltv_score, 2) as avg_ltv_score,

    -- Conversation Stats
    co.conversations_last_7d,
    ROUND(co.avg_rating, 2) as avg_conversation_rating,
    co.high_rated_count,
    ROUND(co.high_rated_count::float / NULLIF(co.conversations_last_7d, 0) * 100, 1) as high_rating_pct,

    -- Compliance Stats
    cm.total_compliance_items,
    cm.critical_items,
    cm.overdue_items,

    -- Knowledge Graph Stats
    kg.total_entities,
    kg.entity_types
FROM agent_stats a
CROSS JOIN client_stats cl
CROSS JOIN conversation_stats co
CROSS JOIN compliance_stats cm
CROSS JOIN kg_stats kg;


-- ============================================================================
-- USAGE NOTES
-- ============================================================================
--
-- To execute these queries:
--
-- 1. Using psql:
--    psql $DATABASE_URL -f scripts/monitoring-queries.sql
--
-- 2. Individual query:
--    psql $DATABASE_URL -c "SELECT * FROM ... LIMIT 10"
--
-- 3. Export to CSV:
--    psql $DATABASE_URL -c "COPY (SELECT * FROM ...) TO STDOUT WITH CSV HEADER" > output.csv
--
-- 4. Pretty print in terminal:
--    psql $DATABASE_URL -x -c "SELECT * FROM ..."
--
-- 5. Create monitoring dashboard:
--    Run query 10.1 (Executive Dashboard) in cron job and send to Slack/Email
--
-- ============================================================================
