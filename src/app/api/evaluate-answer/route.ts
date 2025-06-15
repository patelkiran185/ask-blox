import { NextRequest, NextResponse } from 'next/server';
import { evaluateAnswer } from '@/lib/gemini';
import { getAuth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import UserProgress from '@/models/UserProgress';
import { DOMAINS } from '@/lib/domains';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface Skill {
  name: string;
  proficient: boolean;
  score: number;
}

interface Category {
  name: string;
  average_score: number;
  skills: Skill[];
}

async function categorizeForDatabase(
  question: string,
  userAnswer: string,
  feedback: any,
  domain: string
) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const domainSkills = DOMAINS[domain as keyof typeof DOMAINS]?.skills || [];
  const domainName = DOMAINS[domain as keyof typeof DOMAINS].name;
  console.log('Domain mapping in categorize:', { domain, domainName, availableSkills: domainSkills.length });

  const prompt = `
Based on this interview question and answer, categorize it for database storage:

QUESTION: ${question}
USER ANSWER: ${userAnswer}
FEEDBACK SCORE: ${feedback.score}
DOMAIN: ${domainName}
AVAILABLE SKILLS: ${domainSkills.join(', ')}

Analyze the question and determine:
1. Which skill from the available skills list best matches this question
2. Based on the score (${feedback.score}/100), is the user proficient in this skill? (score >= 70 = proficient)

Respond in this exact JSON format:
{
  "skillName": "exact skill name from the list",
  "proficient": true/false,
  "score": ${feedback.score}
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        skillName: parsed.skillName || domainSkills[0] || 'General Knowledge',
        proficient: parsed.proficient || feedback.score >= 70,
        score: feedback.score
      };
    }
  } catch (error) {
    console.error('Error categorizing for database:', error);
  }

  // Fallback
  return {
    skillName: domainSkills[0] || 'General Knowledge',
    proficient: feedback.score >= 70,
    score: feedback.score
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get Clerk auth
    const { userId } = getAuth(request);
    console.log('Clerk userId:', userId);
    
    if (!userId) {
      console.log('No userId found in request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    console.log('Request body:', body);
    
    const { question, expectedAnswer, userAnswer, domain } = body;

    if (!question || !expectedAnswer || !userAnswer || !domain) {
      console.log('Missing required fields:', { question, expectedAnswer, userAnswer, domain });
      return NextResponse.json(
        { error: 'Question, expected answer, user answer, and domain are required' },
        { status: 400 }
      );
    }

    // Validate domain exists
    if (!DOMAINS[domain as keyof typeof DOMAINS]) {
      console.log('Invalid domain:', domain, 'Available domains:', Object.keys(DOMAINS));
      return NextResponse.json(
        { error: 'Invalid domain specified' },
        { status: 400 }
      );
    }

    // Get normal feedback (this is what gets shown to user)
    console.log('Getting evaluation from Gemini...');
    const feedback = await evaluateAnswer(question, expectedAnswer, userAnswer);
    console.log('Gemini evaluation:', feedback);

    // Now categorize for database storage
    console.log('Categorizing for database...');
    const dbCategory = await categorizeForDatabase(question, userAnswer, feedback, domain);
    console.log('Database categorization:', dbCategory);

    try {
      // Connect to database
      console.log('Connecting to MongoDB...');
      await connectToDatabase();

      // Get the correct domain name from our DOMAINS mapping
      const domainName = DOMAINS[domain as keyof typeof DOMAINS].name;
      console.log('Using domain name for DB:', domainName);

      // First, try to find the existing document
      let progress = await UserProgress.findOne({ userId });
      
      // If there's an existing document with invalid data, delete it
      if (progress) {
        const hasInvalidCategories = progress.categories.some((cat: any) => 
          !['Technology', 'Finance', 'Human Resources'].includes(cat.name)
        );
        if (hasInvalidCategories) {
          console.log('Found document with invalid categories, deleting...');
          await UserProgress.deleteOne({ userId });
          progress = null;
        }
      }
      
      if (!progress) {
        // If no document exists, create a new one with initial category
        console.log('Creating new progress document with domain:', domainName);
        progress = await UserProgress.create({
          userId,
          categories: [{
            name: domainName,
            average_score: dbCategory.score,
            skills: [{
              name: dbCategory.skillName,
              proficient: dbCategory.proficient,
              score: dbCategory.score
            }]
          }]
        });
        console.log('New progress created successfully');
      } else {
        // Find the category for this domain
        let category = progress.categories.find((cat: Category) => cat.name === domainName);
        
        if (category) {
          console.log('Updating existing category:', domainName);
          // Find or add the skill
          const existingSkill = category.skills.find((skill: Skill) => skill.name === dbCategory.skillName);
          if (existingSkill) {
            // Update existing skill
            console.log('Updating existing skill:', dbCategory.skillName);
            existingSkill.proficient = dbCategory.proficient;
            existingSkill.score = dbCategory.score;
          } else {
            // Add new skill
            console.log('Adding new skill:', dbCategory.skillName);
            category.skills.push({
              name: dbCategory.skillName,
              proficient: dbCategory.proficient,
              score: dbCategory.score
            });
          }
          
          // Calculate average score for the category
          const totalScore = category.skills.reduce((sum: number, skill: Skill) => sum + skill.score, 0);
          category.average_score = Math.round(totalScore / category.skills.length);
          console.log('Calculated average score:', category.average_score, 'from', category.skills.length, 'skills');
        } else {
          // Add new category with the skill
          console.log('Adding new category:', domainName);
          progress.categories.push({
            name: domainName,
            average_score: dbCategory.score,
            skills: [{
              name: dbCategory.skillName,
              proficient: dbCategory.proficient,
              score: dbCategory.score
            }]
          });
        }
        
        progress.updatedAt = new Date();
        await progress.save();
        console.log('Progress updated and saved successfully');
      }

      console.log('Progress updated successfully');
      
      // Return the original feedback (what user sees) - THIS IS CRITICAL FOR POPUP
      return NextResponse.json(feedback);
    } catch (dbError) {
      // If database operations fail, still return the feedback
      console.error('Database error:', dbError);
      return NextResponse.json(feedback);
    }
  } catch (error) {
    console.error('Error in evaluate-answer route:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate answer', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 