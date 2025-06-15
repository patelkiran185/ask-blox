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
    const fileType = formData.get('type') as string // 'resume' or 'jobDescription'
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const pdfParser = new PDFParser()
    
    const text = await new Promise<string>((resolve, reject) => {
      pdfParser.on('pdfParser_dataReady', (pdfData: PDFData) => {
        let extractedText = '';
        pdfData.Pages.forEach((page) => {
          if (page.Texts && page.Texts.length > 0) {
            page.Texts.forEach((text) => {
              if (text.R && text.R.length > 0) {
                text.R.forEach((r) => {
                  if (r.T) {
                    extractedText += decodeURIComponent(r.T) + ' ';
                  }
                });
              }
            });
          }
        });
        resolve(extractedText.trim());
      });
      
      pdfParser.on('pdfParser_dataError', (error) => {
        reject(error);
      });
      
      pdfParser.parseBuffer(buffer);
    });
    
    if (!text || text.length === 0) {
      return NextResponse.json(
        { error: 'Could not extract text from PDF' },
        { status: 400 }
      )
    }

    // Process the extracted text based on file type
    let processedData;
    if (fileType === 'resume') {
      // Extract projects and experience sections
      const projectsMatch = text.match(/PROJECTS?[\s\S]*?(?=EDUCATION|SKILLS|$)/i);
      const experienceMatch = text.match(/EXPERIENCE[\s\S]*?(?=PROJECTS|EDUCATION|SKILLS|$)/i);
      
      processedData = {
        projects: projectsMatch ? projectsMatch[0].trim() : '',
        experience: experienceMatch ? experienceMatch[0].trim() : ''
      };
    } else if (fileType === 'jobDescription') {
      // Extract domains, roles, and requirements
      const domainsMatch = text.match(/DOMAINS?[\s\S]*?(?=ROLES|REQUIREMENTS|$)/i);
      const rolesMatch = text.match(/ROLES?[\s\S]*?(?=DOMAINS|REQUIREMENTS|$)/i);
      const requirementsMatch = text.match(/REQUIREMENTS?[\s\S]*?(?=DOMAINS|ROLES|$)/i);
      
      processedData = {
        domains: domainsMatch ? domainsMatch[0].trim() : '',
        roles: rolesMatch ? rolesMatch[0].trim() : '',
        requirements: requirementsMatch ? requirementsMatch[0].trim() : ''
      };
    }

    return NextResponse.json({ 
      text,
      processedData 
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to parse PDF' },
      { status: 500 }
    )
  }
} 