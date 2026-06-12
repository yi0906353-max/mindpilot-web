// 用户类型
export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  status: 'active' | 'suspended' | 'deleted';
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// 认证相关
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

// 消息类型
export interface Message {
  id: string;
  source: string;
  sender_name: string;
  content_preview: string;
  summary: string;
  category: 'needs_reply' | 'needs_read' | 'promotion' | 'spam';
  priority: number;
  action_items?: string[];
  created_at: string;
}

export interface MessageListResponse {
  data: Message[];
  total: number;
}

// 简报类型
export interface Briefing {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  top_tasks: string[];
  messages_count: number;
  created_at: string;
}

// 任务执行类型
export interface TaskRequest {
  input: string;
}

export interface TaskExecution {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  steps: TaskStep[];
  result?: string;
  error?: string;
  created_at: string;
}

export interface TaskStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  error?: string;
}
