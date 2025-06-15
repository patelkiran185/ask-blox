import mongoose from 'mongoose';
import { DOMAINS } from '@/lib/domains';

const SkillSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v: string) {
        return Object.values(DOMAINS).some(domain => 
          domain.skills.includes(v)
        );
      },
      message: (props: { value: string }) => `${props.value} is not a valid skill!`
    }
  },
  proficient: { type: Boolean, required: true },
  score: { type: Number, required: true, min: 0, max: 100 }
});

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: Object.values(DOMAINS).map(d => d.name)
  },
  average_score: { type: Number, required: true, min: 0, max: 100 },
  skills: [SkillSchema]
});

const UserProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true }, // Clerk userId
  categories: [CategorySchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index for faster queries
UserProgressSchema.index({ userId: 1, 'categories.name': 1 });

const UserProgress = mongoose.models.UserProgress || mongoose.model('UserProgress', UserProgressSchema);

export default UserProgress; 