import { AuthResponse, LoginRequest, MessageListResponse, TaskExecution, TaskRequest } from '@/types';

// 使用空字符串作为 base，让所有 API 请求走 Next.js rewrite 代理
const SERVICES = {
  user: '',
  inbox: '',
  agent: '',
  briefing: '',
};

// Token 管理
let accessToken: string | null = null;

if (typeof window !== 'undefined') {
  accessToken = localStorage.getItem('access_token');
}

export function setToken(token: string) {
  accessToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', token);
  }
}

export function clearToken() {
  accessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
  }
}

export function getToken() {
  return accessToken;
}

// 通用请求方法
async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    // 从 JWT token 中提取 user_id 作为 X-User-ID header
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      if (payload.sub) {
        (headers as Record<string, string>)['X-User-ID'] = payload.sub;
      }
    } catch {}
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// 用户服务 API
export const userApi = {
  login: (data: LoginRequest) =>
    request<AuthResponse>(`${SERVICES.user}/api/v1/auth/login`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProfile: () =>
    request<any>(`${SERVICES.user}/api/v1/users/me`),
};

// 收件箱 API
export const inboxApi = {
  getMessages: (params?: { status?: string; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    return request<MessageListResponse>(
      `${SERVICES.inbox}/api/v1/inbox/messages?${searchParams.toString()}`
    );
  },

  getMessage: (id: string) =>
    request<{ data: any }>(`${SERVICES.inbox}/api/v1/inbox/messages/${id}`),
};

// 简报 API
export const briefingApi = {
  getLatest: () =>
    request<{ data: any }>(`${SERVICES.briefing}/api/briefing/latest`),

  run: () =>
    request<{ data: any }>(`${SERVICES.briefing}/api/briefing/run`, {
      method: 'POST',
    }),
};

// Agent 执行 API
export const agentApi = {
  execute: (data: TaskRequest) =>
    request<TaskExecution>(`${SERVICES.agent}/api/v1/tasks/execute`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getExecution: (id: string) =>
    request<TaskExecution>(`${SERVICES.agent}/api/v1/tasks/${id}`),

  listTasks: () =>
    request<{ data: TaskExecution[] }>(`${SERVICES.agent}/api/v1/tasks`),
};

// 通知模板 API
export const templateApi = {
  list: () =>
    request<{ data: any[] }>(`${SERVICES.briefing}/api/templates`),

  get: (id: string) =>
    request<any>(`${SERVICES.briefing}/api/templates/${id}`),

  create: (data: any) =>
    request<any>(`${SERVICES.briefing}/api/templates`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    request<any>(`${SERVICES.briefing}/api/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<any>(`${SERVICES.briefing}/api/templates/${id}`, {
      method: 'DELETE',
    }),
};

// 设置 API
export const settingsApi = {
  getWechat: () =>
    request<{ data: any }>(`${SERVICES.briefing}/api/settings/wechat`),

  updateWechat: (data: any) =>
    request<any>(`${SERVICES.briefing}/api/settings/wechat`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  testWechatPush: () =>
    request<any>(`${SERVICES.briefing}/api/settings/wechat/test`, {
      method: 'POST',
    }),

  testWebhook: () =>
    request<any>(`${SERVICES.briefing}/api/settings/webhook/test`, {
      method: 'POST',
    }),

  testDingtalk: () =>
    request<any>(`${SERVICES.briefing}/api/settings/dingtalk/test`, {
      method: 'POST',
    }),
};

// 灵墨内容创作 API
export const contentApi = {
  generate: (data: { topic: string; platform: string; tone?: string; keywords?: string[] }) =>
    request<any>('/api/content/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  batchGenerate: (data: { topic: string; platforms: string[]; tone?: string; keywords?: string[] }) =>
    request<{ data: any[]; total: number }>('/api/content/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  list: () =>
    request<{ data: any[]; total: number }>('/api/content/list'),

  edit: (id: string, content: string) =>
    request<any>(`/api/content/edit/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),

  remove: (id: string) =>
    request<any>(`/api/content/delete/${id}`, {
      method: 'DELETE',
    }),

  platforms: () =>
    request<{ data: any[] }>('/api/content/platforms'),
};

// 灵墨标题生成 API
export const titlesApi = {
  generate: (data: { topic: string; platform?: string; count?: number }) =>
    request<{ data: string[]; source: string }>('/api/titles/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// 灵墨热点话题 API
export const topicsApi = {
  list: (params?: { platform?: string; category?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.platform) searchParams.set('platform', params.platform);
    if (params?.category) searchParams.set('category', params.category);
    return request<{ data: any[]; total: number }>(
      `/api/topics/list?${searchParams.toString()}`
    );
  },
  categories: () =>
    request<{ data: string[] }>('/api/topics/categories'),

  // 从服务端获取真实热点（B站 + 知乎，通过 Next.js API Route 代理避免 CORS）
  fetchRealTopics: async (): Promise<any[]> => {
    const res = await fetch('/api/topics/fetch');
    const json = await res.json();
    return json.data || [];
  },
};

// 推送日志 API
export const pushLogApi = {
  list: () =>
    request<{ data: any[]; stats: any }>(`${SERVICES.briefing}/api/push-logs`),

  stats: () =>
    request<{ data: any }>(`${SERVICES.briefing}/api/push-logs/stats`),
};

// 监控 API
export const monitorApi = {
  health: () =>
    request<{
      data: {
        timestamp: string;
        overall: string;
        services: Array<{
          name: string;
          url: string;
          status: string;
          latency_ms: number;
          status_code?: number;
          error?: string;
        }>;
      };
    }>(`${SERVICES.briefing}/api/monitor/health`),
};

// 定时发布 API
export const scheduleApi = {
  list: () =>
    request<{ data: any[]; total: number }>(`${SERVICES.briefing}/api/schedule`),

  create: (data: { title: string; content: string; channel: string; scheduled_at: string }) =>
    request<{ data: any }>(`${SERVICES.briefing}/api/schedule`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  cancel: (id: string) =>
    request<any>(`${SERVICES.briefing}/api/schedule/cancel`, {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),

  remove: (id: string) =>
    request<any>(`${SERVICES.briefing}/api/schedule/delete?id=${id}`, {
      method: 'DELETE',
    }),
};
