# .github/workflows/auto-index-architecture-docs.yml

name: Auto-Index Architecture Documents

on:
  pull_request:
    types: [closed]
    branches: [main]  # Adjust to your default branch
    paths: 
      - 'docs/**'  # Adjust path to your architecture docs folder
      - 'architecture/**'  # Add other paths as needed

jobs:
  auto-index-docs:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    
    permissions:
      contents: write
      pull-requests: read
    
    steps:
    - name: Checkout repository
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
        token: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        npm init -y
        npm install glob
    
    - name: Auto-index architecture documents
      run: |
        node << 'EOF'
        const fs = require('fs');
        const path = require('path');
        const { glob } = require('glob');
        
        // Configuration - adjust these paths for your repository
        const DOCS_DIR = 'docs'; // Change to your architecture docs directory
        const FILE_PATTERNS = ['*.md', '*.adoc', '*.txt']; // Supported file types
        
        async function autoIndexDocuments() {
          console.log('Starting auto-indexing process...');
          
          // Find all architecture documents
          const patterns = FILE_PATTERNS.map(pattern => `${DOCS_DIR}/**/${pattern}`);
          let allFiles = [];
          
          for (const pattern of patterns) {
            const files = await glob(pattern);
            allFiles = allFiles.concat(files);
          }
          
          // Filter out files that already have index numbers (0001-9999)
          const indexedFiles = allFiles.filter(file => {
            const basename = path.basename(file);
            return /^\d{4}-/.test(basename);
          });
          
          const unindexedFiles = allFiles.filter(file => {
            const basename = path.basename(file);
            return !/^\d{4}-/.test(basename);
          });
          
          if (unindexedFiles.length === 0) {
            console.log('No unindexed files found. Nothing to do.');
            return;
          }
          
          // Find the highest existing index
          let maxIndex = 0;
          indexedFiles.forEach(file => {
            const basename = path.basename(file);
            const match = basename.match(/^(\d{4})-/);
            if (match) {
              const index = parseInt(match[1], 10);
              if (index > maxIndex) {
                maxIndex = index;
              }
            }
          });
          
          console.log(`Found ${indexedFiles.length} indexed files, highest index: ${maxIndex.toString().padStart(4, '0')}`);
          console.log(`Found ${unindexedFiles.length} unindexed files to process`);
          
          // Sort unindexed files for consistent ordering
          unindexedFiles.sort();
          
          // Rename unindexed files with sequential numbering
          const renames = [];
          unindexedFiles.forEach((file, i) => {
            const newIndex = (maxIndex + i + 1).toString().padStart(4, '0');
            const dir = path.dirname(file);
            const basename = path.basename(file);
            const newFilename = `${newIndex}-${basename}`;
            const newPath = path.join(dir, newFilename);
            
            renames.push({ from: file, to: newPath, index: newIndex });
          });
          
          // Perform the renames
          let renamed = [];
          for (const rename of renames) {
            try {
              fs.renameSync(rename.from, rename.to);
              renamed.push(rename);
              console.log(`Renamed: ${rename.from} → ${rename.to}`);
            } catch (error) {
              console.error(`Failed to rename ${rename.from}:`, error.message);
            }
          }
          
          if (renamed.length > 0) {
            // Create a summary of changes
            const summary = renamed.map(r => `- ${r.index}: ${path.basename(r.to)}`).join('\n');
            
            // Write summary to a file that can be used in commit message
            fs.writeFileSync('rename-summary.txt', 
              `Auto-indexed ${renamed.length} architecture document(s):\n\n${summary}`
            );
            
            console.log(`Successfully renamed ${renamed.length} files`);
          }
        }
        
        autoIndexDocuments().catch(console.error);
        EOF
    
    - name: Check for changes
      id: check_changes
      run: |
        if git diff --quiet; then
          echo "has_changes=false" >> $GITHUB_OUTPUT
        else
          echo "has_changes=true" >> $GITHUB_OUTPUT
        fi
    
    - name: Commit and push changes
      if: steps.check_changes.outputs.has_changes == 'true'
      run: |
        git config --local user.email "action@github.com"
        git config --local user.name "GitHub Action"
        
        # Read the summary if it exists
        if [ -f "rename-summary.txt" ]; then
          COMMIT_MSG=$(cat rename-summary.txt)
        else
          COMMIT_MSG="Auto-index architecture documents"
        fi
        
        git add .
        git commit -m "$COMMIT_MSG"
        git push
        
        # Clean up
        rm -f rename-summary.txt
    
    - name: Create comment on PR
      if: steps.check_changes.outputs.has_changes == 'true'
      uses: actions/github-script@v7
      with:
        script: |
          const fs = require('fs');
          let comment = '🔄 **Architecture Documents Auto-Indexed**\n\n';
          
          if (fs.existsSync('rename-summary.txt')) {
            const summary = fs.readFileSync('rename-summary.txt', 'utf8');
            comment += summary;
          } else {
            comment += 'Architecture documents have been automatically indexed.';
          }
          
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: comment
          });
