'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PenTool,
  Inbox,
  Calendar,
  Settings,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: '控制台', icon: LayoutDashboard },
  { href: '/content', label: '创作', icon: PenTool },
  { href: '/inbox', label: '收件箱', icon: Inbox },
  { href: '/briefing', label: '简报', icon: Calendar },
  { href: '/settings', label: '设置', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden z-30">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
