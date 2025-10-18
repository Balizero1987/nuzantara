// Weekly Report System for ZANTARA v5.2.0
// Automatic Sunday analysis and reporting to Zero
import logger from '../../services/logger.js';
import { getFirestore } from "../../services/firebase.js";
import { getGmail, getDrive } from "../../services/google-auth-service.js";
import { ok } from "../../utils/response.js";
// Configuration
const ZERO_EMAIL = 'zero@balizero.com';
const REPORT_DAY = 0; // Sunday = 0
const BATCH_SIZE = 100; // Max conversations to process at once
// Team members for analysis
const TEAM_MEMBERS = [
    'zero', 'zainal', 'setup', 'tax', 'marketing', 'reception', 'board'
];
// Initialize Gmail for sending reports using centralized service
async function getGmailService() {
    return getGmail();
}
// Get conversations for a specific user within date range
async function getUserConversations(userId, startDate, endDate) {
    try {
        const db = getFirestore();
        const conversationsRef = db.collection('conversations');
        const snapshot = await conversationsRef
            .where('userId', '==', userId)
            .where('timestamp', '>=', startDate.toISOString())
            .where('timestamp', '<=', endDate.toISOString())
            .orderBy('timestamp', 'asc')
            .limit(BATCH_SIZE)
            .get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
    catch (error) {
        logger.error(`Failed to get conversations for ${userId}:`, error.message);
        return [];
    }
}
// Aggregate daily conversations into single summary
function aggregateDailyConversations(conversations) {
    const dailyGroups = {};
    conversations.forEach(conv => {
        const date = conv.timestamp.split('T')[0]; // YYYY-MM-DD
        if (!dailyGroups[date]) {
            dailyGroups[date] = [];
        }
        dailyGroups[date].push(conv);
    });
    return dailyGroups;
}
// Generate qualitative analysis with ZANTARA's perspective
async function generateQualitativeAnalysis(userId, conversations) {
    const totalConversations = conversations.length;
    // Analyze conversation patterns
    const topics = new Map();
    const handlers = new Map();
    const timePatterns = new Map(); // hour of day
    conversations.forEach(conv => {
        // Track handlers used
        handlers.set(conv.handler, (handlers.get(conv.handler) || 0) + 1);
        // Track time patterns
        const hour = new Date(conv.timestamp).getHours();
        timePatterns.set(hour, (timePatterns.get(hour) || 0) + 1);
        // Extract topics from prompts
        const prompt = (conv.prompt || '').toLowerCase();
        if (prompt.includes('visa'))
            topics.set('visa', (topics.get('visa') || 0) + 1);
        if (prompt.includes('company') || prompt.includes('pt'))
            topics.set('company', (topics.get('company') || 0) + 1);
        if (prompt.includes('tax') || prompt.includes('pajak'))
            topics.set('tax', (topics.get('tax') || 0) + 1);
        if (prompt.includes('property') || prompt.includes('real estate'))
            topics.set('property', (topics.get('property') || 0) + 1);
        if (prompt.includes('help') || prompt.includes('urgent'))
            topics.set('urgent', (topics.get('urgent') || 0) + 1);
    });
    // Find peak activity hours
    let peakHour = 0;
    let maxActivity = 0;
    timePatterns.forEach((count, hour) => {
        if (count > maxActivity) {
            maxActivity = count;
            peakHour = hour;
        }
    });
    // Most used services
    const topHandlers = Array.from(handlers.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([handler, count]) => `${handler} (${count}x)`);
    // Main topics discussed
    const mainTopics = Array.from(topics.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([topic, count]) => `${topic} (${count}x)`);
    // ZANTARA's qualitative analysis
    const analysis = {
        summary: `${userId.toUpperCase()} - Weekly Activity Report`,
        totalInteractions: totalConversations,
        // Behavioral insights
        behavioralInsights: {
            peakActivityTime: `${peakHour}:00-${peakHour + 1}:00`,
            averageConversationsPerDay: Math.round(totalConversations / 7),
            preferredServices: topHandlers,
            mainInterests: mainTopics
        },
        // ZANTARA's perspective
        zantaraPerspective: generatePerspective(userId, conversations, topics, timePatterns),
        // Recommendations
        recommendations: generateRecommendations(userId, topics, handlers),
        // Key conversations highlights
        keyHighlights: extractKeyHighlights(conversations),
        // Efficiency metrics
        efficiency: {
            averageResponseTime: calculateAverageResponseTime(conversations),
            successfulResolutions: countSuccessfulResolutions(conversations),
            followUpNeeded: identifyFollowUps(conversations)
        }
    };
    return analysis;
}
// Generate ZANTARA's perspective on the user
function generatePerspective(userId, conversations, topics, timePatterns) {
    let perspective = `Based on this week's interactions with ${userId}, I observe: `;
    // Activity pattern analysis
    const totalConv = conversations.length;
    if (totalConv > 20) {
        perspective += `High engagement level with ${totalConv} conversations. `;
    }
    else if (totalConv > 10) {
        perspective += `Moderate engagement with ${totalConv} conversations. `;
    }
    else {
        perspective += `Light engagement with ${totalConv} conversations. `;
    }
    // Topic focus
    const topTopic = Array.from(topics.entries()).sort((a, b) => b[1] - a[1])[0];
    if (topTopic) {
        perspective += `Primary focus on ${topTopic[0]} services. `;
    }
    // Time pattern insight
    const earlyBird = Array.from(timePatterns.keys()).some(h => h < 9 && timePatterns.get(h) > 2);
    const nightOwl = Array.from(timePatterns.keys()).some(h => h > 21 && timePatterns.get(h) > 2);
    if (earlyBird) {
        perspective += `Early starter, often begins work before 9 AM. `;
    }
    else if (nightOwl) {
        perspective += `Works late hours, active after 9 PM. `;
    }
    // Collaboration style
    if (userId === 'zero') {
        perspective += `As the leader, maintains oversight across all service areas. Strategic thinking evident in queries. `;
    }
    else if (userId === 'zainal') {
        perspective += `Operations-focused, ensuring smooth service delivery. Detail-oriented approach. `;
    }
    else {
        perspective += `Dedicated team member focused on their specialty area. `;
    }
    // Growth opportunity
    if (topics.get('urgent') && topics.get('urgent') > 3) {
        perspective += `Note: Multiple urgent requests this week - may benefit from proactive planning. `;
    }
    return perspective;
}
// Generate recommendations based on patterns
function generateRecommendations(userId, topics, handlers) {
    const recommendations = [];
    // Service-specific recommendations
    if (topics.get('visa') && topics.get('visa') > 5) {
        recommendations.push('Consider creating visa process templates for faster responses');
    }
    if (topics.get('company') && topics.get('company') > 3) {
        recommendations.push('PT/PMA setup inquiries increasing - prepare updated pricing sheet');
    }
    if (topics.get('urgent') && topics.get('urgent') > 2) {
        recommendations.push('Multiple urgent requests - implement priority queue system');
    }
    // Handler optimization
    if (!handlers.has('calendar.create')) {
        recommendations.push('Underutilizing calendar automation - could save time on scheduling');
    }
    if (!handlers.has('sheets.append')) {
        recommendations.push('Consider using sheets for client tracking automation');
    }
    // User-specific
    if (userId === 'zero') {
        recommendations.push('Weekly dashboard summary could provide faster oversight');
    }
    return recommendations.length > 0 ? recommendations : ['Maintain current efficient workflow'];
}
// Extract key conversation highlights
function extractKeyHighlights(conversations) {
    const highlights = [];
    conversations.forEach(conv => {
        const prompt = (conv.prompt || '').toLowerCase();
        // Important keywords that indicate key conversations
        if (prompt.includes('urgent') || prompt.includes('asap')) {
            highlights.push(`⚡ Urgent: ${conv.prompt.substring(0, 100)}...`);
        }
        if (prompt.includes('contract') || prompt.includes('agreement')) {
            highlights.push(`📄 Contract: ${conv.prompt.substring(0, 100)}...`);
        }
        if (prompt.includes('problem') || prompt.includes('issue')) {
            highlights.push(`⚠️ Issue: ${conv.prompt.substring(0, 100)}...`);
        }
        if (prompt.includes('success') || prompt.includes('completed')) {
            highlights.push(`✅ Success: ${conv.prompt.substring(0, 100)}...`);
        }
    });
    return highlights.slice(0, 5); // Top 5 highlights
}
// Calculate average response time
function calculateAverageResponseTime(conversations) {
    const times = conversations
        .map(c => c.responseTime || 0)
        .filter(t => t > 0);
    if (times.length === 0)
        return 'N/A';
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    return `${Math.round(avg)}ms`;
}
// Count successful resolutions
function countSuccessfulResolutions(conversations) {
    return conversations.filter(c => c.response &&
        !c.response.includes('error') &&
        !c.response.includes('failed')).length;
}
// Identify conversations needing follow-up
function identifyFollowUps(conversations) {
    const followUps = [];
    conversations.forEach(conv => {
        const response = (conv.response || '').toLowerCase();
        if (response.includes('follow up') ||
            response.includes('will get back') ||
            response.includes('pending') ||
            response.includes('waiting for')) {
            followUps.push(`${conv.timestamp.split('T')[0]}: ${conv.prompt.substring(0, 50)}...`);
        }
    });
    return followUps;
}
// Format report as HTML email
function formatEmailReport(weeklyAnalysis) {
    let html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    h2 { color: #34495e; margin-top: 30px; }
    .team-section { margin: 20px 0; padding: 20px; background: #ecf0f1; border-radius: 8px; }
    .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
    .metric { background: #3498db; color: white; padding: 15px; border-radius: 5px; text-align: center; }
    .metric-value { font-size: 24px; font-weight: bold; }
    .perspective { background: #e8f4f8; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0; }
    .recommendations { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
    .highlights { background: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0; }
    ul { line-height: 1.8; }
    .footer { text-align: center; color: #7f8c8d; margin-top: 40px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 ZANTARA Weekly Team Report</h1>
    <p><strong>Week Ending:</strong> ${new Date().toLocaleDateString()}</p>
    <p><strong>Report Generated:</strong> ${new Date().toLocaleString()}</p>

    <h2>👥 Team Activity Overview</h2>
`;
    // Add each team member's analysis
    Object.entries(weeklyAnalysis).forEach(([, analysis]) => {
        html += `
    <div class="team-section">
      <h3>${analysis.summary}</h3>

      <div class="metrics">
        <div class="metric">
          <div class="metric-value">${analysis.totalInteractions}</div>
          <div>Conversations</div>
        </div>
        <div class="metric">
          <div class="metric-value">${analysis.behavioralInsights.averageConversationsPerDay}</div>
          <div>Daily Average</div>
        </div>
        <div class="metric">
          <div class="metric-value">${analysis.efficiency.averageResponseTime}</div>
          <div>Avg Response</div>
        </div>
      </div>

      <div class="perspective">
        <strong>🧠 ZANTARA's Analysis:</strong><br>
        ${analysis.zantaraPerspective}
      </div>

      <div class="recommendations">
        <strong>💡 Recommendations:</strong>
        <ul>
          ${analysis.recommendations.map((r) => `<li>${r}</li>`).join('')}
        </ul>
      </div>

      ${analysis.keyHighlights.length > 0 ? `
      <div class="highlights">
        <strong>🌟 Key Highlights:</strong>
        <ul>
          ${analysis.keyHighlights.map((h) => `<li>${h}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      ${analysis.efficiency.followUpNeeded.length > 0 ? `
      <div style="background: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
        <strong>⏰ Follow-ups Needed:</strong>
        <ul>
          ${analysis.efficiency.followUpNeeded.map((f) => `<li>${f}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
    </div>
    `;
    });
    html += `
    <div class="footer">
      <p>ZANTARA v5.2.0 - Intelligent Business Assistant for Bali Zero</p>
      <p>This report is automatically generated every Sunday and optimizes weekly conversation data.</p>
    </div>
  </div>
</body>
</html>
  `;
    return html;
}
// Send email report to Zero
async function sendEmailToZero(htmlReport) {
    try {
        const gmail = await getGmailService();
        if (!gmail) {
            throw new Error('Gmail service not available');
        }
        const subject = `ZANTARA Weekly Team Report - ${new Date().toLocaleDateString()}`;
        // Create email
        const message = [
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            `To: ${ZERO_EMAIL}`,
            `From: ZANTARA <noreply@balizero.com>`,
            `Subject: ${subject}`,
            '',
            htmlReport
        ].join('\n');
        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage
            }
        });
        logger.info(`✅ Weekly report sent to ${ZERO_EMAIL}`);
        return { success: true };
    }
    catch (error) {
        logger.error('Failed to send email:', error.message);
        // Fallback: Save report to Drive
        return await saveReportToDrive(htmlReport);
    }
}
// Fallback: Save report to Google Drive
async function saveReportToDrive(htmlReport) {
    try {
        const drive = await getDrive();
        if (!drive) {
            throw new Error('Drive service not available');
        }
        const fileMetadata = {
            name: `ZANTARA_Weekly_Report_${new Date().toISOString().split('T')[0]}.html`,
            parents: [process.env.ZANTARA_REPORTS_FOLDER_ID || '1cR2BRhVx0fODIQxdLfRhQV_xJ9R9kWb5']
        };
        const media = {
            mimeType: 'text/html',
            body: htmlReport
        };
        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, name'
        });
        logger.info(`📁 Report saved to Drive: ${response.data.name}`);
        return { success: true, driveId: response.data.id };
    }
    catch (error) {
        logger.error('Failed to save report to Drive:', error.message);
        return { success: false, error: error.message };
    }
}
// Main function to generate and send weekly report
export async function generateWeeklyReport() {
    logger.info('📊 Starting weekly report generation...');
    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const weeklyAnalysis = {};
    // Process each team member
    for (const userId of TEAM_MEMBERS) {
        logger.info(`Processing ${userId}...`);
        // Get conversations for this user
        const conversations = await getUserConversations(userId, startDate, endDate);
        if (conversations.length > 0) {
            // Generate qualitative analysis
            const analysis = await generateQualitativeAnalysis(userId, conversations);
            weeklyAnalysis[userId] = analysis;
            // Aggregate daily conversations (cleanup)
            aggregateDailyConversations(conversations);
            // Archive old conversations to save space
            await archiveProcessedConversations(conversations);
        }
    }
    // Format and send report
    if (Object.keys(weeklyAnalysis).length > 0) {
        const htmlReport = formatEmailReport(weeklyAnalysis);
        const result = await sendEmailToZero(htmlReport);
        logger.info('✅ Weekly report completed:', result);
        return ok({
            message: 'Weekly report generated and sent',
            teamMembersProcessed: Object.keys(weeklyAnalysis).length,
            emailSent: result.success,
            timestamp: new Date().toISOString()
        });
    }
    else {
        logger.info('No conversations found for this week');
        return ok({
            message: 'No conversations to report this week',
            timestamp: new Date().toISOString()
        });
    }
}
// Archive processed conversations to save space
async function archiveProcessedConversations(conversations) {
    try {
        const db = getFirestore();
        const batch = db.batch();
        conversations.forEach(conv => {
            const docRef = db.collection('conversations_archive').doc(conv.id);
            batch.set(docRef, {
                ...conv,
                archivedAt: new Date().toISOString()
            });
            // Delete from main collection
            const originalRef = db.collection('conversations').doc(conv.id);
            batch.delete(originalRef);
        });
        await batch.commit();
        logger.info(`📦 Archived ${conversations.length} conversations`);
    }
    catch (error) {
        logger.error('Failed to archive conversations:', error.message);
    }
}
// Schedule function (to be called by cron or scheduler)
export async function scheduleWeeklyReport() {
    const now = new Date();
    // Check if it's Sunday
    if (now.getDay() === REPORT_DAY) {
        logger.info('🗓️ Sunday detected - Running weekly report...');
        return await generateWeeklyReport();
    }
    else {
        return ok({
            message: `Weekly report scheduled for Sunday. Current day: ${now.getDay()}`,
            nextRun: getNextSunday()
        });
    }
}
// Get next Sunday date
function getNextSunday() {
    const now = new Date();
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setHours(9, 0, 0, 0); // 9 AM Sunday
    return nextSunday.toISOString();
}
// Generate monthly report (last day of month)
export async function generateMonthlyReport() {
    logger.info('📅 Starting monthly report generation...');
    // Get current month range
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1); // First day of month
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of month
    const monthlyAnalysis = {};
    // Process each team member for the entire month
    for (const userId of TEAM_MEMBERS) {
        logger.info(`Processing monthly data for ${userId}...`);
        // Get all conversations for this month
        const conversations = await getUserConversations(userId, startDate, endDate);
        if (conversations.length > 0) {
            // Generate deep monthly analysis
            const analysis = await generateMonthlyAnalysis(userId, conversations, now.getMonth());
            monthlyAnalysis[userId] = analysis;
        }
    }
    // Format and send monthly executive report
    if (Object.keys(monthlyAnalysis).length > 0) {
        const htmlReport = formatMonthlyExecutiveReport(monthlyAnalysis, now);
        const result = await sendMonthlyReportToZero(htmlReport);
        logger.info('✅ Monthly report completed:', result);
        return ok({
            message: 'Monthly executive report generated and sent',
            month: now.toLocaleString('default', { month: 'long' }),
            year: now.getFullYear(),
            teamMembersAnalyzed: Object.keys(monthlyAnalysis).length,
            emailSent: result.success,
            timestamp: new Date().toISOString()
        });
    }
    return ok({
        message: 'No data for monthly report',
        month: now.toLocaleString('default', { month: 'long' }),
        timestamp: new Date().toISOString()
    });
}
// Deep monthly analysis with trends and patterns
async function generateMonthlyAnalysis(userId, conversations, month) {
    const monthName = new Date(2025, month, 1).toLocaleString('default', { month: 'long' });
    // Week-by-week breakdown
    const weeklyBreakdown = getWeeklyBreakdown(conversations);
    // Calculate monthly trends
    const trends = calculateMonthlyTrends(conversations, weeklyBreakdown);
    // Service usage evolution
    const serviceEvolution = analyzeServiceEvolution(conversations);
    // Client interaction patterns
    const clientPatterns = analyzeClientPatterns(conversations);
    // Performance metrics
    const performance = calculateMonthlyPerformance(conversations);
    // ZANTARA's monthly executive perspective
    const executiveSummary = generateExecutiveSummary(userId, conversations, trends, monthName);
    return {
        userId,
        month: monthName,
        executiveSummary,
        // Core metrics
        metrics: {
            totalConversations: conversations.length,
            uniqueDays: new Set(conversations.map(c => c.timestamp.split('T')[0])).size,
            averageDaily: Math.round(conversations.length / 30),
            growthRate: trends.growthPercentage
        },
        // Weekly evolution
        weeklyProgression: weeklyBreakdown.map((week, idx) => ({
            week: `Week ${idx + 1}`,
            conversations: week.length,
            topFocus: extractWeekFocus(week),
            efficiency: calculateWeekEfficiency(week)
        })),
        // Service patterns
        serviceInsights: serviceEvolution,
        // Client relationships
        clientInsights: clientPatterns,
        // Performance analysis
        performance,
        // Strategic recommendations
        strategicRecommendations: generateMonthlyStrategicRecommendations(userId, conversations, trends, serviceEvolution),
        // Next month priorities
        nextMonthPriorities: generateNextMonthPriorities(userId, trends, clientPatterns)
    };
}
// Get weekly breakdown of conversations
function getWeeklyBreakdown(conversations) {
    const weeks = [[], [], [], []];
    conversations.forEach(conv => {
        if (!conv.timestamp)
            return;
        const date = new Date(conv.timestamp);
        const weekOfMonth = Math.floor((date.getDate() - 1) / 7);
        if (weekOfMonth < 4 && weeks[weekOfMonth]) {
            weeks[weekOfMonth].push(conv);
        }
    });
    return weeks;
}
// Calculate monthly trends
function calculateMonthlyTrends(_conversations, weeklyBreakdown) {
    const firstWeek = weeklyBreakdown[0]?.length || 0;
    const lastWeek = weeklyBreakdown[weeklyBreakdown.length - 1]?.length || 0;
    const growthPercentage = firstWeek > 0 ?
        Math.round(((lastWeek - firstWeek) / firstWeek) * 100) : 0;
    const avgResponseTimes = weeklyBreakdown.map(week => week.reduce((sum, c) => sum + (c.responseTime || 0), 0) / (week.length || 1));
    const efficiencyTrend = (avgResponseTimes[0] || 0) > (avgResponseTimes[avgResponseTimes.length - 1] || 0) ?
        'improving' : 'declining';
    return {
        growthPercentage,
        efficiencyTrend,
        weeklyVolumes: weeklyBreakdown.map(w => w.length),
        avgResponseTimes
    };
}
// Analyze service usage evolution
function analyzeServiceEvolution(conversations) {
    const servicesByWeek = new Map();
    conversations.forEach(conv => {
        const date = new Date(conv.timestamp);
        const weekOfMonth = Math.floor((date.getDate() - 1) / 7);
        if (!servicesByWeek.has(weekOfMonth)) {
            servicesByWeek.set(weekOfMonth, new Map());
        }
        const weekMap = servicesByWeek.get(weekOfMonth);
        const service = conv.handler.split('.')[0]; // Extract service name
        weekMap.set(service, (weekMap.get(service) || 0) + 1);
    });
    // Identify emerging vs declining services
    const firstWeek = servicesByWeek.get(0) || new Map();
    const lastWeek = servicesByWeek.get(3) || new Map();
    const emerging = [];
    const declining = [];
    lastWeek.forEach((count, service) => {
        const firstCount = firstWeek.get(service) || 0;
        if (count > firstCount * 1.5)
            emerging.push(service);
    });
    firstWeek.forEach((count, service) => {
        const lastCount = lastWeek.get(service) || 0;
        if (lastCount < count * 0.5)
            declining.push(service);
    });
    return {
        emerging,
        declining,
        consistent: Array.from(new Set([...Array.from(firstWeek.keys()), ...Array.from(lastWeek.keys())]))
            .filter(s => !emerging.includes(s) && !declining.includes(s))
    };
}
// Analyze client interaction patterns
function analyzeClientPatterns(conversations) {
    const topics = new Map();
    const urgentRequests = [];
    const completedProjects = [];
    conversations.forEach(conv => {
        const prompt = (conv.prompt || '').toLowerCase();
        // Extract business topics
        if (prompt.includes('b211'))
            topics.set('B211 Visa', (topics.get('B211 Visa') || 0) + 1);
        if (prompt.includes('kitas'))
            topics.set('KITAS', (topics.get('KITAS') || 0) + 1);
        if (prompt.includes('pt pma'))
            topics.set('PT PMA', (topics.get('PT PMA') || 0) + 1);
        if (prompt.includes('property'))
            topics.set('Property', (topics.get('Property') || 0) + 1);
        // Track urgent and completed
        if (prompt.includes('urgent') || prompt.includes('asap')) {
            urgentRequests.push(conv);
        }
        if (prompt.includes('completed') || prompt.includes('done') || prompt.includes('finished')) {
            completedProjects.push(conv);
        }
    });
    return {
        topServices: Array.from(topics.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5),
        urgentRequests: urgentRequests.length,
        completedProjects: completedProjects.length,
        satisfactionIndicators: completedProjects.length / (urgentRequests.length || 1)
    };
}
// Calculate monthly performance metrics
function calculateMonthlyPerformance(conversations) {
    const successfulResolutions = conversations.filter(c => c.response && !c.response.includes('error')).length;
    const avgResponseTime = conversations.reduce((sum, c) => sum + (c.responseTime || 0), 0) / (conversations.length || 1);
    const peakDays = new Map();
    conversations.forEach(c => {
        if (!c.timestamp)
            return;
        const day = new Date(c.timestamp).getDay();
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
        if (dayName) {
            peakDays.set(dayName, (peakDays.get(dayName) || 0) + 1);
        }
    });
    const busiestDay = Array.from(peakDays.entries())
        .sort((a, b) => b[1] - a[1])[0];
    return {
        successRate: Math.round((successfulResolutions / conversations.length) * 100),
        avgResponseTimeMs: Math.round(avgResponseTime),
        busiestDay: busiestDay ? busiestDay[0] : 'N/A',
        totalActiveHours: new Set(conversations.map(c => new Date(c.timestamp).getHours())).size
    };
}
// Generate executive summary
function generateExecutiveSummary(userId, conversations, trends, monthName) {
    let summary = `${monthName} Executive Summary for ${userId.toUpperCase()}\n\n`;
    summary += `This month, ${userId} engaged in ${conversations.length} conversations, `;
    if (trends.growthPercentage > 0) {
        summary += `showing a ${trends.growthPercentage}% increase in activity from week 1 to week 4. `;
    }
    else if (trends.growthPercentage < 0) {
        summary += `with a ${Math.abs(trends.growthPercentage)}% decrease in activity towards month end. `;
    }
    else {
        summary += `maintaining consistent engagement throughout the month. `;
    }
    summary += `Response efficiency is ${trends.efficiencyTrend}, `;
    summary += `indicating ${trends.efficiencyTrend === 'improving' ? 'optimization of processes' : 'potential bottlenecks'}. `;
    // Role-specific insights
    if (userId === 'zero') {
        summary += `\n\nAs CEO, the focus areas this month indicate strategic oversight across all departments. `;
        summary += `Pattern analysis suggests proactive leadership with balanced attention to operations and growth. `;
    }
    else if (userId === 'zainal') {
        summary += `\n\nOperational excellence maintained with consistent service delivery. `;
        summary += `Client satisfaction metrics remain high based on interaction patterns. `;
    }
    else {
        summary += `\n\nDepartmental performance shows dedication to core responsibilities. `;
        summary += `Collaboration patterns indicate effective team coordination. `;
    }
    return summary;
}
// Extract week focus
function extractWeekFocus(weekConversations) {
    const topics = new Map();
    weekConversations.forEach(conv => {
        const handler = conv.handler.split('.')[0];
        topics.set(handler, (topics.get(handler) || 0) + 1);
    });
    const topTopic = Array.from(topics.entries())
        .sort((a, b) => b[1] - a[1])[0];
    return topTopic ? topTopic[0] : 'general';
}
// Calculate week efficiency
function calculateWeekEfficiency(weekConversations) {
    if (weekConversations.length === 0)
        return 0;
    const successful = weekConversations.filter(c => c.response && !c.response.includes('error')).length;
    return Math.round((successful / weekConversations.length) * 100);
}
// Generate monthly strategic recommendations
function generateMonthlyStrategicRecommendations(_userId, _conversations, trends, serviceEvolution) {
    const recommendations = [];
    // Growth-based recommendations
    if (trends.growthPercentage > 50) {
        recommendations.push('High growth detected - consider scaling support resources');
    }
    // Service evolution recommendations
    if (serviceEvolution.emerging.length > 0) {
        recommendations.push(`Focus on emerging services: ${serviceEvolution.emerging.join(', ')}`);
    }
    if (serviceEvolution.declining.length > 0) {
        recommendations.push(`Review declining services: ${serviceEvolution.declining.join(', ')}`);
    }
    // Efficiency recommendations
    if (trends.efficiencyTrend === 'declining') {
        recommendations.push('Implement process optimization to improve response times');
    }
    // Role-specific strategic recommendations
    if (_userId === 'zero') {
        recommendations.push('Monthly strategy review meeting recommended with all departments');
        recommendations.push('Consider automation for repetitive executive queries');
    }
    return recommendations.length > 0 ? recommendations :
        ['Maintain current operational excellence'];
}
// Generate next month priorities
function generateNextMonthPriorities(_userId, trends, clientPatterns) {
    const priorities = [];
    // Based on client patterns
    if (clientPatterns.urgentRequests > 10) {
        priorities.push('Implement urgent request fast-track system');
    }
    clientPatterns.topServices.slice(0, 3).forEach(([service, count]) => {
        priorities.push(`Optimize ${service} processes (${count} requests this month)`);
    });
    // Based on trends
    if (trends.growthPercentage > 20) {
        priorities.push('Prepare for continued growth - resource planning');
    }
    // Universal priorities
    priorities.push('Maintain service quality standards');
    priorities.push('Continue team collaboration excellence');
    return priorities.slice(0, 5); // Top 5 priorities
}
// Format monthly executive report HTML
function formatMonthlyExecutiveReport(monthlyAnalysis, date) {
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    let html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f2f5; padding: 20px; }
    .container { max-width: 1000px; margin: 0 auto; background: white; padding: 40px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    h1 { color: #1a472a; border-bottom: 4px solid #2e7d32; padding-bottom: 15px; font-size: 32px; }
    h2 { color: #2e7d32; margin-top: 40px; font-size: 24px; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; }
    h3 { color: #424242; margin-top: 25px; }
    .executive-summary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; margin: 30px 0; }
    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
    .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #2e7d32; }
    .metric-value { font-size: 32px; font-weight: bold; color: #2e7d32; }
    .metric-label { color: #666; margin-top: 5px; font-size: 14px; }
    .weekly-chart { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .week-bar { display: flex; align-items: center; margin: 10px 0; }
    .week-label { width: 80px; font-weight: bold; }
    .week-progress { height: 30px; background: linear-gradient(90deg, #4caf50, #8bc34a); border-radius: 5px; display: flex; align-items: center; padding: 0 10px; color: white; }
    .insights-section { background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .recommendations { background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .priorities { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
    ul { line-height: 2; }
    .footer { text-align: center; color: #888; margin-top: 50px; padding-top: 20px; border-top: 2px solid #e0e0e0; }
    .trend-indicator { display: inline-block; margin-left: 10px; }
    .trend-up { color: #4caf50; }
    .trend-down { color: #f44336; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 ZANTARA Monthly Executive Report</h1>
    <p><strong>Period:</strong> ${monthYear}</p>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Report Type:</strong> Monthly Consolidation & Strategic Analysis</p>
`;
    // Add team overview metrics
    const totalConversations = Object.values(monthlyAnalysis)
        .reduce((sum, analysis) => sum + analysis.metrics.totalConversations, 0);
    html += `
    <div class="executive-summary">
      <h2 style="color: white; border: none;">📈 Executive Overview</h2>
      <p style="font-size: 18px;">This month, the Bali Zero team handled <strong>${totalConversations}</strong> total interactions across all departments.</p>
      <p>Team efficiency and client satisfaction metrics remain strong with strategic opportunities identified for continued growth.</p>
    </div>
`;
    // Process each team member's monthly analysis
    Object.entries(monthlyAnalysis).forEach(([userId, analysis]) => {
        const growthIcon = analysis.metrics.growthRate > 0 ? '📈' :
            analysis.metrics.growthRate < 0 ? '📉' : '➡️';
        html += `
    <h2>👤 ${userId.toUpperCase()} - ${analysis.month} Analysis</h2>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-value">${analysis.metrics.totalConversations}</div>
        <div class="metric-label">Total Interactions</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${analysis.metrics.averageDaily}</div>
        <div class="metric-label">Daily Average</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${analysis.performance.successRate}%</div>
        <div class="metric-label">Success Rate</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${growthIcon} ${Math.abs(analysis.metrics.growthRate)}%</div>
        <div class="metric-label">Growth Trend</div>
      </div>
    </div>

    <div class="insights-section">
      <h3>💼 Executive Summary</h3>
      <p>${analysis.executiveSummary}</p>
    </div>

    <div class="weekly-chart">
      <h3>📅 Weekly Progression</h3>
      ${analysis.weeklyProgression.map((week) => `
        <div class="week-bar">
          <div class="week-label">${week.week}</div>
          <div class="week-progress" style="width: ${(week.conversations / 50) * 100}%">
            ${week.conversations} conversations (${week.efficiency}% efficiency)
          </div>
        </div>
      `).join('')}
    </div>

    <div class="insights-section">
      <h3>🎯 Service Evolution</h3>
      ${analysis.serviceInsights.emerging.length > 0 ? `
        <p><strong>📈 Emerging Services:</strong> ${analysis.serviceInsights.emerging.join(', ')}</p>
      ` : ''}
      ${analysis.serviceInsights.declining.length > 0 ? `
        <p><strong>📉 Declining Services:</strong> ${analysis.serviceInsights.declining.join(', ')}</p>
      ` : ''}
      <p><strong>✅ Consistent Services:</strong> ${analysis.serviceInsights.consistent.join(', ')}</p>
    </div>

    <div class="recommendations">
      <h3>💡 Strategic Recommendations</h3>
      <ul>
        ${analysis.strategicRecommendations.map((rec) => `<li>${rec}</li>`).join('')}
      </ul>
    </div>

    <div class="priorities">
      <h3>🎯 Next Month Priorities</h3>
      <ol>
        ${analysis.nextMonthPriorities.map((priority) => `<li>${priority}</li>`).join('')}
      </ol>
    </div>
    `;
    });
    html += `
    <div class="footer">
      <h3>About This Report</h3>
      <p>This monthly executive report consolidates 4 weekly reports into strategic insights.</p>
      <p>ZANTARA v5.2.0 - Intelligent Business Assistant</p>
      <p>© ${new Date().getFullYear()} Bali Zero. All data is confidential.</p>
    </div>
  </div>
</body>
</html>
  `;
    return html;
}
// Send monthly report to Zero
async function sendMonthlyReportToZero(htmlReport) {
    // Same as weekly but with different subject
    const subject = `ZANTARA Monthly Executive Report - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`;
    // Reuse the email sending logic
    try {
        const gmail = await getGmailService();
        if (!gmail) {
            return await saveReportToDrive(htmlReport);
        }
        const message = [
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            `To: ${ZERO_EMAIL}`,
            `From: ZANTARA Executive Reports <reports@balizero.com>`,
            `Subject: ${subject}`,
            '',
            htmlReport
        ].join('\n');
        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage
            }
        });
        logger.info(`✅ Monthly executive report sent to ${ZERO_EMAIL}`);
        return { success: true };
    }
    catch (error) {
        logger.error('Failed to send monthly email:', error.message);
        return await saveReportToDrive(htmlReport);
    }
}
// Schedule monthly report (last day of month)
export async function scheduleMonthlyReport() {
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    if (now.getDate() === lastDayOfMonth) {
        logger.info('📅 Last day of month detected - Running monthly report...');
        return await generateMonthlyReport();
    }
    else {
        const daysUntilEnd = lastDayOfMonth - now.getDate();
        return ok({
            message: `Monthly report scheduled for ${lastDayOfMonth}. Days remaining: ${daysUntilEnd}`,
            nextRun: new Date(now.getFullYear(), now.getMonth(), lastDayOfMonth, 9, 0, 0).toISOString()
        });
    }
}
// Export handlers
export const weeklyReportHandlers = {
    'report.weekly.generate': generateWeeklyReport,
    'report.weekly.schedule': scheduleWeeklyReport,
    'report.monthly.generate': generateMonthlyReport,
    'report.monthly.schedule': scheduleMonthlyReport
};
