"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { InterviewQuestion } from "@/lib/gemini"
import { Card, CardContent } from "@/components/ui/card"
import { Star, RotateCcw, Volume2, Mic, MicOff, X } from "lucide-react"
import { DomainSelector } from './domain-selector'
import { CandidateLevelCombobox } from '@/components/ui/candidate-level-combobox'

interface Testimonial {
  id: string;
  description: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: "testimonial-1",
    description: "Question 1",
  },
  {
    id: "testimonial-2",
    description: "Question 2",
  },
  {
    id: "testimonial-3",
    description: "Question 3",
  },
  {
    id: "testimonial-4",
    description: "Question 4",
  },
]

const SWIPE_THRESHOLD = 100
const SWIPE_OUT_DURATION = 250

export function TestimonialsSection({ 
  questions, 
  selectedDomain = 'tech',
  title = "Your Personalized Interview Questions", 
  description = "AI-generated questions based on your resume and the job description. Practice these to ace your interview!"
}: { 
  questions?: InterviewQuestion[]; 
  selectedDomain?: string;
  title?: string; 
  description?: string; 
}) {
  const displayData = questions || TESTIMONIALS
  const isFlashcards = !!questions
  const [currentIndex, setCurrentIndex] = useState(0)
  const [savedItems, setSavedItems] = useState<any[]>([])
  const [showResetBar, setShowResetBar] = useState(false)
  const [notes, setNotes] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speakingCardId, setSpeakingCardId] = useState<string | null>(null)
  
  // STT functionality states
  const [isRecording, setIsRecording] = useState(false)
  const [recordingCardId, setRecordingCardId] = useState<string | null>(null)
  const [transcript, setTranscript] = useState('')
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    feedback: string;
    score: number;
    goodPoints: string;
    improvements: string;
  } | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false)
  const [isProcessingFeedback, setIsProcessingFeedback] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  
  // Animation state for the top card
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const startPos = useRef({ x: 0, y: 0 })

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAnimating) return
    setIsDragging(true)
    startPos.current = { x: e.clientX, y: e.clientY }
    setPosition({ x: 0, y: 0 })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || isAnimating) return
    const deltaX = e.clientX - startPos.current.x
    const deltaY = e.clientY - startPos.current.y
    setPosition({ x: deltaX, y: deltaY })
  }

  const handleMouseUp = () => {
    if (!isDragging || isAnimating) return
    setIsDragging(false)
    const deltaX = position.x
    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      const direction = deltaX > 0 ? 'right' : 'left'
      forceSwipe(direction)
    } else {
      resetPosition()
    }
  }

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return
    setIsDragging(true)
    const touch = e.touches[0]
    startPos.current = { x: touch.clientX, y: touch.clientY }
    setPosition({ x: 0, y: 0 })
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || isAnimating) return
    e.preventDefault() // Prevent scrolling
    const touch = e.touches[0]
    const deltaX = touch.clientX - startPos.current.x
    const deltaY = touch.clientY - startPos.current.y
    setPosition({ x: deltaX, y: deltaY })
  }

  const handleTouchEnd = () => {
    if (!isDragging || isAnimating) return
    setIsDragging(false)
    const deltaX = position.x
    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      const direction = deltaX > 0 ? 'right' : 'left'
      forceSwipe(direction)
    } else {
      resetPosition()
    }
  }

  const forceSwipe = (direction: 'left' | 'right') => {
    setIsAnimating(true)
    const finalX = direction === 'right' ? 1000 : -1000
    
    // Animate to final position
    setPosition({ x: finalX, y: position.y })
    
    setTimeout(() => {
      onSwipeComplete(direction)
    }, SWIPE_OUT_DURATION)
  }

  const resetPosition = () => {
    setPosition({ x: 0, y: 0 })
  }

  const onSwipeComplete = (direction: 'left' | 'right') => {
    const currentItem = displayData[currentIndex]
    
    // Stop any ongoing speech when swiping
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setSpeakingCardId(null)
    }

    // Stop any ongoing recording when swiping
    if (isRecording) {
      stopRecording()
    }

    // Clear textarea when card changes
    setNotes('')
    
    if (direction === 'left') {
      // Save for revisiting
      setSavedItems(prev => {
        if (!prev.find(item => item.id === currentItem.id)) {
          return [currentItem, ...prev].slice(0, 5) // Keep only last 5
        }
        return prev
      })
    }
    // For right swipe, do nothing special
    
    // Reset position and move to next card
    setPosition({ x: 0, y: 0 })
    setIsAnimating(false)
    
    if (currentIndex === displayData.length - 1) {
      setShowResetBar(true)
    } else {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handleReset = () => {
    setCurrentIndex(0)
    setShowResetBar(false)
    setPosition({ x: 0, y: 0 })
    setIsAnimating(false)
  }

  // TTS functionality
  const handleSpeak = (item: Testimonial | InterviewQuestion, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card interactions
    
    // If currently speaking this card, stop it
    if (isSpeaking && speakingCardId === item.id) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setSpeakingCardId(null)
      return
    }

    // Stop any other speech and start new one
    if (isSpeaking) {
      window.speechSynthesis.cancel()
    }

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance()
      
      if (isFlashcards) {
        const question = item as InterviewQuestion
        utterance.text = `Question: ${question.question}. Tip: ${question.tips}`
      } else {
        const testimonial = item as Testimonial
        utterance.text = testimonial.description
      }
      
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8
      
      utterance.onstart = () => {
        setIsSpeaking(true)
        setSpeakingCardId(item.id)
      }
      
      utterance.onend = () => {
        setIsSpeaking(false)
        setSpeakingCardId(null)
      }
      
      utterance.onerror = () => {
        setIsSpeaking(false)
        setSpeakingCardId(null)
      }
      
      window.speechSynthesis.speak(utterance)
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  const closeFeedbackPopup = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setShowFeedbackPopup(false)
    setFeedback(null)
    setUserAnswer('')
    setTranscript('')
    
    // Clear notes and advance to next question when popup closes
    setNotes('')
    setCurrentIndex((prev) => Math.min(prev + 1, displayData.length - 1))
  }

  // Global recording for textarea
  const handleGlobalRecord = (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (isRecording) {
      stopRecording()
      return
    }

    startGlobalRecording()
  }

  const startGlobalRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please try Chrome or Edge.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    let fullTranscript = ''

    recognition.onstart = () => {
      setIsRecording(true)
      setRecordingCardId(null) // Not tied to a specific card
    }

    recognition.onresult = (event) => {
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        }
      }
      if (finalTranscript) {
        fullTranscript += finalTranscript
        setNotes(prev => prev + (prev ? ' ' : '') + finalTranscript)
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const handleAnswerSubmit = async () => {
    if (!notes.trim()) return;
    
    if (isFlashcards && displayData[currentIndex]) {
      // Get AI feedback for flashcards
      setIsProcessingFeedback(true);
      
      try {
        const currentQuestion = displayData[currentIndex] as InterviewQuestion;
        console.log('Submitting answer for question:', currentQuestion);
        
        const response = await fetch('/api/evaluate-answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: currentQuestion.question,
            expectedAnswer: currentQuestion.tips,
            userAnswer: notes,
            domain: selectedDomain
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get feedback');
        }

        const data = await response.json();
        setFeedback(data);
        setUserAnswer(notes); // Store the user's answer
        setShowFeedbackPopup(true); // Show the popup after getting feedback
      } catch (error: any) {
        console.error('Error getting feedback:', error.message);
        setFeedback(null);
        // Still clear notes and advance on error
        setNotes('');
        setCurrentIndex((prev) => Math.min(prev + 1, displayData.length - 1));
      } finally {
        setIsProcessingFeedback(false);
      }
    }
    
    // Don't clear notes or advance here - let the popup handle it
  }

  // Event listeners for mouse
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, position])

  // Cleanup speech synthesis and recognition on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  // Show up to 3 cards at once
  const visibleCards = displayData.slice(currentIndex, currentIndex + 3)

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ))
  }

  const getCardStyle = (index: number) => {
    const isTopCard = index === 0
    const rotation = isTopCard ? (position.x / 500) * 30 : 0
    const opacity = isTopCard ? Math.max(0, 1 - Math.abs(position.x) / 300) : 1
    const scale = isTopCard ? 1 : Math.max(0.9, 1 - index * 0.05)
    const translateY = index * 8
    const translateX = isTopCard ? position.x : 0

    return {
      transform: `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg) scale(${scale})`,
      opacity: opacity,
      zIndex: visibleCards.length - index,
      cursor: isTopCard && !isAnimating ? (isDragging ? 'grabbing' : 'grab') : 'default',
      transition: isDragging || isAnimating ? 'none' : 'transform 0.2s ease-out, opacity 0.2s ease-out',
      pointerEvents: isTopCard && !isAnimating ? 'auto' as const : 'none' as const,
    }
  }

  return (
    <section className="py-8 bg-slate-950">
      <div className="container px-4 mx-auto">
        <div className="max-w-2xl mx-auto mb-12 text-center">
          <h2 className="mt-8 text-3xl md:text-4xl font-bold text-white">{title}</h2>
          <p className="mt-4 text-lg text-slate-400">{description}</p>
        </div>

        {showResetBar ? (
          <div className="flex justify-center items-center min-h-[600px]">
            <div className="flex flex-col items-center space-y-4">
              <p className="text-white text-xl">You&apos;ve seen all questions!</p>
              <button
                onClick={handleReset}
                className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-full font-semibold transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Start Over</span>
              </button>
              {savedItems.length > 0 && (
                <div className="mt-4 text-center">
                  <p className="text-gray-400 mb-2">Items saved for review: {savedItems.length}</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {savedItems.map((item, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                        {isFlashcards ? (item as InterviewQuestion).category : item.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-start justify-center min-h-[600px]">
            {/* Cards Section */}
            <div className="flex justify-center items-center w-full lg:w-auto">
              <div className="relative w-80 h-96 flex-shrink-0">
                {visibleCards.map((item, index) => (
                  <div
                    key={`${item.id}-${currentIndex}-${index}`}
                    className="absolute w-full h-full"
                    style={getCardStyle(index)}
                    onMouseDown={index === 0 ? handleMouseDown : undefined}
                    onTouchStart={index === 0 ? handleTouchStart : undefined}
                  >
                    <Card className="w-full h-full bg-gradient-to-br from-gray-900 to-black border-gray-700 shadow-2xl overflow-hidden">
                      <CardContent className="p-4 sm:p-6 h-full flex flex-col justify-between overflow-hidden relative">
                        {isFlashcards ? (
                          // Flashcard layout for interview questions
                          <div className="flex flex-col h-full overflow-hidden">
                            <div className="flex justify-between items-center mb-3 flex-shrink-0">
                              <span className="px-2 py-1 bg-blue-600 text-white text-xs sm:text-sm rounded-full whitespace-nowrap">
                                {(item as InterviewQuestion).category}
                              </span>
                              <span className={`px-2 py-1 text-xs sm:text-sm rounded-full whitespace-nowrap ${
                                (item as InterviewQuestion).difficulty === 'Basic' ? 'bg-blue-600 text-white' :
                                (item as InterviewQuestion).difficulty === 'Easy' ? 'bg-green-600 text-white' :
                                (item as InterviewQuestion).difficulty === 'Medium' ? 'bg-yellow-600 text-white' :
                                'bg-red-600 text-white'
                              }`}>
                                {(item as InterviewQuestion).difficulty}
                              </span>
                            </div>
                            <div className="flex-1 flex flex-col justify-center overflow-hidden min-h-0">
                              <h4 className="text-white text-base sm:text-lg font-semibold mb-3 leading-relaxed overflow-y-auto">
                                <span className="break-words">
                                  {(item as InterviewQuestion).question}
                                </span>
                              </h4>
                              <div className="mt-auto flex-shrink-0">
                                <p className="text-gray-400 text-xs sm:text-sm overflow-y-auto">
                                  <strong className="text-blue-400">Tip:</strong> 
                                  <span className="break-words ml-1">
                                    {(item as InterviewQuestion).tips}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Simple question layout for testimonials
                          <div className="flex flex-col h-full overflow-hidden">
                            <div className="flex-1 flex items-center justify-center overflow-hidden min-h-0">
                              <h4 className="text-white text-xl font-semibold text-center">
                                {(item as Testimonial).description}
                              </h4>
                            </div>
                          </div>
                        )}
                        
                        {/* TTS Speaker Button */}
                        <button
                          onClick={(e) => handleSpeak(item, e)}
                          className={`absolute bottom-2 right-2 p-2 rounded-full transition-all duration-200 ${
                            speakingCardId === item.id 
                              ? 'bg-blue-600 text-white shadow-lg' 
                              : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
                          }`}
                          title={speakingCardId === item.id ? 'Stop speaking' : 'Read aloud'}
                        >
                          {speakingCardId === item.id ? (
                            <Volume2 className="w-4 h-4" />
                          ) : (
                            <div className="relative">
                              <Volume2 className="w-4 h-4" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-5 h-0.5 bg-current rotate-45 rounded-full"></div>
                              </div>
                            </div>
                          )}
                        </button>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes Section */}
            <div className="w-full lg:w-96 lg:flex-shrink-0">
              <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-lg p-4 shadow-xl h-96">
                <h4 className="text-white text-lg font-semibold mb-3">
                  Your Answer
                </h4>
                
                {/* Textarea with Record Button */}
                <div className="relative h-[calc(384px-4rem)]">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Type your answer here or click the microphone to record..."
                    className="w-full h-full p-4 pr-12 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm leading-relaxed overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 shadow-inner"
                  />
                  
                  {/* Record Button inside textarea */}
                  <button
                    onClick={(e) => handleGlobalRecord(e)}
                    className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 ${
                      isRecording 
                        ? 'bg-red-600 text-white shadow-lg animate-pulse' 
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
                    }`}
                    title={isRecording ? 'Stop recording' : 'Record your answer'}
                  >
                    {isRecording ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <div className="relative">
                        <Mic className="w-4 h-4" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-5 h-0.5 bg-current rotate-45 rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </button>
                </div>
                
                <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                  <span>{notes.length} characters</span>
                  <span>{isRecording ? 'Recording...' : 'Type or record'}</span>
                </div>
                
                {/* Submit Button */}
                <button
                  onClick={handleAnswerSubmit}
                  disabled={!notes.trim()}
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed shadow-lg"
                >
                  {isFlashcards ? 'Get AI Feedback' : 'Get AI Feedback'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {savedItems.length > 0 && !showResetBar && (
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            {savedItems.length} {isFlashcards ? 'question' : 'testimonial'}{savedItems.length !== 1 ? 's' : ''} saved for review
          </p>
        </div>
      )}

      {/* Feedback Popup */}
      {showFeedbackPopup && feedback && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h3 className="text-xl font-semibold text-white">AI Feedback</h3>
              <button
                onClick={(e) => closeFeedbackPopup(e)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Close feedback"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Score */}
              <div className="text-center">
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold ${
                  feedback.score >= 80 ? 'bg-green-600 text-white' :
                  feedback.score >= 60 ? 'bg-yellow-600 text-white' :
                  'bg-red-600 text-white'
                }`}>
                  Score: {feedback.score}/100
                </div>
              </div>

              {/* Question */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Question:</h4>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-gray-300 leading-relaxed">{displayData[currentIndex] ? (displayData[currentIndex] as InterviewQuestion).question : ''}</p>
                </div>
              </div>

              {/* Your Answer */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Your Answer:</h4>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-gray-300 leading-relaxed">{userAnswer}</p>
                </div>
              </div>

              {/* Good Points */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">✅ What You Did Well:</h4>
                <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
                  <p className="text-green-200 leading-relaxed">{feedback.goodPoints}</p>
                </div>
              </div>

              {/* Improvements */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">🎯 Areas for Improvement:</h4>
                <div className="bg-orange-900/20 border border-orange-600/30 rounded-lg p-4">
                  <p className="text-orange-200 leading-relaxed">{feedback.improvements}</p>
                </div>
              </div>

              {/* Status */}
              <div className="text-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  feedback.isCorrect ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                }`}>
                  {feedback.isCorrect ? '✓ Good Answer' : '✗ Needs Improvement'}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-700 text-center">
              <button
                onClick={(e) => closeFeedbackPopup(e)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Continue Practice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Feedback Overlay */}
      {isProcessingFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-white text-lg">Analyzing your answer...</p>
            <p className="text-gray-400 text-sm mt-2">Please wait while AI provides feedback</p>
          </div>
        </div>
      )}
    </section>
  )
} 