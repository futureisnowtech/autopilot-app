export type Urgency = 'Urgent' | 'High' | 'Low';
export type Status = 'Ready' | 'Scheduled' | 'Carry-forward' | 'AI_Do' | 'Review' | 'Blocked' | 'Needs-info' | 'Done';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  notes?: string;
  client?: string;
  workstream?: string;
  urgency: Urgency;
  priority?: number;
  est_minutes: number;
  due_date?: string;
  not_before?: string;
  status: Status;
  source_link?: string;
  recurrence?: string;
  delegatable: boolean;
  calendar_event_id?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  ai_reason?: string;
  feedback?: string;
  attachments?: TaskAttachment[];
  created_at: string;
  updated_at: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  storage_path: string;
  file_type: string;
  created_at: string;
}


export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  timezone: string;
  onboarding_completed: boolean;
  settings: {
    primary_window: string;
    overflow_window: string;
    work_weekends: boolean;
    daily_brief_time: string;
  };
}

export interface StyleGuide {
  id: string;
  user_id: string;
  preferences: Record<string, any>;
  learned_rules: string[];
  updated_at: string;
}
