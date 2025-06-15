import { NextResponse } from 'next/server';
import { processInterviewData } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const { jobDescription, resume } = await req.json();

    if (!jobDescription || !resume) {
      return NextResponse.json(
        { error: 'Job description and resume are required' },
        { status: 400 }
      );
    }

    const data = await processInterviewData(jobDescription, resume);
    console.log('Processed interview data from Gemini:', JSON.stringify(data, null, 2));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error processing interview data:', error);
    return NextResponse.json(
      { error: 'Failed to process interview data' },
      { status: 500 }
    );
  }
} 