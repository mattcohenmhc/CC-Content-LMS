export type Bindings = {
  DB: D1Database;
}

export interface Presentation {
  id: string;
  user_id: string;
  original_filename: string;
  original_file_type: 'pdf' | 'pptx';
  genspark_task_id?: string;
  genspark_project_url?: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  settings?: PresentationSettings;
  created_at: string;
  updated_at: string;
}

export interface PresentationSettings {
  enable_narration: boolean;
  narration_voice?: string;
  enable_quizzes: boolean;
  quiz_frequency: 'after_each' | 'custom';
  quiz_count?: number;
  brand_theme?: {
    primary_color?: string;
    secondary_color?: string;
    font_family?: string;
  };
  webhook_url?: string;
}

export interface Slide {
  id: string;
  presentation_id: string;
  slide_number: number;
  title?: string;
  content?: any;
  animations?: SlideAnimation[];
  narration_text?: string;
  narration_audio_url?: string;
  quiz_enabled: boolean;
  quiz_data?: Quiz;
  created_at: string;
  updated_at: string;
}

export interface SlideAnimation {
  element_id: string;
  animation_type: 'fade' | 'slide' | 'zoom' | 'none';
  duration: number;
  delay: number;
  order: number;
}

export interface Quiz {
  question: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correct_answer: string | string[];
  explanation?: string;
}

export interface ExportRecord {
  id: string;
  presentation_id: string;
  webhook_url?: string;
  export_status: 'pending' | 'completed' | 'error';
  export_data?: any;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface UploadRequest {
  file: File;
  filename: string;
  settings?: PresentationSettings;
}

export interface GenSparkSlideRequest {
  task_name: string;
  query: string;
  instructions: string;
}

export interface GenSparkSlideResponse {
  task_id: string;
  project_url: string;
  session_id: string;
  status: string;
}
