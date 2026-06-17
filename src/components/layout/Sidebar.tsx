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
  Menu,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 路由变化时关闭移动端菜单
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // 移动端汉堡菜单按钮
  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* 移动端侧边栏遮罩 */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* 移动端侧边栏 */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 md:hidden ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-16 flex items-center justify-between px-4 border-b">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-blue-600" />
              <span className="font-semibold">MindPilot</span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-3 h-[calc(100vh-8rem)]">
            {navSections.map((section) => (
              <div key={section.title} className="mb-4">
                <p className="px-4 mb-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {section.title}
                </p>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <div className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}>
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="border-t p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{user?.display_name?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.display_name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </aside>
      </>
    );
  }

  // 桌面端侧边栏
  return (
    <aside className={`h-screen bg-white border-r flex flex-col transition-all duration-300 hidden md:flex ${collapsed ? 'w-16' : 'w-56'}`}>
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
