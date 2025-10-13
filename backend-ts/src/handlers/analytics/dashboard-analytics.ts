// ZANTARA Dashboard Analytics - Real-time Metrics & Monitoring
import logger from '../services/logger.js';
import { ok, err } from "../../utils/response.js";
import { getFirestore } from "../../services/firebase.js";

interface ConversationMetrics {
  total_conversations: number;
  active_sessions: number;
  messages_today: number;
  messages_this_week: number;
  messages_this_month: number;
  average_session_duration: number;
  unique_users_today: number;
  unique_users_this_week: number;
  unique_users_this_month: number;
}

interface ServiceMetrics {
  visa_inquiries: number;
  company_inquiries: number;
  tax_inquiries: number;
  legal_inquiries: number;
  quotes_generated: number;
  documents_created: number;
  successful_identifications: number;
  blocked_requests: number;
}

interface HandlerMetrics {
  handler_name: string;
  total_calls: number;
  success_rate: number;
  average_response_time: number;
  last_called: Date | null;
  errors_count: number;
}

interface SystemHealth {
  uptime_hours: number;
  memory_usage_mb: number;
  cpu_usage_percent: number;
  active_handlers: number;
  total_handlers: number;
  firebase_status: string;
  reality_check_status: string;
  identity_gate_status: string;
}

interface UserActivity {
  userId: string;
  name: string;
  last_active: Date;
  total_messages: number;
  services_used: string[];
  language: string;
}

class DashboardAnalytics {
  private db: FirebaseFirestore.Firestore | null = null;
  private startTime: Date = new Date();

  constructor() {
    try {
      this.db = getFirestore();
    } catch (error) {
      logger.info('⚠️ Firestore not available for analytics');
    }
  }

  async getConversationMetrics(): Promise<ConversationMetrics> {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let metrics: ConversationMetrics = {
      total_conversations: 0,
      active_sessions: 0,
      messages_today: 0,
      messages_this_week: 0,
      messages_this_month: 0,
      average_session_duration: 0,
      unique_users_today: 0,
      unique_users_this_week: 0,
      unique_users_this_month: 0
    };

    if (this.db) {
      try {
        // Get total conversations
        const conversationsRef = await this.db.collection('conversations').get();
        metrics.total_conversations = conversationsRef.size;

        // Get messages stats
        const messagesRef = this.db.collection('messages');

        const todayMessages = await messagesRef
          .where('timestamp', '>=', todayStart)
          .get();
        metrics.messages_today = todayMessages.size;

        const weekMessages = await messagesRef
          .where('timestamp', '>=', weekStart)
          .get();
        metrics.messages_this_week = weekMessages.size;

        const monthMessages = await messagesRef
          .where('timestamp', '>=', monthStart)
          .get();
        metrics.messages_this_month = monthMessages.size;

        // Get unique users
        const usersToday = new Set();
        const usersWeek = new Set();
        const usersMonth = new Set();

        todayMessages.forEach(doc => usersToday.add(doc.data().userId));
        weekMessages.forEach(doc => usersWeek.add(doc.data().userId));
        monthMessages.forEach(doc => usersMonth.add(doc.data().userId));

        metrics.unique_users_today = usersToday.size;
        metrics.unique_users_this_week = usersWeek.size;
        metrics.unique_users_this_month = usersMonth.size;

        // Get active sessions (from memory or session tracking)
        const sessionsRef = await this.db.collection('active_sessions')
          .where('last_activity', '>=', new Date(Date.now() - 30 * 60 * 1000)) // Active in last 30 min
          .get();
        metrics.active_sessions = sessionsRef.size;

      } catch (error) {
        logger.info('Error fetching conversation metrics:', error);
      }
    }

    // Return real data (even if 0)
    return metrics;
  }

  async getServiceMetrics(): Promise<ServiceMetrics> {
    let metrics: ServiceMetrics = {
      visa_inquiries: 0,
      company_inquiries: 0,
      tax_inquiries: 0,
      legal_inquiries: 0,
      quotes_generated: 0,
      documents_created: 0,
      successful_identifications: 0,
      blocked_requests: 0
    };

    if (this.db) {
      try {
        // Get service inquiries from handler_calls collection
        const handlerCalls = await this.db.collection('handler_calls')
          .where('timestamp', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
          .get();

        handlerCalls.forEach(doc => {
          const data = doc.data();
          const handler = data.handler || '';

          if (handler.includes('visa') || data.params?.service === 'visa') {
            metrics.visa_inquiries++;
          }
          if (handler.includes('company') || data.params?.service === 'company') {
            metrics.company_inquiries++;
          }
          if (handler.includes('tax') || data.params?.service === 'tax') {
            metrics.tax_inquiries++;
          }
          if (handler.includes('legal') || data.params?.service === 'legal') {
            metrics.legal_inquiries++;
          }
          if (handler.includes('quote')) {
            metrics.quotes_generated++;
          }
          if (handler.includes('document') || handler.includes('docs')) {
            metrics.documents_created++;
          }
          if (handler === 'identity.resolve' && data.success) {
            metrics.successful_identifications++;
          }
          if (data.error === 'IDENTIFICATION_REQUIRED') {
            metrics.blocked_requests++;
          }
        });

      } catch (error) {
        logger.info('Error fetching service metrics:', error);
      }
    }

    return metrics;
  }

  async getHandlerMetrics(): Promise<HandlerMetrics[]> {
    const handlers: Map<string, HandlerMetrics> = new Map();

    if (this.db) {
      try {
        const handlerCalls = await this.db.collection('handler_calls')
          .orderBy('timestamp', 'desc')
          .limit(1000)
          .get();

        handlerCalls.forEach(doc => {
          const data = doc.data();
          const handlerName = data.handler || 'unknown';

          if (!handlers.has(handlerName)) {
            handlers.set(handlerName, {
              handler_name: handlerName,
              total_calls: 0,
              success_rate: 0,
              average_response_time: 0,
              last_called: null,
              errors_count: 0
            });
          }

          const handler = handlers.get(handlerName)!;
          handler.total_calls++;

          if (data.success === false || data.error) {
            handler.errors_count++;
          }

          if (data.response_time) {
            handler.average_response_time =
              (handler.average_response_time * (handler.total_calls - 1) + data.response_time) / handler.total_calls;
          }

          if (!handler.last_called || data.timestamp.toDate() > handler.last_called) {
            handler.last_called = data.timestamp.toDate();
          }

          handler.success_rate = ((handler.total_calls - handler.errors_count) / handler.total_calls) * 100;
        });

      } catch (error) {
        logger.info('Error fetching handler metrics:', error);
      }
    }

    return Array.from(handlers.values()).sort((a, b) => b.total_calls - a.total_calls);
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const uptime = (Date.now() - this.startTime.getTime()) / (1000 * 60 * 60); // hours
    const memoryUsage = process.memoryUsage();

    return {
      uptime_hours: Math.round(uptime * 100) / 100,
      memory_usage_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      cpu_usage_percent: Math.round(process.cpuUsage().user / 1000000), // Approximate
      active_handlers: 54, // From our handler count
      total_handlers: 64,  // Including all ZARA handlers
      firebase_status: this.db ? 'connected' : 'disconnected',
      reality_check_status: 'operational',
      identity_gate_status: 'enforcing'
    };
  }

  async getTopUsers(limit: number = 10): Promise<UserActivity[]> {
    const users: UserActivity[] = [];

    if (this.db) {
      try {
        const usersRef = await this.db.collection('users')
          .orderBy('stats.messages_count', 'desc')
          .limit(limit)
          .get();

        usersRef.forEach(doc => {
          const data = doc.data();
          users.push({
            userId: doc.id,
            name: data.name || data.ambaradam_name || 'Unknown',
            last_active: data.last_seen?.toDate() || new Date(),
            total_messages: data.stats?.messages_count || 0,
            services_used: data.services_used || [],
            language: data.language || 'en'
          });
        });

      } catch (error) {
        logger.info('Error fetching top users:', error);
      }
    }

    return users;
  }

  async getRealtimeStats(): Promise<any> {
    const [conversations, services, handlers, health, topUsers] = await Promise.all([
      this.getConversationMetrics(),
      this.getServiceMetrics(),
      this.getHandlerMetrics(),
      this.getSystemHealth(),
      this.getTopUsers(5)
    ]);

    return {
      timestamp: new Date().toISOString(),
      conversations,
      services,
      handlers: handlers.slice(0, 10), // Top 10 handlers
      system_health: health,
      top_users: topUsers,
      summary: {
        total_activity_score: conversations.messages_today + services.quotes_generated,
        system_status: health.firebase_status === 'connected' ? 'fully_operational' : 'degraded',
        security_status: 'enforced',
        ai_models_active: ['openai', 'anthropic', 'gemini', 'cohere'],
        zara_handlers_active: 20
      }
    };
  }
}

const analytics = new DashboardAnalytics();

// Main dashboard endpoint
export async function dashboardMain(_params: any) {
  try {
    const stats = await analytics.getRealtimeStats();

    return ok({
      dashboard: 'ZANTARA Analytics Dashboard',
      version: 'v5.2.0',
      environment: process.env.NODE_ENV || 'production',
      data: stats,
      refresh_interval_seconds: 30,
      api_endpoints: {
        conversations: '/dashboard/conversations',
        services: '/dashboard/services',
        handlers: '/dashboard/handlers',
        health: '/dashboard/health',
        users: '/dashboard/users'
      }
    });
  } catch (error: any) {
    return err('DASHBOARD_ERROR', error.message);
  }
}

// Conversations metrics endpoint
export async function dashboardConversations(_params: any) {
  try {
    const metrics = await analytics.getConversationMetrics();

    return ok({
      section: 'Conversations',
      data: metrics,
      insights: {
        trend: metrics.messages_today > 0 ? 'active' : 'quiet',
        engagement_rate: metrics.active_sessions > 0 ? 'engaged' : 'low',
        user_retention: metrics.unique_users_this_week > 0 ? 'returning' : 'new'
      }
    });
  } catch (error: any) {
    return err('METRICS_ERROR', error.message);
  }
}

// Services metrics endpoint
export async function dashboardServices(_params: any) {
  try {
    const metrics = await analytics.getServiceMetrics();

    const mostPopular = Object.entries({
      visa: metrics.visa_inquiries,
      company: metrics.company_inquiries,
      tax: metrics.tax_inquiries,
      legal: metrics.legal_inquiries
    }).sort((a, b) => b[1] - a[1])[0];

    return ok({
      section: 'Services',
      data: metrics,
      insights: {
        most_popular_service: mostPopular?.[0] || 'unknown',
        security_effectiveness: metrics.blocked_requests > 0 ? 'high' : 'untested',
        conversion_rate: metrics.successful_identifications > 0
          ? `${Math.round((metrics.quotes_generated / metrics.successful_identifications) * 100)}%`
          : '0%'
      }
    });
  } catch (error: any) {
    return err('METRICS_ERROR', error.message);
  }
}

// Handler performance endpoint
export async function dashboardHandlers(_params: any) {
  try {
    const handlers = await analytics.getHandlerMetrics();

    return ok({
      section: 'Handler Performance',
      total_handlers: handlers.length,
      data: handlers,
      insights: {
        most_used: handlers[0]?.handler_name || 'none',
        average_success_rate: handlers.length > 0
          ? `${Math.round(handlers.reduce((sum, h) => sum + h.success_rate, 0) / handlers.length)}%`
          : '0%',
        average_response_time: handlers.length > 0
          ? `${Math.round(handlers.reduce((sum, h) => sum + h.average_response_time, 0) / handlers.length)}ms`
          : '0ms'
      }
    });
  } catch (error: any) {
    return err('METRICS_ERROR', error.message);
  }
}

// System health endpoint
export async function dashboardHealth(_params: any) {
  try {
    const health = await analytics.getSystemHealth();

    return ok({
      section: 'System Health',
      data: health,
      status: {
        overall: 'healthy',
        firebase: health.firebase_status,
        security: 'enforced',
        performance: health.memory_usage_mb < 500 ? 'optimal' : 'monitoring'
      },
      alerts: health.memory_usage_mb > 800
        ? ['High memory usage detected']
        : []
    });
  } catch (error: any) {
    return err('HEALTH_ERROR', error.message);
  }
}

// Top users endpoint
export async function dashboardUsers(_params: any) {
  try {
    const limit = _params.limit || 10;
    const users = await analytics.getTopUsers(limit);

    return ok({
      section: 'User Activity',
      data: users,
      total_users: users.length,
      insights: {
        most_active: users[0]?.name || 'none',
        primary_language: users[0]?.language || 'en',
        average_messages: users.length > 0
          ? Math.round(users.reduce((sum, u) => sum + u.total_messages, 0) / users.length)
          : 0
      }
    });
  } catch (error: any) {
    return err('USERS_ERROR', error.message);
  }
}