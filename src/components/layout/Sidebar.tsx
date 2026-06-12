'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  PenTool,
  CalendarClock,
  BarChart3,
  Inbox,
  Calendar,
  Zap,
  Bell,
  MessageSquare,
  Activity,
  Settings,
  Brain,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Link2,
  History,
  CalendarDays,
} from 'lucide-react';
import { useState } from 'react';

const navSections = [
  {
    title: '核心',
    items: [
      { href: '/dashboard', label: '控制台', icon: LayoutDashboard },
      { href: '/content', label: '内容创作', icon: PenTool },
      { href: '/history', label: '内容历史', icon: History },
      { href: '/schedule', label: '定时发布', icon: CalendarClock },
      { href: '/analytics', label: '内容复盘', icon: BarChart3 },
    ],
  },
  {
    title: '工具',
    items: [
      { href: '/inbox', label: '收件箱', icon: Inbox },
      { href: '/sources', label: '消息源', icon: Link2 },
      { href: '/calendar', label: '日程管理', icon: CalendarDays },
      { href: '/briefing', label: '每日简报', icon: Calendar },
      { href: '/execute', label: '一句话执行', icon: Zap },
    ],
  },
  {
    title: '管理',
    items: [
      { href: '/templates', label: '通知模板', icon: Bell },
      { href: '/push-logs', label: '推送日志', icon: MessageSquare },
      { href: '/monitor', label: '监控', icon: Activity },
      { href: '/settings', label: '设置', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`h-screen bg-white border-r flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-blue-600 flex-shrink-0" />
          {!collapsed && <span className="font-semibold text-sm">MindPilot</span>}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded hover:bg-gray-100"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* 导航 */}
      <nav className="flex-1 overflow-y-auto py-3">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            {!collapsed && (
              <p className="px-4 mb-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div className={`flex items-center gap-3 px-4 py-2 mx-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}>
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* 用户信息 */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback>{user?.display_name?.charAt(0) || '?'}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <span className="text-sm flex-1 truncate">{user?.display_name}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
