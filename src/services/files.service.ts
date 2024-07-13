import fs from 'fs/promises';

function removeFile(pathname: string) {
  return fs.rm(pathname);
}

export { removeFile };
