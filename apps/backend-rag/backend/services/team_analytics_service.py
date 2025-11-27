"""
Team Work Analytics Service
7 Advanced Techniques for Team Performance Analysis

Provides intelligent insights on:
1. Pattern Recognition - Work hour patterns and habits
2. Productivity Scoring - Session productivity metrics
3. Burnout Detection - Early warning signs
4. Performance Trends - Long-term performance analysis
5. Workload Balance - Team workload distribution
6. Optimal Hours - Best performance time windows
7. Team Insights - Collaboration and synergy analysis
"""

import logging
import statistics
from collections import defaultdict
from datetime import datetime, timedelta

import asyncpg

logger = logging.getLogger(__name__)


class TeamAnalyticsService:
    """
    Advanced analytics for team work sessions
    Provides 7 intelligent analysis techniques
    """

    def __init__(self, db_pool: asyncpg.Pool):
        self.pool = db_pool

    # ========================================
    # TECHNIQUE 1: PATTERN RECOGNITION
    # ========================================
    async def analyze_work_patterns(self, user_email: str | None = None, days: int = 30) -> dict:
        """
        Analyze work hour patterns and habits

        Returns:
        - Preferred start times
        - Typical session duration
        - Work day patterns (weekday vs weekend)
        - Consistency score
        """
        cutoff = datetime.now() - timedelta(days=days)

        # Get sessions
        if user_email:
            sessions = await self.pool.fetch(
                """
                SELECT session_start, duration_minutes,
                       EXTRACT(DOW FROM session_start) as day_of_week,
                       EXTRACT(HOUR FROM session_start) as start_hour
                FROM team_work_sessions
                WHERE user_email = $1
                AND session_start >= $2
                AND status = 'completed'
                ORDER BY session_start
            """,
                user_email,
                cutoff,
            )
        else:
            sessions = await self.pool.fetch(
                """
                SELECT user_email, session_start, duration_minutes,
                       EXTRACT(DOW FROM session_start) as day_of_week,
                       EXTRACT(HOUR FROM session_start) as start_hour
                FROM team_work_sessions
                WHERE session_start >= $1
                AND status = 'completed'
                ORDER BY session_start
            """,
                cutoff,
            )

        if not sessions:
            return {"error": "No sessions found"}

        # Analyze patterns
        start_hours = [float(s["start_hour"]) for s in sessions]
        durations = [float(s["duration_minutes"]) for s in sessions if s["duration_minutes"]]
        days_of_week = [s["day_of_week"] for s in sessions]

        # Calculate statistics
        avg_start_hour = statistics.mean(start_hours) if start_hours else 0
        std_start_hour = statistics.stdev(start_hours) if len(start_hours) > 1 else 0

        avg_duration = statistics.mean(durations) if durations else 0
        std_duration = statistics.stdev(durations) if len(durations) > 1 else 0

        # Day distribution
        day_counts = defaultdict(int)
        for day in days_of_week:
            day_counts[day] += 1

        # Consistency score (0-100, higher = more consistent)
        time_consistency = max(0, 100 - (std_start_hour * 10))
        duration_consistency = max(0, 100 - (std_duration / 6))
        consistency_score = (time_consistency + duration_consistency) / 2

        return {
            "patterns": {
                "avg_start_hour": round(avg_start_hour, 1),
                "start_hour_variance": round(std_start_hour, 2),
                "preferred_start_time": f"{int(avg_start_hour):02d}:{int((avg_start_hour % 1) * 60):02d}",
                "avg_session_duration_hours": round(avg_duration / 60, 2),
                "duration_variance_minutes": round(std_duration, 1),
            },
            "day_distribution": {
                "weekdays": sum(day_counts[d] for d in range(1, 6)),  # Mon-Fri
                "weekends": sum(day_counts[d] for d in [0, 6]),  # Sun, Sat
            },
            "consistency_score": round(consistency_score, 1),
            "consistency_rating": (
                "Excellent"
                if consistency_score >= 80
                else "Good"
                if consistency_score >= 60
                else "Fair"
                if consistency_score >= 40
                else "Variable"
            ),
            "total_sessions_analyzed": len(sessions),
            "period_days": days,
        }

    # ========================================
    # TECHNIQUE 2: PRODUCTIVITY SCORING
    # ========================================
    async def calculate_productivity_scores(self, days: int = 7) -> list[dict]:
        """
        Calculate productivity score for each team member

        Score based on:
        - Conversations per hour
        - Activities per hour
        - Session consistency
        - Work time efficiency
        """
        cutoff = datetime.now() - timedelta(days=days)

        sessions = await self.pool.fetch(
            """
            SELECT user_name, user_email,
                   SUM(duration_minutes) as total_minutes,
                   SUM(conversations_count) as total_conversations,
                   SUM(activities_count) as total_activities,
                   COUNT(*) as session_count
            FROM team_work_sessions
            WHERE session_start >= $1 AND status = 'completed'
            GROUP BY user_name, user_email
        """,
            cutoff,
        )

        results = []
        for s in sessions:
            total_hours = (s["total_minutes"] or 0) / 60
            if total_hours == 0:
                continue

            # Calculate metrics
            conversations_per_hour = (s["total_conversations"] or 0) / total_hours
            activities_per_hour = (s["total_activities"] or 0) / total_hours
            avg_session_hours = total_hours / s["session_count"]

            # Productivity score (0-100)
            # - 40% from conversation rate (target: 2-5 per hour)
            # - 30% from activity rate (target: 10-30 per hour)
            # - 30% from session length consistency (target: 4-8 hours)

            conv_score = min(100, (conversations_per_hour / 5) * 100) * 0.4
            activity_score = min(100, (activities_per_hour / 30) * 100) * 0.3

            # Session length score (optimal 4-8 hours)
            if 4 <= avg_session_hours <= 8:
                length_score = 100 * 0.3
            elif avg_session_hours < 4:
                length_score = (avg_session_hours / 4) * 100 * 0.3
            else:
                length_score = max(0, (1 - (avg_session_hours - 8) / 4)) * 100 * 0.3

            productivity_score = conv_score + activity_score + length_score

            results.append(
                {
                    "user": s["user_name"],
                    "email": s["user_email"],
                    "productivity_score": round(productivity_score, 1),
                    "rating": (
                        "Excellent"
                        if productivity_score >= 80
                        else "Good"
                        if productivity_score >= 60
                        else "Fair"
                        if productivity_score >= 40
                        else "Needs Attention"
                    ),
                    "metrics": {
                        "conversations_per_hour": round(conversations_per_hour, 2),
                        "activities_per_hour": round(activities_per_hour, 2),
                        "avg_session_hours": round(avg_session_hours, 2),
                        "total_hours": round(total_hours, 2),
                        "sessions": s["session_count"],
                    },
                }
            )

        # Sort by score descending
        results.sort(key=lambda x: x["productivity_score"], reverse=True)
        return results

    # ========================================
    # TECHNIQUE 3: BURNOUT DETECTION
    # ========================================
    async def detect_burnout_signals(self, user_email: str | None = None) -> list[dict]:
        """
        Detect early warning signs of burnout

        Warning signals:
        - Increasing work hours over time
        - Decreasing conversations per hour (efficiency drop)
        - Working on weekends frequently
        - Very long sessions (>10 hours)
        - Inconsistent work patterns
        """
        cutoff = datetime.now() - timedelta(days=30)

        if user_email:
            sessions = await self.pool.fetch(
                """
                SELECT user_name, user_email, session_start, duration_minutes,
                       conversations_count, activities_count,
                       EXTRACT(DOW FROM session_start) as day_of_week
                FROM team_work_sessions
                WHERE user_email = $1
                AND session_start >= $2
                AND status = 'completed'
                ORDER BY session_start
            """,
                user_email,
                cutoff,
            )
        else:
            sessions = await self.pool.fetch(
                """
                SELECT user_name, user_email, session_start, duration_minutes,
                       conversations_count, activities_count,
                       EXTRACT(DOW FROM session_start) as day_of_week
                FROM team_work_sessions
                WHERE session_start >= $1
                AND status = 'completed'
                ORDER BY session_start
            """,
                cutoff,
            )

        # Group by user
        user_sessions = defaultdict(list)
        for s in sessions:
            user_sessions[s["user_email"]].append(s)

        results = []
        for email, user_sess in user_sessions.items():
            if len(user_sess) < 3:  # Need at least 3 sessions
                continue

            warnings = []
            risk_score = 0

            # Check 1: Increasing hours trend
            recent_hours = sum(s["duration_minutes"] for s in user_sess[-5:]) / 60
            older_hours = sum(s["duration_minutes"] for s in user_sess[:5]) / 60
            if recent_hours > older_hours * 1.3:
                warnings.append("📈 Work hours increasing (+30%)")
                risk_score += 25

            # Check 2: Very long sessions (>10 hours)
            long_sessions = sum(1 for s in user_sess if (s["duration_minutes"] or 0) > 600)
            if long_sessions >= 2:
                warnings.append(f"⏰ {long_sessions} very long sessions (>10h)")
                risk_score += 20

            # Check 3: Weekend work
            weekend_sessions = sum(1 for s in user_sess if s["day_of_week"] in [0, 6])
            if weekend_sessions >= 2:
                warnings.append(f"📅 Working {weekend_sessions} weekends")
                risk_score += 15

            # Check 4: Declining efficiency
            if len(user_sess) >= 6:
                recent_conv_per_hour = sum(s["conversations_count"] for s in user_sess[-3:]) / (
                    sum(s["duration_minutes"] for s in user_sess[-3:]) / 60
                )
                older_conv_per_hour = sum(s["conversations_count"] for s in user_sess[:3]) / (
                    sum(s["duration_minutes"] for s in user_sess[:3]) / 60
                )
                if recent_conv_per_hour < older_conv_per_hour * 0.7:
                    warnings.append("📉 Conversation efficiency dropped -30%")
                    risk_score += 20

            # Check 5: Inconsistent patterns
            durations = [s["duration_minutes"] for s in user_sess if s["duration_minutes"]]
            if len(durations) > 3:
                std_duration = statistics.stdev(durations)
                avg_duration = statistics.mean(durations)
                if std_duration > avg_duration * 0.5:
                    warnings.append("🔄 Highly inconsistent work patterns")
                    risk_score += 20

            if warnings:
                results.append(
                    {
                        "user": user_sess[0]["user_name"],
                        "email": email,
                        "burnout_risk_score": min(100, risk_score),
                        "risk_level": (
                            "High Risk"
                            if risk_score >= 60
                            else "Medium Risk"
                            if risk_score >= 40
                            else "Low Risk"
                        ),
                        "warning_signals": warnings,
                        "warning_count": len(warnings),
                        "total_sessions_analyzed": len(user_sess),
                    }
                )

        # Sort by risk score descending
        results.sort(key=lambda x: x["burnout_risk_score"], reverse=True)
        return results

    # ========================================
    # TECHNIQUE 4: PERFORMANCE TRENDS
    # ========================================
    async def analyze_performance_trends(self, user_email: str, weeks: int = 4) -> dict:
        """
        Analyze performance trends over time
        Returns week-by-week trend data
        """
        cutoff = datetime.now() - timedelta(weeks=weeks)

        sessions = await self.pool.fetch(
            """
            SELECT session_start, duration_minutes, conversations_count, activities_count
            FROM team_work_sessions
            WHERE user_email = $1
            AND session_start >= $2
            AND status = 'completed'
            ORDER BY session_start
        """,
            user_email,
            cutoff,
        )

        if not sessions:
            return {"error": "No sessions found"}

        # Group by week
        weekly_data = defaultdict(
            lambda: {"hours": 0, "conversations": 0, "activities": 0, "sessions": 0}
        )

        for s in sessions:
            week_start = s["session_start"] - timedelta(days=s["session_start"].weekday())
            week_key = week_start.strftime("%Y-W%U")

            weekly_data[week_key]["hours"] += (s["duration_minutes"] or 0) / 60
            weekly_data[week_key]["conversations"] += s["conversations_count"] or 0
            weekly_data[week_key]["activities"] += s["activities_count"] or 0
            weekly_data[week_key]["sessions"] += 1

        # Convert to sorted list
        weeks = []
        for week_key in sorted(weekly_data.keys()):
            data = weekly_data[week_key]
            weeks.append(
                {
                    "week": week_key,
                    "hours": round(data["hours"], 2),
                    "conversations": data["conversations"],
                    "activities": data["activities"],
                    "sessions": data["sessions"],
                    "conversations_per_hour": round(data["conversations"] / data["hours"], 2)
                    if data["hours"] > 0
                    else 0,
                }
            )

        # Calculate trend
        if len(weeks) >= 2:
            first_half_hours = sum(w["hours"] for w in weeks[: len(weeks) // 2])
            second_half_hours = sum(w["hours"] for w in weeks[len(weeks) // 2 :])
            trend_direction = "Increasing" if second_half_hours > first_half_hours else "Decreasing"
        else:
            trend_direction = "Stable"

        return {
            "weekly_breakdown": weeks,
            "trend": {"direction": trend_direction, "total_weeks_analyzed": len(weeks)},
            "averages": {
                "hours_per_week": round(sum(w["hours"] for w in weeks) / len(weeks), 2)
                if weeks
                else 0,
                "conversations_per_week": round(
                    sum(w["conversations"] for w in weeks) / len(weeks), 1
                )
                if weeks
                else 0,
            },
        }

    # ========================================
    # TECHNIQUE 5: WORKLOAD BALANCE
    # ========================================
    async def analyze_workload_balance(self, days: int = 7) -> dict:
        """
        Analyze workload distribution across team
        Identifies imbalances and suggests redistribution
        """
        cutoff = datetime.now() - timedelta(days=days)

        sessions = await self.pool.fetch(
            """
            SELECT user_name, user_email,
                   SUM(duration_minutes) as total_minutes,
                   SUM(conversations_count) as total_conversations,
                   COUNT(*) as session_count
            FROM team_work_sessions
            WHERE session_start >= $1 AND status = 'completed'
            GROUP BY user_name, user_email
        """,
            cutoff,
        )

        if not sessions:
            return {"error": "No sessions found"}

        team_stats = []
        total_hours = 0
        total_conversations = 0

        for s in sessions:
            hours = (s["total_minutes"] or 0) / 60
            total_hours += hours
            total_conversations += s["total_conversations"] or 0

            team_stats.append(
                {
                    "user": s["user_name"],
                    "email": s["user_email"],
                    "hours": round(hours, 2),
                    "conversations": s["total_conversations"] or 0,
                    "sessions": s["session_count"],
                }
            )

        # Calculate shares and ideal distribution
        team_size = len(team_stats)
        ideal_hours_per_person = total_hours / team_size if team_size > 0 else 0

        for stat in team_stats:
            stat["hours_share_percent"] = (
                round((stat["hours"] / total_hours * 100), 1) if total_hours > 0 else 0
            )
            stat["conversations_share_percent"] = (
                round((stat["conversations"] / total_conversations * 100), 1)
                if total_conversations > 0
                else 0
            )
            stat["deviation_from_ideal"] = round(stat["hours"] - ideal_hours_per_person, 2)

        # Sort by hours descending
        team_stats.sort(key=lambda x: x["hours"], reverse=True)

        # Calculate balance score
        hours_list = [s["hours"] for s in team_stats]
        if len(hours_list) > 1:
            std_hours = statistics.stdev(hours_list)
            avg_hours = statistics.mean(hours_list)
            coefficient_variation = (std_hours / avg_hours) * 100 if avg_hours > 0 else 0
            balance_score = max(0, 100 - coefficient_variation)
        else:
            balance_score = 100

        return {
            "team_distribution": team_stats,
            "balance_metrics": {
                "balance_score": round(balance_score, 1),
                "balance_rating": (
                    "Well Balanced"
                    if balance_score >= 80
                    else "Moderately Balanced"
                    if balance_score >= 60
                    else "Imbalanced"
                ),
                "ideal_hours_per_person": round(ideal_hours_per_person, 2),
                "total_team_hours": round(total_hours, 2),
                "team_size": team_size,
            },
            "recommendations": self._generate_workload_recommendations(
                team_stats, ideal_hours_per_person
            ),
        }

    def _generate_workload_recommendations(self, team_stats: list[dict], ideal: float) -> list[str]:
        """Generate workload redistribution recommendations"""
        recommendations = []

        overworked = [s for s in team_stats if s["deviation_from_ideal"] > ideal * 0.3]
        underutilized = [s for s in team_stats if s["deviation_from_ideal"] < -ideal * 0.3]

        if overworked:
            for s in overworked:
                recommendations.append(
                    f"⚠️ {s['user']} is working {abs(s['deviation_from_ideal']):.1f}h above average - consider redistributing tasks"
                )

        if underutilized:
            for s in underutilized:
                recommendations.append(
                    f"💡 {s['user']} has capacity for {abs(s['deviation_from_ideal']):.1f}h more work"
                )

        if not recommendations:
            recommendations.append("✅ Team workload is well balanced")

        return recommendations

    # ========================================
    # TECHNIQUE 6: OPTIMAL HOURS
    # ========================================
    async def identify_optimal_hours(self, user_email: str | None = None, days: int = 30) -> dict:
        """
        Identify most productive time windows
        Based on conversations-per-hour by time of day
        """
        cutoff = datetime.now() - timedelta(days=days)

        if user_email:
            sessions = await self.pool.fetch(
                """
                SELECT EXTRACT(HOUR FROM session_start) as hour,
                       duration_minutes, conversations_count
                FROM team_work_sessions
                WHERE user_email = $1
                AND session_start >= $2
                AND status = 'completed'
                AND duration_minutes > 0
            """,
                user_email,
                cutoff,
            )
        else:
            sessions = await self.pool.fetch(
                """
                SELECT EXTRACT(HOUR FROM session_start) as hour,
                       duration_minutes, conversations_count
                FROM team_work_sessions
                WHERE session_start >= $1
                AND status = 'completed'
                AND duration_minutes > 0
            """,
                cutoff,
            )

        if not sessions:
            return {"error": "No sessions found"}

        # Group by hour
        hourly_data = defaultdict(lambda: {"total_minutes": 0, "total_conversations": 0})

        for s in sessions:
            hour = int(s["hour"])
            hourly_data[hour]["total_minutes"] += s["duration_minutes"] or 0
            hourly_data[hour]["total_conversations"] += s["conversations_count"] or 0

        # Calculate productivity by hour
        hourly_productivity = []
        for hour in range(24):
            if hour in hourly_data:
                data = hourly_data[hour]
                total_hours = data["total_minutes"] / 60
                conv_per_hour = data["total_conversations"] / total_hours if total_hours > 0 else 0

                hourly_productivity.append(
                    {
                        "hour": f"{hour:02d}:00",
                        "conversations_per_hour": round(conv_per_hour, 2),
                        "total_hours_worked": round(total_hours, 2),
                        "total_conversations": data["total_conversations"],
                    }
                )

        # Sort by productivity
        hourly_productivity.sort(key=lambda x: x["conversations_per_hour"], reverse=True)

        # Identify peak hours
        peak_hours = (
            hourly_productivity[:3] if len(hourly_productivity) >= 3 else hourly_productivity
        )

        return {
            "optimal_windows": peak_hours,
            "all_hours": hourly_productivity,
            "recommendation": f"Most productive: {', '.join(h['hour'] for h in peak_hours)}",
        }

    # ========================================
    # TECHNIQUE 7: TEAM INSIGHTS
    # ========================================
    async def generate_team_insights(self, days: int = 7) -> dict:
        """
        Generate comprehensive team collaboration insights

        Provides:
        - Team sync patterns (who works when)
        - Collaboration opportunities
        - Team health score
        - Key metrics
        """
        cutoff = datetime.now() - timedelta(days=days)

        # Get all team sessions
        sessions = await self.pool.fetch(
            """
            SELECT user_name, user_email, session_start, session_end,
                   duration_minutes, conversations_count, activities_count,
                   EXTRACT(HOUR FROM session_start) as start_hour,
                   EXTRACT(DOW FROM session_start) as day_of_week
            FROM team_work_sessions
            WHERE session_start >= $1 AND status = 'completed'
            ORDER BY session_start
        """,
            cutoff,
        )

        if not sessions:
            return {"error": "No team sessions found"}

        # Calculate team metrics
        total_hours = sum((s["duration_minutes"] or 0) / 60 for s in sessions)
        total_conversations = sum(s["conversations_count"] or 0 for s in sessions)
        total_activities = sum(s["activities_count"] or 0 for s in sessions)

        unique_members = len(set(s["user_email"] for s in sessions))

        # Find overlap periods (when multiple people work)
        overlap_hours = defaultdict(set)
        for s in sessions:
            if s["session_start"] and s["session_end"]:
                start_hour = int(s["start_hour"])
                duration_hours = (s["duration_minutes"] or 0) / 60
                for h in range(start_hour, min(24, start_hour + int(duration_hours) + 1)):
                    overlap_hours[h].add(s["user_email"])

        # Identify best collaboration windows
        collaboration_windows = []
        for hour, members in overlap_hours.items():
            if len(members) >= 2:
                collaboration_windows.append(
                    {
                        "hour": f"{hour:02d}:00",
                        "team_members_online": len(members),
                        "members": list(members),
                    }
                )

        collaboration_windows.sort(key=lambda x: x["team_members_online"], reverse=True)

        # Team health score (0-100)
        # Based on: participation, workload balance, productivity
        participation_score = min(100, (unique_members / max(1, unique_members)) * 100)
        productivity_score = min(100, (total_conversations / max(1, total_hours)) * 20)

        team_health_score = (participation_score + productivity_score) / 2

        return {
            "team_summary": {
                "active_members": unique_members,
                "total_hours_worked": round(total_hours, 2),
                "total_conversations": total_conversations,
                "total_activities": total_activities,
                "avg_hours_per_member": round(total_hours / unique_members, 2)
                if unique_members > 0
                else 0,
                "avg_conversations_per_member": round(total_conversations / unique_members, 1)
                if unique_members > 0
                else 0,
            },
            "team_health_score": round(team_health_score, 1),
            "health_rating": (
                "Excellent"
                if team_health_score >= 80
                else "Good"
                if team_health_score >= 60
                else "Fair"
                if team_health_score >= 40
                else "Needs Attention"
            ),
            "collaboration_windows": collaboration_windows[:5],  # Top 5
            "insights": self._generate_team_insights_text(
                unique_members,
                total_hours,
                total_conversations,
                collaboration_windows,
                team_health_score,
            ),
            "period_days": days,
        }

    def _generate_team_insights_text(
        self,
        members: int,
        hours: float,
        conversations: int,
        collab_windows: list[dict],
        health_score: float,
    ) -> list[str]:
        """Generate human-readable insights"""
        insights = []

        insights.append(f"👥 {members} active team members this period")
        insights.append(f"⏰ {round(hours, 1)} total hours worked")
        insights.append(f"💬 {conversations} conversations handled")

        if collab_windows:
            best_window = collab_windows[0]
            insights.append(
                f"🤝 Best collaboration time: {best_window['hour']} "
                f"({best_window['team_members_online']} members typically online)"
            )

        if health_score >= 80:
            insights.append("✅ Team is performing excellently")
        elif health_score >= 60:
            insights.append("👍 Team is performing well")
        else:
            insights.append("⚠️ Team performance could be improved")

        return insights
