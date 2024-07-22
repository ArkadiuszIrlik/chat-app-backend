import { ExtendedYup } from '@src/extendedYup.js';
import fileUpload from 'express-fileupload';
import mongoose from 'mongoose';

describe('ExtendedYup.string().mongooseId()', () => {
  it('isValid() resolves to true when passed a valid mongoose id string', async () => {
    const testSchema = ExtendedYup.string().mongooseId();
    const testValue = new mongoose.Types.ObjectId().toString();

    await expect(testSchema.isValid(testValue)).resolves.toBe(true);
  });

  it('isValid() resolves to false when passed an invalid mongoose id string', async () => {
    const testSchema = ExtendedYup.string().mongooseId();
    const testValue = 'invalid mongoose id';

    await expect(testSchema.isValid(testValue)).resolves.toBe(false);
  });
});

describe('ExtendedYup.mixed().notTruncated()', () => {
  it('isValid() resolves to true when passed an object with truncated: false', async () => {
    const testSchema = ExtendedYup.mixed().notTruncated();
    const mockFileUpload: Partial<fileUpload.UploadedFile> = {
      truncated: false,
    };

    await expect(testSchema.isValid(mockFileUpload)).resolves.toBe(true);
  });

  it('isValid() resolves to false when passed an object with truncated: true', async () => {
    const testSchema = ExtendedYup.mixed().notTruncated();
    const mockFileUpload: Partial<fileUpload.UploadedFile> = {
      truncated: true,
    };

    await expect(testSchema.isValid(mockFileUpload)).resolves.toBe(false);
  });
});

describe('ExtendedYup.mixed().notArray()', () => {
  it('isValid() resolves to true when passed a single object', async () => {
    const testSchema = ExtendedYup.mixed().notArray();
    const testObject = {
      property: 'value',
    };

    await expect(testSchema.isValid(testObject)).resolves.toBe(true);
  });

  it('isValid() resolves to false when passed an array of objects', async () => {
    const testSchema = ExtendedYup.mixed().notArray();
    const testArray = [{ property: 'value' }, { property: 'value' }];

    await expect(testSchema.isValid(testArray)).resolves.toBe(false);
  });
});

describe('ExtendedYup.mixed().oneOfMimeType()', () => {
  it('isValid() resolves to true when passed a file upload of expected MIME type', async () => {
    const testSchema = ExtendedYup.mixed().oneOfMimeType([
      'image/jpeg',
      'image/png',
    ]);
    const mockFileUpload: Partial<fileUpload.UploadedFile> = {
      mimetype: 'image/png',
    };

    await expect(testSchema.isValid(mockFileUpload)).resolves.toBe(true);
  });

  it('isValid() resolves to false when passed a file upload with a different MIME type than expected', async () => {
    const testSchema = ExtendedYup.mixed().oneOfMimeType([
      'image/jpeg',
      'image/png',
    ]);
    const mockFileUpload: Partial<fileUpload.UploadedFile> = {
      mimetype: 'image/avif',
    };

    await expect(testSchema.isValid(mockFileUpload)).resolves.toBe(false);
  });

  it('isValid() resolves to false when passed an object without mimetype property', async () => {
    const testSchema = ExtendedYup.mixed().oneOfMimeType([
      'image/jpeg',
      'image/png',
    ]);
    const testObject = { property: 'value' };

    await expect(testSchema.isValid(testObject)).resolves.toBe(false);
  });
});
