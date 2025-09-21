import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export function generateNumerologyPDF({ name, result }) {
  const doc = new PDFDocument();
  const stream = Readable.from(doc);
  doc.info.Title = `Numerology Report - ${name}`;
  doc.fontSize(20).text('Numerology Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text(`Name: ${name}`);
  doc.text(`Total Value: ${result.total}`);
  doc.text(`Number: ${result.number}`);
  doc.text(`Meaning: ${result.meaning}`);
  doc.end();
  return stream;
}

export function generateCSV(dataArray) {
  const headers = Object.keys(dataArray[0] || {});
  const rows = dataArray.map(obj => headers.map(h => JSON.stringify(obj[h] ?? '')).join(','));
  return [headers.join(','), ...rows].join('\n');
}
