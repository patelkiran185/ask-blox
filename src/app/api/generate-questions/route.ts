import { NextRequest, NextResponse } from 'next/server';
import { generateInterviewQuestions } from '@/lib/gemini';
import { DOMAINS } from '@/lib/domains';

export async function POST(request: NextRequest) {
  try {
    const { resumeText, jobDescriptionText, candidateLevel, domain } = await request.json();

    if (!resumeText || !jobDescriptionText || !domain) {
      return NextResponse.json(
        { error: 'Resume, job description, and domain are required' },
        { status: 400 }
      );
    }

    // Validate domain
    if (!Object.keys(DOMAINS).includes(domain)) {
      return NextResponse.json(
        { error: 'Invalid domain specified' },
        { status: 400 }
      );
    }

    const questions = await generateInterviewQuestions(resumeText, jobDescriptionText, candidateLevel, domain);
    
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
} 