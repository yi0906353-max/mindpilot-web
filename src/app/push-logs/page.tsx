'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { pushLogApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Send,
  MessageSquare,
  AlertTriangle,
  Loader2,
  Filter,
} from 'lucide-react';

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

const channelLabels: Record<string, string> = {
  wechat: '微信',
  email: '邮件',
  sms: '短信',
  webhook: '企业微信',
};

const channelColors: Record<string, string> = {
  wechat: 'bg-green-100 text-green-700',
  email: 'bg-blue-100 text-blue-700',
  sms: 'bg-amber-100 text-amber-700',
  webhook: 'bg-purple-100 text-purple-700',
};

export default function PushLogsPage() {
  const [logs, setLogs] = useState<PushLog[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await pushLogApi.list();
      setLogs(res.data || []);
      setStats(res.stats || {});
    } catch (e: any) {
      toast.error('加载失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, []);

  const filtered = filter === 'all' ? logs : logs.filter(l => l.status === filter);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'retrying': return <RefreshCw className="h-4 w-4 text-amber-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'sent': return <Badge className="bg-green-100 text-green-700">已发送</Badge>;
      case 'failed': return <Badge className="bg-red-100 text-red-700">失败</Badge>;
      case 'retrying': return <Badge className="bg-amber-100 text-amber-700">重试中</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-700">等待中</Badge>;
    }
  };

  const statCards = [
    { label: '总推送', value: stats.total || 0, color: 'text-blue-600' },
    { label: '成功', value: stats.sent || 0, color: 'text-green-600' },
    { label: '失败', value: stats.failed || 0, color: 'text-red-600' },
    { label: '重试中', value: stats.retrying || 0, color: 'text-amber-600' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">推送日志</h1>
            <p className="text-sm text-gray-500 mt-1">查看推送历史，监控失败重试</p>
          </div>
          <Button variant="outline" onClick={loadLogs}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4">
          {statCards.map(s => (
            <Card key={s.label}>
              <CardContent className="py-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 过滤器 */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: '全部' },
            { key: 'sent', label: '已发送' },
            { key: 'failed', label: '失败' },
            { key: 'retrying', label: '重试中' },
          ].map(f => (
            <Button
              key={f.key}
              variant={filter === f.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* 日志列表 */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
            加载中...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">暂无推送记录</p>
            <p className="text-xs text-gray-300 mt-1">当简报生成并推送后，记录会出现在这里</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(log => (
              <Card key={log.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {statusIcon(log.status)}
                      {statusBadge(log.status)}
                      <Badge className={channelColors[log.channel] || 'bg-gray-100 text-gray-700'}>
                        {channelLabels[log.channel] || log.channel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {log.retry_count > 0 && (
                        <span className="text-amber-500">重试 {log.retry_count}/{log.max_retries}</span>
                      )}
                      <span>{new Date(log.created_at).toLocaleString('zh-CN')}</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium mb-1">{log.subject}</p>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">{log.content}</p>
                  {log.error && (
                    <div className="flex items-start gap-2 p-2 bg-red-50 rounded text-xs text-red-600">
                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>{log.error}</span>
                    </div>
                  )}
                  {log.next_retry && (
                    <p className="text-xs text-amber-500 mt-1">
                      下次重试: {new Date(log.next_retry).toLocaleString('zh-CN')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
