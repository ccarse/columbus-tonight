import fs from 'fs';

export function log(level: any, msg: any) {
  process.stderr.write('[' + new Date() + '] ' + '[' + level + '] ' + msg + '\n');
  fs.appendFileSync(__dirname + '/../docs/log.txt', '[' + new Date() + '] ' + '[' + level + '] ' + msg + '\n');
}
