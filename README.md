# MindPilot Web

MindPilot AI 个人助理的 Web 前端。

## 功能

- **登录页** - 调用 user-svc 进行 JWT 认证
- **收件箱** - 展示 inbox-svc 的消息列表，支持分类筛选
- **每日简报** - 展示 daily-briefing-svc 生成的简报
- **一句话执行** - 调用 agent-svc 执行自然语言任务

## 技术栈

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- Lucide React Icons

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 3. 启动后端服务

确保以下服务已运行：

| 服务 | 端口 | 说明 |
|------|------|------|
| user-svc | 3002 | 用户认证 |
| inbox-svc | 3001 | 消息收件箱 |
| agent-svc | 3003 | Agent 执行引擎 |
| daily-briefing-svc | 3004 | 每日简报 |

## 项目结构

```
src/
├── app/
│   ├── login/          # 登录页
│   ├── inbox/          # 收件箱
│   ├── briefing/       # 每日简报
│   ├── execute/        # 一句话执行
│   └── layout.tsx      # 根布局
├── components/
│   ├── layout/         # 布局组件 (Navbar, AppLayout)
│   └── ui/             # shadcn/ui 组件
├── hooks/
│   └── useAuth.ts      # 认证 hook
├── lib/
│   ├── api.ts          # API 调用工具
│   └── utils.ts        # 工具函数
└── types/
    └── index.ts        # TypeScript 类型定义
```

## 环境变量

创建 `.env.local`：

```env
NEXT_PUBLIC_API_BASE=http://localhost
```

## 构建部署

```bash
npm run build
npm start
``` 
