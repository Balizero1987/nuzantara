// ZANTARA Frontend Integrity System v3.1
// Display transparency e verifica fonti in real-time

class ZANTARAIntegrityLayer {
    constructor() {
        this.confidence_threshold = 0.85;
        this.source_display = new SourceDisplayManager();
        this.team_confidence = new TeamConfidenceEngine();
    }

    // 1. TEAM CONFIDENCE DISPLAY
    displayTeamKnowledge(query, response) {
        const team_confidence = this.calculateTeamConfidence(response);

        return {
            header: "🏢 Team Bali Zero Knowledge",
            confidence_bar: this._createConfidenceBar(team_confidence),
            team_members: this._extractTeamMembers(response),
            disclaimer: team_confidence < 0.9 ?
                "⚠️ Team knowledge database being updated" :
                "✅ Team information verified",
            last_sync: this._getLastSyncTime()
        };
    }

    // 2. SOURCE VERIFICATION DISPLAY
    displaySourceVerification(sources) {
        const verified_sources = sources.map(source => ({
            name: source.name,
            tier: source.tier,
            verified: this._verifySourceExistence(source),
            url: source.url || "🔗 Check source",
            confidence: this._calculateSourceConfidence(source)
        }));

        return {
            header: "📚 Source Verification",
            sources: verified_sources,
            overall_confidence: this._calculateOverallConfidence(verified_sources)
        };
    }

    // 3. INTEGRITY SCORE
    calculateIntegrityScore(response) {
        const team_score = this.team_confidence.calculate(response);
        const source_score = this._calculateSourceReliability(response);
        const consistency_score = this._checkResponseConsistency(response);

        return {
            overall: (team_score + source_score + consistency_score) / 3,
            breakdown: {
                team_knowledge: team_score,
                source_reliability: source_score,
                response_consistency: consistency_score
            },
            status: this._getIntegrityStatus((team_score + source_score + consistency_score) / 3)
        };
    }

    // Metodi interni
    _createConfidenceBar(score) {
        const percentage = Math.round(score * 100);
        const color = score > 0.9 ? "🟢" : score > 0.7 ? "🟡" : "🔴";
        return `${color} ${percentage}% Confidence`;
    }

    _extractTeamMembers(response) {
        // Estrae membri team menzionati nella risposta
        const team_pattern = /\b(ZERO|RINA|VERONIKA|OLENA|ANGEL|KADEK|FAISHA|SAHIRA|KRISNA|ANTON|VINO)\b/g;
        const found = response.match(team_pattern) || [];
        return [...new Set(found)]; // Remove duplicates
    }

    _verifySourceExistence(source) {
        // Verifica automatica esistenza fonte
        const verified_sources = {
            "government.go.id": true,
            "bkpm.go.id": true,
            "kemenkumham.go.id": true,
            "oss.go.id": true,
            "bps.go.id": true
        };

        return verified_sources[source.domain] || false;
    }

    _calculateSourceConfidence(source) {
        if (source.tier === "T1" && this._verifySourceExistence(source)) return 0.95;
        if (source.tier === "T2" && source.url) return 0.85;
        if (source.tier === "T3") return 0.70;
        return 0.50; // Fonti non verificate
    }

    _getIntegrityStatus(score) {
        if (score > 0.9) return "🟢 EXCELLENT";
        if (score > 0.8) return "🟡 GOOD";
        if (score > 0.7) return "🟠 ACCEPTABLE";
        return "🔴 NEEDS IMPROVEMENT";
    }
}

// Frontend Display Integration
class FrontendIntegrityDisplay {
    constructor() {
        this.integrity = new ZANTARAIntegrityLayer();
    }

    renderIntegrityPanel(response) {
        const integrity_score = this.integrity.calculateIntegrityScore(response);
        const team_info = this.integrity.displayTeamKnowledge("", response);
        const source_info = this.integrity.displaySourceVerification(response.sources || []);

        return `
        <div class="zantara-integrity-panel">
            <div class="integrity-score">
                <h3>${integrity_score.status}</h3>
                <div class="score-breakdown">
                    <div>Team Knowledge: ${this._createProgressBar(integrity_score.breakdown.team_knowledge)}</div>
                    <div>Source Reliability: ${this._createProgressBar(integrity_score.breakdown.source_reliability)}</div>
                    <div>Response Consistency: ${this._createProgressBar(integrity_score.breakdown.response_consistency)}</div>
                </div>
            </div>

            <div class="team-confidence">
                <h4>${team_info.header}</h4>
                <div>${team_info.confidence_bar}</div>
                <div class="team-members">Members mentioned: ${team_info.team_members.join(", ")}</div>
                <div class="disclaimer">${team_info.disclaimer}</div>
                <div class="last-sync">Last sync: ${team_info.last_sync}</div>
            </div>

            <div class="source-verification">
                <h4>${source_info.header}</h4>
                <div class="sources-list">
                    ${source_info.sources.map(src => `
                        <div class="source-item ${src.verified ? 'verified' : 'unverified'}">
                            <span class="tier-badge">${src.tier}</span>
                            <span class="source-name">${src.name}</span>
                            <span class="confidence">${Math.round(src.confidence * 100)}%</span>
                            ${src.url ? `<a href="${src.url}" target="_blank">🔗</a>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        `;
    }

    _createProgressBar(score) {
        const percentage = Math.round(score * 100);
        const color = score > 0.8 ? "green" : score > 0.6 ? "orange" : "red";
        return `
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentage}%; background-color: ${color}"></div>
            <span class="progress-text">${percentage}%</span>
        </div>
        `;
    }
}

// Export per integrazione frontend
window.ZANTARAIntegrity = {
    FrontendIntegrityDisplay,
    ZANTARAIntegrityLayer
};