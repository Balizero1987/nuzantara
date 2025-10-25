#!/usr/bin/env python3
"""
FIX INITIALIZATION ORDER - Rebuild Tool System
Move ZantaraTools initialization AFTER TeamAnalyticsService
"""

import re

def fix_initialization_order():
    """Fix the initialization order in main_cloud.py"""
    
    # Read the file
    with open('apps/backend-rag/backend/app/main_cloud.py', 'r') as f:
        content = f.read()
    
    # Find ZantaraTools initialization block
    zantara_pattern = r'    # Initialize ZantaraTools FIRST \(needed by ToolExecutor\)\n    try:\n        zantara_tools = ZantaraTools\(\n            team_analytics_service=team_analytics_service,\n            work_session_service=work_session_service,\n            memory_service=memory_service,\n            pricing_service=pricing_service  # FIXED: Now properly initialized\n        \)\n        logger\.info\("✅ ZantaraTools initialized \(tool calling enabled\)"\)\n    except Exception as e:\n        logger\.warning\(f"⚠️ ZantaraTools initialization failed: \{e\}"\)\n        zantara_tools = None\n\n    # Initialize Intelligent Router \(HAIKU-ONLY system\)'
    
    # Find TeamAnalyticsService initialization block
    team_analytics_pattern = r'    # Initialize Team Analytics Service \(7 Advanced Analytics Techniques\)\n    try:\n        if work_session_service and work_session_service\.pool:\n            team_analytics_service = TeamAnalyticsService\(db_pool=work_session_service\.pool\)\n            logger\.info\("✅ TeamAnalyticsService ready \(7 advanced analytics techniques\)"\)\n            logger\.info\("   1\. Pattern Recognition - Work hour patterns"\)\n            logger\.info\("   2\. Productivity Scoring - Performance metrics"\)\n            logger\.info\("   3\. Burnout Detection - Early warning system"\)\n            logger\.info\("   4\. Performance Trends - Long-term analysis"\)\n            logger\.info\("   5\. Workload Balance - Team distribution"\)\n            logger\.info\("   6\. Optimal Hours - Peak productivity windows"\)\n            logger\.info\("   7\. Team Insights - Collaboration intelligence"\)\n        else:\n            logger\.warning\("⚠️ TeamAnalyticsService disabled - requires WorkSessionService"\)\n            team_analytics_service = None\n    except Exception as e:\n        logger\.error\(f"❌ TeamAnalyticsService initialization failed: \{e\}"\)\n        team_analytics_service = None'
    
    # Check if both patterns exist
    if re.search(zantara_pattern, content) and re.search(team_analytics_pattern, content):
        print("✅ Found both ZantaraTools and TeamAnalyticsService blocks")
        
        # Remove ZantaraTools block
        content = re.sub(zantara_pattern, '', content)
        print("✅ Removed ZantaraTools block")
        
        # Add ZantaraTools AFTER TeamAnalyticsService
        new_zantara_block = '''
    # Initialize ZantaraTools AFTER all dependencies (FIXED ORDER)
    try:
        zantara_tools = ZantaraTools(
            team_analytics_service=team_analytics_service,
            work_session_service=work_session_service,
            memory_service=memory_service,
            pricing_service=pricing_service  # All services now available
        )
        logger.info("✅ ZantaraTools initialized (tool calling enabled)")
    except Exception as e:
        logger.warning(f"⚠️ ZantaraTools initialization failed: {e}")
        zantara_tools = None

    # Initialize Intelligent Router (HAIKU-ONLY system)'''
        
        # Insert after TeamAnalyticsService
        content = re.sub(
            team_analytics_pattern,
            team_analytics_pattern + new_zantara_block,
            content
        )
        print("✅ Added ZantaraTools after TeamAnalyticsService")
        
        # Write back to file
        with open('apps/backend-rag/backend/app/main_cloud.py', 'w') as f:
            f.write(content)
        
        print("✅ Initialization order fixed!")
        return True
    else:
        print("❌ Could not find required patterns")
        return False

if __name__ == "__main__":
    fix_initialization_order()
