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
        <span aria-hidden="true">🔒</span> O documento permanece neste dispositivo e não é enviado a nenhum servidor.
      </p>
    </main>
  );
}
