import { useId, useRef, useState, type DragEvent, type ChangeEvent } from 'react';

interface Props { onFile: (file: File) => void; disabled?: boolean }

export function PdfDropzone({ onFile, disabled }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  // dragenter/dragleave disparam para cada filho; o contador evita piscar.
  const depth = useRef(0);

  function hasFiles(e: DragEvent) {
    return Array.from(e.dataTransfer?.types ?? []).includes('Files');
  }
  function onDragEnter(e: DragEvent<HTMLDivElement>) {
    if (disabled || !hasFiles(e)) return;
    e.preventDefault();
    depth.current++;
    setDragging(true);
  }
  function onDragOver(e: DragEvent<HTMLDivElement>) {
    if (disabled || !hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }
  function onDragLeave() {
    depth.current = Math.max(depth.current - 1, 0);
    if (depth.current === 0) setDragging(false);
  }
  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    depth.current = 0;
    setDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) onFile(file);
  }
  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    // Zera o valor para permitir reabrir o mesmo arquivo (o change nao dispara de novo com valor igual).
    e.target.value = '';
  }

  return (
    <div
      className="dropzone"
      data-testid="dropzone"
      data-dragging={dragging ? 'true' : 'false'}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
    >
      <div className="dropzone__book" aria-hidden="true">
        <span className="dropzone__ribbon" />
        <span className="dropzone__title">Seu<br />próximo<br />livro</span>
      </div>
      <p className="dropzone__lead">Escolha um PDF e comece a leitura.</p>
      <p className="dropzone__hint">
        {dragging ? 'Solte o arquivo para abrir.' : 'Clique para selecionar ou arraste o arquivo até aqui.'}
      </p>
      <label htmlFor={inputId} className="visually-hidden">Abrir PDF</label>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="visually-hidden"
        onChange={onChange}
        onClick={(e) => e.stopPropagation()}
        disabled={disabled}
      />
    </div>
  );
}
