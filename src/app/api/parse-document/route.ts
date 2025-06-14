import { NextRequest, NextResponse } from 'next/server'
import PDFParser from 'pdf2json'

// Define types for pdf2json
interface PDFText {
  R: Array<{
    T: string;
  }>;
}

interface PDFPage {
  Texts: PDFText[];
}

interface PDFData {
  Pages: PDFPage[];
}

// Ensure this is a Node.js runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes timeout

// Add proper error handling middleware
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Check if file is PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse PDF using pdf2json
    const pdfParser = new PDFParser()
    
    const pdfData = await new Promise<PDFData>((resolve, reject) => {
      pdfParser.on('pdfParser_dataReady', (data: PDFData) => {
        resolve(data)
      })
      
      pdfParser.on('pdfParser_dataError', (errMsg: { parserError: Error }) => {
        reject(errMsg.parserError)
      })
      
      pdfParser.parseBuffer(buffer)
    })
    
    // Extract text from all pages
    const text = pdfData.Pages.map((page) => 
      page.Texts.map((text) => 
        decodeURIComponent(text.R[0].T)
      ).join(' ')
    ).join('\n')
    
    if (!text) {
      return NextResponse.json(
        { error: 'Could not extract text from PDF' },
        { status: 400 }
      )
    }

    return NextResponse.json({ text })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to parse PDF' },
      { status: 500 }
    )
  }
} 