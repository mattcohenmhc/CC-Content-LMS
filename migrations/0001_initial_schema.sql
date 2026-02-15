-- Presentations table
CREATE TABLE IF NOT EXISTS presentations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  original_file_type TEXT NOT NULL,
  genspark_task_id TEXT,
  genspark_project_url TEXT,
  status TEXT NOT NULL DEFAULT 'uploading',
  settings JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Slides table
CREATE TABLE IF NOT EXISTS slides (
  id TEXT PRIMARY KEY,
  presentation_id TEXT NOT NULL,
  slide_number INTEGER NOT NULL,
  title TEXT,
  content JSON,
  animations JSON,
  narration_text TEXT,
  narration_audio_url TEXT,
  quiz_enabled INTEGER DEFAULT 0,
  quiz_data JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (presentation_id) REFERENCES presentations(id) ON DELETE CASCADE
);

-- Exports table for webhook tracking
CREATE TABLE IF NOT EXISTS exports (
  id TEXT PRIMARY KEY,
  presentation_id TEXT NOT NULL,
  webhook_url TEXT,
  export_status TEXT NOT NULL DEFAULT 'pending',
  export_data JSON,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (presentation_id) REFERENCES presentations(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_presentations_user_id ON presentations(user_id);
CREATE INDEX IF NOT EXISTS idx_presentations_status ON presentations(status);
CREATE INDEX IF NOT EXISTS idx_slides_presentation_id ON slides(presentation_id);
CREATE INDEX IF NOT EXISTS idx_slides_slide_number ON slides(presentation_id, slide_number);
CREATE INDEX IF NOT EXISTS idx_exports_presentation_id ON exports(presentation_id);
