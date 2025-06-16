#  AskBlox

**AskBlox** is your smartest interview prep ally — a personalized, AI-powered platform that helps candidates prepare not just for questions, but for the *interview conversation itself*.

Whether you're preparing for placements, internships, or a job switch, AskBlox gives you real-time voice-based mock interviews, strategic skill mapping, and contextual questions to flip the script during interviews.



## 🎥 Demo

👉 [

https://github.com/user-attachments/assets/8051a9f9-4a15-41fa-9875-ea0e2ef1ffd0

]



## ✨ Features

### 🎙️ Mock Interview  
Experience realistic, voice-driven interviews to practice speaking.  
- AI-generated questions based on your resume and job description  
- Voice interaction   
- Helps build confidence, articulation, and clarity

### 🔁 Reverse-Interview Trainer 
Teaches you what to ask *them*.  
- Analyzes your resume and the job description  
- Generates smart, contextual questions for you to ask the interviewer  
- Helps you stand out in the last critical minutes of the interview  

### 🗺️ Interview Map  
Visualize your interview strategy.  
- Creates a personalized mind map showing:  
  - 🔵 Skill clusters (what the JD is testing)  
  - 🟢 Quick wins (your strengths)  
  - 🔴 Gaps or missing areas  
- Designed for visual learners to plan their interview approach
- Gives you a talking point/strategy for interview

### 🧩 SkillSphere  
Track your interview readiness and where to improve.  
- Interactive, visual skill map across categories:  
  - 💻 Technical  
  - 💬 Behavioral  
  - 🛠️ Projects  
  - 🧠 Problem-Solving  
  - 📜 Experience / Background  
- Offers upskilling suggestions to close gaps

---

## ✅ Why AskBlox is Better (Compared to Traditional Platforms)

- **🕒 Practice Anytime** – No waiting for mentor slots or scheduling; AI is available 24/7 for on-demand interview prep.  
- **📊 Consistent Feedback** – Get standardized, unbiased feedback based on proven metrics — no variability between mentors.  
- **💸 Cost-Effective** – Unlimited mock interviews with a single payment; no pay-per-session pricing like ₹500–₹2000.  
- **📈 Progress Tracking** – Track your improvement over time: speaking clarity, confidence, topic mastery, and more.  
- **🚀 Self-Paced & Scalable** – Designed to work for individuals, classrooms, and institutions — grow at your own pace with zero bottlenecks.

---

## 🧑‍💻 Tech Stack

- **Next.js** — Fullstack framework for frontend & backend  
- **MongoDB** — NoSQL database for storing user data and insights  
- **Clerk** — User authentication and session management  
- **Gemini API** — Powers AI-based content generation and analysis  
- **React Flow** — Dynamic visualization for the Interview Map & SkillSphere  
- **Framer Motion** — Smooth animations for UI  
- **PWA (Progressive Web App)** — Installable and mobile-friendly for on-the-go usage  

---

## 📦 Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/askblox.git
cd askblox

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Create a .env.local file and add your Clerk, MongoDB, Gemini/OpenAI keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
GEMINI_API_KEY=
SERPER_API_KEY=
GOOGLE_API_KEY=
GOOGLE_CSE_ID=

# 4. Run the development server
npm run dev
```
