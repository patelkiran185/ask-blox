"use client";
import React, { useState } from 'react';
import { AnimeNavBarDemo } from '@/components/ui/anime-navbar-demo';
import { FileUpload } from "@/components/ui/file-upload";
import { TestimonialsSection } from "@/components/testimonials-demo";
import { InterviewQuestion } from "@/lib/gemini";
import { CandidateLevelCombobox } from "@/components/ui/candidate-level-combobox";
import { DomainSelector } from '@/components/domain-selector';

export default function LearnPage() {
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const [jobDescFiles, setJobDescFiles] = useState<File[]>([]);
  const [jobDescText, setJobDescText] = useState<string>('');
  const [jobDescMode, setJobDescMode] = useState<'upload' | 'text'>('upload');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [candidateLevel, setCandidateLevel] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<string>('tech');
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [jobDescError, setJobDescError] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleResumeUpload = async (files: File[]) => {
    if (files.length === 0) {
      setResumeFiles([]);
      setResumeError(null);
      return;
    }

    setResumeError(null);
    const file = files[0];

    // Check if file is PDF or text
    if (file.type !== 'application/pdf' && file.type !== 'text/plain') {
      setResumeError('Please upload a PDF or text file');
      setResumeFiles([]);
      return;
    }

    try {
      await extractTextFromFile(file); // Test if we can extract text
      setResumeFiles(files);
      console.log('Resume uploaded:', files);
    } catch (error: any) {
      console.error('Error processing resume:', error);
      setResumeError(`Error processing file: ${error.message}. Please try a different file.`);
      setResumeFiles([]);
    }
  };

  const handleJobDescUpload = async (files: File[]) => {
    if (files.length === 0) {
      setJobDescFiles([]);
      setJobDescError(null);
      return;
    }

    setJobDescError(null);
    const file = files[0];

    // Check if file is PDF or text
    if (file.type !== 'application/pdf' && file.type !== 'text/plain') {
      setJobDescError('Please upload a PDF or text file');
      setJobDescFiles([]);
      return;
    }

    try {
      await extractTextFromFile(file); // Test if we can extract text
      setJobDescFiles(files);
      console.log('Job description uploaded:', files);
    } catch (error: any) {
      console.error('Error processing job description:', error);
      setJobDescError(`Error processing file: ${error.message}. Please try a different file.`);
      setJobDescFiles([]);
    }
  };

  const handleJobDescTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJobDescText(e.target.value);
  };

  const isJobDescComplete = jobDescMode === 'upload' ? jobDescFiles.length > 0 : jobDescText.trim().length > 0;

  const extractTextFromFile = async (file: File): Promise<string> => {
    const fileType = file.type;
    
    if (fileType === 'application/pdf') {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        console.log('Sending PDF to parse-document API...');
        
        const response = await fetch('/api/parse-document', {
          method: 'POST',
          body: formData,
        });

        console.log('API Response received:', {
          status: response.status,
          statusText: response.statusText,
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Successfully extracted text, length:', data.text.length);
        
        if (!data.text) {
          throw new Error('No text content extracted from PDF');
        }

        return data.text;
      } catch (error: any) {
        console.error('Error parsing PDF:', error);
        throw new Error(`Error processing PDF file: ${error.message}`);
      }
    } else {
      // For text files
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          resolve(text || '');
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });
    }
  };

  const handleGenerateQuestions = async () => {
    if (!resumeFiles.length || !isJobDescComplete) {
      setGenerationError('Please provide both resume and job description to generate questions.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setQuestions([]);

    try {
      // Extract text from resume
      const resumeText = await extractTextFromFile(resumeFiles[0]);
      
      // Get job description text
      const jobDescriptionText = jobDescMode === 'upload' 
        ? await extractTextFromFile(jobDescFiles[0])
        : jobDescText;

      console.log('Complete Resume Text:', resumeText);
      console.log('Complete Job Description Text:', jobDescriptionText);
      console.log('Candidate Level:', candidateLevel);
      console.log('Selected Domain:', selectedDomain);

      // Call API to generate questions
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          jobDescriptionText,
          candidateLevel,
          domain: selectedDomain,
        }),
      });

      if (response.ok) {
        const { questions: generatedQuestions } = await response.json();
        if (!generatedQuestions || generatedQuestions.length === 0) {
          throw new Error('No questions were generated. Please try again.');
        }
        setQuestions(generatedQuestions);
        setGenerationError(null);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to generate questions');
      }
    } catch (error: any) {
      console.error('Error generating questions:', error);
      setGenerationError(`Failed to generate questions: ${error.message}. Please try again.`);
      setQuestions([]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      <AnimeNavBarDemo />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 lg:pt-32 pb-16">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Learn</h1>
          <p className="text-neutral-400 text-lg sm:text-xl max-w-2xl mx-auto px-4">
            Upload your resume and the job description you&apos;re preparing for to get personalized interview preparation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {/* Resume Upload Section */}
          <div className="space-y-4">
            <h2 className="text-white text-xl sm:text-2xl font-semibold text-center">
              Upload Your Resume
            </h2>
            <p className="text-neutral-400 text-center mb-6 text-sm sm:text-base">
              Upload your current resume in PDF, DOC, or DOCX format
            </p>
            <div className="space-y-4">
              <div className="w-full h-32 sm:h-40 border border-dashed bg-neutral-900/50 border-neutral-700 rounded-lg relative">
                <FileUpload onChange={handleResumeUpload} id="resume" />
              </div>
              {resumeFiles.length > 0 && (
                <div className="p-3 sm:p-4 bg-green-900/20 border border-green-700 rounded-lg">
                  <p className="text-green-400 text-sm">
                    ✓ Resume uploaded successfully: {resumeFiles[0]?.name}
                  </p>
                </div>
              )}
              {resumeError && (
                <div className="p-3 sm:p-4 bg-red-900/20 border border-red-700 rounded-lg">
                  <p className="text-red-400 text-sm">{resumeError}</p>
                </div>
              )}
            </div>
          </div>

          {/* Job Description Section */}
          <div className="space-y-4">
            <h2 className="text-white text-xl sm:text-2xl font-semibold text-center">
              Job Description
            </h2>
            <p className="text-neutral-400 text-center mb-6 text-sm sm:text-base">
              Upload a file or paste the job description you&apos;re preparing for
            </p>
            
            {/* Toggle Buttons */}
            <div className="relative flex p-1 bg-neutral-900/80 rounded-lg border border-neutral-700/30 mb-4">
              {/* Sliding background indicator */}
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
                    className="w-full h-32 sm:h-40 p-3 sm:p-4 bg-neutral-900/50 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
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
                <div className="p-3 sm:p-4 bg-red-900/20 border border-red-700 rounded-lg">
                  <p className="text-red-400 text-sm">{jobDescError}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Domain Selection */}
        {resumeFiles.length > 0 && isJobDescComplete && (
          <div className="mt-6 sm:mt-8 max-w-md mx-auto px-4">
            <h3 className="text-white text-lg font-semibold text-center mb-4">
              Select Domain
            </h3>
            <DomainSelector 
              value={selectedDomain}
              onValueChange={setSelectedDomain}
              placeholder="Choose domain..."
            />
          </div>
        )}

        {/* Candidate Level Selection */}
        {resumeFiles.length > 0 && isJobDescComplete && selectedDomain && (
          <div className="mt-6 sm:mt-8 max-w-md mx-auto px-4">
            <h3 className="text-white text-lg font-semibold text-center mb-4">
              Select Your Experience Level
            </h3>
            <CandidateLevelCombobox 
              value={candidateLevel}
              onValueChange={setCandidateLevel}
              placeholder="Choose your experience level..."
            />
          </div>
        )}

        {/* Generate Questions Button */}
        {resumeFiles.length > 0 && isJobDescComplete && selectedDomain && candidateLevel && (
          <div className="mt-6 sm:mt-8 flex flex-col items-center px-4 space-y-4">
            <button
              onClick={handleGenerateQuestions}
              disabled={isGenerating}
              className="relative bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 text-white font-semibold py-3 px-6 sm:px-8 rounded-lg transition-all duration-700 ease-out transform hover:from-slate-600 hover:via-slate-700 hover:to-slate-800 hover:scale-105 hover:shadow-xl group border border-slate-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base w-full max-w-md"
            >
              <span className="relative z-10">
                {isGenerating ? 'Generating Questions...' : 'Generate Interview Questions'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-lg"></div>
            </button>
            
            {generationError && (
              <div className="p-3 sm:p-4 bg-red-900/20 border border-red-700 rounded-lg w-full max-w-md">
                <p className="text-red-400 text-sm text-center">{generationError}</p>
              </div>
            )}
          </div>
        )}

        {/* Interview Questions or Testimonials Section */}
        <div className="mt-8 sm:mt-12">
          {questions.length > 0 ? (
            <TestimonialsSection 
              questions={questions}
              selectedDomain={selectedDomain}
              title="Your Personalized Interview Questions"
              description="AI-generated questions based on your resume and the job description. Practice these to ace your interview!"
            />
          ) : (
            <TestimonialsSection />
          )}
        </div>
      </div>
    </div>
  );
} 