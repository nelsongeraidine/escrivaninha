export type AppErrorCode = 'not-pdf' | 'invalid-pdf' | 'password' | 'too-large' | 'render' | 'unknown';

export class AppError extends Error {
  readonly code: AppErrorCode;
  constructor(code: AppErrorCode, cause?: unknown) {
    super(messageFor(code), { cause });
    this.name = 'AppError';
    this.code = code;
  }
}

const MESSAGES: Record<AppErrorCode, string> = {
  'not-pdf': 'Este arquivo não parece ser um PDF.',
  'invalid-pdf': 'Não foi possível abrir este PDF. O arquivo pode estar danificado.',
  password: 'Este PDF está protegido por senha. Ainda não é possível abri-lo aqui.',
  'too-large': 'Este arquivo é muito grande para ser lido aqui (limite de 500 MB).',
  render: 'Houve um problema ao exibir esta página.',
  unknown: 'Algo deu errado ao preparar seu livro. Tente novamente.',
};

export function messageFor(code: AppErrorCode): string {
  return MESSAGES[code];
}

// O pdf.js identifica exceções pelo `name`; o mapeamento por nome evita
// depender das classes internas, que mudam entre versões.
const PDFJS_BY_NAME: Record<string, AppErrorCode> = {
  InvalidPDFException: 'invalid-pdf',
  MissingPDFException: 'invalid-pdf',
  FormatError: 'invalid-pdf',
  PasswordException: 'password',
  RenderingCancelledException: 'render',
};

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const name = typeof error === 'object' && error !== null && 'name' in error
    ? String((error as { name: unknown }).name)
    : '';
  const code = PDFJS_BY_NAME[name] ?? 'unknown';
  return new AppError(code, error);
}
