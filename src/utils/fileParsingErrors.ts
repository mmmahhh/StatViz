/**
 * Custom error types for file parsing
 */

export class FileParsingError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'FileParsingError';
  }
}

export class FileTypeError extends FileParsingError {
  constructor(fileType: string) {
    super(
      `Unsupported file type: ${fileType}. Please upload a CSV or Excel (.xlsx/.xls) file.`,
      'UNSUPPORTED_FILE_TYPE'
    );
    this.name = 'FileTypeError';
  }
}

export class FileReadError extends FileParsingError {
  constructor(message: string) {
    super(`Failed to read file: ${message}`, 'FILE_READ_ERROR');
    this.name = 'FileReadError';
  }
}

export class DataParsingError extends FileParsingError {
  constructor(message: string) {
    super(`Failed to parse file data: ${message}`, 'DATA_PARSING_ERROR');
    this.name = 'DataParsingError';
  }
}

export class EmptyFileError extends FileParsingError {
  constructor() {
    super('File is empty or contains no valid data', 'EMPTY_FILE');
    this.name = 'EmptyFileError';
  }
}

export class CorruptedFileError extends FileParsingError {
  constructor(message: string) {
    super(`File appears to be corrupted: ${message}`, 'CORRUPTED_FILE');
    this.name = 'CorruptedFileError';
  }
}

export class FileTooLargeError extends FileParsingError {
  public readonly fileSize: number;
  public readonly maxSize: number;
  constructor(fileSize: number, maxSize: number) {
    super(
      `File too large: ${(fileSize / 1024 / 1024).toFixed(1)}MB exceeds ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`,
      'FILE_TOO_LARGE'
    );
    this.name = 'FileTooLargeError';
    this.fileSize = fileSize;
    this.maxSize = maxSize;
  }
}
