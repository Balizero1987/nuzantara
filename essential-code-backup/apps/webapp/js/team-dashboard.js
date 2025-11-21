/* eslint-disable no-undef, no-console */
/**
 * ZANTARA Team Dashboard
 * Displays team analytics and performance metrics
 */

document.addEventListener('DOMContentLoaded', async () => {
    const userContext = window.UserContext;

    if (!userContext || !userContext.user) {
        window.location.href = '/login.html';
        return;
    }

    const teamAnalyticsClient = new window.TeamAnalyticsClient();
    const userEmail = userContext.user.email;
    const teamId = userContext.user.team_id || 'balizero';

    // Load all analytics
    await loadAllAnalytics();

    // Refresh button
    document.getElementById('refreshBtn')?.addEventListener('click', loadAllAnalytics);

    // Trends weeks selector
    document.getElementById('trendsWeeks')?.addEventListener('change', (e) => {
        loadPerformanceTrends(parseInt(e.target.value));
    });

    async function loadAllAnalytics() {
        await Promise.all([
            loadPerformanceTrends(4),
            loadSkillMatrix(),
            loadWorkloadDistribution(),
            loadCollaboration(),
            loadResponseTimes(),
            loadKnowledgeSharing()
        ]);
    }

    async function loadPerformanceTrends(weeks = 4) {
        const container = document.getElementById('performanceTrends');
        try {
            const data = await teamAnalyticsClient.getPerformanceTrends(userEmail, weeks);

            if (data && data.trends) {
                container.innerHTML = `
          <div class="metric-grid">
            <div class="metric-item">
              <div class="metric-value">${data.trends.avg_response_time || 'N/A'}</div>
              <div class="metric-label">Avg Response Time</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">${data.trends.total_interactions || 0}</div>
              <div class="metric-label">Total Interactions</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">${data.trends.satisfaction_score || 'N/A'}</div>
              <div class="metric-label">Satisfaction Score</div>
            </div>
          </div>
        `;
            } else {
                container.innerHTML = '<p style="color: rgba(255,255,255,0.6);">No data available</p>';
            }
        } catch (error) {
            console.error('Failed to load performance trends:', error);
            container.innerHTML = '<p style="color: #f44336;">Failed to load data</p>';
        }
    }

    async function loadSkillMatrix() {
        const container = document.getElementById('skillMatrix');
        try {
            const data = await teamAnalyticsClient.getSkillGaps(userEmail);

            if (data && data.skills) {
                container.innerHTML = data.skills.map(skill => `
          <div class="skill-bar">
            <div class="skill-name">
              <span>${skill.name}</span>
              <span>${skill.level}%</span>
            </div>
            <div class="skill-progress">
              <div class="skill-progress-bar" style="width: ${skill.level}%"></div>
            </div>
          </div>
        `).join('');
            } else {
                container.innerHTML = '<p style="color: rgba(255,255,255,0.6);">No data available</p>';
            }
        } catch (error) {
            console.error('Failed to load skill matrix:', error);
            container.innerHTML = '<p style="color: #f44336;">Failed to load data</p>';
        }
    }

    async function loadWorkloadDistribution() {
        const container = document.getElementById('workloadDist');
        try {
            const data = await teamAnalyticsClient.getWorkloadDistribution(teamId);

            if (data && data.members) {
                container.innerHTML = data.members.map(member => `
          <div class="team-member">
            <div class="member-avatar">${member.name.charAt(0)}</div>
            <div class="member-info">
              <div class="member-name">${member.name}</div>
              <div class="member-role">${member.role}</div>
            </div>
            <div class="member-stat">${member.workload || 0}</div>
          </div>
        `).join('');
            } else {
                container.innerHTML = '<p style="color: rgba(255,255,255,0.6);">No data available</p>';
            }
        } catch (error) {
            console.error('Failed to load workload distribution:', error);
            container.innerHTML = '<p style="color: #f44336;">Failed to load data</p>';
        }
    }

    async function loadCollaboration() {
        const container = document.getElementById('collaboration');
        try {
            const data = await teamAnalyticsClient.getCollaborationPatterns(teamId);

            if (data && data.patterns) {
                container.innerHTML = `
          <div class="metric-grid">
            <div class="metric-item">
              <div class="metric-value">${data.patterns.total_collaborations || 0}</div>
              <div class="metric-label">Collaborations</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">${data.patterns.avg_team_size || 0}</div>
              <div class="metric-label">Avg Team Size</div>
            </div>
          </div>
        `;
            } else {
                container.innerHTML = '<p style="color: rgba(255,255,255,0.6);">No data available</p>';
            }
        } catch (error) {
            console.error('Failed to load collaboration patterns:', error);
            container.innerHTML = '<p style="color: #f44336;">Failed to load data</p>';
        }
    }

    async function loadResponseTimes() {
        const container = document.getElementById('responseTimes');
        try {
            const data = await teamAnalyticsClient.getResponseTimes(userEmail);

            if (data && data.metrics) {
                container.innerHTML = `
          <div class="metric-grid">
            <div class="metric-item">
              <div class="metric-value">${data.metrics.avg_response || 'N/A'}</div>
              <div class="metric-label">Average</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">${data.metrics.fastest || 'N/A'}</div>
              <div class="metric-label">Fastest</div>
            </div>
          </div>
        `;
            } else {
                container.innerHTML = '<p style="color: rgba(255,255,255,0.6);">No data available</p>';
            }
        } catch (error) {
            console.error('Failed to load response times:', error);
            container.innerHTML = '<p style="color: #f44336;">Failed to load data</p>';
        }
    }

    async function loadKnowledgeSharing() {
        const container = document.getElementById('knowledgeSharing');
        try {
            const data = await teamAnalyticsClient.getKnowledgeSharingIndex(teamId);

            if (data && data.index) {
                container.innerHTML = `
          <div class="metric-grid">
            <div class="metric-item">
              <div class="metric-value">${data.index.score || 0}</div>
              <div class="metric-label">Sharing Score</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">${data.index.contributions || 0}</div>
              <div class="metric-label">Contributions</div>
            </div>
          </div>
        `;
            } else {
                container.innerHTML = '<p style="color: rgba(255,255,255,0.6);">No data available</p>';
            }
        } catch (error) {
            console.error('Failed to load knowledge sharing:', error);
            container.innerHTML = '<p style="color: #f44336;">Failed to load data</p>';
        }
    }
});
