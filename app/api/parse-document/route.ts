import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();
    let text = '';

    if (name.endsWith('.pdf')) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (name.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      text = xlsx.utils.sheet_to_csv(firstSheet);
    } else if (name.endsWith('.txt')) {
      text = buffer.toString('utf-8');
    } else {
      return NextResponse.json({ error: 'Unsupported document format' }, { status: 400 });
    }

    // Truncate to reasonable limit (e.g. 50k chars) to prevent context window overflow
    const MAX_CHARS = 50000;
    if (text.length > MAX_CHARS) {
      text = text.substring(0, MAX_CHARS) + '\n\n...[Document truncated due to length]...';
    }

    return NextResponse.json({ text: text.trim() });
  } catch (error) {
    console.error('Document parse error:', error);
    return NextResponse.json({ error: 'Failed to parse document' }, { status: 500 });
  }
}
