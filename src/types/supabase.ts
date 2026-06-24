// Auto-generated placeholder â€” run `npm run db:types` after connecting Supabase CLI
// to regenerate this file from your actual database schema.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      colleges: {
        Row: {
          id: string;
          name: string;
          code: string;
          university: string;
          city: string | null;
          state: string;
          country: string;
          logo_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: { id?: string; name: string; code: string; university: string; city?: string | null; state?: string; country?: string; logo_url?: string | null; is_active?: boolean; created_at?: string };
        Update: { id?: string; name?: string; code?: string; university?: string; city?: string | null; state?: string; country?: string; logo_url?: string | null; is_active?: boolean; created_at?: string };
      };
      users: {
        Row: {
          id: string;
          email: string;
          role: string;
          college_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          avatar_url: string | null;
          batch_year: number | null;
          roll_number: string | null;
          phone: string | null;
          exam_date: string | null;
          target_percentage: number;
          learning_style: string;
          daily_study_hours: number;
          wake_time: string;
          sleep_time: string;
          college_start_time: string;
          college_end_time: string;
          weekly_holidays: string[];
          preferred_session_mins: number;
          revision_frequency: number;
          xp_points: number;
          study_streak: number;
          longest_streak: number;
          last_active_date: string | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      subjects: {
        Row: {
          id: string;
          college_id: string | null;
          name: string;
          code: string;
          description: string | null;
          total_topics: number;
          exam_weightage: number;
          color: string;
          icon: string | null;
          order_index: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      topics: {
        Row: {
          id: string;
          subject_id: string;
          parent_topic_id: string | null;
          name: string;
          description: string | null;
          difficulty: string;
          estimated_hours: number;
          is_important: boolean;
          order_index: number;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      user_subject_progress: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string;
          completion_pct: number;
          confidence_score: number;
          revision_status: string;
          study_hours_spent: number;
          is_weak: boolean;
          is_strong: boolean;
          last_studied_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      user_topic_progress: {
        Row: {
          id: string;
          user_id: string;
          topic_id: string;
          status: string;
          confidence: number;
          study_minutes: number;
          last_studied_at: string | null;
          notes: string | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      study_plans: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          exam_date: string;
          generated_by_ai: boolean;
          is_active: boolean;
          readiness_score: number;
          total_sessions: number;
          completed_sessions: number;
          ai_summary: string | null;
          ai_strategy: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      study_sessions: {
        Row: {
          id: string;
          plan_id: string | null;
          user_id: string;
          subject_id: string | null;
          topic_id: string | null;
          session_date: string;
          start_time: string;
          end_time: string;
          planned_duration_mins: number;
          actual_duration_mins: number | null;
          session_type: string;
          status: string;
          notes: string | null;
          xp_earned: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      revision_schedule: {
        Row: {
          id: string;
          user_id: string;
          topic_id: string;
          due_date: string;
          interval_days: number;
          repetition_no: number;
          ease_factor: number;
          is_completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      flashcards: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string | null;
          topic_id: string | null;
          front: string;
          back: string;
          hint: string | null;
          difficulty: string;
          is_bookmarked: boolean;
          source: string;
          tags: string[];
          ease_factor: number;
          interval_days: number;
          due_date: string;
          review_count: number;
          last_reviewed: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      uploaded_pdfs: {
        Row: {
          id: string;
          user_id: string;
          filename: string;
          original_name: string;
          file_url: string;
          file_size_bytes: number | null;
          subject_id: string | null;
          pdf_type: string;
          processed: boolean;
          page_count: number | null;
          extracted_text: string | null;
          embedding_status: string;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      document_chunks: {
        Row: {
          id: string;
          pdf_id: string;
          user_id: string;
          content: string;
          chunk_index: number | null;
          embedding: number[] | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string | null;
          topic_id: string | null;
          title: string;
          content: string;
          tags: string[];
          is_pinned: boolean;
          word_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      previous_papers: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          year: number;
          subject_id: string | null;
          file_url: string | null;
          extracted_questions: number;
          processed: boolean;
          analysis_json: Json | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      questions: {
        Row: {
          id: string;
          subject_id: string | null;
          topic_id: string | null;
          question_text: string;
          answer: string | null;
          question_type: string;
          difficulty: string;
          marks: number | null;
          year_appeared: number[];
          frequency_count: number;
          importance_score: number;
          probability_score: number;
          priority: string;
          source_paper_id: string | null;
          is_predicted: boolean;
          tags: string[];
          embedding: number[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      question_frequency: {
        Row: {
          id: string;
          question_id: string;
          subject_id: string | null;
          topic_tag: string | null;
          total_count: number;
          years: number[];
          last_appeared: number | null;
          trend: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      viva_sessions: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string | null;
          topic_id: string | null;
          mode: string;
          total_questions: number;
          correct_answers: number;
          accuracy_score: number;
          completeness_score: number;
          confidence_score: number;
          terminology_score: number;
          overall_score: number;
          feedback: string | null;
          duration_minutes: number | null;
          xp_earned: number;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      viva_questions: {
        Row: {
          id: string;
          session_id: string;
          question_text: string;
          user_answer: string | null;
          ai_ideal_answer: string | null;
          score: number;
          feedback: string | null;
          follow_up_questions: string[];
          question_order: number;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      case_studies: {
        Row: {
          id: string;
          created_by: string | null;
          title: string;
          chief_complaint: string;
          history: string | null;
          examination_findings: string | null;
          investigation_results: string | null;
          diagnosis: string | null;
          treatment_plan: string | null;
          difficulty: string;
          subject_id: string | null;
          tags: string[];
          is_ai_generated: boolean;
          is_public: boolean;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      case_submissions: {
        Row: {
          id: string;
          user_id: string;
          case_id: string | null;
          submitted_diagnosis: string | null;
          submitted_treatment: string | null;
          submitted_reasoning: string | null;
          ai_score: number | null;
          ai_feedback: string | null;
          ai_evaluation: Json | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      exam_predictions: {
        Row: {
          id: string;
          user_id: string | null;
          subject_id: string | null;
          prediction_json: Json;
          generated_at: string;
          valid_until: string | null;
          is_active: boolean;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      performance_metrics: {
        Row: {
          id: string;
          user_id: string;
          metric_date: string;
          study_minutes: number;
          topics_completed: number;
          flashcards_reviewed: number;
          viva_sessions: number;
          readiness_score: number;
          readiness_delta: number;
          xp_earned: number;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      achievements: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          xp_reward: number;
          condition_type: string;
          condition_value: number;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          earned_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read: boolean;
          action_url: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          notify_daily_reminder: boolean;
          notify_revision_due: boolean;
          notify_streak_alert: boolean;
          notify_achievements: boolean;
          reminder_time: string;
          ai_provider: string;
          ai_verbosity: string;
          theme: string;
          language: string;
          show_on_leaderboard: boolean;
          share_progress: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      study_streak_log: {
        Row: {
          id: string;
          user_id: string;
          study_date: string;
          minutes: number;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_documents: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          filter_user_id?: string;
        };
        Returns: {
          id: string;
          content: string;
          similarity: number;
          pdf_id: string;
          metadata: Json;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

