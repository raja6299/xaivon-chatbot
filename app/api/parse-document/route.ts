import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import { checkRateLimit, getTrustedClientIp } from '@/lib/security';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB hard limit
const MAX_CHARS = 50000; // 50k character output limit
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.xlsx', '.xls', '.csv', '.txt']);

/**
 * Validate magic bytes / file signatures to prevent disguised malicious payloads.
 */
function validateFileSignature(buffer: Buffer, extension: string): boolean {
  if (buffer.length < 4) return false;

  switch (extension) {
    case '.pdf':
      // PDF begins with %PDF- (0x25 0x50 0x44 0x46)
      return (
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46
      );
    case '.docx':
    case '.xlsx':
      // Zip-based Office formats begin with PK\x03\x04 (0x50 0x4B 0x03 0x04)
      return (
        buffer[0] === 0x50 &&
        buffer[1] === 0x4B &&
        buffer[2] === 0x03 &&
        buffer[3] === 0x04
      );
    case '.xls':
      // Legacy Excel begins with OLE compound format (0xD0 0xCF 0x11 0xE0) or BIFF
      return (
        (buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0) ||
        (buffer[0] === 0x09 && buffer[1] === 0x08)
      );
    case '.txt':
    case '.csv': {
      // Text formats must not contain binary null bytes in the header sample
      const sampleSize = Math.min(buffer.length, 512);
      for (let i = 0; i < sampleSize; i++) {
        if (buffer[i] === 0x00) return false;
      }
      return true;
    }
    default:
      return false;
  }
}

export async function POST(req: Request) {
  try {
    // 1. Rate limiting by trusted client IP
    const clientIp = getTrustedClientIp(req);
    const rateLimit = checkRateLimit(`parse_doc_${clientIp}`, 5, 60_000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many document upload requests. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfter || 60) },
        }
      );
    }

    // 2. Early Content-Length check before reading body
    const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_FILE_SIZE + 1024 * 1024) {
      return NextResponse.json(
        { error: 'Payload exceeds maximum allowed size of 5 MB.' },
        { status: 413 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 3. File size check before buffering
    if (file.size <= 0) {
      return NextResponse.json({ error: 'Uploaded file is empty.' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed limit of 5 MB.' },
        { status: 413 }
      );
    }

    // 4. File extension check
    const rawName = file.name || '';
    const lastDotIndex = rawName.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return NextResponse.json(
        { error: 'File has no extension. Supported formats: PDF, DOCX, XLSX, XLS, CSV, TXT.' },
        { status: 400 }
      );
    }

    const ext = rawName.slice(lastDotIndex).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `Unsupported document format (${ext}). Supported formats: PDF, DOCX, XLSX, XLS, CSV, TXT.` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 5. Signature / magic bytes validation
    if (!validateFileSignature(buffer, ext)) {
      return NextResponse.json(
        { error: 'File signature does not match its declared format.' },
        { status: 400 }
      );
    }

    let text = '';

    // 6. Safe in-memory parsing with format-specific constraints
    if (ext === '.pdf') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PDFParse } = require('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      text = data.text || '';
      if (typeof parser.destroy === 'function') {
        await parser.destroy();
      }
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value || '';
    } else if (ext === '.csv' || ext === '.xlsx' || ext === '.xls') {
      // Limit rows to prevent billion-row zip bomb / memory explosion
      const workbook = xlsx.read(buffer, {
        type: 'buffer',
        sheetRows: 250,
        cellDates: true,
      });
      if (workbook.SheetNames.length === 0) {
        return NextResponse.json({ error: 'Spreadsheet contains no sheets.' }, { status: 400 });
      }
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      text = xlsx.utils.sheet_to_csv(firstSheet);
    } else if (ext === '.txt') {
      text = buffer.toString('utf-8');
    }

    // 7. Truncate text output to prevent downstream context overflow
    if (text.length > MAX_CHARS) {
      text = text.substring(0, MAX_CHARS) + '\n\n...[Document truncated due to length]...';
    }

    return NextResponse.json({ text: text.trim() });
  } catch (error: unknown) {
    // Redact error details to prevent leaking file contents or stack trace PII
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Document parse failed safely:', { reason: errorMessage });
    return NextResponse.json(
      { error: 'Failed to process document. Please ensure the file is valid and unencrypted.' },
      { status: 500 }
    );
  }
}
