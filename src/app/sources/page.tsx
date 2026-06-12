'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Link2,
  CheckCircle2,
  AlertCircle,
  Settings,
  ArrowRight,
  Loader2,
  Plus,
} from 'lucide-react';

interface SourceConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  settings?: Record<string, string>;
}

const defaultSources: SourceConfig[] = [
  { id: 'wechat', name: '微信', icon: '💬', description: '微信公众号/小程序消息', status: 'disconnected' },
  { id: 'email', name: '邮箱', icon: '📧', description: 'Gmail/Outlook/企业邮箱', status: 'disconnected' },
  { id: 'dingtalk', name: '钉钉', icon: '🔔', description: '钉钉工作消息/审批', status: 'disconnected' },
  { id: 'feishu', name: '飞书', icon: '📱', description: '飞书消息/文档/日历', status: 'disconnected' },
  { id: 'slack', name: 'Slack', icon: '💬', description: 'Slack 频道/私信', status: 'disconnected' },
  { id: 'telegram', name: 'Telegram', icon: '✈️', description: 'Telegram 私聊/群组', status: 'disconnected' },
];

export default function SourcesPage() {
  const [sources, setSources] = useState<SourceConfig[]>(defaultSources);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState<string | null>(null);
  const [config, setConfig] = useState<Record<string, string>>({});

  const handleConnect = async (sourceId: string) => {
    setConnecting(sourceId);
    try {
      // 模拟连接过程
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSources(prev => prev.map(s =>
        s.id === sourceId ? { ...s, status: 'connected' as const } : s
      ));
      toast.success(`${sources.find(s => s.id === sourceId)?.name} 连接成功`);
    } catch (e: any) {
      toast.error('连接失败: ' + e.message);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = (sourceId: string) => {
    setSources(prev => prev.map(s =>
      s.id === sourceId ? { ...s, status: 'disconnected' as const } : s
    ));
    toast.success('已断开连接');
  };

  const handleSaveConfig = (sourceId: string) => {
    toast.success('配置已保存');
    setShowConfig(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Link2 className="h-6 w-6 text-blue-600" />
            消息源管理
          </h1>
          <p className="text-sm text-gray-500 mt-1">连接你的消息平台，让 AI 自动整理</p>
        </div>

        {/* 状态概览 */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-green-600">{sources.filter(s => s.status === 'connected').length}</p>
              <p className="text-sm text-gray-500">已连接</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-gray-400">{sources.filter(s => s.status === 'disconnected').length}</p>
              <p className="text-sm text-gray-500">未连接</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-red-500">{sources.filter(s => s.status === 'error').length}</p>
              <p className="text-sm text-gray-500">异常</p>
            </CardContent>
          </Card>
        </div>

        {/* 消息源列表 */}
        <div className="space-y-4">
          {sources.map(source => (
            <Card key={source.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
                    {source.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{source.name}</h3>
                      <Badge className={
                        source.status === 'connected' ? 'bg-green-100 text-green-700' :
                        source.status === 'error' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }>
                        {source.status === 'connected' ? '✅ 已连接' :
                         source.status === 'error' ? '⚠️ 异常' : '未连接'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{source.description}</p>
                  </div>
                  <div className="flex gap-2">
                    {source.status === 'connected' ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setShowConfig(source.id)}>
                          <Settings className="h-3.5 w-3.5 mr-1" />配置
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDisconnect(source.id)}>
                          断开
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" onClick={() => handleConnect(source.id)} disabled={connecting === source.id}>
                        {connecting === source.id ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5 mr-1" />
                        )}
                        连接
                      </Button>
                    )}
                  </div>
                </div>

                {/* 配置面板 */}
                {showConfig === source.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                    <p className="text-sm font-medium">配置 {source.name}</p>
                    {source.id === 'email' && (
                      <>
                        <Input placeholder="邮箱地址" />
                        <Input type="password" placeholder="应用专用密码" />
                      </>
                    )}
                    {source.id === 'dingtalk' && (
                      <Input placeholder="钉钉机器人 Webhook URL" />
                    )}
                    {source.id === 'wechat' && (
                      <>
                        <Input placeholder="公众号 AppID" />
                        <Input type="password" placeholder="公众号 AppSecret" />
                      </>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveConfig(source.id)}>保存</Button>
                      <Button size="sm" variant="outline" onClick={() => setShowConfig(null)}>取消</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
