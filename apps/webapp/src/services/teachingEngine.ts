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
    topic: 'Come ZANTARA Trova le Informazioni',
    explanations: [
      // Level 1-2: Rookie/Explorer
      'Immagina ZANTARA come un bibliotecario intelligente. Quando fai una domanda, lui va a cercare tra 25.000+ documenti nella sua libreria, trova quelli più utili, li legge, e ti dà una risposta citando da dove ha preso le informazioni. Non inventa niente, usa documenti veri!',

      // Level 3-4: Expert/Master
      'ZANTARA fa due cose: prima CERCA i documenti giusti, poi CREA la risposta. Per cercare, trasforma la tua domanda in una "formula matematica" e trova documenti con formule simili. Poi legge quei documenti e scrive la risposta citando le fonti. Per questo le risposte sono sempre accurate!',

      // Level 5: Legend
      'Il processo: la tua domanda diventa un "embedding" (vettore matematico). ZANTARA cerca documenti con embeddings simili usando cosine similarity. Trova i top 5-10 risultati, li passa al modello AI che genera la risposta. Usa HNSW index per ricerca veloce, chunking con overlap per non perdere contesto.'
    ],
    examples: [
      'Tu chiedi: "Visto lavorativo Indonesia?"\nZANTARA cerca → Trova 5 documenti su visti → Ti risponde citando le fonti',
      'Se cerchi in italiano o inglese, trova gli stessi documenti perché capisce il SIGNIFICATO',
      'Ha 25.422 documenti indicizzati, può cercare tra tutti in meno di mezzo secondo'
    ],
    interactiveDemo: true
  },

  semantic_search: {
    topic: 'Ricerca Intelligente',
    explanations: [
      'ZANTARA non cerca solo le stesse parole che usi. Capisce il SIGNIFICATO! Se chiedi "come ottenere visa" trova anche documenti che parlano di "richiesta visto", "visa application", "procedura immigrazione" - anche se non usano le tue stesse parole.',

      'Come fa? Ogni testo (sia la tua domanda che i documenti) diventa un "numero speciale" che rappresenta il suo significato. Testi con significati simili hanno numeri simili. ZANTARA confronta i numeri e trova i documenti che "significano" qualcosa di simile alla tua domanda.',

      'Tecnicamente: usa vector embeddings in spazio 1536-dimensionale. Similarity search con cosine similarity. Modelli transformer (sentence-transformers) per encoding. HNSW graph index per ricerca approssimata con 99%+ recall.'
    ],
    examples: [
      'Cerchi "visto lavorativo" in italiano → Trova anche docs che dicono "work permit" in inglese',
      'Funziona in 3 lingue: Italiano, Inglese, Indonesiano',
      'Due frasi diverse ma con stesso significato vengono trovate insieme'
    ]
  },

  multi_agent: {
    topic: 'I 4 Esperti di ZANTARA',
    explanations: [
      'ZANTARA non è uno solo - è un team di 4 esperti! Immigration (pratiche visti), Health (assicurazioni salute), Revenue (tasse e soldi), Memory (ricorda le conversazioni). Quando fai una domanda, ZANTARA capisce l\'argomento e chiama l\'esperto giusto. È come avere 4 consulenti specializzati sempre disponibili!',

      'Ogni esperto ha: la sua libreria di documenti specializzati, conoscenze specifiche del suo settore, strumenti dedicati. Un "router" analizza la tua domanda e la manda all\'esperto più adatto. A volte collaborano tra loro per domande complesse.',

      'Architettura: backend-ts coordina tutto (orchestrator), backend-rag fa la ricerca documenti (vector search), memory-service gestisce memoria (persistent context). Selezione agent via intent classification + entity extraction. Comunicazione cross-agent via message bus.'
    ],
    examples: [
      'Chiedi di un visto → Immigration Agent risponde (ha 8.000 documenti su immigrazione)',
      'Chiedi di assicurazione → Health Agent risponde (ha 6.000 documenti su salute)',
      'Domanda complessa su visto + tasse → Immigration e Revenue collaborano'
    ]
  }
};
