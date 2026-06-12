'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Inbox,
  Calendar,
  Zap,
  LogOut,
  Brain,
  Bell,
  Settings,
  Activity,
  MessageSquare,
  PenTool,
  CalendarClock,
  BarChart3,
  LayoutDashboard,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: '控制台', icon: LayoutDashboard },
  { href: '/content', label: '内容创作', icon: PenTool },
  { href: '/schedule', label: '定时发布', icon: CalendarClock },
  { href: '/analytics', label: '内容复盘', icon: BarChart3 },
  { href: '/inbox', label: '收件箱', icon: Inbox },
  { href: '/briefing', label: '每日简报', icon: Calendar },
  { href: '/execute', label: '一句话执行', icon: Zap },
  { href: '/templates', label: '通知模板', icon: Bell },
  { href: '/push-logs', label: '推送日志', icon: MessageSquare },
  { href: '/monitor', label: '监控', icon: Activity },
  { href: '/settings', label: '设置', icon: Settings },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  return (
    <nav className="border-b bg-white">
      <div className="flex h-16 items-center px-6">
        <Link href="/inbox" className="flex items-center gap-2 font-semibold">
          <Brain className="h-6 w-6 text-blue-600" />
          <span>MindPilot</span>
        </Link>

        <div className="flex items-center gap-1 ml-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {user.display_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{user.display_name}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
