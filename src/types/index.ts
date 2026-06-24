// ============================================================
// DENTORA AI - Core TypeScript Types
// ============================================================

export type UserRole = "student" | "admin" | "faculty";
export type LearningStyle = "visual" | "auditory" | "reading" | "kinesthetic";
export type DifficultyLevel = "easy" | "medium" | "hard";
export type RevisionStatus = "not_started" | "in_progress" | "revised" | "mastered";
export type SessionStatus = "scheduled" | "completed" | "missed" | "skipped";
export type CardDifficulty = "again" | "hard" | "good" | "easy";
export type QuestionType = "long" | "short" | "viva" | "mcq" | "case";
export type PriorityLevel = "high" | "medium" | "low";
export type AIProvider = "gemini" | "openrouter" | "ollama";

// ---- USER & PROFILE ----

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  college_id: string;
  batch_year: number;
  roll_number?: string;
  phone?: string;
  exam_date?: string;
  target_percentage: number;
  learning_style: LearningStyle;
  daily_study_hours: number;
  wake_time: string;  // "06:00"
  sleep_time: string; // "23:00"
  college_start_time: string;
  college_end_time: string;
  weekly_holidays: string[]; // ["saturday", "sunday"]
  onboarding_completed: boolean;
  xp_points: number;
  study_streak: number;
  longest_streak: number;
  last_active_date: string;
}

// ---- SUBJECTS & TOPICS ----

export interface Subject {
  id: string;
  college_id: string;
  name: string;
  code: string;
  description?: string;
  total_topics: number;
  exam_weightage: number; // percentage
  color: string; // hex color for UI
  icon?: string;
  created_at: string;
}

export interface Topic {
  id: string;
  subject_id: string;
  name: string;
  description?: string;
  difficulty: DifficultyLevel;
  estimated_hours: number;
  is_important: boolean;
  order_index: number;
  parent_topic_id?: string; // for sub-topics
}

export interface UserSubjectProgress {
  id: string;
  user_id: string;
  subject_id: string;
  completion_percentage: number;
  confidence_score: number; // 0-100
  revision_status: RevisionStatus;
  study_hours_spent: number;
  is_weak: boolean;
  is_strong: boolean;
  last_studied_at?: string;
}

// ---- STUDY PLANS ----

export interface StudyPlan {
  id: string;
  user_id: string;
  name: string;
  exam_date: string;
  generated_by_ai: boolean;
  is_active: boolean;
  readiness_score: number; // 0-100
  total_topics: number;
  completed_topics: number;
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  plan_id: string;
  user_id: string;
  subject_id: string;
  topic_id?: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  session_type: "study" | "revision" | "practice" | "viva";
  status: SessionStatus;
  notes?: string;
  actual_duration_minutes?: number;
}

// ---- FLASHCARDS ----

export interface Flashcard {
  id: string;
  user_id: string;
  subject_id: string;
  topic_id?: string;
  front: string;
  back: string;
  hint?: string;
  difficulty: DifficultyLevel;
  is_bookmarked: boolean;
  source: "manual" | "ai_generated" | "pdf_extracted";
  tags: string[];
  // Spaced repetition fields
  ease_factor: number;   // default 2.5
  interval_days: number; // days until next review
  due_date: string;
  review_count: number;
  last_reviewed_at?: string;
}

// ---- QUESTIONS ----

export interface Question {
  id: string;
  subject_id: string;
  topic_id?: string;
  question_text: string;
  answer?: string;
  question_type: QuestionType;
  difficulty: DifficultyLevel;
  year_appeared?: number[]; // [2021, 2022, 2023]
  frequency_count: number;
  importance_score: number;   // 0-100
  probability_score: number;  // 0-100 (exam predictor)
  priority: PriorityLevel;
  source_paper_id?: string;
  is_predicted: boolean;
  tags: string[];
}

export interface PreviousPaper {
  id: string;
  user_id: string;
  title: string;
  year: number;
  subject_id?: string;
  file_url: string;
  extracted_questions: number;
  processed: boolean;
  created_at: string;
}

// ---- VIVA ----

export interface VivaSession {
  id: string;
  user_id: string;
  subject_id?: string;
  mode: "beginner" | "intermediate" | "exam" | "mock_external";
  total_questions: number;
  correct_answers: number;
  accuracy_score: number;
  completeness_score: number;
  confidence_score: number;
  terminology_score: number;
  overall_score: number;
  feedback: string;
  duration_minutes: number;
  created_at: string;
}

export interface VivaQuestion {
  id: string;
  session_id: string;
  question_text: string;
  user_answer?: string;
  ai_ideal_answer: string;
  score: number; // 0-100
  feedback: string;
  follow_up_questions: string[];
}

// ---- CASE SIMULATOR ----

export interface CaseStudy {
  id: string;
  title: string;
  chief_complaint: string;
  history: string;
  examination_findings: string;
  investigation_results?: string;
  diagnosis: string;
  treatment_plan: string;
  difficulty: DifficultyLevel;
  subject_id?: string;
  tags: string[];
  is_ai_generated: boolean;
}

// ---- NOTES & FILES ----

export interface Note {
  id: string;
  user_id: string;
  subject_id?: string;
  topic_id?: string;
  title: string;
  content: string; // markdown
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface UploadedPDF {
  id: string;
  user_id: string;
  filename: string;
  file_url: string;
  file_size_bytes: number;
  subject_id?: string;
  pdf_type: "notes" | "paper" | "textbook" | "other";
  processed: boolean;
  page_count?: number;
  extracted_text?: string;
  embedding_status: "pending" | "processing" | "done" | "failed";
  created_at: string;
}

// ---- PROGRESS & ANALYTICS ----

export interface PerformanceMetric {
  id: string;
  user_id: string;
  date: string;
  study_hours: number;
  topics_completed: number;
  flashcards_reviewed: number;
  viva_sessions: number;
  readiness_delta: number; // change in readiness score that day
  xp_earned: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  condition_type: string;
  condition_value: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

// ---- NOTIFICATIONS ----

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "reminder" | "achievement" | "plan_update" | "streak" | "ai_insight";
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

// ---- UI STATE ----

export interface OnboardingData {
  step: number;
  examDate: string;
  dailyHours: number;
  wakeTime: string;
  sleepTime: string;
  collegeStartTime: string;
  collegeEndTime: string;
  weeklyHolidays: string[];
  strongSubjects: string[];
  weakSubjects: string[];
  targetPercentage: number;
  preferredDuration: number;
  revisionFrequency: number;
  learningStyle: LearningStyle;
}

export interface DashboardStats {
  examDaysLeft: number;
  readinessScore: number;
  studyStreak: number;
  hoursToday: number;
  topicsCompleted: number;
  totalTopics: number;
  flashcardsdue: number;
  weeklyHours: number;
}

// ---- AI CHAT ----

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  attachments?: { type: "pdf" | "image"; url: string; name: string }[];
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  tokens_used?: number;
}
