'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { pushLogApi, monitorApi, scheduleApi, contentApi } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  PenTool,
  CalendarClock,
  RefreshCw,
  ArrowRight,
  Zap,
  Bell,
  Sparkles,
  Loader2,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>({});
  const [health, setHealth] = useState<any>(null);
  const [scheduleCount, setScheduleCount] = useState(0);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 快速推送
  const [quickTopic, setQuickTopic] = useState('');
  const [quickContent, setQuickContent] = useState('');
  const [quickPlatform, setQuickPlatform] = useState('xiaohongshu');
  const [generating, setGenerating] = useState(false);
  const [pushing, setPushing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsRes, healthRes, schedRes] = await Promise.allSettled([
        pushLogApi.list(),
        monitorApi.health(),
        scheduleApi.list(),
      ]);

      if (logsRes.status === 'fulfilled') {
        setStats(logsRes.value.stats || {});
        setRecentLogs((logsRes.value.data || []).slice(0, 5));
      }
      if (healthRes.status === 'fulfilled') {
        setHealth(healthRes.value.data);
      }
      if (schedRes.status === 'fulfilled') {
        setScheduleCount(schedRes.value.total || 0);
      }
    } catch (e: any) {
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const successRate = stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0;

  // 快速生成内容
  const handleQuickGenerate = async () => {
    if (!quickTopic.trim()) { toast.error('请输入主题'); return; }
    setGenerating(true);
    try {
      const res = await contentApi.generate({
        topic: quickTopic.trim(),
        platform: quickPlatform,
        tone: 'casual',
      });
      setQuickContent(res.content || '');
      toast.success('内容已生成');
    } catch (e: any) {
      toast.error('生成失败: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  // 快速推送到钉钉
  const handleQuickPush = async () => {
    if (!quickContent.trim()) { toast.error('请先生成内容'); return; }
    setPushing(true);
    try {
      const res = await fetch('/api/content/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `📝 ${quickTopic} · 快速推送`,
          body: quickContent,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('推送成功！');
        setQuickTopic('');
        setQuickContent('');
        loadData();
      } else {
        toast.error(result.error || '推送失败');
      }
    } catch (e: any) {
      toast.error('推送失败: ' + e.message);
    } finally {
      setPushing(false);
    }
  };

  const quickActions = [
    { label: '内容创作', icon: PenTool, href: '/content', color: 'bg-purple-100 text-purple-600' },
    { label: '定时发布', icon: CalendarClock, href: '/schedule', color: 'bg-blue-100 text-blue-600' },
    { label: '内容复盘', icon: BarChart3, href: '/analytics', color: 'bg-green-100 text-green-600' },
    { label: '推送日志', icon: Send, href: '/push-logs', color: 'bg-amber-100 text-amber-600' },
    { label: '监控', icon: Activity, href: '/monitor', color: 'bg-red-100 text-red-600' },
    { label: '设置', icon: Bell, href: '/settings', color: 'bg-gray-100 text-gray-600' },
  ];

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">控制台</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">MindPilot 系统概览</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className={`h-4 w-4 mr-1 md:mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">刷新</span>
          </Button>
        </div>

        {/* 核心指标 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/analytics')}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.total || 0}</p>
                  <p className="text-sm text-gray-500">总推送</p>
                </div>
                <Send className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/analytics')}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.sent || 0}</p>
                  <p className="text-sm text-gray-500">成功 {successRate}%</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/push-logs')}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.failed || 0}</p>
                  <p className="text-sm text-gray-500">失败</p>
                </div>
                <XCircle className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/schedule')}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-amber-600">{scheduleCount}</p>
                  <p className="text-sm text-gray-500">定时任务</p>
                </div>
                <Clock className="h-8 w-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 快速推送 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
              快速推送
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-0 md:flex md:gap-3">
              <Input
                placeholder="输入主题，例如：AI 写作工具推荐"
                value={quickTopic}
                onChange={e => setQuickTopic(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !generating) handleQuickGenerate(); }}
                className="flex-1"
              />
              <div className="flex gap-2">
                <select
                  value={quickPlatform}
                  onChange={e => setQuickPlatform(e.target.value)}
                  className="flex-1 md:flex-none px-3 border rounded-md text-sm"
                >
                  <option value="xiaohongshu">小红书</option>
                  <option value="douyin">抖音</option>
                  <option value="wechat">公众号</option>
                  <option value="weibo">微博</option>
                </select>
                <Button onClick={handleQuickGenerate} disabled={generating || !quickTopic.trim()}>
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  <span className="hidden md:inline ml-1">生成</span>
                </Button>
              </div>
            </div>
            {quickContent && (
              <div className="mt-3">
                <Textarea
                  value={quickContent}
                  onChange={e => setQuickContent(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={handleQuickPush} disabled={pushing}>
                    {pushing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                    推送到钉钉
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setQuickContent(''); setQuickTopic(''); }}>
                    清空
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* 快捷操作 */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base md:text-lg">快捷操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-2 gap-2 md:gap-3">
                {quickActions.map(action => (
                  <Button
                    key={action.href}
                    variant="outline"
                    className="h-14 md:h-16 flex flex-col items-center gap-1"
                    onClick={() => router.push(action.href)}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${action.color}`}>
                      <action.icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs">{action.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 服务状态 */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                服务状态
                {health && (
                  <Badge className={
                    health.overall === 'healthy' ? 'bg-green-100 text-green-700' :
                    health.overall === 'degraded' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }>
                    {health.overall === 'healthy' ? '正常' :
                     health.overall === 'degraded' ? '降级' : '异常'}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {health?.services ? (
                <div className="space-y-2">
                  {health.services.slice(0, 6).map((s: any) => (
                    <div key={s.name} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{s.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{Math.round(s.latency_ms)}ms</span>
                        <Badge className={
                          s.status === 'ok' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        } variant="outline">
                          {s.status === 'ok' ? '✓' : '✗'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-4">加载中...</p>
              )}
              <Button variant="ghost" size="sm" className="w-full mt-3" onClick={() => router.push('/monitor')}>
                查看全部 <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* 最近推送 */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">最近推送</CardTitle>
            </CardHeader>
            <CardContent>
              {recentLogs.length === 0 ? (
                <div className="text-center py-4">
                  <Send className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-400 text-sm">暂无推送记录</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentLogs.map(log => (
                    <div key={log.id} className="flex items-center gap-2 text-sm">
                      {log.status === 'sent' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                      )}
                      <span className="truncate flex-1">{log.subject}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(log.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="ghost" size="sm" className="w-full mt-3" onClick={() => router.push('/push-logs')}>
                查看全部 <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
