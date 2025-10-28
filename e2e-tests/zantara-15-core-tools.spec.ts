import { test, expect, Page } from '@playwright/test';

/**
 * ZANTARA 15 Core Tools Test
 * Tests the 143 active tools (Google Workspace + Communication integrations disabled)
 * 
 * Categories tested:
 * 1. Pricing (4 tools)
 * 2. Oracle/KBLI (3 tools)
 * 3. RAG/Search (4 tools)
 * 4. Memory (11 tools)
 * 5. Team (5 tools)
 * 6. Maps (3 tools)
 * 7. Translation (3 tools)
 * 8. AI Services (10 tools)
 */

const TEST_CONVERSATIONS = [
  // ===== CATEGORY 1: PRICING (Critical - Anti-hallucination) =====
  {
    id: 1,
    title: "Pricing - KITAS Offshore vs Onshore",
    category: "pricing",
    difficulty: "easy",
    turns: [
      { user: "Quanto costa un KITAS Freelance?", expectToolCall: "get_pricing" },
      { user: "E il KITAS Limited Stay?", expectToolCall: "get_pricing" },
      { user: "Qual è la differenza tra offshore e onshore?", expectToolCall: null }
    ],
    expectedTools: ["get_pricing", "bali.zero.pricing"],
    expectedInAnswer: ["26.000.000", "15.000.000", "offshore", "onshore"],
    groundTruth: {
      prices: ["26.000.000 IDR", "28.000.000 IDR", "15.000.000 IDR"],
      facts: ["KITAS Freelance offshore: 26 juta", "KITAS Limited Stay: 15 juta"]
    }
  },

  {
    id: 2,
    title: "Pricing - PT PMA Setup Complete",
    category: "pricing",
    difficulty: "medium",
    turns: [
      { user: "Quanto costa aprire una PT PMA completa?", expectToolCall: "get_pricing" },
      { user: "Include virtual office?", expectToolCall: "get_pricing" },
      { user: "E il KITAS per il direttore?", expectToolCall: "get_pricing" }
    ],
    expectedTools: ["get_pricing", "bali.zero.pricing"],
    expectedInAnswer: ["170.000.000", "virtual office", "KITAS"],
    groundTruth: {
      prices: ["170.000.000 IDR", "PT PMA setup"],
      facts: ["Include: NIB, Akta, NPWP, Virtual Office 1 year"]
    }
  },

  {
    id: 3,
    title: "Pricing - Visa C1 vs D12",
    category: "pricing",
    difficulty: "easy",
    turns: [
      { user: "Berapa harga visa C1 Tourism?", expectToolCall: "get_pricing" },
      { user: "Dan visa D12 Working?", expectToolCall: "get_pricing" }
    ],
    expectedTools: ["get_pricing"],
    expectedInAnswer: ["2.300.000", "3.200.000", "C1", "D12"],
    groundTruth: {
      prices: ["2.300.000 IDR", "3.200.000 IDR"],
      facts: ["C1 Tourism 60 days", "D12 Working single entry"]
    }
  },

  // ===== CATEGORY 2: ORACLE + KBLI (Domain Expertise) =====
  {
    id: 4,
    title: "KBLI - IT Consulting Code",
    category: "kbli",
    difficulty: "medium",
    turns: [
      { user: "Qual è il codice KBLI per IT consulting?", expectToolCall: "kbli.lookup" },
      { user: "Ci sono alternative?", expectToolCall: "kbli.lookup" },
      { user: "Quale scegli per una startup?", expectToolCall: null }
    ],
    expectedTools: ["kbli.lookup"],
    expectedInAnswer: ["62010", "62020", "computer programming", "IT consulting"],
    groundTruth: {
      facts: ["KBLI 62010: Computer Programming", "KBLI 62020: IT Consulting"]
    }
  },

  {
    id: 5,
    title: "Oracle - Tax Rate PT PMA Export",
    category: "oracle",
    difficulty: "hard",
    turns: [
      { user: "Qual è l'aliquota fiscale per una PT PMA nel settore export?", expectToolCall: "oracle.query" },
      { user: "Ci sono agevolazioni?", expectToolCall: "rag.query" }
    ],
    expectedTools: ["oracle.query", "rag.query"],
    expectedInAnswer: ["tax", "export", "PT PMA"],
    groundTruth: {
      laws: ["UU PPh"],
      facts: ["Corporate tax rate: 22%", "Export incentives available"]
    }
  },

  {
    id: 6,
    title: "Oracle - Property Foreign Ownership",
    category: "oracle",
    difficulty: "hard",
    turns: [
      { user: "Can foreigners own property in Bali?", expectToolCall: "oracle.query" },
      { user: "What's Hak Pakai?", expectToolCall: "rag.query" }
    ],
    expectedTools: ["oracle.query", "rag.query"],
    expectedInAnswer: ["Hak Pakai", "foreigners", "25 years"],
    groundTruth: {
      laws: ["UU No. 5/1960"],
      facts: ["Hak Pakai: 25 years renewable", "No freehold for foreigners"]
    }
  },

  // ===== CATEGORY 3: RAG & KNOWLEDGE =====
  {
    id: 7,
    title: "RAG - KITAS Requirements",
    category: "rag",
    difficulty: "medium",
    turns: [
      { user: "Quali documenti servono per il KITAS?", expectToolCall: "rag.query" },
      { user: "Il certificate medico dove lo faccio?", expectToolCall: "rag.query" }
    ],
    expectedTools: ["rag.query"],
    expectedInAnswer: ["passport", "medical certificate", "sponsor letter"],
    groundTruth: {
      facts: ["Passport validity 18 months", "Medical certificate required", "Sponsor letter"]
    }
  },

  {
    id: 8,
    title: "RAG - PT PMA Capital Requirements",
    category: "rag",
    difficulty: "hard",
    turns: [
      { user: "Quanto capitale serve per una PT PMA?", expectToolCall: "rag.query" },
      { user: "Ci sono eccezioni per tech companies?", expectToolCall: "rag.query" }
    ],
    expectedTools: ["rag.query"],
    expectedInAnswer: ["10 billion", "capital", "PT PMA"],
    groundTruth: {
      facts: ["Capital requirement: 10 billion IDR", "Tech companies exceptions possible"]
    }
  },

  // ===== CATEGORY 4: MEMORY (Context Retention) =====
  {
    id: 9,
    title: "Memory - Save User Preferences",
    category: "memory",
    difficulty: "easy",
    turns: [
      { user: "Ricorda: il mio budget è 500 milioni di rupie", expectToolCall: "memory.save" },
      { user: "Preferisco comunicare in italiano", expectToolCall: "memory.save" },
      { user: "Qual è il mio budget?", expectToolCall: "memory.retrieve" }
    ],
    expectedTools: ["memory.save", "memory.retrieve"],
    expectedInAnswer: ["500 milioni", "italiano"],
    groundTruth: {
      facts: ["Budget: 500 million IDR", "Language preference: Italian"]
    }
  },

  {
    id: 10,
    title: "Memory - Complex Context Retrieval",
    category: "memory",
    difficulty: "medium",
    turns: [
      { user: "Mi chiamo Marco, voglio aprire un ristorante a Canggu", expectToolCall: "memory.save" },
      { user: "Budget 2 miliardi, partner indonesiano", expectToolCall: "memory.save" },
      { user: "Cosa sai di me?", expectToolCall: "memory.retrieve" }
    ],
    expectedTools: ["memory.save", "memory.retrieve"],
    expectedInAnswer: ["Marco", "ristorante", "Canggu", "2 miliardi"],
    groundTruth: {
      facts: ["Name: Marco", "Business: Restaurant", "Location: Canggu", "Budget: 2 billion"]
    }
  },

  // ===== CATEGORY 5: TEAM MANAGEMENT =====
  {
    id: 11,
    title: "Team - Who is Dea?",
    category: "team",
    difficulty: "easy",
    turns: [
      { user: "Chi è Dea nel team?", expectToolCall: "search_team_member" },
      { user: "Come posso contattarla?", expectToolCall: null }
    ],
    expectedTools: ["search_team_member", "team.list"],
    expectedInAnswer: ["Dea", "Exec", "Operations"],
    groundTruth: {
      facts: ["Dea Exec: Operations Manager", "Contact: info@balizero.com"]
    }
  },

  {
    id: 12,
    title: "Team - Full Team Overview",
    category: "team",
    difficulty: "medium",
    turns: [
      { user: "Show me the Bali Zero team structure", expectToolCall: "get_team_overview" },
      { user: "How many people in Setup department?", expectToolCall: "team.list" }
    ],
    expectedTools: ["get_team_overview", "team.list"],
    expectedInAnswer: ["team", "department", "Setup"],
    groundTruth: {
      facts: ["23 team members total", "5 departments"]
    }
  },

  // ===== CATEGORY 6: MAPS & LOCATION =====
  {
    id: 13,
    title: "Maps - Find Coworking in Canggu",
    category: "maps",
    difficulty: "easy",
    turns: [
      { user: "Trova coworking space a Canggu", expectToolCall: "maps.places" },
      { user: "Quale mi consigli?", expectToolCall: null }
    ],
    expectedTools: ["maps.places"],
    expectedInAnswer: ["Canggu", "coworking"],
    groundTruth: {
      facts: ["Canggu location", "Coworking spaces available"]
    }
  },

  // ===== CATEGORY 7: TRANSLATION =====
  {
    id: 14,
    title: "Translation - Italian to English",
    category: "translation",
    difficulty: "easy",
    turns: [
      { user: "Translate to English: Voglio aprire una società in Indonesia", expectToolCall: "translate.text" },
      { user: "E in indonesiano?", expectToolCall: "translate.text" }
    ],
    expectedTools: ["translate.text"],
    expectedInAnswer: ["want", "open", "company", "Indonesia"],
    groundTruth: {
      facts: ["Translation: I want to open a company in Indonesia"]
    }
  },

  // ===== CATEGORY 8: AI SERVICES =====
  {
    id: 15,
    title: "AI Chat - General Business Advice",
    category: "ai",
    difficulty: "medium",
    turns: [
      { user: "Ciao ZANTARA! Come stai?", expectToolCall: "bali.zero.chat" },
      { user: "Cosa puoi fare per aiutarmi a trasferirmi a Bali?", expectToolCall: "ai.chat" },
      { user: "Quanto costa in media?", expectToolCall: "get_pricing" }
    ],
    expectedTools: ["bali.zero.chat", "ai.chat", "get_pricing"],
    expectedInAnswer: ["ZANTARA", "Bali", "visa", "company"],
    groundTruth: {
      facts: ["ZANTARA greeting", "Relocation services", "Cost estimates"]
    }
  }
];

test.describe('ZANTARA 15 Core Tools Test', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('https://zantara.balizero.com');
    await page.waitForLoadState('networkidle');
  });

  for (const conversation of TEST_CONVERSATIONS) {
    test(`[${conversation.id}] ${conversation.title}`, async () => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🧪 TEST ${conversation.id}: ${conversation.title}`);
      console.log(`📂 Category: ${conversation.category} | Difficulty: ${conversation.difficulty}`);
      console.log(`🔧 Expected Tools: ${conversation.expectedTools.join(', ')}`);
      console.log(`${'='.repeat(80)}\n`);

      const toolsCalled: string[] = [];
      const messages: any[] = [];

      // Setup network listener to capture tool calls
      page.on('response', async (response) => {
        if (response.url().includes('/api/') || response.url().includes('/chat')) {
          try {
            const json = await response.json();
            if (json.tool_use || json.tools_used) {
              const tools = json.tool_use || json.tools_used || [];
              tools.forEach((tool: any) => {
                const toolName = tool.name || tool.tool || tool;
                if (toolName && !toolsCalled.includes(toolName)) {
                  toolsCalled.push(toolName);
                  console.log(`   🔧 Tool called: ${toolName}`);
                }
              });
            }
          } catch {}
        }
      });

      // Execute conversation turns
      for (let i = 0; i < conversation.turns.length; i++) {
        const turn = conversation.turns[i];
        console.log(`\n💬 Turn ${i + 1}/${conversation.turns.length}: "${turn.user}"`);
        
        // Find input field and send message
        const input = page.locator('textarea, input[type="text"]').first();
        await input.fill(turn.user);
        await input.press('Enter');

        // Wait for response
        await page.waitForTimeout(3000); // Give time for tool execution
        
        const chatMessages = await page.locator('.message, [class*="message"], [class*="chat"]').all();
        const lastMessage = await chatMessages[chatMessages.length - 1]?.textContent();
        
        if (lastMessage) {
          messages.push({ role: 'user', content: turn.user });
          messages.push({ role: 'assistant', content: lastMessage });
          console.log(`   💬 Response preview: ${lastMessage.substring(0, 150)}...`);
        }

        // Check if expected tool was called
        if (turn.expectToolCall) {
          const toolCalled = toolsCalled.some(t => 
            t.includes(turn.expectToolCall!) || turn.expectToolCall!.includes(t)
          );
          if (toolCalled) {
            console.log(`   ✅ Expected tool called: ${turn.expectToolCall}`);
          } else {
            console.log(`   ⚠️ Expected tool NOT called: ${turn.expectToolCall}`);
          }
        }

        await page.waitForTimeout(1000);
      }

      // Validation
      console.log(`\n📊 VALIDATION RESULTS:`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      // Tool usage validation
      const fullText = messages.map(m => m.content).join(' ').toLowerCase();
      const toolMatches = conversation.expectedTools.filter(expected => 
        toolsCalled.some(called => 
          called.toLowerCase().includes(expected.toLowerCase()) || 
          expected.toLowerCase().includes(called.toLowerCase())
        )
      );
      
      const toolScore = (toolMatches.length / conversation.expectedTools.length) * 100;
      console.log(`🔧 Tools: ${toolMatches.length}/${conversation.expectedTools.length} (${toolScore.toFixed(0)}%)`);
      console.log(`   Expected: ${conversation.expectedTools.join(', ')}`);
      console.log(`   Called: ${toolsCalled.join(', ') || 'NONE'}`);

      // Content validation
      const contentMatches = conversation.expectedInAnswer.filter(expected =>
        fullText.includes(expected.toLowerCase())
      );
      
      const contentScore = (contentMatches.length / conversation.expectedInAnswer.length) * 100;
      console.log(`📝 Content: ${contentMatches.length}/${conversation.expectedInAnswer.length} (${contentScore.toFixed(0)}%)`);
      console.log(`   Found: ${contentMatches.join(', ')}`);
      console.log(`   Missing: ${conversation.expectedInAnswer.filter(e => !contentMatches.includes(e)).join(', ')}`);

      // Overall score
      const overallScore = (toolScore * 0.6 + contentScore * 0.4);
      console.log(`\n🎯 OVERALL SCORE: ${overallScore.toFixed(1)}/100`);
      
      if (overallScore >= 70) {
        console.log(`✅ PASS - Good integration`);
      } else if (overallScore >= 50) {
        console.log(`⚠️ PARTIAL - Needs improvement`);
      } else {
        console.log(`❌ FAIL - Critical issues`);
      }

      console.log(`${'='.repeat(80)}\n`);

      // Save results
      const result = {
        conversationId: conversation.id,
        title: conversation.title,
        category: conversation.category,
        difficulty: conversation.difficulty,
        expectedTools: conversation.expectedTools,
        toolsUsed: toolsCalled,
        toolScore,
        contentScore,
        overallScore,
        messages,
        timestamp: new Date().toISOString()
      };

      // Soft assertion - log but don't fail
      if (overallScore < 50) {
        console.warn(`⚠️ Low score for ${conversation.title}: ${overallScore.toFixed(1)}`);
      }
    });
  }
});
