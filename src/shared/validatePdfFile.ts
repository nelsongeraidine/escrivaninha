import { AppError } from './errors';

export const MAX_READ_BYTES = 500 * 1024 * 1024;

const SIGNATURE = '%PDF-';

export async function validatePdfFile(file: File): Promise<void> {
  const byExt = /\.pdf$/i.test(file.name);
  const byMime = file.type === 'application/pdf';
  if (!byExt && !byMime) throw new AppError('not-pdf');
  if (file.size > MAX_READ_BYTES) throw new AppError('too-large');

  // Extensão e MIME são só declarações; a assinatura no início do arquivo é a
  // única checagem barata que pega arquivos renomeados.
  const head = await file.slice(0, SIGNATURE.length).text();
  if (head !== SIGNATURE) throw new AppError('not-pdf');
}
