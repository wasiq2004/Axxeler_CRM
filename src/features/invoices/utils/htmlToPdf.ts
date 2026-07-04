import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Render already-populated invoice HTML into an A4 PDF, entirely in the browser.
// The HTML is rendered off-screen, captured to a canvas, then sliced across as
// many A4 pages as needed. No server round-trip and no external services.
export const generateInvoicePdf = async (html: string, filename: string): Promise<void> => {
  const host = document.createElement('div');
  // Off-screen but still laid out (display:none would give zero dimensions).
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.width = '800px';
  host.style.background = '#ffffff';
  host.innerHTML = html;
  document.body.appendChild(host);

  try {
    const canvas = await html2canvas(host, { scale: 2, backgroundColor: '#ffffff', useCORS: true });

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Scale the captured image to the PDF page width.
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;
    const imgData = canvas.toDataURL('image/png');

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(host);
  }
};
