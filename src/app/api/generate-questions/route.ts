import { NextRequest, NextResponse } from 'next/server';
import { generateInterviewQuestions } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { resumeText, jobDescriptionText, candidateLevel } = await request.json();

    if (!resumeText || !jobDescriptionText) {
      return NextResponse.json(
        { error: 'Resume and job description are required' },
        { status: 400 }
      );
    }

    const questions = await generateInterviewQuestions(resumeText, jobDescriptionText, candidateLevel);
    
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
} 