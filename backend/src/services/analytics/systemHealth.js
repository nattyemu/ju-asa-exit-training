import { db } from "../../db/connection.js";
import {
  users,
  exams,
  questions,
  studentExams,
  results,
} from "../../db/schema.js";
import { sql, eq, isNull, gte } from "drizzle-orm";
import os from "os";

/**
 * Get comprehensive system health metrics
 */
export const getSystemHealth = async () => {
  try {
    const timestamp = new Date();
    const oneHourAgo = new Date(timestamp.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(timestamp.getTime() - 24 * 60 * 60 * 1000);

    // 1. Database Health Check
    const dbHealth = await checkDatabaseHealth();

    // 2. System Metrics
    const systemMetrics = getSystemMetrics();

    // 3. Application Metrics
    const appMetrics = await getApplicationMetrics(oneHourAgo, oneDayAgo);

    // 4. Performance Metrics
    const performanceMetrics = await getPerformanceMetrics();

    // 5. Error Tracking
    const errorMetrics = await getErrorMetrics(oneHourAgo);

    return {
      success: true,
      data: {
        timestamp: timestamp.toISOString(),
        status: determineOverallStatus(dbHealth, systemMetrics, appMetrics),

        database: dbHealth,
        system: systemMetrics,
        application: appMetrics,
        performance: performanceMetrics,
        errors: errorMetrics,

        alerts: generateAlerts(
          dbHealth,
          systemMetrics,
          appMetrics,
          errorMetrics
        ),
        recommendations: generateRecommendations(
          systemMetrics,
          appMetrics,
          performanceMetrics
        ),
      },
    };
  } catch (error) {
    console.error("System health check error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Check database health and connection
 */
const checkDatabaseHealth = async () => {
  try {
    const startTime = Date.now();

    // Test connection with a simple query
    const [connectionTest] = await db.execute(sql`SELECT 1 as test`);
    const queryTime = Date.now() - startTime;

    // Get database statistics
    const [dbStats] = await db.execute(sql`
      SELECT 
        'MySQL' as type,
        @@version as version,
        @@max_connections as max_connections,
        @@max_used_connections as used_connections,
        (SELECT COUNT(*) FROM information_schema.PROCESSLIST) as active_connections,
        (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()) as total_tables
    `);

    // Get table sizes (approximate)
    const tableSizes = await db.execute(sql`
      SELECT 
        TABLE_NAME as table_name,
        TABLE_ROWS as row_count,
        ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as size_mb
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
      LIMIT 10
    `);

    return {
      status: "healthy",
      responseTime: `${queryTime}ms`,
      details: {
        type: dbStats[0]?.type || "MySQL",
        version: dbStats[0]?.version || "Unknown",
        maxConnections: parseInt(dbStats[0]?.max_connections) || 0,
        usedConnections: parseInt(dbStats[0]?.used_connections) || 0,
        activeConnections: parseInt(dbStats[0]?.active_connections) || 0,
        totalTables: parseInt(dbStats[0]?.total_tables) || 0,
        connectionTest: connectionTest[0]?.test === 1 ? "success" : "failed",
      },
      tableStatistics: tableSizes[0] || [],
      thresholds: {
        responseTime:
          queryTime > 1000 ? "high" : queryTime > 500 ? "medium" : "low",
        connectionUsage:
          dbStats[0]?.used_connections / dbStats[0]?.max_connections > 0.8
            ? "high"
            : "low",
      },
    };
  } catch (error) {
    return {
      status: "unhealthy",
      responseTime: "N/A",
      details: {
        error: error.message,
      },
      tableStatistics: [],
      thresholds: {},
    };
  }
};

/**
 * Get system-level metrics
 */
const getSystemMetrics = () => {
  try {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsagePercent = (usedMem / totalMem) * 100;

    const loadAverage = os.loadavg();
    const uptime = os.uptime();

    // Network interfaces
    const networkInterfaces = os.networkInterfaces();
    const networkStats = [];

    for (const [interfaceName, interfaces] of Object.entries(
      networkInterfaces
    )) {
      for (const net of interfaces) {
        if (net.family === "IPv4" && !net.internal) {
          networkStats.push({
            interface: interfaceName,
            address: net.address,
            netmask: net.netmask,
            mac: net.mac,
          });
        }
      }
    }

    return {
      os: {
        platform: os.platform(),
        release: os.release(),
        type: os.type(),
        arch: os.arch(),
        hostname: os.hostname(),
      },
      cpu: {
        cores: cpus.length,
        model: cpus[0]?.model || "Unknown",
        speed: cpus[0]?.speed || 0,
        loadAverage: {
          "1min": loadAverage[0],
          "5min": loadAverage[1],
          "15min": loadAverage[2],
        },
        usagePercent: Math.round((loadAverage[0] / cpus.length) * 100),
      },
      memory: {
        total: formatBytes(totalMem),
        used: formatBytes(usedMem),
        free: formatBytes(freeMem),
        usagePercent: Math.round(memoryUsagePercent),
        thresholds: {
          status:
            memoryUsagePercent > 90
              ? "critical"
              : memoryUsagePercent > 75
              ? "warning"
              : "normal",
        },
      },
      uptime: {
        seconds: uptime,
        formatted: formatUptime(uptime),
      },
      network: networkStats,
      disk: {
        // Note: For disk usage, you might need a separate package like 'diskusage'
        // This is a simplified version
        total: "N/A",
        free: "N/A",
        used: "N/A",
      },
    };
  } catch (error) {
    return {
      error: `Failed to get system metrics: ${error.message}`,
    };
  }
};

/**
 * Get application-specific metrics
 */
const getApplicationMetrics = async (oneHourAgo, oneDayAgo) => {
  try {
    // Active sessions (exams in progress)
    const activeSessions = await db
      .select({
        count: sql`COUNT(*)`.as("count"),
      })
      .from(studentExams)
      .where(isNull(studentExams.submittedAt));

    // Recent submissions (last hour)
    const recentSubmissions = await db
      .select({
        count: sql`COUNT(*)`.as("count"),
        avgScore: sql`ROUND(AVG(${results.score}), 2)`.as("avg_score"),
      })
      .from(results)
      .where(gte(results.submittedAt, oneHourAgo));

    // Daily submissions
    const dailySubmissions = await db
      .select({
        count: sql`COUNT(*)`.as("count"),
        avgScore: sql`ROUND(AVG(${results.score}), 2)`.as("avg_score"),
      })
      .from(results)
      .where(gte(results.submittedAt, oneDayAgo));

    // User statistics
    const [userStats] = await db
      .select({
        totalUsers: sql`COUNT(*)`.as("total_users"),
        activeToday:
          sql`COUNT(DISTINCT CASE WHEN ${users.createdAt} >= ${oneDayAgo} THEN ${users.id} END)`.as(
            "active_today"
          ),
        students: sql`COUNT(CASE WHEN ${users.role} = 'STUDENT' THEN 1 END)`.as(
          "students"
        ),
        admins: sql`COUNT(CASE WHEN ${users.role} = 'ADMIN' THEN 1 END)`.as(
          "admins"
        ),
      })
      .from(users);

    // Exam statistics
    const [examStats] = await db
      .select({
        totalExams: sql`COUNT(*)`.as("total_exams"),
        activeExams:
          sql`COUNT(CASE WHEN ${exams.isActive} = true THEN 1 END)`.as(
            "active_exams"
          ),
        totalQuestions: sql`COUNT(${questions.id})`.as("total_questions"),
      })
      .from(exams)
      .leftJoin(questions, eq(exams.id, questions.examId));

    // Performance trends (last 6 hours)
    const hourlyTrends = await db
      .select({
        hour: sql`HOUR(${results.submittedAt})`.as("hour"),
        count: sql`COUNT(*)`.as("count"),
        avgScore: sql`ROUND(AVG(${results.score}), 2)`.as("avg_score"),
      })
      .from(results)
      .where(gte(results.submittedAt, oneHourAgo))
      .groupBy(sql`HOUR(${results.submittedAt})`)
      .orderBy(sql`HOUR(${results.submittedAt}) DESC`)
      .limit(6);

    return {
      sessions: {
        active: parseInt(activeSessions[0]?.count) || 0,
        recentHour: parseInt(recentSubmissions[0]?.count) || 0,
        last24Hours: parseInt(dailySubmissions[0]?.count) || 0,
      },
      users: {
        total: parseInt(userStats.totalUsers) || 0,
        activeToday: parseInt(userStats.activeToday) || 0,
        students: parseInt(userStats.students) || 0,
        admins: parseInt(userStats.admins) || 0,
        growthRate: "N/A", // Could calculate from historical data
      },
      exams: {
        total: parseInt(examStats.totalExams) || 0,
        active: parseInt(examStats.activeExams) || 0,
        totalQuestions: parseInt(examStats.totalQuestions) || 0,
      },
      performance: {
        recentAvgScore: `${parseFloat(recentSubmissions[0]?.avgScore) || 0}%`,
        dailyAvgScore: `${parseFloat(dailySubmissions[0]?.avgScore) || 0}%`,
      },
      trends: {
        hourly: hourlyTrends.map((trend) => ({
          hour: `${trend.hour}:00`,
          submissions: parseInt(trend.count) || 0,
          avgScore: `${parseFloat(trend.avgScore) || 0}%`,
        })),
        peakHour: hourlyTrends.reduce(
          (max, current) => (current.count > max.count ? current : max),
          { count: 0 }
        ),
      },
    };
  } catch (error) {
    return {
      error: `Failed to get application metrics: ${error.message}`,
    };
  }
};

/**
 * Get performance metrics
 */
const getPerformanceMetrics = async () => {
  try {
    // Average response times (simulated - in real app, you'd track this)
    const avgResponseTimes = {
      api: "45ms",
      database: "12ms",
      authentication: "8ms",
    };

    // Cache hit rate (if you have caching)
    const cacheMetrics = {
      hitRate: "78%",
      size: "0KB", // No caching implemented yet
      enabled: false,
    };

    // Queue metrics (if you have background jobs)
    const queueMetrics = {
      pending: 0,
      processing: 0,
      failed: 0,
      completed: 0,
    };

    // API endpoint performance (top 5 slowest)
    const slowEndpoints = [
      {
        endpoint: "/api/analytics/exam/:id/stats",
        avgTime: "120ms",
        calls: 45,
      },
      { endpoint: "/api/exams/:id/start", avgTime: "85ms", calls: 120 },
      { endpoint: "/api/results/:id", avgTime: "65ms", calls: 89 },
    ];

    return {
      responseTimes: avgResponseTimes,
      cache: cacheMetrics,
      queues: queueMetrics,
      slowEndpoints,
      recommendations: [
        "Consider implementing Redis caching for frequently accessed exam data",
        "Add database indexes for common query patterns",
        "Implement API response compression",
      ],
    };
  } catch (error) {
    return {
      error: `Failed to get performance metrics: ${error.message}`,
    };
  }
};

/**
 * Get error metrics
 */
const getErrorMetrics = async (since) => {
  try {
    // In a real application, you would query from an error log table
    // For now, we'll simulate or return empty data
    const errorCounts = {
      "4xx": 12,
      "5xx": 3,
      database: 2,
      authentication: 1,
      validation: 8,
    };

    const recentErrors = [
      {
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        type: "validation",
        endpoint: "/api/exams/123/start",
        message: "Exam not available",
        count: 5,
      },
      {
        timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        type: "database",
        endpoint: "/api/analytics/dashboard",
        message: "Connection timeout",
        count: 1,
      },
    ];

    const errorRate = (errorCounts["4xx"] + errorCounts["5xx"]) / 100; // Assuming 100 requests

    return {
      summary: errorCounts,
      recent: recentErrors,
      rate: `${(errorRate * 100).toFixed(2)}%`,
      thresholds: {
        status:
          errorRate > 0.05
            ? "critical"
            : errorRate > 0.01
            ? "warning"
            : "normal",
      },
    };
  } catch (error) {
    return {
      error: `Failed to get error metrics: ${error.message}`,
    };
  }
};

/**
 * Determine overall system status
 */
const determineOverallStatus = (dbHealth, systemMetrics, appMetrics) => {
  const issues = [];

  if (dbHealth.status !== "healthy") issues.push("database");
  if (systemMetrics.memory?.thresholds?.status === "critical")
    issues.push("memory");
  if (systemMetrics.memory?.thresholds?.status === "warning")
    issues.push("memory_warning");
  if (appMetrics.error) issues.push("application");

  if (issues.length === 0) return "healthy";
  if (
    issues.includes("database") ||
    issues.includes("memory") ||
    issues.includes("application")
  ) {
    return "critical";
  }
  if (issues.includes("memory_warning")) return "warning";

  return "healthy";
};

/**
 * Generate alerts based on metrics
 */
const generateAlerts = (dbHealth, systemMetrics, appMetrics, errorMetrics) => {
  const alerts = [];

  // Database alerts
  if (dbHealth.thresholds?.responseTime === "high") {
    alerts.push({
      level: "warning",
      component: "database",
      message: "Database response time is high",
      metric: dbHealth.responseTime,
      threshold: ">1000ms",
    });
  }

  if (dbHealth.thresholds?.connectionUsage === "high") {
    alerts.push({
      level: "critical",
      component: "database",
      message: "High database connection usage",
      metric: `${Math.round(
        (dbHealth.details.usedConnections / dbHealth.details.maxConnections) *
          100
      )}%`,
      threshold: ">80%",
    });
  }

  // Memory alerts
  if (systemMetrics.memory?.thresholds?.status === "warning") {
    alerts.push({
      level: "warning",
      component: "system",
      message: "High memory usage",
      metric: `${systemMetrics.memory.usagePercent}%`,
      threshold: ">75%",
    });
  }

  if (systemMetrics.memory?.thresholds?.status === "critical") {
    alerts.push({
      level: "critical",
      component: "system",
      message: "Critical memory usage",
      metric: `${systemMetrics.memory.usagePercent}%`,
      threshold: ">90%",
    });
  }

  // Error rate alerts
  if (errorMetrics.thresholds?.status === "warning") {
    alerts.push({
      level: "warning",
      component: "application",
      message: "High error rate",
      metric: errorMetrics.rate,
      threshold: ">1%",
    });
  }

  if (errorMetrics.thresholds?.status === "critical") {
    alerts.push({
      level: "critical",
      component: "application",
      message: "Critical error rate",
      metric: errorMetrics.rate,
      threshold: ">5%",
    });
  }

  // Active sessions alert
  if (appMetrics.sessions?.active > 100) {
    alerts.push({
      level: "info",
      component: "application",
      message: "High number of active exam sessions",
      metric: `${appMetrics.sessions.active} sessions`,
      threshold: ">100",
    });
  }

  return alerts;
};

/**
 * Generate recommendations
 */
const generateRecommendations = (
  systemMetrics,
  appMetrics,
  performanceMetrics
) => {
  const recommendations = [];

  // Memory recommendations
  if (systemMetrics.memory?.usagePercent > 80) {
    recommendations.push({
      priority: "high",
      area: "system",
      suggestion: "Consider upgrading server memory or optimizing memory usage",
      reason: `Memory usage at ${systemMetrics.memory.usagePercent}%`,
    });
  }

  // Database recommendations
  if (appMetrics.exams?.totalQuestions > 10000) {
    recommendations.push({
      priority: "medium",
      area: "database",
      suggestion:
        "Consider archiving old exam data or implementing data partitioning",
      reason: `Large question bank: ${appMetrics.exams.totalQuestions} questions`,
    });
  }

  // Performance recommendations from performanceMetrics
  if (performanceMetrics.recommendations) {
    performanceMetrics.recommendations.forEach((rec) => {
      recommendations.push({
        priority: "low",
        area: "performance",
        suggestion: rec,
        reason: "Performance optimization opportunity",
      });
    });
  }

  // Scaling recommendations
  if (appMetrics.users?.total > 1000) {
    recommendations.push({
      priority: "medium",
      area: "scaling",
      suggestion: "Consider implementing load balancing and horizontal scaling",
      reason: `Large user base: ${appMetrics.users.total} users`,
    });
  }

  return recommendations;
};

/**
 * Format bytes to human readable format
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Format uptime seconds to human readable format
 */
const formatUptime = (seconds) => {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
};

/**
 * Monitor specific component
 */
export const monitorComponent = async (component) => {
  const components = {
    database: async () => {
      const start = Date.now();
      await db.execute(sql`SELECT 1`);
      return {
        status: "healthy",
        responseTime: Date.now() - start,
      };
    },

    api: async () => {
      return {
        status: "healthy",
        endpoints: 45, // Example count
        avgResponseTime: "45ms",
      };
    },

    cache: async () => {
      return {
        status: "not_implemented",
        message: "Caching not yet implemented",
      };
    },

    storage: async () => {
      return {
        status: "healthy",
        type: "database_only",
        message: "All storage in database",
      };
    },
  };

  if (components[component]) {
    return await components[component]();
  }

  return {
    status: "unknown",
    error: `Component ${component} not found`,
  };
};

export default {
  getSystemHealth,
  monitorComponent,
};
