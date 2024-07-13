import { UploadedFile } from 'express-fileupload';
import fs from 'fs/promises';

function readTempFile(tempFile: UploadedFile) {
  return fs.readFile(tempFile.tempFilePath);
}

function removeTempFile(tempFile: UploadedFile) {
  return fs.rm(tempFile.tempFilePath);
}

export { readTempFile, removeTempFile };
