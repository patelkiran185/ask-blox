import { NextRequest, NextResponse } from 'next/server';
import { evaluateAnswer } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { question, expectedAnswer, userAnswer } = await request.json();

    if (!question || !expectedAnswer || !userAnswer) {
      return NextResponse.json(
        { error: 'Question, expected answer, and user answer are required' },
        { status: 400 }
      );
    }

    const evaluation = await evaluateAnswer(question, expectedAnswer, userAnswer);
    
    return NextResponse.json({ evaluation });
  } catch (error) {
    console.error('Error evaluating answer:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate answer' },
      { status: 500 }
    );
  }
} 