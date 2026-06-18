'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { inboxApi } from '@/lib/api';
import { Message } from '@/types';
import { toast } from 'sonner';
import {
  Mail,
  MessageSquare,
  Bell,
  Trash2,
  RefreshCw,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Reply,
  Send,
  X,
} from 'lucide-react';

const categoryConfig: Record<string, { label: string; color: string; icon: any }> = {
  needs_reply: { label: '需回复', color: 'bg-red-100 text-red-800', icon: MessageSquare },
  needs_read: { label: '需知晓', color: 'bg-blue-100 text-blue-800', icon: Bell },
  promotion: { label: '推广', color: 'bg-gray-100 text-gray-800', icon: Mail },
  spam: { label: '垃圾', color: 'bg-gray-100 text-gray-600', icon: Trash2 },
};

export default function InboxPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [generating, setGenerating] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data } = await inboxApi.getMessages({ limit: 50 });
      setMessages(data || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  const filteredMessages = filter === 'all'
    ? messages
    : messages.filter((m) => m.category === filter);

  // 今日三件事：按优先级排序的前 3 条需回复消息
  const topThree = messages
    .filter(m => m.category === 'needs_reply')
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);

  const getCategoryConfig = (category: string) => {
    return categoryConfig[category] || categoryConfig.needs_read;
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-red-600';
    if (priority >= 3) return 'text-orange-600';
    return 'text-gray-600';
  };

  // 生成回复草稿
  const generateReply = async (msg: Message) => {
    setReplyingTo(msg.id);
    setGenerating(true);
    setReplyDraft('');
    try {
      const res = await fetch('/api/v1/tasks/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: `帮我回复这条消息：${msg.sender_name} 说 "${msg.summary}"，消息来源是 ${msg.source}，优先级 P${msg.priority}` }),
      });
      const data = await res.json();
      setReplyDraft(data.result || 'AI 生成回复草稿失败');
    } catch {
      setReplyDraft('AI 生成回复草稿失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendReply = () => {
    toast.success('回复已发送（模拟）');
    setReplyingTo(null);
    setReplyDraft('');
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Inbox className="h-6 w-6 text-blue-600" />
              收件箱
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">共 {messages.length} 条消息，{topThree.length} 条需处理</p>
          </div>
          <Button onClick={fetchMessages} variant="outline" size="sm" className="shrink-0">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>

        {/* 今日三件事 */}
        {topThree.length > 0 && (
          <Card className="border-2 border-amber-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                今日三件事
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topThree.map((msg, i) => (
                  <div key={msg.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{msg.sender_name}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{msg.summary}</p>
                    </div>
                    <Badge className={getCategoryConfig(msg.category).color}>
                      {getCategoryConfig(msg.category).label}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 分类筛选 */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            全部 ({messages.length})
          </Button>
          {Object.entries(categoryConfig).map(([key, config]) => {
            const count = messages.filter((m) => m.category === key).length;
            return (
              <Button
                key={key}
                variant={filter === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(key)}
              >
                {config.label} ({count})
              </Button>
            );
          })}
        </div>

        {/* 消息列表 */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
            加载中...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">暂无消息</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((msg) => {
              const catConfig = getCategoryConfig(msg.category);
              const CatIcon = catConfig.icon;
              return (
                <Card key={msg.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <CatIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{msg.sender_name}</span>
                          <Badge className={catConfig.color}>{catConfig.label}</Badge>
                          <span className={`text-xs font-medium ${getPriorityColor(msg.priority)}`}>
                            P{msg.priority}
                          </span>
                          <span className="text-xs text-gray-400 ml-auto">
                            {msg.source}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{msg.summary}</p>
                        {msg.action_items && msg.action_items.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {msg.action_items.slice(0, 2).map((item, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {msg.category === 'needs_reply' && replyingTo !== msg.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 text-blue-600 hover:text-blue-700"
                            onClick={() => generateReply(msg)}
                          >
                            <Reply className="h-3.5 w-3.5 mr-1" />AI 回复
                          </Button>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-xs text-gray-400">
                        {new Date(msg.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {/* 回复草稿区 */}
                    {replyingTo === msg.id && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-700">AI 回复草稿</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyingTo(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {generating ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" />AI 正在生成回复...
                          </div>
                        ) : (
                          <>
                            <Textarea
                              value={replyDraft}
                              onChange={e => setReplyDraft(e.target.value)}
                              rows={3}
                              className="text-sm mb-2"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSendReply} disabled={!replyDraft}>
                                <Send className="h-3.5 w-3.5 mr-1" />发送
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => { setReplyDraft(''); generateReply(msg); }}>
                                重新生成
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// Inbox icon
function Inbox({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}
