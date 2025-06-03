const fs = require('fs');
const path = require('path');

class JournalParser {
  constructor(journalPath = 'journal.txt', postedLogPath = 'posted-entries.log') {
    this.journalPath = journalPath;
    this.postedLogPath = postedLogPath;
  }

  // Read and parse journal entries
  parseJournal() {
    try {
      const content = fs.readFileSync(this.journalPath, 'utf8');
      const entries = content.split('---')
        .map(entry => entry.trim())
        .filter(entry => entry.length > 0)
        .map((entry, index) => {
          const lines = entry.split('\n').filter(line => line.trim());
          if (lines.length === 0) return null;
          
          // Try to parse date from first line
          const firstLine = lines[0].trim();
          const dateMatch = firstLine.match(/^\d{4}-\d{2}-\d{2}(\s+\d{1,2}:\d{2})?/);
          
          let title = '';
          let content = '';
          let date = new Date().toISOString();
          
          if (dateMatch) {
            date = new Date(dateMatch[0]).toISOString();
            // Content starts from second line
            const contentLines = lines.slice(1);
            // First content line might be title, rest is content
            if (contentLines.length > 0) {
              title = contentLines[0].substring(0, 60) + (contentLines[0].length > 60 ? '...' : '');
              content = contentLines.join('\n');
            }
          } else {
            // No date found, treat first line as title
            title = firstLine.substring(0, 60) + (firstLine.length > 60 ? '...' : '');
            content = lines.join('\n');
          }
          
          return {
            id: `entry_${index}_${Buffer.from(entry).toString('base64').substring(0, 8)}`,
            title: title || `Quick thought - ${new Date(date).toLocaleDateString()}`,
            content: content,
            date: date,
            raw: entry
          };
        })
        .filter(entry => entry !== null);
      
      return entries;
    } catch (error) {
      console.error('Error reading journal:', error);
      return [];
    }
  }

  // Get list of already posted entries
  getPostedEntries() {
    try {
      if (fs.existsSync(this.postedLogPath)) {
        const content = fs.readFileSync(this.postedLogPath, 'utf8');
        return content.split('\n').filter(line => line.trim().length > 0);
      }
      return [];
    } catch (error) {
      console.error('Error reading posted log:', error);
      return [];
    }
  }

  // Mark entry as posted
  markAsPosted(entryId) {
    try {
      fs.appendFileSync(this.postedLogPath, entryId + '\n');
    } catch (error) {
      console.error('Error marking entry as posted:', error);
    }
  }

  // Get new entries that haven't been posted yet
  getNewEntries() {
    const allEntries = this.parseJournal();
    const postedIds = this.getPostedEntries();
    
    const newEntries = allEntries.filter(entry => !postedIds.includes(entry.id));
    
    console.log(`Found ${allEntries.length} total entries, ${postedIds.length} already posted, ${newEntries.length} new`);
    
    return newEntries;
  }
}

// Export for use in other scripts
module.exports = JournalParser;

// If run directly, show new entries
if (require.main === module) {
  const parser = new JournalParser();
  const newEntries = parser.getNewEntries();
  
  console.log('New entries to post:');
  newEntries.forEach(entry => {
    console.log(`\n--- ${entry.title} ---`);
    console.log(`Date: ${entry.date}`);
    console.log(`Content: ${entry.content.substring(0, 100)}...`);
    console.log(`ID: ${entry.id}`);
  });
}