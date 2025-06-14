import { NextRequest, NextResponse } from 'next/server';
import { generateReverseInterviewQuestions } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    // Only expect jobDescriptionText and category now
    const { jobDescriptionText, category } = await request.json();

    if (!jobDescriptionText) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      );
    }

    const questions = await generateReverseInterviewQuestions(
      jobDescriptionText,
      category
    );
    
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error generating reverse interview questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate reverse interview questions' },
      { status: 500 }
    );
  }
} 