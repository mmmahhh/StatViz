import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { RawDataRow } from '../types';

export const parseFile = async (file: File): Promise<RawDataRow[]> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  return new Promise((resolve, reject) => {
    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data as RawDataRow[]);
        },
        error: (error) => {
          reject(error);
        },
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json<RawDataRow>(worksheet, {
            defval: null,
          });
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error('Unsupported file type. Please upload a CSV or Excel (.xlsx/.xls) file.'));
    }
  });
};
