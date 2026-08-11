process.env.BRAINSTORM_DIR = 'C:\\Users\\Miguel\\Documents\\New project\\.superpowers\\brainstorm\\carousel-visual-20260807';
process.env.BRAINSTORM_PORT = '51777';
process.env.BRAINSTORM_OPEN = '0';
process.env.BRAINSTORM_IDLE_TIMEOUT_MS = '14400000';
try {
  require('C:\\Users\\Miguel\\.codex\\superpowers\\skills\\brainstorming\\scripts\\server.cjs');
} catch (error) {
  require('fs').writeFileSync('C:\\Users\\Miguel\\Documents\\New project\\.superpowers\\brainstorm\\carousel-visual-20260807\\launcher-error.log', String(error.stack || error));
  throw error;
}
