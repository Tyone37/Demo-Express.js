import { fork } from 'node:child_process';

const children = ['sinhvien', 'detai', 'dangky'].map(name => fork(new URL(`./${name}.js`, import.meta.url), [], { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] }));
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  children.forEach(child => { if (child.connected) child.send('stop'); });
  setTimeout(() => children.forEach(child => { if (child.exitCode === null) child.kill(); }), 3000).unref();
}
let ready = 0;
children.forEach(child => {
  child.on('message', () => { if (++ready === 3) console.log('Mở giao diện: http://127.0.0.1:3001/client/'); });
  child.on('error', error => { console.error(error.message); stop(1); });
  child.on('exit', code => { if (!stopping) stop(code || 1); });
});
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
