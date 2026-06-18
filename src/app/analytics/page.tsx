'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { pushLogApi, scheduleApi, contentApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Award,
  Calendar,
  Zap,
} from 'lucide-react';

type TimeRange = 'today' | 'week' | 'month' | 'custom';

interface PushLog {
  id: string;
  channel: string;
  template_id: string;
  recipient: string;
  subject: string;
  content: string;
  status: string;
  error?: string;
  retry_count: number;
  max_retries: number;
  created_at: string;
  sent_at?: string;
  next_retry?: string;
}

interface Stats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  retrying: number;
  channels: Record<string, number>;
}

export default function AnalyticsPage() {
  const [logs, setLogs] = useState<PushLog[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, sent: 0, failed: 0, pending: 0, retrying: 0, channels: {} });
  const [loading, setLoading] = useState(false);
  const [scheduleCount, setScheduleCount] = useState(0);
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [aiSummary, setAiSummary] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsRes, schedRes] = await Promise.allSettled([
        pushLogApi.list(),
        scheduleApi.list(),
      ]);

      if (logsRes.status === 'fulfilled') {
        setLogs(logsRes.value.data || []);
        setStats(logsRes.value.stats || stats);
      }
      if (schedRes.status === 'fulfilled') {
        setScheduleCount(schedRes.value.total || 0);
      }
    } catch (e: any) {
      toast.error('加载失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // 按时间范围过滤
  const filteredLogs = logs.filter(l => {
    const d = new Date(l.created_at);
    const now = new Date();
    switch (timeRange) {
      case 'today':
        return d.toDateString() === now.toDateString();
      case 'week': {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo;
      }
      case 'month': {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return d >= monthAgo;
      }
      default:
        return true;
    }
  });

  // 过滤后统计
  const fStats = {
    total: filteredLogs.length,
    sent: filteredLogs.filter(l => l.status === 'sent').length,
    failed: filteredLogs.filter(l => l.status === 'failed').length,
    retrying: filteredLogs.filter(l => l.status === 'retrying').length,
  };
  const successRate = fStats.total > 0 ? Math.round((fStats.sent / fStats.total) * 100) : 0;

  // 渠道分布
  const channelStats = Object.entries(stats.channels).map(([ch, count]) => ({
    channel: ch,
    count,
    percentage: stats.total > 0 ? Math.round((count / stats.total) * 100) : 0,
  }));

  // Top 内容排行（按 subject 去重计数）
  const contentRanking = (() => {
    const map = new Map<string, { count: number; sent: number }>();
    filteredLogs.forEach(l => {
      const key = l.subject || '未知';
      const existing = map.get(key) || { count: 0, sent: 0 };
      existing.count++;
      if (l.status === 'sent') existing.sent++;
      map.set(key, existing);
    });
    return Array.from(map.entries())
      .map(([subject, data]) => ({
        subject,
        count: data.count,
        sent: data.sent,
        rate: data.count > 0 ? Math.round((data.sent / data.count) * 100) : 0,
      }))
      .sort((a, b) => b.rate - a.rate || b.count - a.count)
      .slice(0, 5);
  })();

  // 渠道效果对比
  const channelComparison = (() => {
    const map = new Map<string, { total: number; sent: number }>();
    filteredLogs.forEach(l => {
      const existing = map.get(l.channel) || { total: 0, sent: 0 };
      existing.total++;
      if (l.status === 'sent') existing.sent++;
      map.set(l.channel, existing);
    });
    return Array.from(map.entries()).map(([channel, data]) => ({
      channel,
      total: data.total,
      sent: data.sent,
      rate: data.total > 0 ? Math.round((data.sent / data.total) * 100) : 0,
    }));
  })();

  // 24 小时分布
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hour = filteredLogs.filter(l => new Date(l.created_at).getHours() === i).length;
    return { hour: `${i}:00`, count: hour };
  });
  const maxHourly = Math.max(...hourlyData.map(d => d.count), 1);

  // AI 复盘总结
  const generateAiSummary = () => {
    const summary = [];
    if (fStats.total === 0) {
      setAiSummary('暂无数据。开始推送内容后，AI 将自动分析推送效果并生成洞察建议。');
      return;
    }
    summary.push(`📊 本期共推送 ${fStats.total} 条消息，成功 ${fStats.sent} 条（成功率 ${successRate}%）。`);
    if (successRate < 80) {
      summary.push(`⚠️ 成功率偏低（${successRate}%），建议检查推送渠道配置。`);
    } else if (successRate >= 95) {
      summary.push(`✅ 推送成功率优秀（${successRate}%），渠道运行稳定。`);
    }
    if (fStats.failed > 0) {
      summary.push(`🔴 有 ${fStats.failed} 条推送失败，建议查看推送日志排查原因。`);
    }
    if (channelComparison.length > 1) {
      const best = channelComparison.reduce((a, b) => a.rate > b.rate ? a : b);
      const worst = channelComparison.reduce((a, b) => a.rate < b.rate ? a : b);
      if (best.channel !== worst.channel) {
        summary.push(`📈 渠道对比：${best.channel} 成功率 ${best.rate}%，${worst.channel} 成功率 ${worst.rate}%。`);
      }
    }
    if (contentRanking.length > 0) {
      summary.push(`🏆 效果最佳内容：「${contentRanking[0].subject}」，成功率 ${contentRanking[0].rate}%。`);
    }
    setAiSummary(summary.join('\n'));
  };

  useEffect(() => { generateAiSummary(); }, [filteredLogs, timeRange]);

  const channelLabels: Record<string, string> = {
    dingtalk: '钉钉',
    webhook: '企业微信',
    wechat: '微信',
    content_push: '内容推送',
    daily_briefing: '每日简报',
  };

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex justify-between items-center gap-4">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600 shrink-0" />
              内容复盘
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">推送效果分析与数据洞察</p>
          </div>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />刷新
          </Button>
        </div>

        {/* 时间范围选择 */}
        <div className="flex items-center gap-2">
          {[
            { key: 'today' as TimeRange, label: '今日', icon: Calendar },
            { key: 'week' as TimeRange, label: '本周', icon: Calendar },
            { key: 'month' as TimeRange, label: '本月', icon: Calendar },
          ].map(item => (
            <Button key={item.key} variant={timeRange === item.key ? 'default' : 'outline'} size="sm" onClick={() => setTimeRange(item.key)}>
              {item.label}
            </Button>
          ))}
        </div>

        {/* AI 复盘总结 */}
        <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI 复盘总结
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiSummary ? (
              <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{aiSummary}</div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />分析中...
              </div>
            )}
          </CardContent>
        </Card>

        {/* 核心指标 + 成功率环 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          <Card className="col-span-2 md:col-span-1">
            <CardContent className="py-4 md:py-6 flex flex-col items-center">
              <div className="relative w-16 h-16 md:w-24 md:h-24">
                <svg className="w-16 h-16 md:w-24 md:h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  <circle cx="50" cy="50" r="40" fill="none"
                    stroke={successRate >= 80 ? "#22c55e" : successRate >= 50 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="8" strokeDasharray={`${successRate * 2.51} 251`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base md:text-xl font-bold">{successRate}%</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">成功率</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-1"><CardContent className="py-3 md:py-4 text-center"><p className="text-xl md:text-3xl font-bold text-blue-600">{fStats.total}</p><p className="text-xs md:text-sm text-gray-500">总推送</p></CardContent></Card>
          <Card className="md:col-span-1"><CardContent className="py-3 md:py-4 text-center"><p className="text-xl md:text-3xl font-bold text-green-600">{fStats.sent}</p><p className="text-xs md:text-sm text-gray-500">成功</p></CardContent></Card>
          <Card className="md:col-span-1"><CardContent className="py-3 md:py-4 text-center"><p className="text-xl md:text-3xl font-bold text-red-600">{fStats.failed}</p><p className="text-xs md:text-sm text-gray-500">失败</p></CardContent></Card>
          <Card className="md:col-span-1"><CardContent className="py-3 md:py-4 text-center"><p className="text-xl md:text-3xl font-bold text-amber-600">{fStats.retrying + scheduleCount}</p><p className="text-xs md:text-sm text-gray-500">进行中</p></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* 效果趋势 - 24 小时分布 */}
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-blue-500" />效果趋势</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-end gap-1 h-32">
                {hourlyData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-blue-500 rounded-t transition-all" style={{ height: `${(d.count / maxHourly) * 100}%`, minHeight: d.count > 0 ? '4px' : '0' }} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>0:00</span><span>6:00</span><span>12:00</span><span>18:00</span><span>23:00</span></div>
            </CardContent>
          </Card>

          {/* 渠道对比 */}
          <Card>
            <CardHeader><CardTitle className="text-lg">渠道对比</CardTitle></CardHeader>
            <CardContent>
              {channelComparison.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">暂无数据</p>
              ) : (
                <div className="space-y-3">
                  {channelComparison.map(ch => (
                    <div key={ch.channel} className="flex items-center gap-3">
                      <span className="text-sm w-20">{channelLabels[ch.channel] || ch.channel}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${ch.rate}%` }} />
                      </div>
                      <span className="text-sm text-gray-500 w-24 text-right">{ch.sent}/{ch.total} ({ch.rate}%)</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top 内容排行 */}
        {contentRanking.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Award className="h-5 w-5 text-amber-500" />Top 内容排行</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {contentRanking.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{medals[i]}</span>
                      <div>
                        <p className="text-sm font-medium">{item.subject}</p>
                        <p className="text-xs text-gray-400">推送 {item.count} 次，成功 {item.sent} 次</p>
                      </div>
                    </div>
                    <Badge className={item.rate >= 80 ? 'bg-green-100 text-green-700' : item.rate >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                      {item.rate}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 推送记录明细 */}
        <Card>
          <CardHeader><CardTitle className="text-lg">推送记录明细</CardTitle></CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8">
                <Send className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-400 text-sm">暂无推送记录</p>
                <p className="text-xs text-gray-300">推送内容后记录会出现在这里</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.slice(0, 15).map(log => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {log.status === 'sent' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                       log.status === 'failed' ? <XCircle className="h-4 w-4 text-red-500" /> :
                       log.status === 'retrying' ? <RefreshCw className="h-4 w-4 text-amber-500 animate-spin" /> :
                       <Clock className="h-4 w-4 text-gray-400" />}
                      <div>
                        <p className="text-sm font-medium">{log.subject}</p>
                        <p className="text-xs text-gray-400">
                          {channelLabels[log.channel] || log.channel} · {new Date(log.created_at).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <Badge className={
                      log.status === 'sent' ? 'bg-green-100 text-green-700' :
                      log.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }>
                      {log.status === 'sent' ? '已发送' : log.status === 'failed' ? '失败' : log.status === 'retrying' ? '重试中' : '等待中'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
