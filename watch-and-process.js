const fs = require('fs');
const { exec } = require('child_process');
const notifier = require('node-notifier');

const journalPath = 'C:\\Users\\jacks\\OneDrive\\Desktop\\Blog\\journal.txt';

console.log(`👀 Watching ${journalPath} for changes...`);

fs.watchFile(journalPath, { interval: 1000 }, () => {
  console.log('🛠️  Change detected. Running parser...');

  exec('node C:\\Users\\jacks\\OneDrive\\Desktop\\Blog\\parser.js', (err, stdout, stderr) => {
    if (err) {
      console.error('❌ Parser error:', err);
      notifier.notify({
        title: 'BearBlog Upload',
        message: '❌ Parser error occurred',
        sound: true,
      });
      return;
    }
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    console.log('🚀 Running uploader...');
    exec('node C:\\Users\\jacks\\OneDrive\\Desktop\\Blog\\updateBearBlog.js', (err2, stdout2, stderr2) => {
      if (err2) {
        console.error('❌ Upload error:', err2);
        notifier.notify({
          title: 'BearBlog Upload',
          message: '❌ Upload error occurred',
          sound: true,
        });
        return;
      }
      if (stdout2) console.log(stdout2);
      if (stderr2) console.error(stderr2);

      console.log('✅ Upload complete.');
      notifier.notify({
        title: 'BearBlog Upload',
        message: '✅ Blog post uploaded successfully!',
        sound: true,
      });
    });
  });
});
