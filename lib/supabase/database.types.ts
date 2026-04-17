// ============================================================
// Supabase Database Type Definitions — Sevasync AI
// ============================================================

export type UserRole = 'super-admin' | 'admin' | 'volunteer';
export type NeedType = 'Medical' | 'Food' | 'Shelter' | 'Water' | 'Education';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'unassigned' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type NeedStatus = 'open' | 'in-progress' | 'resolved';
export type IntakeSource = 'ocr' | 'whatsapp' | 'csv' | 'mobile' | 'manual';
export type IntakeStatus = 'pending' | 'approved' | 'rejected';
export type NotifType = 'task_assigned' | 'task_update' | 'message' | 'alert' | 'milestone';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  region: string | null;
  phone: string | null;
  skills: string[] | null;
  status: string;
  admin_id: string | null;
  available_days: string[] | null;
  joined_at: string;
  last_active: string;
}

export interface Need {
  id: string;
  title: string;
  type: NeedType;
  severity: Severity;
  ai_score: number;
  location: string;
  people_affected: number;
  source: IntakeSource;
  status: NeedStatus;
  description: string | null;
  admin_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  type: string;
  priority: Severity;
  status: TaskStatus;
  need_id: string | null;
  volunteer_id: string | null;
  admin_id: string | null;
  location: string | null;
  due_date: string | null;
  instructions: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields (optional, from select with relationships)
  volunteer?: Profile | null;
  need?: Need | null;
}

export interface Message {
  id: string;
  from_id: string;
  to_id: string;
  text: string;
  task_id: string | null;
  read: boolean;
  created_at: string;
  from?: Profile;
  to?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotifType;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

export interface IntakeEntry {
  id: string;
  source: IntakeSource;
  raw_text: string | null;
  parsed_data: Record<string, unknown> | null;
  status: IntakeStatus;
  admin_id: string | null;
  need_id: string | null;
  created_at: string;
}

// Supabase generic Database type — use `any` for Insert/Update to avoid
// overload conflicts with the Supabase PostgREST filter builder generics.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

export type Database = {
  public: {
    Tables: {
      profiles:      { Row: Profile;      Insert: AnyRecord; Update: AnyRecord };
      needs:         { Row: Need;         Insert: AnyRecord; Update: AnyRecord };
      tasks:         { Row: Task;         Insert: AnyRecord; Update: AnyRecord };
      messages:      { Row: Message;      Insert: AnyRecord; Update: AnyRecord };
      notifications: { Row: Notification; Insert: AnyRecord; Update: AnyRecord };
      intake_queue:  { Row: IntakeEntry;  Insert: AnyRecord; Update: AnyRecord };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
