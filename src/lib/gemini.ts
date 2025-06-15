import { GoogleGenerativeAI } from '@google/generative-ai'
import PDFParser from 'pdf2json'
import { DOMAINS, type DomainSkill } from './domains'

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  console.warn('Warning: GEMINI_API_KEY is not set in environment variables')
}

const genAI = new GoogleGenerativeAI(apiKey || 'dummy-key-for-development')

// Function to convert PDF to text
async function pdfToText(pdfBuffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser()
    
    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      const text = pdfParser.getRawTextContent()
      resolve(text)
    })

    pdfParser.on('pdfParser_dataError', (error) => {
      reject(error)
    })

    pdfParser.parseBuffer(pdfBuffer)
  })
}

// Function to extract relevant sections from text
function extractSections(text: string, type: 'resume' | 'jobDescription'): {
  projects?: string;
  experience?: string;
  skills?: string;
  role?: string;
  domains?: string;
  requirements?: string;
} {
  // Clean up the text
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  if (type === 'resume') {
    const projectsMatch = cleanText.match(/PROJECTS?[\s\S]*?(?=EDUCATION|SKILLS|EXPERIENCE|ACHIEVEMENTS|LANGUAGES|$)/i);
    const experienceMatch = cleanText.match(/EXPERIENCE[\s\S]*?(?=PROJECTS|EDUCATION|SKILLS|ACHIEVEMENTS|LANGUAGES|$)/i);
    const skillsMatch = cleanText.match(/SKILLS[\s\S]*?(?=PROJECTS|EDUCATION|EXPERIENCE|ACHIEVEMENTS|LANGUAGES|$)/i);
    
    return {
      projects: projectsMatch ? projectsMatch[0].trim() : '',
      experience: experienceMatch ? experienceMatch[0].trim() : '',
      skills: skillsMatch ? skillsMatch[0].trim() : ''
    };
  } else {
    const rolesMatch = cleanText.match(/Designation:?[\s\S]*?(?=Key Responsibilities|Foundational Skills|Advanced Skills|How to Apply|About Techolution|$)/i);
    const domainsMatch = cleanText.match(/DOMAINS?:?[\s\S]*?(?=ROLES|REQUIREMENTS|$)/i);
    const requirementsMatch = cleanText.match(/(Foundational Skills|Advanced Skills)[\s\S]*?(?=How to Apply|About Techolution|$)/i);
    
    return {
      role: rolesMatch ? rolesMatch[0].trim() : '',
      domains: domainsMatch ? domainsMatch[0].trim() : '',
      requirements: requirementsMatch ? requirementsMatch[0].trim() : ''
    };
  }
}

export interface FlashcardData {
  question: string
  expectedAnswer: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
}

export async function generateFlashcards(
  resumeContent: string,
  jobDescription: string,
  numberOfCards: number = 10
): Promise<FlashcardData[]> {
  if (!apiKey || apiKey === 'dummy-key-for-development') {
    // Return mock data for testing when API key is not available
    console.log('Using mock data for flashcard generation')
    return [
      {
        question: "Tell me about your background and experience relevant to this role.",
        expectedAnswer: "Based on your resume, you should highlight your key experiences and skills that align with the job requirements.",
        difficulty: "easy",
        tags: ["background", "experience"]
      },
      {
        question: "What specific projects have you worked on that demonstrate your skills?",
        expectedAnswer: "Discuss specific projects from your resume that showcase relevant technical or professional skills.",
        difficulty: "medium",
        tags: ["projects", "technical"]
      },
      {
        question: "How would you handle a challenging situation in this role?",
        expectedAnswer: "Provide a structured response showing problem-solving abilities and relevant experience.",
        difficulty: "hard",
        tags: ["behavioral", "problem-solving"]
      }
    ]
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

  const prompt = `
Based on the following resume and job description, generate ${numberOfCards} interview flashcards that would help the candidate prepare for this specific role.

RESUME:
${resumeContent}

JOB DESCRIPTION:
${jobDescription}

Please generate flashcards that:
1. Focus on skills, experiences, and achievements mentioned in the resume
2. Are relevant to the job requirements, don't ask about a skill or project (which is in the resume) that incorporated a certain skill which ISN'T in the job description
3. Include behavioral, technical, and situational questions
4. Vary in difficulty (easy, medium, hard), the question may be short/mid-length/long 
5. Include relevant tags for categorization
6. In behavioral, don't ask technical, should be more like testing soft skills (Focus on any extracurriculars or achivements from resume)

Return the response as a JSON array with this exact structure:
[
  {
    "question": "Tell me about your experience with [specific technology/skill from resume relevant to job]",
    "expectedAnswer": "A comprehensive answer highlighting specific examples from the resume",
    "difficulty": "medium",
    "tags": ["technical", "experience", "specific-skill"]
  }
]

Make sure the questions are personalized to this candidate's background and the specific job requirements.
`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Clean up the response and parse JSON
    let cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    // Additional cleanup for common issues
    cleanedText = cleanedText.replace(/^[^[\{]*/, '') // Remove any text before JSON starts
    cleanedText = cleanedText.replace(/[^}\]]*$/, '') // Remove any text after JSON ends
    
    // Try to find JSON array in the response
    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      cleanedText = jsonMatch[0]
    }
    
    let flashcards
    try {
      flashcards = JSON.parse(cleanedText) as FlashcardData[]
      
      // Validate the structure
      if (!Array.isArray(flashcards) || flashcards.length === 0) {
        throw new Error('Invalid response structure')
      }
      
      // Ensure each flashcard has required fields
      flashcards = flashcards.map((card) => ({
        question: card.question || 'Tell me about your experience.',
        expectedAnswer: card.expectedAnswer || 'Provide a detailed response based on your background.',
        difficulty: ['easy', 'medium', 'hard'].includes(card.difficulty) ? card.difficulty : 'medium',
        tags: Array.isArray(card.tags) ? card.tags : ['general']
      }))
      
      return flashcards
    } catch (parseError) {
      console.error('JSON parsing failed for flashcards:', parseError)
      throw new Error('Failed to parse AI response')
    }
  } catch (error) {
    console.error('Error generating flashcards:', error)
    throw new Error('Failed to generate flashcards')
  }
}

interface EvaluationResult {
  isCorrect: boolean;
  feedback: string;
  score: number;
  goodPoints: string;
  improvements: string;
  matchedSkill: string;
  skillProficiency: boolean;
}

async function matchQuestionToSkill(
  question: string,
  domain: string,
  model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
): Promise<{ skill: DomainSkill; proficiency: boolean }> {
  const domainData = DOMAINS[domain as keyof typeof DOMAINS];
  const domainSkills = domainData?.skills;
  
  if (!domainSkills) {
    throw new Error(`Invalid domain: ${domain}`);
  }

  const prompt = `Given this interview question: "${question}"
And these skills for the ${domain} domain: ${domainSkills.join(', ')}

1. Which ONE skill from the list best matches the question's focus? Consider the semantic meaning, not just keywords.
2. Based on the question's complexity and scope, would a correct answer demonstrate proficiency in this skill? Answer only yes or no.

Format your response exactly like this example:
Skill: [(Skill name)(System Design)]
Proficiency: [yes/no]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  const skillMatch = text.match(/Skill: (.*)/);
  const proficiencyMatch = text.match(/Proficiency: (.*)/);
  
  if (!skillMatch || !proficiencyMatch) {
    throw new Error('Failed to parse skill matching response');
  }

  const matchedSkill = skillMatch[1].trim();
  const proficiency = proficiencyMatch[1].trim().toLowerCase() === 'yes';

  const skillExists = domainSkills.some(skill => skill === matchedSkill);
  if (!skillExists) {
    console.warn(`Matched skill "${matchedSkill}" not found in domain skills, using first skill as fallback`);
    return { skill: domainSkills[0] as DomainSkill, proficiency: false };
  }

  return { skill: matchedSkill as DomainSkill, proficiency };
}

export async function evaluateAnswer(
  question: string,
  expectedAnswer: string,
  userAnswer: string
): Promise<{ isCorrect: boolean; feedback: string; score: number; goodPoints: string; improvements: string }> {
  if (!apiKey) {
    console.log('Using mock data for evaluation');
    return {
      isCorrect: true,
      feedback: "This is mock feedback since GEMINI_API_KEY is not set",
      score: 85,
      goodPoints: "• Mock good point 1\n• Mock good point 2",
      improvements: "• Mock improvement 1\n• Mock improvement 2"
    };
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
Please evaluate this interview answer:

QUESTION: ${question}
EXPECTED ANSWER: ${expectedAnswer}
USER'S ANSWER: ${userAnswer}

Provide evaluation in this JSON format, with each bullet point on a new line:
{
  "isCorrect": true/false,
  "feedback": "Brief overall feedback",
  "score": 0-100 (numerical score),
  "goodPoints": "• First good point\\n• Second good point\\n• Third good point",
  "improvements": "• First improvement area\\n• Second improvement area\\n• Third improvement area"
}

IMPORTANT: Each bullet point MUST be on its own line. Use \\n between bullet points.

Consider:
- Accuracy of information
- Completeness of the response
- Relevance to the question
- Communication clarity
- Professional presentation

For goodPoints and improvements:
- Start each point with "• " (bullet and space)
- Put each point on a new line using \\n
- List at least 2-3 specific points for each
- Be specific and actionable
- For goodPoints: highlight specific strengths and effective elements
- For improvements: suggest concrete ways to enhance the answer

Example format for goodPoints:
"goodPoints": "• First strength point here\\n• Second strength point here\\n• Third strength point here"

Example format for improvements:
"improvements": "• First improvement suggestion here\\n• Second improvement suggestion here\\n• Third improvement suggestion here"
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up the response and parse JSON
    let cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Additional cleanup for common issues
    cleanedText = cleanedText.replace(/^[^{\[]*/, ''); // Remove any text before JSON starts
    cleanedText = cleanedText.replace(/[^}\]]*$/, ''); // Remove any text after JSON ends
    
    // Try to find JSON object in the response
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }
    
    try {
      const evaluation = JSON.parse(cleanedText);
      
      // Process bullet points to ensure proper line breaks
      const processPoints = (points: string) => {
        if (!points) return '• No points provided';
        // Replace escaped newlines with actual newlines
        return points.replace(/\\n/g, '\n');
      };
      
      // Ensure required fields with defaults
      return {
        isCorrect: typeof evaluation.isCorrect === 'boolean' ? evaluation.isCorrect : false,
        feedback: evaluation.feedback || 'Unable to provide feedback at this time.',
        score: typeof evaluation.score === 'number' && evaluation.score >= 0 && evaluation.score <= 100 
          ? evaluation.score : 50,
        goodPoints: processPoints(evaluation.goodPoints) || '• No specific strengths identified',
        improvements: processPoints(evaluation.improvements) || '• No specific improvements identified'
      };
    } catch (parseError) {
      console.error('JSON parsing failed for evaluation:', parseError);
      throw new Error('Failed to parse AI response');
    }
  } catch (error) {
    console.error('Error evaluating answer:', error);
    throw new Error('Failed to evaluate answer');
  }
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: string; // Keeping for type consistency for other features, but not used by ReverseInterview
  difficulty: 'Basic' | 'Easy' | 'Medium' | 'Hard';
  tips: string;
}

// Updated interface: removed category property
export interface ReverseInterviewQuestion {
  id: string;
  question: string;
  difficulty: 'Basic' | 'Easy' | 'Medium' | 'Hard';
  tips: string;
  expectedAnswer: string;
}

export async function generateInterviewQuestions(
  resumeText: string,
  jobDescriptionText: string,
  candidateLevel?: string,
  domain: string = 'tech' // default to tech if not specified
): Promise<InterviewQuestion[]> {
  // Debug: Log the complete input content
  console.log('=== COMPLETE RESUME TEXT ===');
  console.log(resumeText);
  console.log('\n=== COMPLETE JOB DESCRIPTION TEXT ===');
  console.log(jobDescriptionText);
  console.log('\n=== CANDIDATE LEVEL ===');
  console.log(candidateLevel);
  console.log('\n=== DOMAIN ===');
  console.log(domain);
  
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Map candidate levels to appropriate difficulty distributions
  const getDifficultyDistribution = (level: string) => {
    switch (level) {
      case 'intern':
        return { Basic: 3, Easy: 2, Medium: 1, Hard: 0 };
      case 'entry-level':
        return { Basic: 2, Easy: 3, Medium: 1, Hard: 0 };
      case 'mid-level':
        return { Basic: 1, Easy: 2, Medium: 2, Hard: 1 };
      case 'senior':
        return { Basic: 0, Easy: 1, Medium: 2, Hard: 3 };
      default:
        return { Basic: 1, Easy: 2, Medium: 2, Hard: 1 };
    }
  };

  const difficultyDistribution = getDifficultyDistribution(candidateLevel || 'entry-level');
  const levelDescription = candidateLevel ? `Candidate Level: ${candidateLevel.charAt(0).toUpperCase() + candidateLevel.slice(1).replace('-', ' ')}` : '';
  const domainName = DOMAINS[domain as keyof typeof DOMAINS].name;

  const prompt = `
  You are an expert interview coach specializing in ${domainName} roles. Create 6 DIVERSE and PERSONALIZED interview questions for a ${candidateLevel || 'entry-level'} candidate based STRICTLY on their resume content.

  CANDIDATE'S RESUME:
  ${resumeText}

  TARGET JOB DESCRIPTION (FOR CONTEXT ONLY):
  ${jobDescriptionText}

  ${levelDescription}
  Domain: ${domainName}

  CRITICAL RULES - MUST FOLLOW:
  1. ONLY ask about technologies, skills, projects, and experiences that are EXPLICITLY mentioned in the RESUME
  2. DO NOT ask about anything from the job description that is not also in the resume

  3. Use the job description ONLY to understand the role context, NOT to generate question content

  MANDATORY QUESTION TYPE DISTRIBUTION (exactly 6 questions):
  1. TECHNICAL QUESTION (1): About specific ${domainName} technologies/tools mentioned in resume
  2. PROJECT-BASED QUESTION (1): About a specific ${domainName}-related project from resume
  3. BEHAVIORAL QUESTION (1): About teamwork, leadership, or problem-solving context using resume examples
  4. EXPERIENCE QUESTION (1): About professional experience/roles mentioned in resume related to ${domainName}
  5. SITUATIONAL QUESTION (1): "How would you handle..." scenario based on ${domainName} challenges, using resume background
  6. GROWTH/LEARNING QUESTION (1): About learning new skills, overcoming challenges, or career development

  DIFFICULTY LEVELS FOR ${candidateLevel || 'entry-level'}:
  - Basic: ${difficultyDistribution.Basic} questions (fundamental concepts)
  - Easy: ${difficultyDistribution.Easy} questions (simple applications)
  - Medium: ${difficultyDistribution.Medium} questions (practical scenarios)
  - Hard: ${difficultyDistribution.Hard} questions (complex problem-solving)

  EXAMPLES OF DIVERSE QUESTION TYPES:
  - Technical: "Walk me through how you implemented [SPECIFIC TECH FROM RESUME] in your [SPECIFIC PROJECT FROM RESUME]"
  - Behavioral: "Tell me about a time you had to collaborate with others on [SPECIFIC PROJECT/EXPERIENCE FROM RESUME]"
  - Situational: "If you encountered [RELEVANT CHALLENGE] in a ${domainName} role, how would you approach it based on your experience with [RESUME EXPERIENCE]?"
  - Experience: "What was your role and key contributions in [SPECIFIC ROLE/PROJECT FROM RESUME]?"
  - Growth: "How did you learn [SPECIFIC SKILL FROM RESUME] and what challenges did you face?"

  Generate exactly 6 questions in this JSON format:
  [
    {
      "id": "q1",
      "question": "Walk me through how you implemented [ACTUAL TECHNOLOGY FROM RESUME] in your [ACTUAL PROJECT FROM RESUME]",
      "category": "${domainName}",
      "difficulty": "Medium", 
      "tips": "Focus on specific implementation details and challenges you overcame"
    }
  ]

  DO NOT USE:
  - Placeholder text like [technology], [skill], [project], etc.
  - Technologies or skills not mentioned in resume
  - All questions of the same type (avoid 6 technical questions)
  - Questions not relevant to ${domainName}

  VALIDATION CHECK:
  Before finalizing each question, ask yourself:
  1. "Is everything I'm asking about explicitly mentioned in the candidate's resume?"
  2. "Is this question relevant to the ${domainName} domain?"
  3. "Do I have diverse question types (technical, behavioral, situational, etc.)?"
  If NO to any, rewrite the question.

  Return ONLY the JSON array with actual, specific content from the resume and diverse question types.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("Raw AI response:", text);

    let cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log("Cleaned AI response before JSON match:", cleanedText);

    // Use regex to find and extract the JSON array
    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);

    if (jsonMatch && jsonMatch[0]) {
      cleanedText = jsonMatch[0];
    } else {
      console.error("Could not find valid JSON array in AI response:", cleanedText);
      throw new Error('Failed to extract JSON array from AI response');
    }

    let questions;
    try {
      questions = JSON.parse(cleanedText);
      
      // Validate the structure
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid response structure');
      }
      
      // Ensure each question has required fields and validate content
      questions = questions.map((q, index) => {
        let question = q.question || 'Tell me about your experience.';
        
        // Check for placeholder text and reject if found
        const hasPlaceholders = /\[.*?\]/.test(question) || 
                               question.includes('[') || 
                               question.includes('specific technology') ||
                               question.includes('specific skill') ||
                               question.includes('replace with') ||
                               question.toLowerCase().includes('placeholder');
        
        // Enhanced validation: Check if question mentions technologies from JD but not resume
        const resumeLower = resumeText.toLowerCase();
        const questionLower = question.toLowerCase();
        
        // Common frameworks/technologies that might be in JD but not resume
        const commonTechs = ['react', 'angular', 'vue', 'django', 'flask', 'spring', 'laravel', 'rails', 'express'];
        const invalidTechMention = commonTechs.some(tech => 
          questionLower.includes(tech) && !resumeLower.includes(tech)
        );
        
        if (hasPlaceholders || invalidTechMention) {
          if (invalidTechMention) {
            console.warn(`Question mentions technology not in resume: ${question}`);
          } else {
            console.warn('Detected placeholder text in question, using fallback');
          }
          question = `Tell me about a specific ${domainName.toLowerCase()}-related project you worked on.`;
        }
        
        return {
          id: q.id || `q${index + 1}`,
          question: question,
          category: domainName,
          difficulty: ['Basic', 'Easy', 'Medium', 'Hard'].includes(q.difficulty) ? q.difficulty : 'Medium',
          tips: q.tips || `Be specific and provide concrete examples from your ${domainName.toLowerCase()} experience.`
        };
      });
      
      return questions;
    } catch (parseError) {
      console.error('JSON parsing failed, using fallback questions:', parseError);
      throw new Error('Failed to parse AI response');
    }
  } catch (error) {
    console.error('Error generating interview questions:', error);
    // Return fallback questions if API fails
    return [
      {
        id: "q1",
        question: `Tell me about your background in ${domainName}.`,
        category: domainName,
        difficulty: "Easy",
        tips: `Focus on your relevant ${domainName.toLowerCase()} experience and show enthusiasm for the role.`
      },
      {
        id: "q2", 
        question: `Describe a challenging ${domainName.toLowerCase()}-related project you worked on.`,
        category: domainName,
        difficulty: "Medium",
        tips: "Use the STAR method: Situation, Task, Action, Result."
      },
      {
        id: "q3",
        question: `What are your greatest strengths in ${domainName}?`,
        category: domainName,
        difficulty: "Easy",
        tips: `Choose strengths that directly relate to ${domainName.toLowerCase()} roles.`
      },
      {
        id: "q4",
        question: `Where do you see yourself in 5 years in the ${domainName.toLowerCase()} field?`,
        category: domainName,
        difficulty: "Medium",
        tips: "Show ambition while aligning with industry trends."
      },
      {
        id: "q5",
        question: `Why did you choose to pursue a career in ${domainName}?`,
        category: domainName,
        difficulty: "Easy",
        tips: "Share your passion and motivation for the field."
      },
      {
        id: "q6",
        question: `What recent developments in ${domainName} interest you the most?`,
        category: domainName,
        difficulty: "Medium",
        tips: "Show that you stay current with industry trends."
      }
    ];
  }
}

// Updated generateReverseInterviewQuestions to remove category parameter and logic, and refined JSON parsing
export async function generateReverseInterviewQuestions(
  jobDescription: string,
): Promise<ReverseInterviewQuestion[]> {
  if (!apiKey || apiKey === 'dummy-key-for-development') {
    console.log('Using mock data for reverse interview question generation');
    const mockQuestions: ReverseInterviewQuestion[] = [
      {
        id: "rev-1",
        question: "What would my day-to-day look like in the first month? Is there a structured onboarding plan?",
        difficulty: "Easy",
        tips: "This question helps you understand practical integration and the support provided to new hires.",
        expectedAnswer: "Your first month would involve a structured onboarding program, including introductions to key team members, training on our core systems and tools, and shadowing experienced colleagues on live projects. You'd gradually take on small tasks and contribute to a team project, with regular check-ins to ensure a smooth transition and get you up to speed quickly."
      },
      {
        id: "rev-2",
        question: "How does the team foster collaboration and knowledge sharing?",
        difficulty: "Medium",
        tips: "Shows your interest in team dynamics and learning within the organization. Helps you understand the company's investment in its employees.",
        expectedAnswer: "We use Slack for daily communication and Jira for project tracking. We have daily stand-ups, weekly syncs, and encourage peer programming to share knowledge."
      },
      {
        id: "rev-3",
        question: "Are there opportunities for mentorship, cross-team learning, or career development programs?",
        difficulty: "Easy",
        tips: "Shows your interest in professional growth and learning within the organization. Helps you understand the company's investment in its employees.",
        expectedAnswer: "Yes, we have a structured mentorship program where new hires are paired with senior team members. We also encourage cross-functional projects to foster learning across teams, and we offer a budget for external courses and conferences to support career development."
      },
      {
        id: "rev-4",
        question: "What are the key priorities for this role in the first 90 days?",
        difficulty: "Medium",
        tips: "Demonstrates your proactivity and desire to understand immediate expectations and priorities.",
        expectedAnswer: "In the first 90 days, we'd expect you to complete our onboarding modules, successfully contribute to at least one small project or feature, and establish a strong working relationship with your immediate team members."
      },
      {
        id: "rev-5",
        question: "How is performance typically evaluated for this role—both qualitatively and quantitatively?",
        difficulty: "Medium",
        tips: "Clarifies expectations and allows you to understand how your contributions will be assessed.",
        expectedAnswer: "Performance is evaluated quarterly through a combination of quantitative metrics, such as project completion rates and impact on key business objectives, and qualitative feedback from managers and peers on collaboration, problem-solving, and initiative."
      },
      {
        id: "rev-6",
        question: "Can you describe the team's current biggest challenge and how a new hire might contribute to solving it?",
        difficulty: "Hard",
        tips: "This question shows your interest in problem-solving and making an impact. It helps uncover real team challenges.",
        expectedAnswer: "One of our current challenges is integrating our new data pipeline with legacy systems. A new hire with strong Python experience could significantly help accelerate this integration by developing new connectors and optimizing existing scripts."
      }
    ];
    return mockQuestions;
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
  Imagine you are a candidate applying for the position described in the Job Description below. You are in the final 2-5 minutes of your interview and have the opportunity to ask the interviewer some concise questions. What 10 simple, quick questions would you ask to gain a better understanding of the role, the team, the company culture, and the next steps?

  IMPORTANT: These questions should be:
  - Quick to ask (one sentence)
  - Easy to answer in 30 seconds or less by the interviewer
  - Focused on practical aspects of the job, team, or company
  - Directly informed by the nuances of the provided Job Description
  - From YOUR perspective as a candidate seeking to understand the fit
  - **ABSOLUTELY NO TECHNICAL QUESTIONS. Focus purely on non-technical, organizational, and career-related inquiries.**

  JOB DESCRIPTION:
  ${jobDescription}

  Generate exactly 10 questions in this JSON format, similar to these excellent examples you provided:
  [
    {
      "id": "q_next_steps",
      "question": "What are the next steps in the hiring process?",
      "difficulty": "Easy",
      "tips": "This provides clarity on the timeline and process moving forward.",
      "expectedAnswer": "The next steps involve a second-round interview with the team lead, followed by a final interview with a director. We expect to make a decision within two weeks."
    },
    {
      "id": "q_daily_tasks",
      "question": "What are the most common daily tasks for this internship?",
      "difficulty": "Easy",
      "tips": "Focuses on day-to-day responsibilities and helps visualize the role.",
      "expectedAnswer": "Interns typically start their day with a team stand-up, then work on assigned coding tasks, participate in code reviews, and collaborate with team members on minor feature developments or bug fixes. There's usually a mix of independent work and team interaction."
    },
    {
      "id": "q_team_structure",
      "question": "Can you describe the team's structure and how interns typically interact with other team members?",
      "difficulty": "Easy",
      "tips": "Explores team dynamics and collaboration within the company, especially for interns.",
      "expectedAnswer": "Our team is structured into small pods, each focusing on a specific product area. Interns are embedded directly into one of these pods, working closely with senior engineers and product managers. You'll participate in all team meetings and contribute to real projects."
    },
    {
      "id": "q_growth_opportunities",
      "question": "What opportunities are there for learning and professional development during this internship?",
      "difficulty": "Medium",
      "tips": "Focuses on growth, learning resources, and potential for skill development.",
      "expectedAnswer": "We offer a dedicated mentorship program for interns, access to online learning platforms, and weekly tech talks. You'll also have opportunities to attend internal workshops and present your work at the end of the internship, fostering your professional growth."
    },
    {
      "id": "q_company_culture",
      "question": "How would you describe Techolution's company culture?",
      "difficulty": "Easy",
      "tips": "Explores company culture and values to assess fit.",
      "expectedAnswer": "Techolution's culture is collaborative and innovative. We encourage open communication and continuous learning. We value problem-solvers who are passionate about technology and eager to make an impact."
    },
    {
      "id": "q_work_life_balance",
      "question": "What is the typical work-life balance like for interns?",
      "difficulty": "Easy",
      "tips": "Focuses on work-life balance and the overall intern experience.",
      "expectedAnswer": "We strive for a healthy work-life balance. Interns typically work standard business hours, and while there might be busy periods, we encourage taking breaks and maintaining personal well-being. We also have social events to foster community."
    }
  ]

  Focus on these key areas:
  1. Day-to-day work / Responsibilities
  2. Team dynamics / Structure
  3. Opportunities for growth / Learning
  4. Company culture / Values
  5. Work-life balance / Environment
  6. Hiring process next steps

  Keep questions simple, direct, and actionable. **Crucially, avoid any technical deep-dives or questions about specific technologies.**
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Raw AI response from Gemini (Reverse Interview):", text);

    // Find the first occurrence of '[' and the last occurrence of ']'
    const startIndex = text.indexOf('[');
    const endIndex = text.lastIndexOf(']');

    let cleanedText = text;
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        cleanedText = text.substring(startIndex, endIndex + 1);
    } else {
        console.error("Could not find valid JSON array boundaries in AI response:", text);
        throw new Error('Failed to extract JSON array from AI response');
    }
    
    console.log("Cleaned text for JSON parsing (Reverse Interview):", cleanedText);

    let questions: ReverseInterviewQuestion[];
    try {
      questions = JSON.parse(cleanedText) as ReverseInterviewQuestion[];

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid response structure or empty array');
      }

      // Basic validation for required fields and removing any remaining placeholders (fallback)
      questions = questions.map((q, index) => ({
        id: q.id || `generated-rev-q-${index}`,
        question: (q.question || 'Generated question').replace(/\[.*?\]/g, '(specific detail)'), // Fallback for placeholders
        difficulty: ['Basic', 'Easy', 'Medium', 'Hard'].includes(q.difficulty) ? q.difficulty : 'Medium',
        tips: q.tips || 'No tips provided.',
        expectedAnswer: q.expectedAnswer || 'No expected answer provided.'
      }));

      return questions;
    } catch (parseError) {
      console.error('JSON parsing failed for generateReverseInterviewQuestions:', parseError);
      // Log the text that failed to parse for debugging
      console.error('Failed to parse text:', cleanedText);
      throw new Error('Failed to parse AI response');
    }
  } catch (error) {
    console.error('Error generating reverse interview questions:', error);
    throw new Error('Failed to generate questions');
  }
}

export interface SkillCluster {
  label: string;
  type: 'matched' | 'gap' | 'quickWin';
  description: string;
  percentage: number;
  talkingPoint?: string;
}

export interface ProcessedData {
  skillClusters: SkillCluster[];
  connections: {
    source: string;
    target: string;
    type: 'matched' | 'gap' | 'quickWin';
  }[];
}

export async function processInterviewData(jobDescriptionData: any, resumeData: any): Promise<ProcessedData> {
  if (!apiKey || apiKey === 'dummy-key-for-development') {
    console.log('Using mock data for processInterviewData when API key is not available');
    // Return mock data for testing when API key is not available
    return {
      skillClusters: [
        { label: 'System Design', type: 'matched', description: 'Strong match from your backend projects', percentage: 90, talkingPoint: 'Highlight your experience with building scalable backend systems using [specific project/technology].' },
        { label: 'AI/ML Projects', type: 'quickWin', description: 'Unique chatbot with real users - major differentiator', percentage: 85, talkingPoint: 'Emphasize the user impact and technical challenges of your chatbot project.' },
        { label: 'Leadership', type: 'gap', description: 'No formal team lead experience', percentage: 30, talkingPoint: 'Focus on instances where you took initiative or mentored junior team members, even if not in a formal lead role.' },
        { label: 'Cloud Architecture', type: 'matched', description: 'AWS experience from side projects', percentage: 70, talkingPoint: 'Discuss how your AWS knowledge from side projects can be directly applied to similar cloud environments.' },
        { label: 'Microservices', type: 'gap', description: 'Limited production experience', percentage: 40, talkingPoint: 'Acknowledge the gap and express eagerness to learn, perhaps mentioning relevant courses or personal studies.' },
        { label: 'Interview Strategy Map', type: 'matched', description: 'Your personalized battle plan', percentage: 100, talkingPoint: 'This is your overall strategy; use it to guide your responses.' },
        { label: 'Steer to AI/ML', type: 'quickWin', description: 'When asked about general experience, pivot to your AI/ML chatbot project and its impact.', percentage: 95, talkingPoint: 'Use your AI/ML chatbot project as a strong example of your innovation and initiative.' },
        { label: 'Highlight Problem-Solving', type: 'quickWin', description: 'For behavioral questions, use STAR method and focus on instances where you overcame technical challenges.', percentage: 80, talkingPoint: 'Prepare specific examples of problem-solving using the STAR method.' }
      ],
      connections: [
        { source: 'Interview Strategy Map', target: 'System Design', type: 'matched' },
        { source: 'Interview Strategy Map', target: 'AI/ML Projects', type: 'quickWin' },
        { source: 'Interview Strategy Map', target: 'Leadership', type: 'gap' },
        { source: 'Interview Strategy Map', target: 'Cloud Architecture', type: 'matched' },
        { source: 'Interview Strategy Map', target: 'Microservices', type: 'gap' },
        { source: 'Interview Strategy Map', target: 'Steer to AI/ML', type: 'quickWin' },
        { source: 'Interview Strategy Map', target: 'Highlight Problem-Solving', type: 'quickWin' }
      ],
    };
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
  Given the following extracted sections from a resume and a job description, generate an 'Interview Strategy Map'.
  The map should identify key skills/areas, categorize them as 'matched', 'gap', or 'quickWin', and provide a relevance percentage.
  Also, suggest connections between the 'Interview Strategy Map' central node and these skill clusters.
  Crucially, also include specific actionable "interview steering strategies" as 'quickWin' nodes.
  For each skill cluster, provide a 'talkingPoint' that is a concise suggestion for how the candidate should discuss this skill during an interview to maximize impact or address a gap.

  Resume Data:
  Projects: ${resumeData.projects || 'N/A'}
  Experience: ${resumeData.experience || 'N/A'}
  Skills: ${resumeData.skills || 'N/A'}

  Job Description Data:
  Role: ${jobDescriptionData.role || 'N/A'}
  Domains: ${jobDescriptionData.domains || 'N/A'}
  Requirements: ${jobDescriptionData.requirements || 'N/A'}

  Provide the output as a JSON object with two arrays: 'skillClusters' and 'connections'.
  'skillClusters' should have objects with 'label' (skill/area name), 'type' ('matched', 'gap', 'quickWin'), 'description', 'percentage' (0-100), and a 'talkingPoint' that provides actionable advice. The 'talkingPoint' MUST always be present and concise.
  The 'Interview Strategy Map' should be a central node with type 'matched' and percentage 100.
  'connections' should have objects with 'source', 'target', and 'type' matching the skill cluster type.

  Example JSON Structure:
  {
    "skillClusters": [
      {"label": "Interview Strategy Map", "type": "matched", "description": "Your personalized battle plan", "percentage": 100, "talkingPoint": "This is your overall strategy; use it to guide your responses."},
      {"label": "System Design", "type": "matched", "description": "Strong match from your backend projects", "percentage": 90, "talkingPoint": "Highlight your experience with building scalable backend systems using specific project names and technologies mentioned in your resume."},
      {"label": "AI/ML Projects", "type": "quickWin", "description": "Unique chatbot with real users - major differentiator", "percentage": 85, "talkingPoint": "Emphasize the user impact and technical challenges you overcame in your AI/ML chatbot project. Quantify results if possible."},
      {"label": "Leadership", "type": "gap", "description": "No formal team lead experience", "percentage": 30, "talkingPoint": "For leadership questions, focus on instances where you took initiative, mentored junior colleagues, or led small project modules, even if not in a formal role. Frame these as 'informal leadership'."},
      {"label": "Cloud Architecture", "type": "matched", "description": "AWS experience from side projects", "percentage": 70, "talkingPoint": "Connect your AWS side project experience directly to the job's cloud requirements, focusing on transferable skills and eagerness to learn more."},
      {"label": "Microservices", "type": "gap", "description": "Limited production experience", "percentage": 40, "talkingPoint": "Acknowledge the limited production experience but pivot to your understanding of microservices principles and any relevant academic projects or personal studies."},
      {"label": "Steer to AI/ML", "type": "quickWin", "description": "When asked about general experience, pivot to your AI/ML chatbot project and its impact.", "percentage": 95, "talkingPoint": "Proactively bring up your AI/ML chatbot project as a key differentiator, even if the question is broad. Explain its unique aspects and your role."},
      {"label": "Highlight Problem-Solving", "type": "quickWin", "description": "For behavioral questions, use STAR method and focus on instances where you overcame technical challenges.", "percentage": 80, "talkingPoint": "Prepare 2-3 specific examples of technical challenges you faced, detailing the Situation, Task, Action, and Result (STAR method)."},
      {"label": "Address Communication Skills", "type": "quickWin", "description": "If the job emphasizes communication, provide examples of presenting technical topics to non-technical audiences.", "percentage": 75, "talkingPoint": "Have examples ready where you simplified complex technical concepts for diverse audiences (e.g., presentations, documentation, team discussions)."}
    ],
    "connections": [
      {"source": "Interview Strategy Map", "target": "System Design", "type": "matched"},
      {"source": "Interview Strategy Map", "target": "AI/ML Projects", "type": "quickWin"},
      {"source": "Interview Strategy Map", "target": "Leadership", "type": "gap"},
      {"source": "Interview Strategy Map", "target": "Cloud Architecture", "type": "matched"},
      {"source": "Interview Strategy Map", "target": "Microservices", "type": "gap"},
      {"source": "Interview Strategy Map", "target": "Steer to AI/ML", "type": "quickWin"},
      {"source": "Interview Strategy Map", "target": "Highlight Problem-Solving", "type": "quickWin"},
      {"source": "Interview Strategy Map", "target": "Address Communication Skills", "type": "quickWin"}
    ]
  }
  Ensure the JSON is well-formed and complete.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    let cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const parsedData = JSON.parse(cleanedText) as ProcessedData;
      // Basic validation
      if (!parsedData.skillClusters || !Array.isArray(parsedData.skillClusters) ||
          !parsedData.connections || !Array.isArray(parsedData.connections)) {
        throw new Error('Invalid structure from Gemini API');
      }
      return parsedData;
    } catch (parseError) {
      console.error('Error parsing Gemini response JSON:', parseError);
      console.error('Raw Gemini response text:', cleanedText);
      throw new Error('Failed to parse Gemini API response.');
    }

  } catch (error) {
    console.error('Error calling Gemini API for interview data:', error);
    throw new Error('Failed to generate interview map data from Gemini.');
  }
}