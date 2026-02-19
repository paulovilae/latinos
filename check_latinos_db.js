const Database = require('/home/paulo/Programs/apps/imaginos/scripts/node_modules/better-sqlite3-multiple-ciphers');
const path = require('path');

const dbPath = '/home/paulo/Programs/apps/latinos/app/app.db';

try {
    const db = new Database(dbPath);
    
    const posts = db.prepare("SELECT title FROM posts WHERE title LIKE '%Mercer%'").all();
    console.log('Relevant Posts:', posts);
    
    const pages = db.prepare("SELECT title FROM pages WHERE title LIKE '%Mercer%'").all();
    console.log('Relevant Pages:', pages);
    
} catch (e) {
    console.error('Error:', e.message);
}
