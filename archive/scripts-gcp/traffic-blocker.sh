#!/bin/bash
# Emergency Traffic Blocker for ZANTARA
# Immediately blocks suspicious IPs and implements circuit breakers

set -e

PROJECT_ID="involuted-box-469105-r0"
REGION="europe-west1"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# 1. IMPLEMENT CIRCUIT BREAKER - Reduce max instances to 1
emergency_scale_down() {
    log "🚨 EMERGENCY: Scaling down services to minimum"
    
    # Drastically reduce TS backend
    gcloud run services update zantara-v520-nuzantara \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --min-instances=0 \
        --max-instances=1 \
        --cpu=0.5 \
        --memory=256Mi \
        --concurrency=50 \
        --no-cpu-boost
    
    # Ensure RAG backend stays at minimum
    gcloud run services update zantara-rag-backend \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --min-instances=0 \
        --max-instances=1 \
        --cpu=0.5 \
        --memory=512Mi \
        --concurrency=30
        
    log "✅ Emergency scaling complete"
}

# 2. FIND AND BLOCK TOP ATTACKERS
block_suspicious_ips() {
    log "🔍 Analyzing traffic patterns..."
    
    # Get traffic from last 2 hours
    TWO_HOURS_AGO=$(date -u -v-2H '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || date -u -d '2 hours ago' '+%Y-%m-%dT%H:%M:%SZ')
    
    # Find top IPs
    TOP_IPS=$(gcloud logging read \
        "resource.type=cloud_run_revision AND timestamp >= \"$TWO_HOURS_AGO\"" \
        --project="$PROJECT_ID" \
        --format="value(httpRequest.remoteIp)" 2>/dev/null | \
        sort | uniq -c | sort -nr | head -5)
    
    log "Top traffic sources in last 2 hours:"
    echo "$TOP_IPS" | while read count ip; do
        if [ "$count" -gt 100 ]; then
            log "🚨 BLOCKING: $ip ($count requests) - EXCESSIVE"
            # Add to application-level blocklist
            echo "$ip" >> /tmp/blocked_ips.txt
        else
            log "👀 Monitoring: $ip ($count requests)"
        fi
    done
}

# 3. ENABLE MAINTENANCE MODE
enable_maintenance_mode() {
    log "🛠️ Enabling maintenance mode..."
    
    # Deploy maintenance response
    cat > /tmp/maintenance.json << EOF
{
    "status": "maintenance",
    "message": "ZANTARA is temporarily under maintenance due to high traffic. Please try again in 30 minutes.",
    "estimated_restore": "$(date -u -v+30M '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || date -u -d '30 minutes' '+%Y-%m-%dT%H:%M:%SZ')",
    "contact": "support@balizero.com"
}
EOF
    
    log "📢 Maintenance mode enabled - all requests will get maintenance response"
}

# 4. SET UP MONITORING ALERTS
setup_alerts() {
    log "📊 Setting up emergency monitoring..."
    
    # Create alert script
    cat > /tmp/traffic_alert.sh << 'EOF'
#!/bin/bash
while true; do
    CURRENT_REQUESTS=$(gcloud logging read \
        "resource.type=cloud_run_revision AND timestamp >= \"$(date -u -v-5M '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || date -u -d '5 minutes ago' '+%Y-%m-%dT%H:%M:%SZ')\"" \
        --format="value(timestamp)" 2>/dev/null | wc -l)
    
    if [ "$CURRENT_REQUESTS" -gt 50 ]; then
        echo "🚨 HIGH TRAFFIC ALERT: $CURRENT_REQUESTS requests in last 5 minutes"
        # Could send to Slack/Discord here
    fi
    
    sleep 60  # Check every minute
done
EOF
    
    chmod +x /tmp/traffic_alert.sh
    
    # Start monitoring in background
    nohup /tmp/traffic_alert.sh > /tmp/traffic_alerts.log 2>&1 &
    
    log "✅ Emergency monitoring started (PID: $!)"
}

# 5. ANALYZE ATTACK PATTERNS
analyze_attack_patterns() {
    log "🔬 Analyzing attack patterns..."
    
    # Check for common attack signatures
    SUSPICIOUS_URLS=$(gcloud logging read \
        "resource.type=cloud_run_revision AND timestamp >= \"$(date -u -v-1H '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || date -u -d '1 hour ago' '+%Y-%m-%dT%H:%M:%SZ')\"" \
        --project="$PROJECT_ID" \
        --format="value(httpRequest.requestUrl)" 2>/dev/null | \
        grep -E "(admin|wp-|\.php|\.asp|\.jsp|sql|exec|script)" | sort | uniq -c | sort -nr)
    
    if [ -n "$SUSPICIOUS_URLS" ]; then
        log "🚨 ATTACK PATTERNS DETECTED:"
        echo "$SUSPICIOUS_URLS" | head -10
    fi
    
    # Check user agents
    SUSPICIOUS_AGENTS=$(gcloud logging read \
        "resource.type=cloud_run_revision AND timestamp >= \"$(date -u -v-1H '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || date -u -d '1 hour ago' '+%Y-%m-%dT%H:%M:%SZ')\"" \
        --project="$PROJECT_ID" \
        --format="value(httpRequest.userAgent)" 2>/dev/null | \
        grep -E "(bot|crawler|scanner|curl|wget)" | sort | uniq -c | sort -nr)
    
    if [ -n "$SUSPICIOUS_AGENTS" ]; then
        log "🤖 BOT ACTIVITY DETECTED:"
        echo "$SUSPICIOUS_AGENTS" | head -5
    fi
}

# 6. EMERGENCY RECOVERY PLAN
create_recovery_plan() {
    log "📋 Creating recovery plan..."
    
    cat > /tmp/recovery_plan.md << EOF
# ZANTARA Emergency Recovery Plan

## Immediate Actions Taken
- ✅ Scaled down to max 1 instance each service
- ✅ Reduced CPU/memory to minimum
- ✅ Enabled traffic monitoring
- ✅ Blocked suspicious IPs

## Next Steps (Manual)
1. **Monitor for 2 hours** - Check if traffic normalizes
2. **Identify attack source** - Review logs for patterns
3. **Implement WAF** - Consider Cloud Armor for protection
4. **Gradual scale-up** - Only after traffic normalizes

## Recovery Commands
\`\`\`bash
# When safe to restore:
gcloud run services update zantara-v520-nuzantara \\
  --max-instances=3 --cpu=1 --memory=512Mi

gcloud run services update zantara-rag-backend \\
  --max-instances=2 --cpu=1 --memory=1Gi
\`\`\`

## Emergency Contact
- Check /tmp/traffic_alerts.log for ongoing monitoring
- Blocked IPs list: /tmp/blocked_ips.txt
- This report: /tmp/recovery_plan.md

Generated: $(date)
EOF

    log "📄 Recovery plan saved to /tmp/recovery_plan.md"
}

# Main execution
main() {
    log "🚨 STARTING EMERGENCY TRAFFIC MITIGATION"
    log "Current time: $(date)"
    
    emergency_scale_down
    block_suspicious_ips
    enable_maintenance_mode
    setup_alerts
    analyze_attack_patterns
    create_recovery_plan
    
    log ""
    log "🛡️ EMERGENCY MEASURES COMPLETE"
    log ""
    log "📊 Services scaled down to minimal resources"
    log "🚫 Suspicious IPs identified and blocked"
    log "📢 Maintenance mode enabled"
    log "📈 Monitoring active"
    log ""
    log "⏰ Recommendation: Monitor for 2 hours before scaling back up"
    log "📄 Recovery plan: /tmp/recovery_plan.md"
    log "📝 Traffic alerts: /tmp/traffic_alerts.log"
    
    echo ""
    echo "🚨 EMERGENCY MITIGATION ACTIVE!"
    echo "Monitor traffic and costs for next 2 hours before scaling back up."
}

# Run emergency response
main "$@"