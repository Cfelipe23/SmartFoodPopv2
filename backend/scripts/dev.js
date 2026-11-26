const { spawn } = require('node:child_process');
const { join } = require('node:path');
const ts = require('typescript');
const { copySchema } = require('./copy-schema');

const backendDir = join(__dirname, '..');
let server;

const formatHost = {
  getCanonicalFileName: file => file,
  getCurrentDirectory: () => backendDir,
  getNewLine: () => ts.sys.newLine
};
const reportDiagnostic = diagnostic => {
  process.stderr.write(ts.formatDiagnostic(diagnostic, formatHost));
};

const host = ts.createWatchCompilerHost(
  join(backendDir, 'tsconfig.json'),
  {},
  ts.sys,
  ts.createEmitAndSemanticDiagnosticsBuilderProgram,
  reportDiagnostic,
  diagnostic => process.stdout.write(ts.flattenDiagnosticMessageText(diagnostic.messageText, ts.sys.newLine) + ts.sys.newLine)
);

const reportCompilation = host.afterProgramCreate;
host.afterProgramCreate = program => {
  reportCompilation(program);
  if (server || ts.getPreEmitDiagnostics(program.getProgram()).some(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error)) return;

  copySchema();
  server = spawn(process.execPath, ['--watch', '--enable-source-maps', 'dist/server.js'], {
    cwd: backendDir,
    stdio: 'inherit'
  });
  server.once('error', error => {
    console.error(error.message);
    process.exitCode = 1;
    watcher.close();
  });
  server.once('exit', (code, signal) => {
    watcher.close();
    process.exitCode = code ?? (signal ? 1 : 0);
  });
};

const watcher = ts.createWatchProgram(host);

function stop() {
  watcher.close();
  server?.kill();
}

process.once('SIGINT', stop);
process.once('SIGTERM', stop);
