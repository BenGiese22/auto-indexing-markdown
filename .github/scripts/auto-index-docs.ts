// .github/scripts/auto-index-docs.ts

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Configuration interface
interface Config {
  docsDir: string;
  filePatterns: string[];
}

// Rename operation interface
interface RenameOperation {
  from: string;
  to: string;
  index: string;
}

// Configuration - adjust these paths for your repository
const config: Config = {
  docsDir: process.env.DOCS_DIR || 'docs',
  filePatterns: ['*.md', '*.adoc', '*.txt'] // Supported file types
};

/**
 * Extracts index number from filename if it exists
 */
function extractIndexFromFilename(filename: string): number {
  const match = filename.match(/^(\d{4})-/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Checks if a filename has an index prefix
 */
function hasIndexPrefix(filename: string): boolean {
  return /^\d{4}-/.test(filename);
}

/**
 * Formats a number as a 4-digit index string
 */
function formatIndex(index: number): string {
  return index.toString().padStart(4, '0');
}

/**
 * Updates the header in a markdown file to match the index
 */
function updateFileHeader(filePath: string, index: string): void {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Match various number patterns: [Number], [0001], 0001, 99, etc.
    const updatedContent = content.replace(
      /^# (?:\[(?:Number|\d+)\]|\d+): (.*)$/m, 
      `# ${index}: $1`
    );
    
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`Updated header in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Failed to update content in ${filePath}:`, (error as Error).message);
  }
}

/**
 * Finds all files matching the configured patterns
 */
async function findAllFiles(): Promise<string[]> {
  const patterns = config.filePatterns.map(pattern => `${config.docsDir}/**/${pattern}`);
  let allFiles: string[] = [];
  
  for (const pattern of patterns) {
    const files = await glob(pattern);
    allFiles = allFiles.concat(files);
  }
  
  return allFiles;
}

/**
 * Separates files into indexed and unindexed categories
 */
function categorizeFiles(files: string[]): { indexed: string[], unindexed: string[] } {
  const indexed = files.filter(file => {
    const basename = path.basename(file);
    return hasIndexPrefix(basename);
  });
  
  const unindexed = files.filter(file => {
    const basename = path.basename(file);
    return !hasIndexPrefix(basename);
  });
  
  return { indexed, unindexed };
}

/**
 * Finds the highest existing index number
 */
function findMaxIndex(indexedFiles: string[]): number {
  let maxIndex = 0;
  
  indexedFiles.forEach(file => {
    const basename = path.basename(file);
    const index = extractIndexFromFilename(basename);
    if (index > maxIndex) {
      maxIndex = index;
    }
  });
  
  return maxIndex;
}

/**
 * Creates rename operations for unindexed files
 */
function createRenameOperations(unindexedFiles: string[], startingIndex: number): RenameOperation[] {
  // Sort files for consistent ordering
  const sortedFiles = [...unindexedFiles].sort();
  
  return sortedFiles.map((file, i) => {
    const newIndex = formatIndex(startingIndex + i + 1);
    const dir = path.dirname(file);
    const basename = path.basename(file);
    const newFilename = `${newIndex}-${basename}`;
    const newPath = path.join(dir, newFilename);
    
    return { from: file, to: newPath, index: newIndex };
  });
}

/**
 * Performs the actual file rename operations
 */
function performRenames(operations: RenameOperation[]): RenameOperation[] {
  const successful: RenameOperation[] = [];
  
  for (const operation of operations) {
    try {
      fs.renameSync(operation.from, operation.to);
      successful.push(operation);
      console.log(`Renamed: ${operation.from} → ${operation.to}`);
      
      // Update the file header
      updateFileHeader(operation.to, operation.index);
    } catch (error) {
      console.error(`Failed to rename ${operation.from}:`, (error as Error).message);
    }
  }
  
  return successful;
}

/**
 * Main function to auto-index documents
 */
async function autoIndexDocuments(): Promise<void> {
  console.log('Starting auto-indexing process...');
  
  // Find all files
  const allFiles = await findAllFiles();
  const { indexed, unindexed } = categorizeFiles(allFiles);
  
  if (unindexed.length === 0) {
    console.log('No unindexed files found. Nothing to do.');
    return;
  }
  
  // Find the highest existing index
  const maxIndex = findMaxIndex(indexed);
  
  console.log(`Found ${indexed.length} indexed files, highest index: ${formatIndex(maxIndex)}`);
  console.log(`Found ${unindexed.length} unindexed files to process`);
  
  // Create and perform rename operations
  const operations = createRenameOperations(unindexed, maxIndex);
  const successful = performRenames(operations);
  
  if (successful.length > 0) {
    console.log(`Successfully renamed ${successful.length} files`);
  }
}

// Run the script
autoIndexDocuments().catch((error: Error) => {
  console.error('Error during auto-indexing:', error.message);
  process.exit(1);
});
