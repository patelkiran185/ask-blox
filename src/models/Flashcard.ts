import mongoose, { Schema, Document } from 'mongoose'

export interface IFlashcard extends Document {
  userId: string
  sessionId: string
  question: string
  expectedAnswer: string
  userAnswer?: string
  userAudioAnswer?: string
  isAnswered: boolean
  isCorrect?: boolean
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  createdAt: Date
  answeredAt?: Date
  resumeContent: string
  jobDescription: string
}

const FlashcardSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  question: { type: String, required: true },
  expectedAnswer: { type: String, required: true },
  userAnswer: { type: String },
  userAudioAnswer: { type: String }, // Base64 encoded audio
  isAnswered: { type: Boolean, default: false },
  isCorrect: { type: Boolean },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    required: true 
  },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  answeredAt: { type: Date },
  resumeContent: { type: String, required: true },
  jobDescription: { type: String, required: true }
})

export default mongoose.models.Flashcard || mongoose.model<IFlashcard>('Flashcard', FlashcardSchema) 