import { NextResponse } from 'next/server'
import pdfParse from 'pdf-parse'

// Ensure this is a Node.js runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes timeout

// Add proper error handling middleware
export async function POST(req: Request) {
  console.log('Document parse API called')
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))
  
  try {
    // Check if the request is multipart/form-data
    const contentType = req.headers.get('content-type') || ''
    console.log('Content-Type:', contentType)
    
    if (!contentType.includes('multipart/form-data')) {
      console.log('Invalid content type:', contentType)
      return NextResponse.json(
        { error: 'Content type must be multipart/form-data' },
        { status: 400 }
      )
    }

    const formData = await req.formData()
    const uploaded = formData.get('file') as File | null
    
    if (!uploaded) {
      console.log('No file uploaded')
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    console.log('File received:', uploaded.name, uploaded.type, uploaded.size)

    // Handle text files
    if (uploaded.type === 'text/plain') {
      try {
        const text = await uploaded.text()
        console.log('Text file read successfully, length:', text.length)
        return NextResponse.json({ text })
      } catch (error) {
        console.error('Error reading text file:', error)
        return NextResponse.json(
          { error: 'Failed to read text file' },
          { status: 400 }
        )
      }
    }

    // Handle PDF files
    if (uploaded.type !== 'application/pdf') {
      console.log('Invalid file type:', uploaded.type)
      return NextResponse.json(
        { error: 'Please upload a PDF or text file' },
        { status: 400 }
      )
    }

    try {
      // Convert file to buffer
      console.log('Converting file to buffer')
      const arrayBuffer = await uploaded.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      console.log('Buffer size:', buffer.length)

      // Parse PDF
      console.log('Parsing PDF')
      const pdfData = await pdfParse(buffer, {
        max: 0, // No page limit
        version: 'v2.0.550'
      })
      
      console.log('PDF parsed successfully')
      
      if (!pdfData || !pdfData.text) {
        console.log('No text extracted from PDF')
        return NextResponse.json(
          { error: 'Could not extract text from PDF' },
          { status: 400 }
        )
      }

      console.log('Text extracted successfully, length:', pdfData.text.length)
      return NextResponse.json({ text: pdfData.text })
    } catch (parseError) {
      console.error('PDF parsing error:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse PDF file. Please ensure it is a valid PDF.' },
        { status: 400 }
      )
    }
  } catch (err: any) {
    console.error('parse-document error:', err)
    return NextResponse.json(
      { error: 'Failed to process file: ' + (err.message || 'Unknown error') },
      { status: 500 }
    )
  }
} 