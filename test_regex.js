const fs = require('fs');
const gradleContents = fs.readFileSync('D:\\next-nizron-erp-sabir-main\\flah-app\\android\\app\\build.gradle', 'utf8');
const match = gradleContents.match(/namespace\s*[=]*\s*["'](.+?)["']/);
console.log('Regex match result:', match ? match[1] : 'NO MATCH');
console.log('Full match:', match ? match[0] : 'none');
