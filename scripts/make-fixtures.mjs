// Gera PDFs simples (texto "Página N" em Helvetica) para testar 3, 50 e 800 páginas.
// Escrito à mão para não adicionar dependência só para fixtures.
import { writeFileSync, mkdirSync } from 'node:fs';

function makePdf(pageCount) {
  const objects = [];
  const add = (body) => { objects.push(body); return objects.length; };
  const fontId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pageIds = [];
  const pagesId = objects.length + 1 + pageCount * 2; // reservado depois dos conteúdos
  for (let i = 1; i <= pageCount; i++) {
    const text = `BT /F1 36 Tf 200 500 Td (P\\341gina ${i}) Tj ET BT /F1 14 Tf 72 720 Td (Escrivaninha fixture ${pageCount} paginas) Tj ET`;
    const contentId = add(`<< /Length ${text.length} >>\nstream\n${text}\nendstream`);
    const pageId = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  }
  const realPagesId = add(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>`);
  if (realPagesId !== pagesId) throw new Error('cálculo do id de /Pages divergiu');
  const catalogId = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(out, 'latin1'));
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = Buffer.byteLength(out, 'latin1');
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) out += `${String(o).padStart(10, '0')} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

mkdirSync('fixtures', { recursive: true });
for (const n of [3, 50, 800]) {
  writeFileSync(`fixtures/livro-${n}.pdf`, makePdf(n));
  console.log(`fixtures/livro-${n}.pdf`);
}
