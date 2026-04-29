import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { RawDataRow } from '../types';
import {
  FileTypeError,
  FileReadError,
  DataParsingError,
  EmptyFileError,
  CorruptedFileError,
  FileTooLargeError,
} from './fileParsingErrors';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export const parseFile = async (file: File): Promise<RawDataRow[]> => {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new FileTooLargeError(file.size, MAX_FILE_SIZE_BYTES);
  }

  const extension = file.name.split('.').pop()?.toLowerCase();

  // Validate file type
  if (!extension || !['csv', 'xlsx', 'xls'].includes(extension)) {
    throw new FileTypeError(extension || 'unknown');
  }

  return new Promise((resolve, reject) => {
    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            if (!results.data || results.data.length === 0) {
              reject(new EmptyFileError());
              return;
            }
            
            // Validate that we have at least one column
            const firstRow = results.data[0] as RawDataRow;
            if (!firstRow || Object.keys(firstRow).length === 0) {
              reject(new EmptyFileError());
              return;
            }
            
            resolve(results.data as RawDataRow[]);
          } catch (error) {
            reject(new DataParsingError(error instanceof Error ? error.message : 'Unknown error'));
          }
        },
        error: (error) => {
          reject(new DataParsingError(error.message));
        },
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new FileReadError('No data received from file'));
            return;
          }
          
          const workbook = XLSX.read(data, { type: 'array' });
          
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            reject(new EmptyFileError());
            return;
          }
          
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          if (!worksheet) {
            reject(new CorruptedFileError('Unable to read worksheet'));
            return;
          }
          
          const jsonData = XLSX.utils.sheet_to_json<RawDataRow>(worksheet, {
            defval: null,
          });
          
          if (!jsonData || jsonData.length === 0) {
            reject(new EmptyFileError());
            return;
          }
          
          resolve(jsonData);
        } catch (error) {
          if (error instanceof Error) {
            reject(new CorruptedFileError(error.message));
          } else {
            reject(new DataParsingError('Unknown error occurred'));
          }
        }
      };
      reader.onerror = () => reject(new FileReadError('Failed to read file'));
      reader.readAsArrayBuffer(file);
    }
  });
};
