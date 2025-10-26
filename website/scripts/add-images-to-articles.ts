/**
 * Script to add images every 500 words to existing articles
 * Usage: npx tsx scripts/add-images-to-articles.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import {
  generateImage,
  createEditorialPrompt,
  extractImageContext,
  downloadAndSaveImage,
} from '../lib/image-generator';

const ARTICLES_DIR = path.join(process.cwd(), 'content/articles');
const WORDS_PER_IMAGE = 500;

interface ImageInsertion {
  position: number; // Word position in content
  prompt: string;
  imageUrl: string;
  caption: string;
}

/**
 * Count words in markdown content (excluding frontmatter)
 */
function countWords(content: string): number {
  return content.trim().split(/\s+/).length;
}

/**
 * Parse markdown content into sections with headings
 */
function parseContentSections(content: string): Array<{ heading: string; content: string; position: number }> {
  const lines = content.split('\n');
  const sections: Array<{ heading: string; content: string; position: number }> = [];
  let currentSection = { heading: 'Introduction', content: '', position: 0 };
  let wordCount = 0;

  lines.forEach((line) => {
    if (line.startsWith('## ')) {
      // Save previous section
      if (currentSection.content) {
        sections.push({ ...currentSection });
      }
      // Start new section
      currentSection = {
        heading: line.replace(/^##\s+/, ''),
        content: '',
        position: wordCount,
      };
    } else {
      currentSection.content += line + '\n';
      wordCount += line.split(/\s+/).filter(w => w.length > 0).length;
    }
  });

  // Add final section
  if (currentSection.content) {
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Find optimal positions for images (every 500 words, after paragraphs)
 */
function findImagePositions(content: string, wordsPerImage: number): number[] {
  const words = content.split(/\s+/);
  const totalWords = words.length;
  const positions: number[] = [];

  for (let i = wordsPerImage; i < totalWords; i += wordsPerImage) {
    // Find nearest paragraph break after this position
    const nearestBreak = findNearestParagraphBreak(content, i);
    if (nearestBreak > 0 && !positions.includes(nearestBreak)) {
      positions.push(nearestBreak);
    }
  }

  return positions;
}

/**
 * Find nearest paragraph break (double newline) after word position
 */
function findNearestParagraphBreak(content: string, wordPosition: number): number {
  const words = content.split(/\s+/);
  const charPosition = words.slice(0, wordPosition).join(' ').length;
  
  // Look for \n\n (paragraph break) within next 200 characters
  const searchRange = content.substring(charPosition, charPosition + 200);
  const breakIndex = searchRange.indexOf('\n\n');
  
  if (breakIndex > -1) {
    const actualCharPos = charPosition + breakIndex + 2;
    // Convert back to word position
    return content.substring(0, actualCharPos).split(/\s+/).length;
  }
  
  return wordPosition;
}

/**
 * Generate and insert images into article
 */
async function processArticle(filename: string): Promise<void> {
  console.log(`\n📝 Processing: ${filename}`);
  
  const filePath = path.join(ARTICLES_DIR, filename);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content } = matter(fileContent);
  
  const articleTitle = frontmatter.title || filename;
  const totalWords = countWords(content);
  
  console.log(`   Words: ${totalWords}`);
  
  if (totalWords < WORDS_PER_IMAGE) {
    console.log(`   ⏭️  Skipping (too short)`);
    return;
  }
  
  // Find image positions
  const imagePositions = findImagePositions(content, WORDS_PER_IMAGE);
  console.log(`   🖼️  Images to add: ${imagePositions.length}`);
  
  // Parse sections
  const sections = parseContentSections(content);
  
  // Generate images
  const imageInsertions: ImageInsertion[] = [];
  
  for (const position of imagePositions) {
    // Find which section this position falls into
    const section = sections.find((s, idx) => {
      const nextSection = sections[idx + 1];
      return position >= s.position && (!nextSection || position < nextSection.position);
    }) || sections[0];
    
    console.log(`   🎨 Generating image for position ${position} (${section.heading})...`);
    
    try {
      // Extract context around position
      const context = extractImageContext(content, position, 100);
      
      // Create prompt
      const prompt = createEditorialPrompt(articleTitle, section.heading, context);
      console.log(`      Prompt: ${prompt.substring(0, 80)}...`);
      
      // Generate image
      const generatedImage = await generateImage({
        prompt,
        style: 'editorial',
        aspectRatio: '16:9',
        quality: 'hd',
      });
      
      // Download and save
      const localPath = await downloadAndSaveImage(generatedImage.url, generatedImage.filename);
      
      imageInsertions.push({
        position,
        prompt: generatedImage.prompt,
        imageUrl: localPath,
        caption: `Illustration: ${section.heading}`,
      });
      
      console.log(`      ✅ Saved: ${localPath}`);
    } catch (error) {
      console.error(`      ❌ Error generating image:`, error);
    }
  }
  
  // Insert images into content
  if (imageInsertions.length > 0) {
    const updatedContent = insertImagesIntoContent(content, imageInsertions);
    
    // Write back to file
    const updatedFile = matter.stringify(updatedContent, frontmatter);
    fs.writeFileSync(filePath, updatedFile, 'utf-8');
    
    console.log(`   ✅ Updated article with ${imageInsertions.length} images`);
  }
}

/**
 * Insert images into content at specified positions
 */
function insertImagesIntoContent(content: string, insertions: ImageInsertion[]): string {
  // Sort insertions by position (descending) to insert from end to beginning
  const sortedInsertions = insertions.sort((a, b) => b.position - a.position);
  
  let updatedContent = content;
  const words = content.split(/\s+/);
  
  sortedInsertions.forEach((insertion) => {
    // Find character position from word position
    const charPosition = words.slice(0, insertion.position).join(' ').length;
    
    // Create image markdown
    const imageMarkdown = `\n\n![${insertion.caption}](${insertion.imageUrl})\n*${insertion.caption}*\n\n`;
    
    // Insert at position
    updatedContent = 
      updatedContent.substring(0, charPosition) +
      imageMarkdown +
      updatedContent.substring(charPosition);
  });
  
  return updatedContent;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting article image generation...\n');
  console.log(`   Target: ${WORDS_PER_IMAGE} words per image`);
  console.log(`   Directory: ${ARTICLES_DIR}\n`);
  
  // Get all markdown files
  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.md'));
  
  console.log(`Found ${files.length} articles\n`);
  
  // Process each article
  for (const file of files) {
    try {
      await processArticle(file);
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  }
  
  console.log('\n✅ Done!');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { processArticle, findImagePositions, insertImagesIntoContent };

