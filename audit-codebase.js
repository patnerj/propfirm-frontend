const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'src', 'app', 'admin');
const componentsAdminDir = path.join(__dirname, 'src', 'components', 'admin');
const apiTs = path.join(__dirname, 'src', 'lib', 'api.ts');

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allAdminFiles = [
  ...getAllFiles(adminDir),
  ...getAllFiles(componentsAdminDir),
  apiTs
];

console.log(`Found ${allAdminFiles.length} admin and API files to audit.\n`);

const issues = {
  todos: [],
  emptyHandlers: [],
  consoleHandlers: [],
  mockData: [],
  deadButtons: []
};

for (const filePath of allAdminFiles) {
  const relPath = path.relative(__dirname, filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // 1. TODO, FIXME, TBD, coming soon
    if (/(TODO|FIXME|TBD|coming\s+soon)/i.test(line)) {
      issues.todos.push({ file: relPath, line: lineNum, text: line.trim() });
    }

    // 2. Empty onClick handlers
    if (/onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/.test(line)) {
      issues.emptyHandlers.push({ file: relPath, line: lineNum, text: line.trim() });
    }

    // 3. console.log handlers
    if (/onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*console\.(log|warn|error)/.test(line)) {
      issues.consoleHandlers.push({ file: relPath, line: lineNum, text: line.trim() });
    }

    // 4. Mock arrays
    if (/(const\s+mock[A-Za-z0-9_]*\s*=|const\s+dummy[A-Za-z0-9_]*\s*=)/.test(line)) {
      issues.mockData.push({ file: relPath, line: lineNum, text: line.trim() });
    }
  });
}

console.log('=== AUDIT RESULTS ===');
console.log(`1. TODO/FIXME/TBD/Coming Soon: ${issues.todos.length}`);
issues.todos.forEach(t => console.log(`   [${t.file}:${t.line}] ${t.text}`));

console.log(`\n2. Empty onClick Handlers: ${issues.emptyHandlers.length}`);
issues.emptyHandlers.forEach(t => console.log(`   [${t.file}:${t.line}] ${t.text}`));

console.log(`\n3. Console.log onClick Handlers: ${issues.consoleHandlers.length}`);
issues.consoleHandlers.forEach(t => console.log(`   [${t.file}:${t.line}] ${t.text}`));

console.log(`\n4. Mock Data Constants: ${issues.mockData.length}`);
issues.mockData.forEach(t => console.log(`   [${t.file}:${t.line}] ${t.text}`));
