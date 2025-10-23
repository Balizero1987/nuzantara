/**
 * Dynamic Tokens Manager
 * Gestisce max_tokens dinamico basato su complessità query
 * ~30 righe di codice
 */

class DynamicTokensManager {
    constructor() {
        this.baseTokens = 2000;
        this.maxTokens = 8000;
        this.complexityMultipliers = {
            simple: 1.0,      // "ciao" -> 2000 tokens
            medium: 1.5,      // "spiegami X" -> 3000 tokens  
            complex: 2.0,     // "analizza e confronta" -> 4000 tokens
            research: 3.0,    // "ricerca approfondita" -> 6000 tokens
            analysis: 4.0     // "analisi completa sistema" -> 8000 tokens
        };
        
        console.log('🎯 Dynamic Tokens Manager initialized');
    }
    
    /**
     * Analizza la query e determina i tokens necessari
     */
    calculateTokens(query) {
        const queryLower = query.toLowerCase();
        let complexity = 'simple';
        
        // Analisi complessità basata su keywords
        if (queryLower.includes('analizza') || queryLower.includes('confronta') || 
            queryLower.includes('spiegami') || queryLower.includes('come funziona')) {
            complexity = 'medium';
        }
        
        if (queryLower.includes('ricerca') || queryLower.includes('approfondisci') ||
            queryLower.includes('dettagli') || queryLower.includes('completo')) {
            complexity = 'complex';
        }
        
        if (queryLower.includes('sistema') || queryLower.includes('architettura') ||
            queryLower.includes('tutto') || queryLower.includes('panoramica')) {
            complexity = 'research';
        }
        
        if (queryLower.includes('analisi completa') || queryLower.includes('report dettagliato') ||
            queryLower.includes('documentazione') || queryLower.includes('tutti i dati')) {
            complexity = 'analysis';
        }
        
        const multiplier = this.complexityMultipliers[complexity];
        const calculatedTokens = Math.min(
            Math.round(this.baseTokens * multiplier),
            this.maxTokens
        );
        
        console.log(`🎯 Query complexity: ${complexity}, Tokens: ${calculatedTokens}`);
        
        return {
            tokens: calculatedTokens,
            complexity: complexity,
            multiplier: multiplier
        };
    }
    
    /**
     * Ottiene configurazione per API call
     */
    getConfig(query) {
        const analysis = this.calculateTokens(query);
        
        return {
            max_tokens: analysis.tokens,
            temperature: complexity === 'analysis' ? 0.1 : 0.7,
            top_p: complexity === 'analysis' ? 0.9 : 0.95
        };
    }
}

// Export per compatibilità
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DynamicTokensManager;
} else {
    window.DynamicTokensManager = DynamicTokensManager;
}
