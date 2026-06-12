'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { monitorApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Server,
  Database,
  Network,
  Globe,
  MessageSquare,
  Zap,
} from 'lucide-react';

interface ServiceCheck {
  name: string;
  url: string;
  status: string;
  latency_ms: number;
  status_code?: number;
  error?: string;
}

interface MonitorData {
  timestamp: string;
  overall: string;
  services: ServiceCheck[];
}

const serviceIcons: Record<string, React.ReactNode> = {
  'API Gateway': <Globe className="h-5 w-5" />,
  'User Service': <Server className="h-5 w-5" />,
  'Inbox Service': <MessageSquare className="h-5 w-5" />,
  'Agent Service': <Zap className="h-5 w-5" />,
  'Daily Briefing': <Activity className="h-5 w-5" />,
  PostgreSQL: <Database className="h-5 w-5" />,
  Redis: <Database className="h-5 w-5" />,
  NATS: <Network className="h-5 w-5" />,
};

export default function MonitorPage() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await monitorApi.health();
      setData(res.data);
    } catch (e: any) {
      toast.error('获取监控数据失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchHealth]);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const overallConfig = {
    healthy: { color: 'bg-green-50 border-green-200', text: 'text-green-700', label: '系统正常', icon: CheckCircle2 },
    degraded: { color: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: '部分降级', icon: AlertTriangle },
    down: { color: 'bg-red-50 border-red-200', text: 'text-red-700', label: '服务中断', icon: XCircle },
  };

  const oc = overallConfig[data?.overall as keyof typeof overallConfig] || overallConfig.healthy;
  const OverallIcon = oc.icon;

  const latencyColor = (ms: number) => {
    if (ms < 10) return 'bg-green-400';
    if (ms < 50) return 'bg-amber-400';
    return 'bg-red-400';
  };

  const latencyWidth = (ms: number) => {
    return Math.min(100, Math.max(4, ms * 2)) + '%';
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">监控面板</h1>
            <p className="text-sm text-gray-500 mt-1">
              {data ? `最后更新: ${new Date(data.timestamp).toLocaleTimeString('zh-CN')}` : '加载中...'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              自动刷新 (30s)
            </label>
            <Button variant="outline" onClick={fetchHealth} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              立即刷新
            </Button>
          </div>
        </div>

        {/* 总体状态 */}
        <Card className={`border-2 ${oc.color}`}>
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <OverallIcon className={`h-8 w-8 ${oc.text}`} />
              <div>
                <p className={`text-xl font-bold ${oc.text}`}>{oc.label}</p>
                <p className="text-sm text-gray-500">
                  {data?.services.filter(s => s.status === 'ok').length || 0} / {data?.services.length || 8} 服务正常
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 服务状态网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.services.map(svc => (
            <Card key={svc.name} className="hover:shadow-sm transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {serviceIcons[svc.name] || <Server className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{svc.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{svc.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusIcon(svc.status)}
                    <Badge
                      className={
                        svc.status === 'ok'
                          ? 'bg-green-100 text-green-700'
                          : svc.status === 'degraded'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                      }
                    >
                      {svc.status === 'ok' ? '正常' : svc.status === 'degraded' ? '降级' : '中断'}
                    </Badge>
                  </div>
                </div>

                {/* 延迟条 */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <span>延迟:</span>
                  <span className="font-mono font-medium">{svc.latency_ms.toFixed(1)} ms</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${latencyColor(svc.latency_ms)}`}
                    style={{ width: latencyWidth(svc.latency_ms) }}
                  />
                </div>

                {/* 错误信息 */}
                {svc.error && (
                  <p className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded">
                    {svc.error}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
