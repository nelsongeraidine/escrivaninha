import { PdfDropzone } from './PdfDropzone';
import { ContinueReadingCard } from './ContinueReadingCard';

interface Props {
  onFile: (file: File) => void;
  continueInfo?: { name: string; page: number; pageCount: number; onContinue: () => void };
}

export function LibraryView({ onFile, continueInfo }: Props) {
  return (
    <main className="library wood">
      <header className="library__header">
        <h1 className="library__title">Escrivaninha</h1>
        <p className="library__subtitle">Sua biblioteca particular</p>
      </header>

      <PdfDropzone onFile={onFile} />

      <div className="library__actions">
        <label className="button button--primary">
          Abrir PDF
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="visually-hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
          />
        </label>
        {continueInfo && <ContinueReadingCard {...continueInfo} />}
      </div>

      <p className="library__privacy">
        {/* Cadeado em SVG inline: o emoji renderiza inconsistente entre sistemas. */}
        <svg className="library__lock" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
          <rect x="4.5" y="10.5" width="15" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        O documento permanece neste dispositivo e não é enviado a nenhum servidor.
      </p>

      <p className="library__credit">
        feito por{' '}
        <a href="https://instagram.com/nelsonggeraidine" target="_blank" rel="noopener noreferrer">
          @nelsonggeraidine
        </a>
      </p>
    </main>
  );
}
