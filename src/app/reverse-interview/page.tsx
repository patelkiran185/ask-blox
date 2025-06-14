"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ShimmerButton } from "@/components/magicui/shimmer-button"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
// Removed specific lucide-react icons as categories are removed
import { AnimeNavBarDemo } from "@/components/ui/anime-navbar-demo"
import { FileUpload } from "@/components/ui/file-upload"
// Updated import to reflect removed category property
import type { ReverseInterviewQuestion } from "@/lib/gemini"

export default function ReverseInterviewPage() {
  const [jobDescFiles, setJobDescFiles] = useState<File[]>([])
  const [jobDescText, setJobDescText] = useState<string>('')
  const [jobDescMode, setJobDescMode] = useState<'upload' | 'text'>('upload')
  const [generatedQuestions, setGeneratedQuestions] = useState<ReverseInterviewQuestion[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [jobDescError, setJobDescError] = useState<string | null>(null)
  // No selectedCategory state as categories are not used
  const [extractedJobDescText, setExtractedJobDescText] = useState<string>('');

  // No categories array definition

  // Always display all generated questions
  const filteredQuestions = generatedQuestions

  const handleJobDescUpload = async (files: File[]) => {
    if (files.length === 0) {
      setJobDescText(''); // Clear text if no file is selected
      setJobDescFiles([]);
      return;
    }

    setJobDescError(null)
    setIsGenerating(true)

    const file = files[0]

    // Check if file is PDF or text
    if (file.type !== 'application/pdf' && file.type !== 'text/plain') {
      setJobDescError('Please upload a PDF or text file')
      setJobDescFiles([])
      setIsGenerating(false)
      return
    }

    // If it's a text file, read it directly
    if (file.type === 'text/plain') {
      try {
        const text = await file.text()
        setExtractedJobDescText(text)
        setJobDescFiles(files)
        setJobDescMode('upload')
        setGeneratedQuestions([])
        setIsGenerating(false)
        return
      } catch (error: any) {
        console.error('Error reading text file:', error)
        setJobDescError(`Error reading text file: ${error.message}`)
        setJobDescFiles([])
        setJobDescText('')
        setIsGenerating(false)
        return
      }
    }

    // Handle PDF file
    try {
      console.log('Starting file upload process...');
      console.log('File details:', {
        name: file.name,
        type: file.type,
        size: file.size
      });
      
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('FormData created, attempting API call to /api/parse-document');
      
      const response = await fetch('/api/parse-document', {
        method: 'POST',
        body: formData,
      });

      console.log('API Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (!data.text) {
        throw new Error('No text content extracted from PDF');
      }

      console.log('Successfully extracted text, length:', data.text.length);
      setExtractedJobDescText(data.text);
      setJobDescFiles(files);
      setJobDescMode('upload');
      setGeneratedQuestions([]);
    } catch (error: any) {
      console.error('Error parsing document:', error);
      setJobDescError(`Error processing file: ${error.message}. Please try pasting the content directly.`);
      setJobDescFiles([]);
      setJobDescText('');
    } finally {
      setIsGenerating(false);
    }
  }

  const handleJobDescTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJobDescError(null) // Clear error when text is typed
    setJobDescText(e.target.value)
    setGeneratedQuestions([])
  }

  const isJobDescComplete = jobDescMode === 'upload' ? jobDescFiles.length > 0 : jobDescText.trim().length > 0

  const handleGenerateQuestions = async () => {
    if (!isJobDescComplete) {
      setJobDescError("Please provide the Job Description content to generate questions.")
      return
    }

    setIsGenerating(true)
    setJobDescError(null)
    setGeneratedQuestions([])

    try {
      const response = await fetch('/api/reverse-interview/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescriptionText: jobDescMode === 'upload' ? extractedJobDescText : jobDescText,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate questions')
      }

      const { questions: fetchedQuestions } = await response.json()
      setGeneratedQuestions(fetchedQuestions)
    } catch (error) {
      console.error('Error generating questions:', error)
      setJobDescError('Failed to generate questions. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // handleCategorySelect function removed as category buttons are no longer displayed

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
       <AnimeNavBarDemo />
      <div className="max-w-7xl mx-auto pt-20 sm:pt-24 lg:pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Reverse Interview Trainer
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Master the art of asking insightful questions during interviews. 
            Turn the tables and make a lasting impression.
          </p>
        </div>

        <div className="grid grid-cols-1 max-w-3xl mx-auto gap-6 lg:gap-8 mb-12">
          <div className="space-y-4">
            <h2 className="text-white text-xl sm:text-2xl font-semibold text-center">
              Upload Job Description
            </h2>
            <p className="text-neutral-400 text-center mb-6 text-sm sm:text-base">
              Upload a file or paste the job description you&apos;re preparing for
            </p>

            <div className="relative flex p-1 bg-neutral-900/80 rounded-lg border border-neutral-700/30 mb-4">
              <div
                className={`absolute top-1 bottom-1 w-1/2 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 rounded-md transition-all duration-500 ease-out shadow-lg ${
                  jobDescMode === 'text' ? 'translate-x-full' : 'translate-x-0'
                }`}
              />

              <button
                onClick={() => setJobDescMode('upload')}
                className={`relative flex-1 py-2 sm:py-3 px-2 sm:px-4 text-sm font-medium rounded-md transition-all duration-500 ease-out z-10 ${
                  jobDescMode === 'upload'
                    ? 'text-white'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => setJobDescMode('text')}
                className={`relative flex-1 py-2 sm:py-3 px-2 sm:px-4 text-sm font-medium rounded-md transition-all duration-500 ease-out z-10 ${
                  jobDescMode === 'text'
                    ? 'text-white'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Paste Text
              </button>
            </div>

            <div className="space-y-4">
              {jobDescMode === 'upload' ? (
                <div className="w-full h-32 sm:h-40 border border-dashed bg-neutral-900/50 border-neutral-700 rounded-lg relative">
                  <FileUpload onChange={handleJobDescUpload} id="jobdesc" />
                </div>
              ) : (
                <div className="relative">
                  <textarea
                    value={jobDescText}
                    onChange={handleJobDescTextChange}
                    placeholder="Paste the job description here..."
                    className="w-full h-32 sm:h-40 p-3 sm:p-4 bg-neutral-900/50 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 resize-y focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-neutral-500">
                    {jobDescText.length} characters
                  </div>
                </div>
              )}

              {isJobDescComplete && (
                <div className="p-3 sm:p-4 bg-green-900/20 border border-green-700 rounded-lg">
                  <p className="text-green-400 text-sm">
                    ✓ {jobDescMode === 'upload'
                      ? `Job description uploaded successfully: ${jobDescFiles[0]?.name}`
                      : `Job description text added (${jobDescText.length} characters)`
                    }
                  </p>
                </div>
              )}

              {jobDescError && (
                <div className="p-3 sm:p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400 text-sm">
                  {jobDescError}
                </div>
              )}
            </div>
          </div>
        </div>

        {isJobDescComplete && (
          <div className="mt-6 sm:mt-8 flex justify-center px-4 mb-12">
            <ShimmerButton
              onClick={handleGenerateQuestions}
              disabled={isGenerating}
              className="w-full max-w-sm"
            >
              {isGenerating ? 'Generating Questions...' : 'Generate Interview Questions'}
            </ShimmerButton>
          </div>
        )}

        {generatedQuestions.length > 0 && (
          <>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Your Personalized Interview Questions</h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Practice these to ace your interview and flip the script!
              </p>
            </div>

        {/* Removed category filter buttons section as per user request */}

        <div className="grid grid-cols-1 md:col-span-3 gap-6">
          <div className="space-y-4 w-full">
            {/* Ensure 'question' is typed as ReverseInterviewQuestion to resolve linter errors */}
            {filteredQuestions.map((question: ReverseInterviewQuestion) => (
              <motion.div
                key={question.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Card 
                  className="cursor-default transition-all duration-300 border-white/10 hover:border-white/20 bg-white/5"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        {/* Removed question.category display */}
                        <p className="text-white font-semibold mb-2">{question.question}</p>
                        <p className="text-gray-400 text-sm">Tips: {question.tips}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  )
}