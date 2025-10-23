#!/usr/bin/env node

/**
 * Bali Zero Publication - Content Generator
 *
 * Uses RAG Backend + Claude Haiku 4.5 to generate high-quality articles
 * with legal accuracy and cultural intelligence (JIWA).
 *
 * Usage:
 *   node generate-article.js --topic "Bali Tourism 2025" --pillar bali-reality
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  ragBackendUrl: process.env.RAG_BACKEND_URL || 'https://scintillating-kindness-production-47e3.up.railway.app',
  tsBackendUrl: process.env.TS_BACKEND_URL || 'https://ts-backend-production-568d.up.railway.app',
  outputDir: path.join(__dirname, '../../apps/publication/src/content/articles'),
};

// Pillar mappings
const PILLARS = {
  'bali-reality': 'Bali Reality',
  'expat-economy': 'Expat Economy',
  'business-formation': 'Business Formation',
  'ai-tech': 'AI & Tech',
  'trends-analysis': 'Trends & Analysis',
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    parsed[key] = value;
  }

  return parsed;
}

/**
 * Validate arguments
 */
function validateArgs(args) {
  if (!args.topic) {
    console.error('❌ Error: --topic is required');
    console.log('\nUsage:');
    console.log('  node generate-article.js --topic "Your Topic" --pillar bali-reality');
    console.log('\nPillars:');
    Object.keys(PILLARS).forEach(key => console.log(`  - ${key}`));
    process.exit(1);
  }

  if (!args.pillar || !PILLARS[args.pillar]) {
    console.error('❌ Error: Invalid --pillar');
    console.log('\nAvailable pillars:');
    Object.keys(PILLARS).forEach(key => console.log(`  - ${key}`));
    process.exit(1);
  }
}

/**
 * Generate slug from title
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Query RAG backend for context
 */
async function queryRAGContext(topic, pillar) {
  console.log('🔍 Querying RAG backend for context...');

  try {
    const response = await fetch(`${CONFIG.ragBackendUrl}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: topic,
        collections: getCollectionsForPillar(pillar),
        top_k: 10,
      }),
    });

    if (!response.ok) {
      throw new Error(`RAG Backend error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Found ${data.results?.length || 0} relevant documents`);

    return data.results || [];
  } catch (error) {
    console.warn(`⚠️  RAG query failed: ${error.message}`);
    return [];
  }
}

/**
 * Get ChromaDB collections based on pillar
 */
function getCollectionsForPillar(pillar) {
  const collectionMap = {
    'bali-reality': ['visa_oracle', 'legal_architect', 'cultural_insights'],
    'expat-economy': ['tax_genius', 'legal_architect', 'cultural_insights'],
    'business-formation': ['kbli_eye', 'legal_architect', 'tax_genius'],
    'ai-tech': ['zantara_books', 'kb_indonesian'],
    'trends-analysis': ['legal_updates', 'tax_updates', 'cultural_insights'],
  };

  return collectionMap[pillar] || ['cultural_insights'];
}

/**
 * Generate article using Claude Haiku 4.5
 */
async function generateArticle(topic, pillar, ragContext) {
  console.log('✍️  Generating article with Claude Haiku 4.5...');

  const prompt = buildArticlePrompt(topic, pillar, ragContext);

  try {
    const response = await fetch(`${CONFIG.ragBackendUrl}/bali-zero/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: prompt,
        use_rag: true,
        include_jiwa: true,
        user_id: 'content-generator',
        session_id: `article-gen-${Date.now()}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Article generation error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Article generated successfully');

    return data.response;
  } catch (error) {
    console.error(`❌ Generation failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Build prompt for article generation
 */
function buildArticlePrompt(topic, pillar, ragContext) {
  const contextText = ragContext
    .map(doc => doc.content || doc.text)
    .join('\n\n');

  return `You are writing for the Bali Zero Publication, a McKinsey-style content platform.

**Assignment:** Write a comprehensive article about "${topic}" for the ${PILLARS[pillar]} section.

**Style Guidelines:**
- McKinsey consultantial voice (data-driven, authoritative, opinionated)
- NOT a listicle or "how to" guide
- Deep analysis with insights
- Include Zero's strategic perspective
- 2000-2500 words
- Use markdown formatting

**Structure:**
1. Hook opening (compelling context)
2. 3-4 main sections with subheadings
3. Data and statistics (with citations)
4. Zero's consultantial take
5. Forward-looking conclusion

**RAG Context (use for accuracy):**
${contextText.slice(0, 3000)}

**Output Format:**
Return ONLY the article content in markdown format. Do NOT include frontmatter (I'll add that).
Start with the article title as # heading.

Write now:`;
}

/**
 * Create MDX file with frontmatter
 */
function createMDXFile(topic, pillar, articleContent, ragContext) {
  const slug = generateSlug(topic);
  const today = new Date().toISOString().split('T')[0];

  // Calculate read time (rough estimate: 200 words/min)
  const wordCount = articleContent.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / 200);

  // Extract title from article content (first # heading)
  const titleMatch = articleContent.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : topic;

  // Extract first paragraph as description
  const descMatch = articleContent.match(/\n\n(.+?)\n\n/);
  const description = descMatch
    ? descMatch[1].slice(0, 160)
    : `Deep analysis about ${topic}`;

  // Build frontmatter
  const frontmatter = `---
title: "${title}"
description: "${description}"
pubDate: ${today}
heroImage: "/images/articles/${slug}.jpg"
pillar: ${pillar}
tags: ${JSON.stringify(extractTags(topic, pillar))}
author: "Zero"
readTime: "${readTime} min"
featured: false
ragGenerated: true
ragSources: ${JSON.stringify(ragContext.slice(0, 3).map(d => d.source || 'RAG'))}
culturalContext: true
---

`;

  const mdxContent = frontmatter + articleContent;

  // Create directory if needed
  const pillarDir = path.join(CONFIG.outputDir, pillar);
  if (!fs.existsSync(pillarDir)) {
    fs.mkdirSync(pillarDir, { recursive: true });
  }

  // Write file
  const filePath = path.join(pillarDir, `${slug}.mdx`);
  fs.writeFileSync(filePath, mdxContent, 'utf8');

  console.log(`\n✅ Article created successfully!`);
  console.log(`📁 File: ${filePath}`);
  console.log(`📝 Word count: ${wordCount}`);
  console.log(`⏱️  Read time: ${readTime} min`);
  console.log(`🔗 Slug: ${slug}`);

  return filePath;
}

/**
 * Extract tags from topic and pillar
 */
function extractTags(topic, pillar) {
  const tags = [PILLARS[pillar]];

  // Add common keywords as tags
  const keywords = ['visa', 'tax', 'business', 'bali', 'indonesia', 'expat', 'legal', 'ai'];
  const topicLower = topic.toLowerCase();

  keywords.forEach(keyword => {
    if (topicLower.includes(keyword)) {
      tags.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
    }
  });

  return tags.slice(0, 5); // Max 5 tags
}

/**
 * Main execution
 */
async function main() {
  console.log('🌌 Bali Zero Publication - Content Generator\n');

  const args = parseArgs();
  validateArgs(args);

  const { topic, pillar } = args;

  console.log(`📝 Topic: ${topic}`);
  console.log(`📂 Pillar: ${PILLARS[pillar]}`);
  console.log('');

  // Step 1: Query RAG for context
  const ragContext = await queryRAGContext(topic, pillar);

  // Step 2: Generate article
  const articleContent = await generateArticle(topic, pillar, ragContext);

  // Step 3: Create MDX file
  const filePath = createMDXFile(topic, pillar, articleContent, ragContext);

  console.log('\n🎉 Done! Next steps:');
  console.log('  1. Review the article');
  console.log('  2. Generate hero image with IMAGINEART');
  console.log('  3. git add && git commit && git push');
  console.log('  4. Auto-deploys to Cloudflare Pages!');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
