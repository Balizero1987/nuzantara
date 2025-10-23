/**
 * RAG Warmup Service
 * Pre-warm RAG system per performance ottimali
 * ~20 righe di codice
 */

class RAGWarmupService {
    constructor() {
        this.warmupQueries = [
            "ciao",
            "come stai", 
            "aiutami",
            "grazie",
            "salve"
        ];
        this.isWarmedUp = false;
        this.warmupPromise = null;
        
        console.log('🔥 RAG Warmup Service initialized');
    }
    
    /**
     * Esegue warmup del sistema RAG
     */
    async warmup() {
        if (this.isWarmedUp) {
            console.log('🔥 RAG already warmed up');
            return;
        }
        
        if (this.warmupPromise) {
            console.log('🔥 RAG warmup in progress...');
            return this.warmupPromise;
        }
        
        this.warmupPromise = this._performWarmup();
        return this.warmupPromise;
    }
    
    async _performWarmup() {
        console.log('🔥 Starting RAG warmup...');
        
        try {
            // Warmup queries in parallelo
            const warmupPromises = this.warmupQueries.map(async (query) => {
                try {
                    await ZANTARA_API.chat(query);
                    console.log(`🔥 Warmup query: "${query}" ✅`);
                } catch (error) {
                    console.log(`🔥 Warmup query: "${query}" ❌ (expected)`);
                }
            });
            
            await Promise.allSettled(warmupPromises);
            
            this.isWarmedUp = true;
            console.log('🔥 RAG warmup completed! System ready for optimal performance');
            
        } catch (error) {
            console.log('🔥 RAG warmup failed, but system still functional');
        }
    }
    
    /**
     * Controlla se sistema è warm
     */
    isReady() {
        return this.isWarmedUp;
    }
}

// Export per compatibilità
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RAGWarmupService;
} else {
    window.RAGWarmupService = RAGWarmupService;
}
