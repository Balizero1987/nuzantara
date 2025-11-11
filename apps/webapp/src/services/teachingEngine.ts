// 🎓 ZANTARA Teaching Engine - Educational Content Generation

import {
  IntelligenceLayer,
  DeepDive,
  TeachingContent,
  SystemKnowledge,
  LearnedConcept,
  SYSTEM_CONCEPTS,
  UserLevel,
  LearningTrack
} from '../types/gamification';

/**
 * Teaching Engine - Generates educational content based on user actions
 */
export class TeachingEngine {
  /**
   * Generate intelligence layer content for a quest completion
   */
  static generateIntelligenceLayer(questId: string, userLevel: UserLevel): IntelligenceLayer | null {
    const content = INTELLIGENCE_CONTENT[questId];
    if (!content) return null;

    // Check if user level is appropriate
    if (content.minLevel && this.getLevelNumber(userLevel) < this.getLevelNumber(content.minLevel)) {
      return null; // Too advanced
    }

    return {
      didYouKnow: content.didYouKnow,
      technicalExplanation: content.technicalExplanation,
      deepDive: content.deepDive,
      relatedConcepts: content.relatedConcepts,
      unlockQuest: content.unlockQuest
    };
  }

  /**
   * Generate teaching content for a specific concept
   */
  static generateTeachingContent(conceptId: string, userLevel: UserLevel): TeachingContent | null {
    const concept = TEACHING_LIBRARY[conceptId];
    if (!concept) return null;

    // Adjust complexity based on user level
    const levelIndex = this.getLevelNumber(userLevel);

    return {
      topic: concept.topic,
      explanation: concept.explanations[Math.min(levelIndex, concept.explanations.length - 1)],
      examples: concept.examples,
      interactiveDemo: concept.interactiveDemo,
      quiz: concept.quiz
    };
  }

  /**
   * Check if user should unlock a new concept
   */
  static shouldUnlockConcept(
    conceptId: string,
    systemKnowledge: SystemKnowledge,
    userLevel: UserLevel
  ): boolean {
    // Already learned?
    if (systemKnowledge.conceptsLearned.find(c => c.id === conceptId)) {
      return false;
    }

    // Level requirement met?
    const concept = Object.values(SYSTEM_CONCEPTS).find(c => c.id === conceptId);
    if (!concept) return false;

    return this.getLevelNumber(userLevel) >= this.getLevelNumber(concept.requiredLevel);
  }

  /**
   * Record learned concept
   */
  static recordLearnedConcept(
    systemKnowledge: SystemKnowledge,
    conceptId: string,
    questId: string
  ): SystemKnowledge {
    const concept = Object.values(SYSTEM_CONCEPTS).find(c => c.id === conceptId);
    if (!concept) return systemKnowledge;

    const existing = systemKnowledge.conceptsLearned.find(c => c.id === conceptId);

    if (existing) {
      // Update existing
      existing.questsCompleted.push(questId);
      // Upgrade mastery if enough quests completed
      if (existing.questsCompleted.length >= 10) {
        existing.masteryLevel = 'expert';
      } else if (existing.questsCompleted.length >= 5) {
        existing.masteryLevel = 'advanced';
      } else if (existing.questsCompleted.length >= 2) {
        existing.masteryLevel = 'intermediate';
      }
    } else {
      // Add new concept
      const newConcept: LearnedConcept = {
        id: conceptId,
        name: concept.name,
        category: this.getConceptCategory(conceptId),
        learnedAt: new Date(),
        masteryLevel: 'basic',
        questsCompleted: [questId]
      };
      systemKnowledge.conceptsLearned.push(newConcept);
    }

    // Update intelligence level
    systemKnowledge.intelligenceLevel = this.calculateIntelligenceLevel(systemKnowledge);

    return systemKnowledge;
  }

  /**
   * Calculate overall intelligence level (0-100)
   */
  private static calculateIntelligenceLevel(knowledge: SystemKnowledge): number {
    const totalConcepts = Object.keys(SYSTEM_CONCEPTS).length;
    const learnedCount = knowledge.conceptsLearned.length;

    // Base score from concepts learned
    let score = (learnedCount / totalConcepts) * 70;

    // Bonus from mastery levels
    const masteryBonus = knowledge.conceptsLearned.reduce((sum, concept) => {
      const bonus = {
        basic: 0,
        intermediate: 5,
        advanced: 10,
        expert: 15
      }[concept.masteryLevel];
      return sum + bonus;
    }, 0);

    score += Math.min(masteryBonus / totalConcepts, 30);

    return Math.min(Math.round(score), 100);
  }

  /**
   * Get recommended next concepts to learn
   */
  static getRecommendedConcepts(
    systemKnowledge: SystemKnowledge,
    userLevel: UserLevel,
    limit: number = 3
  ): Array<{ id: string; name: string; description: string }> {
    const learnedIds = systemKnowledge.conceptsLearned.map(c => c.id);
    const levelNum = this.getLevelNumber(userLevel);

    return Object.values(SYSTEM_CONCEPTS)
      .filter(concept =>
        !learnedIds.includes(concept.id) &&
        this.getLevelNumber(concept.requiredLevel) <= levelNum
      )
      .slice(0, limit)
      .map(c => ({ id: c.id, name: c.name, description: c.description }));
  }

  private static getLevelNumber(level: UserLevel): number {
    return {
      [UserLevel.ROOKIE]: 1,
      [UserLevel.EXPLORER]: 2,
      [UserLevel.EXPERT]: 3,
      [UserLevel.MASTER]: 4,
      [UserLevel.LEGEND]: 5
    }[level];
  }

  private static getConceptCategory(conceptId: string): LearnedConcept['category'] {
    if (conceptId.includes('rag') || conceptId.includes('semantic') || conceptId.includes('vector') || conceptId.includes('chroma')) {
      return 'rag';
    }
    if (conceptId.includes('agent') || conceptId.includes('llama') || conceptId.includes('claude') || conceptId.includes('nlp')) {
      return 'agents';
    }
    if (conceptId.includes('memory') || conceptId.includes('cache') || conceptId.includes('circuit') || conceptId.includes('api')) {
      return 'architecture';
    }
    if (conceptId.includes('google') || conceptId.includes('workspace')) {
      return 'integration';
    }
    return 'performance';
  }
}

// === INTELLIGENCE CONTENT LIBRARY ===

interface IntelligenceContent {
  didYouKnow: string;
  technicalExplanation: string;
  deepDive?: DeepDive;
  relatedConcepts?: string[];
  unlockQuest?: string;
  minLevel?: UserLevel;
}

const INTELLIGENCE_CONTENT: Record<string, IntelligenceContent> = {
  // === DAILY QUESTS ===
  'daily_health_check': {
    didYouKnow: '🤖 ZANTARA ha appena controllato 4 agenti in meno di 0.5 secondi! Ogni agente è un sistema AI specializzato.',
    technicalExplanation: 'Il sistema Nuzantara usa un\'architettura Multi-Agent: Immigration, Health, Revenue e Memory lavorano in parallelo. Ognuno è ottimizzato per il suo dominio specifico.',
    relatedConcepts: ['multi_agent'],
    unlockQuest: 'quest_multi_agent_intro'
  },

  'daily_feedback_review': {
    didYouKnow: '💬 Ogni feedback viene analizzato con NLP per estrarre sentiment, entities e intent automaticamente!',
    technicalExplanation: 'Il sistema NLP (Natural Language Processing) usa entity extraction, sentiment analysis e intent classification per capire cosa dicono gli utenti.',
    relatedConcepts: ['nlp_pipeline'],
    unlockQuest: 'quest_nlp_basics',
    minLevel: UserLevel.EXPLORER
  },

  'daily_chat': {
    didYouKnow: '🧠 ZANTARA ricorda le conversazioni grazie al Persistent Memory System. Non è solo chat, è memoria!',
    technicalExplanation: 'Il Memory Service salva ogni conversazione in PostgreSQL con embedding vettoriali, permettendo a ZANTARA di "ricordare" contesto e preferenze.',
    relatedConcepts: ['persistent_memory'],
    unlockQuest: 'quest_memory_deep_dive',
    minLevel: UserLevel.EXPLORER
  },

  // === RAG QUESTS ===
  'quest_rag_search': {
    didYouKnow: '🔍 ZANTARA non "cerca" come Google - capisce il SIGNIFICATO della tua domanda!',
    technicalExplanation: 'RAG (Retrieval Augmented Generation) usa semantic search: converte la tua domanda in un vettore matematico e trova documenti con significato simile, non solo parole uguali.',
    deepDive: {
      title: 'Come Funziona RAG',
      sections: [
        {
          heading: '1. La Tua Domanda',
          content: 'Quando chiedi "Come ottenere visto lavorativo Indonesia?", ZANTARA non cerca solo quelle parole.'
        },
        {
          heading: '2. Embeddings',
          content: 'La domanda viene convertita in un vettore matematico (embedding) che rappresenta il suo SIGNIFICATO.',
          code: 'embedding = model.encode("Come ottenere visto lavorativo Indonesia?")\n// Result: [0.234, -0.567, 0.891, ...] (1536 dimensioni)'
        },
        {
          heading: '3. Semantic Search',
          content: 'Il sistema cerca in ChromaDB i documenti con vettori simili - trova documenti su "work permits", "visa application", "Indonesia immigration" anche se non usano quelle parole esatte!'
        },
        {
          heading: '4. Context + AI',
          content: 'I documenti trovati vengono dati a Llama 4 Scout come contesto, che genera una risposta precisa e citando le fonti.'
        }
      ],
      visualAid: `
┌─────────────┐
│  Your Query │ "Visto lavorativo Indonesia?"
└──────┬──────┘
       │ Embedding
       ▼
┌─────────────┐
│  [0.2, ...] │ Vector representation
└──────┬──────┘
       │ Semantic Search
       ▼
┌──────────────────────┐
│   ChromaDB (25K+)    │
│  ┌────┐ ┌────┐      │
│  │Doc1│ │Doc2│ ...  │ Similar docs
│  └────┘ └────┘      │
└──────┬───────────────┘
       │ Top 5 docs
       ▼
┌─────────────┐
│ Llama 4     │ Generates answer + cites sources
│ Scout       │
└─────────────┘
      `,
      practicalExample: 'Prova a cercare "pratiche immigrazione" e poi "immigration procedures" - trovi gli stessi documenti! Questo è semantic search in azione.',
      furtherReading: ['quest_rag_training', 'quest_vector_embeddings']
    },
    relatedConcepts: ['rag_basics', 'semantic_search'],
    unlockQuest: 'quest_rag_training'
  },

  'quest_rag_training': {
    didYouKnow: '📚 Aggiungendo 10 documenti hai appena reso ZANTARA più intelligente! Il RAG impara dai documenti che gli dai.',
    technicalExplanation: 'Ogni documento viene "chunkato" (diviso in pezzi), convertito in embeddings, e salvato in ChromaDB. Ora ZANTARA può trovare e usare queste informazioni per rispondere.',
    deepDive: {
      title: 'Il Processo di Indicizzazione RAG',
      sections: [
        {
          heading: 'Step 1: Chunking',
          content: 'Il documento viene diviso in "chunks" (pezzi) di ~500 parole con overlap del 10% per non perdere contesto.',
          code: 'chunks = split_document(doc, chunk_size=500, overlap=50)\n// Un doc di 5000 parole → ~12 chunks'
        },
        {
          heading: 'Step 2: Embedding Generation',
          content: 'Ogni chunk viene convertito in un vettore 1536-dimensionale che rappresenta il suo significato semantico.',
          code: 'for chunk in chunks:\n  embedding = embedding_model.encode(chunk.text)\n  chunk.embedding = embedding'
        },
        {
          heading: 'Step 3: Storage in ChromaDB',
          content: 'Gli embeddings vengono salvati in ChromaDB, un vector database ottimizzato per similarity search.',
          code: 'chromadb.add(\n  documents=[chunk.text for chunk in chunks],\n  embeddings=[chunk.embedding for chunk in chunks],\n  metadata=[chunk.metadata for chunk in chunks]\n)'
        },
        {
          heading: 'Step 4: Indexing',
          content: 'ChromaDB crea un indice (HNSW - Hierarchical Navigable Small World) per ricerche ultra-veloci.'
        }
      ],
      visualAid: `
Document (5000 words)
       │
       ├─► Chunk 1 (500w) ──► Embedding [0.1, 0.5, ...] ─┐
       ├─► Chunk 2 (500w) ──► Embedding [0.3, -0.2, ...] ├─► ChromaDB
       ├─► Chunk 3 (500w) ──► Embedding [-0.1, 0.8, ...] │
       └─► ... (~12 chunks total)                        ─┘
`,
      practicalExample: 'Ora prova a fare domande sui documenti che hai aggiunto - vedrai ZANTARA citarli come fonti!',
      furtherReading: ['quest_vector_embeddings', 'quest_rag_optimization']
    },
    relatedConcepts: ['rag_basics', 'vector_embeddings', 'chromadb'],
    unlockQuest: 'quest_vector_embeddings',
    minLevel: UserLevel.EXPLORER
  },

  // === MULTI-AGENT QUESTS ===
  'quest_multi_agent_intro': {
    didYouKnow: '🤹 Nuzantara usa 4 agenti specializzati che lavorano insieme come un team!',
    technicalExplanation: 'Architettura Multi-Agent: ogni agente (Immigration, Health, Revenue, Memory) è ottimizzato per un dominio. Il router analizza la query e la invia all\'agente giusto.',
    deepDive: {
      title: 'Multi-Agent Architecture',
      sections: [
        {
          heading: 'Perché Multi-Agent?',
          content: 'Invece di un unico AI generalista, usiamo agenti specializzati. Ognuno ha il suo RAG, il suo knowledge domain, e i suoi tool specifici. Risultato: risposte più precise e veloci.'
        },
        {
          heading: 'Immigration Agent',
          content: 'Esperto in: Visti, permessi, normative immigrazione, pratiche documentali. Ha accesso a documenti legali, templates, procedure.',
          code: 'Domain: Immigration, Visas, Work Permits\nTools: Document templates, Legal DB, Case tracker\nRAG: 8K+ immigration docs'
        },
        {
          heading: 'Health Agent',
          content: 'Esperto in: Assicurazioni sanitarie, coperture, provider, claim. Conosce tutti i piani sanitari e le procedure mediche.',
          code: 'Domain: Health insurance, Medical coverage\nTools: Insurance DB, Provider network, Claims system\nRAG: 6K+ health docs'
        },
        {
          heading: 'Revenue Agent',
          content: 'Esperto in: Tasse, revenue tracking, reporting fiscale, compliance. Integrato con Google Sheets per analytics.',
          code: 'Domain: Tax, Revenue, Fiscal compliance\nTools: Google Sheets, Tax calculator, Reports\nRAG: 5K+ tax/finance docs'
        },
        {
          heading: 'Memory Agent',
          content: 'Gestisce la memoria persistente: conversazioni passate, preferenze utente, context tracking cross-session.',
          code: 'Domain: Conversation history, User preferences\nTools: PostgreSQL, Session manager\nStorage: 10K+ conversations'
        }
      ],
      visualAid: `
User Query: "Come funziona assicurazione sanitaria?"
       │
       ▼
┌────────────┐
│   Router   │ ◄── Analizza intent ed entities
└──────┬─────┘
       │ Routes to Health Agent
       ▼
┌──────────────────┐
│  Health Agent    │
│  ┌────────────┐  │
│  │ RAG (6K+)  │  │ ◄── Cerca docs salute
│  └────────────┘  │
│  ┌────────────┐  │
│  │ Insurance  │  │ ◄── Accede DB assicurazioni
│  │     DB     │  │
│  └────────────┘  │
│  ┌────────────┐  │
│  │ Llama 4    │  │ ◄── Genera risposta
│  │   Scout    │  │
│  └────────────┘  │
└────────┬─────────┘
         │
         ▼
    Response + Sources
`,
      practicalExample: 'Prova a chiedere a ZANTARA domande su domini diversi - vedrai che risponde sempre con expertise specifica!',
      furtherReading: ['quest_agent_routing', 'quest_rag_per_agent']
    },
    relatedConcepts: ['multi_agent'],
    unlockQuest: 'quest_agent_deep_dive',
    minLevel: UserLevel.EXPLORER
  }
};

// === TEACHING LIBRARY ===

interface TeachingLibraryItem {
  topic: string;
  explanations: string[]; // Different complexity levels
  examples: string[];
  interactiveDemo?: boolean;
  quiz?: any;
}

const TEACHING_LIBRARY: Record<string, TeachingLibraryItem> = {
  rag_basics: {
    topic: 'RAG (Retrieval Augmented Generation)',
    explanations: [
      // Level 1-2: Rookie/Explorer
      'RAG è come avere un assistente che cerca informazioni in una libreria prima di rispondere. ZANTARA cerca tra 25K+ documenti, trova i più rilevanti, e li usa per darti una risposta precisa con fonti.',

      // Level 3-4: Expert/Master
      'RAG combina retrieval (ricerca) e generation (creazione risposta). Usa embeddings vettoriali per semantic search in ChromaDB, recupera top-K documenti simili, e li passa al LLM come contesto. Questo riduce allucinazioni e permette risposte grounded.',

      // Level 5: Legend
      'RAG architecture: Query encoding → Similarity search (cosine similarity su embeddings) → Context retrieval → Prompt augmentation → LLM generation. Usa HNSW index per sub-linear search time, chunk overlap per context preservation, e re-ranking per relevance optimization.'
    ],
    examples: [
      'Tu: "Visto lavorativo Indonesia?"\nZANTARA cerca → Trova 5 docs rilevanti → Risponde citando fonti',
      'Semantic search: "immigration procedures" e "pratiche immigrazione" trovano gli stessi documenti',
      'ChromaDB has 25,422 indexed documents with 1536-dim embeddings for ultra-fast similarity search'
    ],
    interactiveDemo: true
  },

  semantic_search: {
    topic: 'Semantic Search - Ricerca per Significato',
    explanations: [
      'Semantic search capisce il SIGNIFICATO, non solo le parole. Se cerchi "come applicare per visa" trova anche documenti che dicono "visa application process" o "richiesta visto".',

      'Usa embeddings: ogni testo diventa un vettore matematico che rappresenta il suo significato. Testi con significato simile hanno vettori simili (cosine similarity). ChromaDB fa similarity search in milliseconds.',

      'Vector embeddings mapping: text → R^1536 space. Semantic similarity → geometric proximity. Uses transformer models (sentence-transformers) for encoding. HNSW graph index for approximate nearest neighbor search with 99%+ recall.'
    ],
    examples: [
      '"visto lavorativo" e "work permit" → vettori simili → stessi risultati',
      'Funziona anche cross-language: IT/EN/ID queries trovano docs rilevanti',
      'Cosine similarity: dot(v1, v2) / (||v1|| * ||v2||) > 0.7 = relevant match'
    ]
  },

  multi_agent: {
    topic: 'Multi-Agent Architecture',
    explanations: [
      'Nuzantara ha 4 agenti specializzati: Immigration (visti), Health (assicurazioni), Revenue (tasse), Memory (conversazioni). Ogni agente è esperto nel suo dominio.',

      'Ogni agente ha: RAG specializzato, domain knowledge, tool specifici. Un router analizza la query e la manda all\'agente giusto. Gli agenti possono collaborare per query complesse.',

      'Microservices architecture: backend-ts (orchestrator), backend-rag (vector search), memory-service (persistent context). Agent selection via intent classification + entity extraction. Cross-agent communication via message bus.'
    ],
    examples: [
      'Query su visto → Immigration Agent (8K docs)',
      'Query su assicurazione → Health Agent (6K docs)',
      'Query complessa → Multi-agent collaboration con context sharing'
    ]
  }
};
