import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface PDFOptions {
  filename: string;
  backgroundColor?: string;
  scale?: number;
}

/**
 * Utility to export an HTML element as a multi-page PDF.
 * Decoupled from React UI logic.
 * Fixed: Proper cleanup of blob URLs to prevent memory leaks
 */
export async function exportElementToPDF(
  element: HTMLElement,
  options: PDFOptions
): Promise<void> {
  let canvas: HTMLCanvasElement | null = null;
  
  try {
    canvas = await html2canvas(element, {
      scale: options.scale || 2,
      useCORS: true,
      backgroundColor: options.backgroundColor || '#131316',
      logging: false,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    
    // A4 dimensions in pt: [595.28, 841.89]
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();
    
    const imgProps = pdf.getImageProperties(imgData);
    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // Add image to PDF with pagination support
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfPageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfPageHeight;
    }

    pdf.save(`${options.filename}-${Date.now()}.pdf`);
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('PDF generation failed:', error);
    }
    throw error;
  } finally {
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = 1;
      canvas.height = 1;
      canvas = null;
    }
  }
}
