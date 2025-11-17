/**
 * ZANTARA Team Dashboard - Main Logic
 * Handles all team dashboard interactions, data fetching, and visualization
 */

// Configuration
const CONFIG = {
  backendURL: 'https://nuzantara-orchestrator.fly.dev',
  ragURL: 'https://nuzantara-rag.fly.dev',
  refreshInterval: 30000, // 30 seconds
};

// State
const state = {
  currentSection: 'overview',
  agents: [],
  teamMembers: [],
  decisions: [],
  analytics: {},
  refreshTimer: null,
};

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 ZANTARA Team Dashboard initializing...');

  setupNavigation();
  setupEventListeners();
  await loadAllData();
  startAutoRefresh();

  console.log('✅ Dashboard ready');
});

/**
 * Navigation setup
 */
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();

      // Update active state
      navItems.forEach((nav) => nav.classList.remove('active'));
      item.classList.add('active');

      // Show corresponding section
      const section = item.dataset.section;
      showSection(section);
    });
  });
}

function showSection(sectionName) {
  state.currentSection = sectionName;

  // Hide all sections
  document.querySelectorAll('.content-section').forEach((section) => {
    section.classList.remove('active');
  });

  // Show target section
  const targetSection = document.getElementById(`${sectionName}-section`);
  if (targetSection) {
    targetSection.classList.add('active');

    // Load section-specific data
    loadSectionData(sectionName);
  }
}

/**
 * Event listeners setup
 */
function setupEventListeners() {
  // Refresh button
  document.getElementById('refresh-btn')?.addEventListener('click', () => {
    loadAllData();
  });

  // New decision button
  document.getElementById('new-decision-btn')?.addEventListener('click', () => {
    openDecisionModal();
  });

  // Decision modal close
  document.querySelector('.modal-close')?.addEventListener('click', () => {
    closeDecisionModal();
  });

  document.getElementById('cancel-decision')?.addEventListener('click', () => {
    closeDecisionModal();
  });

  // Decision form submit
  document.getElementById('decision-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveDecision(e.target);
  });

  // Memory search
  document.getElementById('memory-search-btn')?.addEventListener('click', () => {
    performMemorySearch();
  });

  // Memory tabs
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      switchMemoryTab(btn.dataset.tab);
    });
  });
}

/**
 * Load all dashboard data
 */
async function loadAllData() {
  console.log('📊 Loading dashboard data...');

  showLoading();

  try {
    await Promise.all([
      loadAgentsStatus(),
      loadTeamMembers(),
      loadDecisions(),
      loadAnalytics(),
      loadActivityFeed(),
      loadAlerts(),
    ]);

    console.log('✅ Data loaded successfully');
  } catch (error) {
    console.error('❌ Error loading data:', error);
    showError('Failed to load dashboard data');
  } finally {
    hideLoading();
  }
}

/**
 * Load section-specific data
 */
async function loadSectionData(section) {
  switch (section) {
    case 'agents':
      await loadAgentsDetails();
      break;
    case 'team':
      await loadTeamDetails();
      break;
    case 'analytics':
      renderCharts();
      await loadAIInsights();
      break;
    case 'memory':
      await loadMemoryData();
      break;
    case 'security':
      await loadSecurityAudit();
      break;
  }
}

/**
 * AI AGENTS STATUS
 */
async function loadAgentsStatus() {
  try {
    const response = await fetch(`${CONFIG.ragURL}/api/agents/status`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      // Fallback to mock data if endpoint not available
      state.agents = getMockAgents();
      renderAgents();
      return;
    }

    const data = await response.json();
    state.agents = data.agents || getMockAgents();
    renderAgents();

    // Update quick stat
    const activeCount = state.agents.filter((a) => a.status === 'active').length;
    document.getElementById('agents-active').textContent = `${activeCount}/${state.agents.length}`;
  } catch (error) {
    console.warn('Using mock agents data:', error);
    state.agents = getMockAgents();
    renderAgents();
  }
}

function renderAgents() {
  const container = document.getElementById('agents-grid');
  if (!container) return;

  container.innerHTML = state.agents
    .map(
      (agent) => `
    <div class="agent-card ${agent.status === 'active' ? 'active' : 'inactive'}" data-agent-id="${agent.id}">
      <div class="agent-header">
        <div class="agent-title">${agent.icon} ${agent.name}</div>
        <div class="agent-status ${agent.status}"></div>
      </div>
      <div class="agent-description">${agent.description}</div>
      <div class="agent-metrics">
        <div class="agent-metric">
          <span class="agent-metric-label">Tasks</span>
          <span class="agent-metric-value">${agent.tasksCompleted || 0}</span>
        </div>
        <div class="agent-metric">
          <span class="agent-metric-label">Success Rate</span>
          <span class="agent-metric-value">${agent.successRate || '0'}%</span>
        </div>
        <div class="agent-metric">
          <span class="agent-metric-label">Avg Time</span>
          <span class="agent-metric-value">${agent.avgTime || '0'}s</span>
        </div>
      </div>
    </div>
  `
    )
    .join('');
}

function getMockAgents() {
  return [
    {
      id: 'journey',
      name: 'Journey Orchestrator',
      icon: '🗺️',
      description: 'Guides clients through service workflows automatically',
      status: 'active',
      tasksCompleted: 45,
      successRate: 98,
      avgTime: 120,
    },
    {
      id: 'compliance',
      name: 'Compliance Monitor',
      icon: '⚠️',
      description: 'Monitors deadlines and sends alerts before expiration',
      status: 'active',
      tasksCompleted: 23,
      successRate: 100,
      avgTime: 5,
    },
    {
      id: 'knowledge-graph',
      name: 'Knowledge Graph Builder',
      icon: '🕸️',
      description: 'Creates connections between entities and information',
      status: 'active',
      tasksCompleted: 156,
      successRate: 95,
      avgTime: 15,
    },
    {
      id: 'ingestion',
      name: 'Auto Ingestion',
      icon: '📥',
      description: 'Monitors external sources and updates knowledge base',
      status: 'active',
      tasksCompleted: 89,
      successRate: 97,
      avgTime: 30,
    },
    {
      id: 'synthesis',
      name: 'Cross-Oracle Synthesis',
      icon: '🔄',
      description: 'Combines information from multiple knowledge bases',
      status: 'active',
      tasksCompleted: 67,
      successRate: 92,
      avgTime: 8,
    },
    {
      id: 'pricing',
      name: 'Dynamic Pricing',
      icon: '💰',
      description: 'Calculates personalized quotes based on requirements',
      status: 'active',
      tasksCompleted: 34,
      successRate: 100,
      avgTime: 3,
    },
    {
      id: 'research',
      name: 'Autonomous Research',
      icon: '🔍',
      description: 'Conducts deep research when information is not available',
      status: 'active',
      tasksCompleted: 12,
      successRate: 88,
      avgTime: 180,
    },
    {
      id: 'analytics-1',
      name: 'Client Insights',
      icon: '📊',
      description: 'Analyzes client patterns and generates insights',
      status: 'active',
      tasksCompleted: 78,
      successRate: 96,
      avgTime: 45,
    },
    {
      id: 'analytics-2',
      name: 'Revenue Forecast',
      icon: '💹',
      description: 'Forecasts revenue based on pipeline and patterns',
      status: 'inactive',
      tasksCompleted: 0,
      successRate: 0,
      avgTime: 0,
    },
    {
      id: 'analytics-3',
      name: 'Team Performance',
      icon: '⭐',
      description: 'Tracks and analyzes team productivity metrics',
      status: 'active',
      tasksCompleted: 145,
      successRate: 94,
      avgTime: 10,
    },
  ];
}

/**
 * TEAM MEMBERS
 */
async function loadTeamMembers() {
  try {
    const response = await fetch(`${CONFIG.backendURL}/team.list`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      state.teamMembers = getMockTeamMembers();
      renderTeamMembers();
      return;
    }

    const data = await response.json();
    state.teamMembers = data.team || getMockTeamMembers();
    renderTeamMembers();
  } catch (error) {
    console.warn('Using mock team data:', error);
    state.teamMembers = getMockTeamMembers();
    renderTeamMembers();
  }
}

function renderTeamMembers() {
  const container = document.getElementById('team-grid');
  if (!container) return;

  container.innerHTML = state.teamMembers
    .map(
      (member) => `
    <div class="team-card">
      <div class="team-card-header">
        <div class="team-avatar">${member.initials}</div>
        <div class="team-info">
          <h3>${member.name}</h3>
          <div class="team-role">${member.role}</div>
        </div>
      </div>
      <div class="team-skills">
        ${member.skills
          .map(
            (skill) => `
          <span class="skill-tag">${skill}</span>
        `
          )
          .join('')}
      </div>
      <div class="team-stats">
        <div class="team-stat">
          <span class="team-stat-value">${member.commits || 0}</span>
          <span class="team-stat-label">Commits</span>
        </div>
        <div class="team-stat">
          <span class="team-stat-value">${member.prs || 0}</span>
          <span class="team-stat-label">PRs</span>
        </div>
        <div class="team-stat">
          <span class="team-stat-value">${member.rating || 0}</span>
          <span class="team-stat-label">Rating</span>
        </div>
      </div>
    </div>
  `
    )
    .join('');
}

function getMockTeamMembers() {
  return [
    {
      id: 'marco',
      name: 'Marco Rossi',
      initials: 'MR',
      role: 'Senior Backend Developer',
      skills: ['TypeScript', 'Python', 'Docker', 'PostgreSQL'],
      commits: 67,
      prs: 12,
      rating: 9.2,
    },
    {
      id: 'sara',
      name: 'Sara Bianchi',
      initials: 'SB',
      role: 'Frontend Developer',
      skills: ['React', 'CSS', 'UX Design', 'JavaScript'],
      commits: 54,
      prs: 15,
      rating: 9.5,
    },
    {
      id: 'zero',
      name: 'Zero',
      initials: 'Z',
      role: 'Full Stack + DevOps',
      skills: ['Everything', 'AI', 'Architecture', 'Cloud'],
      commits: 156,
      prs: 45,
      rating: 10.0,
    },
  ];
}

/**
 * DECISION LOG
 */
async function loadDecisions() {
  // For now use mock data - later integrate with memory.event.save
  state.decisions = getMockDecisions();
  renderDecisions();
}

function renderDecisions() {
  const container = document.getElementById('decisions-timeline');
  if (!container) return;

  container.innerHTML = state.decisions
    .map(
      (decision) => `
    <div class="timeline-item">
      <div class="timeline-date">${formatDate(decision.timestamp)}</div>
      <div class="timeline-content">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
          <h4 class="timeline-title">${decision.title}</h4>
          <span class="timeline-badge ${decision.type}">${decision.type}</span>
        </div>
        <p class="timeline-description">${decision.description}</p>
        <div class="timeline-meta">
          <span>👥 ${decision.participants}</span>
          <span>📊 Impact: ${decision.impact}</span>
        </div>
      </div>
    </div>
  `
    )
    .join('');
}

function getMockDecisions() {
  return [
    {
      id: '1',
      timestamp: new Date('2024-11-17T14:30:00'),
      type: 'architecture',
      title: 'Team Dashboard Implementation',
      description:
        'Decided to create dedicated team dashboard for internal use with AI agents monitoring, team analytics, and decision logging.',
      participants: 'Zero, Marco, Sara',
      impact: 'high',
    },
    {
      id: '2',
      timestamp: new Date('2024-11-15T09:15:00'),
      type: 'technical',
      title: 'Memory Leak Fix Deployment',
      description:
        'Emergency deployment of v2.3.5 to fix ChromaDB connection pool memory leak discovered in production.',
      participants: 'Marco, Zero',
      impact: 'critical',
    },
    {
      id: '3',
      timestamp: new Date('2024-11-12T16:00:00'),
      type: 'business',
      title: 'Hired Frontend Developer',
      description:
        'Anna Rossi hired as Frontend Developer after successful interviews. Start date: 2024-12-01. Onboarding owner: Sara.',
      participants: 'Marco, Sara, Zero',
      impact: 'high',
    },
  ];
}

function openDecisionModal() {
  const modal = document.getElementById('decision-modal');
  if (modal) {
    modal.classList.add('active');
  }
}

function closeDecisionModal() {
  const modal = document.getElementById('decision-modal');
  if (modal) {
    modal.classList.remove('active');
    document.getElementById('decision-form').reset();
  }
}

async function saveDecision(form) {
  const formData = new FormData(form);
  const decision = {
    type: formData.get('type'),
    title: formData.get('title'),
    description: formData.get('description'),
    participants: formData.get('participants'),
    impact: formData.get('impact'),
    timestamp: new Date(),
  };

  try {
    // TODO: Integrate with backend endpoint
    // await fetch(`${CONFIG.backendURL}/memory.event.save`, { ... })

    // For now, add to local state
    state.decisions.unshift(decision);
    renderDecisions();
    closeDecisionModal();

    showNotification('Decision logged successfully', 'success');
  } catch (error) {
    console.error('Error saving decision:', error);
    showNotification('Failed to save decision', 'error');
  }
}

/**
 * ANALYTICS
 */
async function loadAnalytics() {
  // Mock analytics data
  state.analytics = getMockAnalytics();
  updateAnalyticsStats();
}

function getMockAnalytics() {
  return {
    commits: {
      today: 23,
      trend: 15,
      byDay: [12, 18, 15, 23, 19, 21, 23],
    },
    deploys: {
      count: 4,
      successRate: 100,
    },
    issues: {
      open: 7,
      critical: 2,
    },
    sprint: {
      progress: 87,
      status: 'on-track',
    },
    quality: {
      coverage: 78,
      trend: 3,
    },
    velocity: {
      issuesClosed: 15,
      trend: 8,
    },
  };
}

function updateAnalyticsStats() {
  document.getElementById('commits-today').textContent = state.analytics.commits.today;
  document.getElementById('deploys-count').textContent = state.analytics.deploys.count;
  document.getElementById('issues-count').textContent = state.analytics.issues.open;
  document.getElementById('sprint-progress').textContent = `${state.analytics.sprint.progress}%`;
}

function renderCharts() {
  renderCommitsChart();
  renderQualityChart();
  renderVelocityChart();
  renderBugsChart();
}

function renderCommitsChart() {
  const ctx = document.getElementById('commits-chart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Commits',
          data: state.analytics.commits.byDay,
          borderColor: '#D4AF37',
          backgroundColor: 'rgba(212, 175, 55, 0.1)',
          tension: 0.4,
        },
      ],
    },
    options: getChartOptions(),
  });
}

function renderQualityChart() {
  const ctx = document.getElementById('quality-chart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['W1', 'W2', 'W3', 'W4'],
      datasets: [
        {
          label: 'Test Coverage %',
          data: [72, 75, 75, 78],
          borderColor: '#44ff44',
          backgroundColor: 'rgba(68, 255, 68, 0.1)',
          tension: 0.4,
        },
      ],
    },
    options: getChartOptions(),
  });
}

function renderVelocityChart() {
  const ctx = document.getElementById('velocity-chart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['W1', 'W2', 'W3', 'W4'],
      datasets: [
        {
          label: 'Issues Closed',
          data: [12, 14, 13, 15],
          backgroundColor: '#D4AF37',
        },
      ],
    },
    options: getChartOptions(),
  });
}

function renderBugsChart() {
  const ctx = document.getElementById('bugs-chart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['W1', 'W2', 'W3', 'W4'],
      datasets: [
        {
          label: 'Avg Resolution Time (hours)',
          data: [18, 15, 12, 10],
          borderColor: '#ff4444',
          backgroundColor: 'rgba(255, 68, 68, 0.1)',
          tension: 0.4,
        },
      ],
    },
    options: getChartOptions(),
  });
}

function getChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
    },
    scales: {
      y: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };
}

async function loadAIInsights() {
  const container = document.getElementById('ai-insights');
  if (!container) return;

  const insights = [
    '💡 Sara has the highest code quality score this week (9.5/10). Consider peer learning session.',
    '⚠️ Marco has 3 PRs waiting for review for >2 days. Review needed to unblock.',
    '📈 Team velocity increased 8% this sprint. On track to exceed sprint goal.',
    '🎯 Test coverage increased to 78% (+3%). Goal of 80% achievable this month.',
    '🔴 2 critical issues remain open. Recommend prioritization in next standup.',
  ];

  container.innerHTML = insights.map((insight) => `<div class="insight-item">${insight}</div>`).join('');
}

/**
 * ACTIVITY FEED
 */
async function loadActivityFeed() {
  const container = document.getElementById('activity-feed');
  if (!container) return;

  const activities = getMockActivities();

  container.innerHTML = activities
    .map(
      (activity) => `
    <div class="activity-item">
      <div class="activity-time">${formatTime(activity.timestamp)}</div>
      <div class="activity-description">
        <span class="activity-user">${activity.user}</span> ${activity.action}
      </div>
    </div>
  `
    )
    .join('');
}

function getMockActivities() {
  return [
    {
      timestamp: new Date(Date.now() - 5 * 60000),
      user: 'Marco',
      action: 'deployed backend v2.3.6 to production',
    },
    {
      timestamp: new Date(Date.now() - 15 * 60000),
      user: 'Sara',
      action: 'merged PR #47: Fix message virtualization bug',
    },
    {
      timestamp: new Date(Date.now() - 23 * 60000),
      user: 'Zero',
      action: 'created team dashboard feature',
    },
    {
      timestamp: new Date(Date.now() - 45 * 60000),
      user: 'Marco',
      action: 'closed issue #23: Critical memory leak',
    },
    {
      timestamp: new Date(Date.now() - 67 * 60000),
      user: 'Sara',
      action: 'opened PR #48: Add Google Calendar integration',
    },
  ];
}

/**
 * ALERTS
 */
async function loadAlerts() {
  const container = document.getElementById('alerts-container');
  if (!container) return;

  const alerts = [
    {
      type: 'warning',
      message: '⚠️ Sprint deadline in 3 days. 13% of tasks remaining.',
    },
    {
      type: 'info',
      message: '📅 Team sync meeting tomorrow at 10:00 AM.',
    },
  ];

  container.innerHTML = alerts
    .map(
      (alert) => `
    <div class="alert ${alert.type}">
      ${alert.message}
    </div>
  `
    )
    .join('');
}

/**
 * MEMORY SECTION
 */
async function loadMemoryData() {
  // TODO: Integrate with advanced memory endpoints
  console.log('Loading team memory data...');
}

function performMemorySearch() {
  const query = document.getElementById('memory-search').value;
  console.log('Searching memory for:', query);
  // TODO: Integrate with memory.search.semantic
}

function switchMemoryTab(tab) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  // Update tab content
  document.querySelectorAll('.tab-content').forEach((content) => {
    content.classList.remove('active');
  });
  document.getElementById(`memory-${tab}`).classList.add('active');
}

/**
 * SECURITY AUDIT
 */
async function loadSecurityAudit() {
  const tbody = document.getElementById('audit-tbody');
  if (!tbody) return;

  const auditLogs = getMockAuditLogs();

  tbody.innerHTML = auditLogs
    .map(
      (log) => `
    <tr>
      <td>${formatDateTime(log.timestamp)}</td>
      <td>${log.userId}</td>
      <td>${log.action}</td>
      <td>${log.tool}</td>
      <td><span class="status-badge ${log.status}">${log.status}</span></td>
      <td>${log.details}</td>
    </tr>
  `
    )
    .join('');
}

function getMockAuditLogs() {
  return [
    {
      timestamp: new Date(Date.now() - 5 * 60000),
      userId: 'zero',
      action: 'deploy_backend',
      tool: 'zero_tools',
      status: 'success',
      details: 'Deployed v2.3.6 to production',
    },
    {
      timestamp: new Date(Date.now() - 15 * 60000),
      userId: 'marco',
      action: 'edit_file',
      tool: 'zero_tools',
      status: 'success',
      details: 'Modified src/handlers/pricing.ts',
    },
    {
      timestamp: new Date(Date.now() - 45 * 60000),
      userId: 'sara',
      action: 'team.login',
      tool: 'auth',
      status: 'success',
      details: 'Successful authentication',
    },
  ];
}

/**
 * UTILITY FUNCTIONS
 */
function getAuthHeaders() {
  const tokenData = JSON.parse(localStorage.getItem('zantara-token') || '{}');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${tokenData.token || ''}`,
  };
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTime(date) {
  const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDateTime(date) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function showLoading() {
  console.log('Loading...');
}

function hideLoading() {
  console.log('Loading complete');
}

function showError(message) {
  console.error('Error:', message);
  showNotification(message, 'error');
}

function showNotification(message, type = 'info') {
  // Simple notification - can be enhanced with toast library
  console.log(`[${type.toUpperCase()}]`, message);

  // Add visual notification
  const alertContainer = document.getElementById('alerts-container');
  if (alertContainer) {
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.textContent = message;
    alertContainer.appendChild(alert);

    setTimeout(() => {
      alert.remove();
    }, 5000);
  }
}

/**
 * AUTO REFRESH
 */
function startAutoRefresh() {
  if (state.refreshTimer) {
    clearInterval(state.refreshTimer);
  }

  state.refreshTimer = setInterval(() => {
    console.log('🔄 Auto-refreshing data...');
    loadAllData();
  }, CONFIG.refreshInterval);
}

// Export for debugging
window.TEAM_DASHBOARD = {
  state,
  loadAllData,
  showSection,
};
