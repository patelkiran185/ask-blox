"use client"
import React, { useState } from 'react';
import { AnimeNavBarDemo } from '@/components/ui/anime-navbar-demo';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';
import { InterviewMap } from '@/components/interview-map';
import { FileUpload } from '@/components/ui/file-upload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'motion/react';

export default function MindMapPage() {
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState('');
  const [jobDescError, setJobDescError] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  // State to hold the processed data from the API
  const [processedJobDescriptionData, setProcessedJobDescriptionData] = useState<any>(null);
  const [processedResumeData, setProcessedResumeData] = useState<any>(null);

  const handleJobDescriptionUpload = async (files: File[]) => {
    if (files.length === 0) {
      setJobDescription('');
      return;
    }

    setJobDescError(null);
    setIsProcessing(true);

    const file = files[0];
    if (file.type !== 'application/pdf' && file.type !== 'text/plain') {
      setJobDescError('Please upload a PDF or text file');
      setJobDescription('');
      setIsProcessing(false);
      return;
    }

    if (file.type === 'text/plain') {
      try {
        const text = await file.text();
        setJobDescription(text);
      } catch (error: any) {
        console.error('Error reading text file:', error); 
        setJobDescError(`Error reading text file: ${error.message}`);
        setJobDescription('');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'jobDescription'); // Pass file type to API
      
      const response = await fetch('/api/parse-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setJobDescription(data.text);
      setProcessedJobDescriptionData(data.processedData); // Store processed data in state
    } catch (error: any) {
      console.error('Error parsing document:', error); 
      setJobDescError(`Error processing file: ${error.message}`);
      setJobDescription('');
      setProcessedJobDescriptionData(null); // Clear processed data on error
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResumeUpload = async (files: File[]) => {
    if (files.length === 0) {
      setResume('');
      return;
    }

    setResumeError(null);
    setIsProcessing(true);

    const file = files[0];
    if (file.type !== 'application/pdf' && file.type !== 'text/plain') {
      setResumeError('Please upload a PDF or text file');
      setResume('');
      setIsProcessing(false);
      return;
    }

    if (file.type === 'text/plain') {
      try {
        const text = await file.text();
        setResume(text);
      } catch (error: any) {
        console.error('Error reading text file:', error); 
        setResumeError(`Error reading text file: ${error.message}`);
        setResume('');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'resume'); // Pass file type to API
      
      const response = await fetch('/api/parse-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setResume(data.text);
      setProcessedResumeData(data.processedData); // Store processed data in state
    } catch (error: any) {
      console.error('Error parsing document:', error); 
      setResumeError(`Error processing file: ${error.message}`);
      setResume('');
      setProcessedResumeData(null); // Clear processed data on error
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      
      <SignedIn>
        <div className="min-h-screen bg-black">
          <AnimeNavBarDemo />
          <div className="container mx-auto px-4 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-4">Interview Map</h1>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  Upload your resume and the job description to generate a visual strategy map
                  that helps you prepare for your interview.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-black/50 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Job Description</CardTitle>
                    <CardDescription className="text-gray-400">
                      Upload the job description in PDF or text format
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUpload onChange={handleJobDescriptionUpload} id="jd" />
                    {jobDescError && (
                      <p className="text-red-400 text-sm mt-2">{jobDescError}</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-black/50 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Your Resume</CardTitle>
                    <CardDescription className="text-gray-400">
                      Upload your resume in PDF or text format
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUpload onChange={handleResumeUpload} id="resume" />
                    {resumeError && (
                      <p className="text-red-400 text-sm mt-2">{resumeError}</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Render InterviewMap component only if jobDescription or resume is available */}
              {(jobDescription || resume) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <InterviewMap
                    jobDescription={jobDescription}
                    resume={resume}
                    processedJobDescriptionData={processedJobDescriptionData}
                    processedResumeData={processedResumeData}
                  />
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </SignedIn>
    </>
  );
}