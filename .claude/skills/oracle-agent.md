---
name: oracle-agent
description: Test and validate Oracle agents (visa-oracle, kbli-eye, tax-genius, legal-architect, morgana) with realistic scenarios and multi-agent collaboration
---

# Oracle Agent Testing Protocol

Use this skill when testing the 5 specialized Oracle agents for Indonesian business consulting or validating multi-agent collaboration.

## Available Agents

### 1. **visa-oracle** - Immigration & KITAS Consultant
Expertise: Work permits, KITAS, KITAP, visa extensions, sponsorship

### 2. **kbli-eye** - Business Classification Expert
Expertise: KBLI codes, business classification, licensing requirements

### 3. **tax-genius** - Tax Consultant
Expertise: Corporate tax, VAT, withholding tax, tax treaties, reporting

### 4. **legal-architect** - Legal Consultant
Expertise: Company formation, contracts, compliance, intellectual property

### 5. **morgana** - Strategic Business Consultant
Expertise: Business strategy, market analysis, growth planning

## Testing Procedure

### 1. Individual Agent Testing
Test each agent with domain-specific queries:

```python
# Example test scenarios
test_scenarios = {
    "visa-oracle": "I need to hire 3 foreign developers. What's the KITAS process?",
    "kbli-eye": "I'm starting an AI software company. Which KBLI codes do I need?",
    "tax-genius": "What's the corporate tax rate for PT companies in 2025?",
    "legal-architect": "What are the legal requirements for PT PMA formation?",
    "morgana": "How to expand my Bali-based business to Jakarta?"
}
```

### 2. Multi-Agent Collaboration
Test agents working together on complex queries:

**Example Complex Query**: "I want to start a PT PMA tech company in Bali with 2 foreign partners. What's the complete setup process?"

Expected collaboration:
1. **legal-architect**: Company structure and formation requirements
2. **kbli-eye**: Appropriate KBLI codes for tech business
3. **tax-genius**: Tax implications and registration
4. **visa-oracle**: KITAS requirements for foreign partners
5. **morgana**: Strategic timeline and cost estimates

### 3. Validate Agent Responses

Check for:
- ✅ **Accuracy**: Responses align with Indonesian regulations
- ✅ **Completeness**: All aspects of query addressed
- ✅ **Source Citation**: References to legal documents/regulations
- ✅ **Tier Compliance**: Only uses knowledge within access tier
- ✅ **Actionability**: Provides clear next steps

### 4. Test Agent Configuration
Verify agent setup in:
```
projects/oracle-system/agents/
├── visa-oracle/
├── kbli-eye/
├── tax-genius/
├── legal-architect/
└── morgana/
```

Check each agent has:
- System prompts
- Knowledge base access configuration
- Tier permissions
- Response templates

### 5. Simulation Testing
Run multi-agent simulation scenarios:
```bash
# If simulation scripts exist
python projects/oracle-system/simulation/test_collaboration.py
```

### 6. Performance Metrics
- Response time per agent (target: <2s)
- Accuracy of recommendations
- Inter-agent handoff efficiency
- User satisfaction scoring

## Key Files to Check
- `projects/oracle-system/agents/*/` - Agent configurations
- `projects/oracle-system/simulation/` - Multi-agent simulations
- `apps/backend-ts/src/agents/` - Agent orchestration logic
- `docs/ORACLE_AGENTS_COMPLETE_IMPLEMENTATION.md` - Full documentation

## Common Issues
- Agent not responding: Check agent configuration files
- Wrong tier access: Verify user permissions in request
- Poor collaboration: May need prompt engineering tuning
- Inconsistent answers: Check knowledge base consistency

## Success Criteria
✅ Each agent responds accurately to domain queries
✅ Multi-agent collaboration produces coherent recommendations
✅ Responses include proper citations and tier compliance
✅ Agents hand off correctly to other specialists
✅ Response times meet performance targets
✅ User receives actionable, complete guidance
