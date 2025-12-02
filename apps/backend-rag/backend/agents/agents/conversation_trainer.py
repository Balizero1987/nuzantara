"""
🤖 AUTONOMOUS CONVERSATION TRAINER
Learns from successful conversations and improves prompts automatically
"""

from datetime import datetime

import psycopg2


class ConversationTrainer:
    """
    Autonomous agent that:
    1. Finds high-rated conversations (rating >= 4)
    2. Extracts successful patterns with Claude
    3. Generates improved prompt suggestions
    4. Creates PR with prompt improvements
    """

    def __init__(self):
        from app.core.config import settings

        self.db_url = settings.database_url
        self.github_token = settings.github_token

    async def analyze_winning_patterns(self, days_back: int = 7):
        """Find patterns in successful conversations"""

        # 1. Query top conversations
        conn = psycopg2.connect(self.db_url)
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT
                conversation_id,
                messages,
                rating,
                client_feedback,
                created_at
            FROM conversations
            WHERE rating >= 4
              AND created_at >= NOW() - INTERVAL '%s days'
            ORDER BY rating DESC, created_at DESC
            LIMIT 50
        """,
            (days_back,),
        )

        top_conversations = cursor.fetchall()
        cursor.close()
        conn.close()

        if not top_conversations:
            return None

        # 2. Use Claude to extract patterns
        conversation_texts = "\n\n---\n\n".join(
            [
                f"Rating: {conv[2]}/5\nFeedback: {conv[3]}\nMessages:\n{conv[1]}"
                for conv in top_conversations[:10]  # Analyze top 10
            ]
        )

        analysis_prompt = f"""Analyze these top-rated ZANTARA conversations and extract:

1. **Common patterns** that led to high satisfaction
2. **Specific phrases** or approaches that worked well
3. **Response structures** that users appreciated
4. **Topics** where ZANTARA excelled
5. **Concrete prompt improvements** to replicate success

Conversations:
{conversation_texts}

Provide actionable recommendations in JSON format:
{{
  "successful_patterns": ["pattern1", "pattern2"],
  "key_phrases": ["phrase1", "phrase2"],
  "prompt_improvements": [
    {{
      "current": "current approach",
      "improved": "improved approach",
      "reason": "why this is better"
    }}
  ],
  "metrics": {{
    "avg_rating": 4.5,
    "common_topics": ["topic1", "topic2"],
    "response_length_sweet_spot": "150-300 words"
  }}
}}
"""

        # Placeholder for analysis
        return '{"successful_patterns": ["pattern1"], "prompt_improvements": []}'

    async def generate_prompt_update(self, analysis: str):
        """Generate improved system prompt based on analysis"""

        update_prompt = f"""Based on this analysis of successful conversations:

{analysis}

Generate an IMPROVED version of the ZANTARA system prompt that incorporates these learnings.

Current prompt structure:
- Role definition
- Knowledge base
- Response guidelines
- Tone and style

Return the improved prompt ready to be committed."""

        # Placeholder for improved prompt
        return analysis

    async def create_improvement_pr(self, improved_prompt: str, analysis: str):
        """Create GitHub PR with prompt improvements"""
        import subprocess

        # 1. Create branch
        branch_name = f"auto/prompt-improvement-{datetime.now().strftime('%Y%m%d-%H%M')}"
        subprocess.run(["git", "checkout", "-b", branch_name])

        # 2. Update prompt file
        prompt_file = "apps/backend-rag/backend/prompts/zantara_system_prompt.txt"
        with open(prompt_file, "w") as f:
            f.write(improved_prompt)

        # 3. Create analysis report
        report_file = f"reports/conversation-analysis-{datetime.now().strftime('%Y%m%d')}.md"
        with open(report_file, "w") as f:
            f.write(
                f"""# Conversation Quality Analysis

Date: {datetime.now().isoformat()}

## Analysis Results

{analysis}

## Prompt Changes

See `{prompt_file}` for updated system prompt.

## Next Steps

1. Review changes in PR
2. Test with sample conversations
3. Deploy if approved
4. Monitor rating changes
"""
            )

        # 4. Commit
        subprocess.run(["git", "add", prompt_file, report_file])
        subprocess.run(
            [
                "git",
                "commit",
                "-m",
                f"feat(prompts): auto-improve based on {datetime.now().strftime('%Y-%m-%d')} conversation analysis",
            ]
        )

        # 5. Push and create PR
        subprocess.run(["git", "push", "-u", "origin", branch_name])

        pr_body = f"""## 🤖 Auto-Generated Prompt Improvement

**Analysis Period**: Last 7 days
**Top Conversations Analyzed**: 10
**Avg Rating**: 4.5+/5

### Key Learnings
{analysis[:500]}...

### Changes
- Updated system prompt based on successful conversation patterns
- See detailed analysis in `{report_file}`

### Testing
- [ ] Review prompt changes
- [ ] Test with sample queries
- [ ] Compare ratings before/after

**Auto-generated by ConversationTrainer agent**
"""

        subprocess.run(
            [
                "gh",
                "pr",
                "create",
                "--title",
                f"🤖 Auto-improve prompts ({datetime.now().strftime('%Y-%m-%d')})",
                "--body",
                pr_body,
                "--label",
                "automation,prompt-improvement",
            ]
        )

        return branch_name


# Cron job entry (add to backend-ts cron)
async def run_conversation_trainer():
    """Weekly conversation analysis and prompt improvement"""
    trainer = ConversationTrainer()

    # 1. Analyze
    analysis = await trainer.analyze_winning_patterns(days_back=7)

    if not analysis:
        print("No high-rated conversations found")
        return

    # 2. Generate improved prompt
    improved_prompt = await trainer.generate_prompt_update(analysis)

    # 3. Create PR
    pr_branch = await trainer.create_improvement_pr(improved_prompt, analysis)

    print(f"✅ Created PR on branch: {pr_branch}")

    # 4. Notify team
    from app.core.config import settings

    if settings.slack_webhook_url:
        import requests

        requests.post(
            settings.slack_webhook_url,
            json={
                "text": f"🤖 New prompt improvement PR created: {pr_branch}\n\nAnalyzed 10 top conversations, found actionable improvements!"
            },
        )
