'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { scheduleApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Clock,
  Plus,
  X,
  Send,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  CalendarClock,
} from 'lucide-react';

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  channel: string;
  scheduled_at: string;
  status: string;
  created_at: string;
  sent_at?: string;
  error?: string;
}

const channelLabels: Record<string, string> = {
  dingtalk: '钉钉',
  webhook: '企业微信',
  wechat: '微信',
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: '等待中', color: 'bg-blue-100 text-blue-700', icon: Clock },
  sent: { label: '已发送', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  failed: { label: '失败', color: 'bg-red-100 text-red-700', icon: XCircle },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-700', icon: X },
};

export default function SchedulePage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    channel: 'dingtalk',
    date: '',
    time: '',
  });

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await scheduleApi.list();
      setPosts(res.data || []);
    } catch (e: any) {
      toast.error('加载失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPosts(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('请填写标题和内容');
      return;
    }
    if (!form.date || !form.time) {
      toast.error('请选择发布时间');
      return;
    }

    const scheduledAt = new Date(`${form.date}T${form.time}:00+08:00`).toISOString();

    try {
      await scheduleApi.create({
        title: form.title,
        content: form.content,
        channel: form.channel,
        scheduled_at: scheduledAt,
      });
      toast.success('定时任务已创建');
      setShowCreate(false);
      setForm({ title: '', content: '', channel: 'dingtalk', date: '', time: '' });
      loadPosts();
    } catch (e: any) {
      toast.error('创建失败: ' + e.message);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await scheduleApi.cancel(id);
      toast.success('已取消');
      loadPosts();
    } catch (e: any) {
      toast.error('取消失败: ' + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await scheduleApi.remove(id);
      toast.success('已删除');
      loadPosts();
    } catch (e: any) {
      toast.error('删除失败: ' + e.message);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex justify-between items-center gap-4">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <CalendarClock className="h-6 w-6 text-blue-600 shrink-0" />
              定时发布
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">设定时间自动推送内容到钉钉/微信</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />新建定时
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
            加载中...
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">暂无定时任务</p>
            <p className="text-xs text-gray-300 mt-1">点击上方按钮创建定时发布</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map(post => {
              const cfg = statusConfig[post.status] || statusConfig.pending;
              const StatusIcon = cfg.icon;
              return (
                <Card key={post.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={cfg.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {cfg.label}
                          </Badge>
                          <Badge variant="outline">{channelLabels[post.channel] || post.channel}</Badge>
                          <span className="text-xs text-gray-400">
                            {new Date(post.scheduled_at).toLocaleString('zh-CN')}
                          </span>
                        </div>
                        <p className="text-sm font-medium mb-1">{post.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-2">{post.content}</p>
                        {post.error && (
                          <p className="text-xs text-red-500 mt-1">错误: {post.error}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        {post.status === 'pending' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCancel(post.id)}>
                            <X className="h-3.5 w-3.5 text-amber-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(post.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* 创建弹窗 */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>新建定时发布</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">标题</label>
                  <Input
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="推送标题"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">内容</label>
                  <Textarea
                    value={form.content}
                    onChange={e => setForm({ ...form, content: e.target.value })}
                    rows={4}
                    placeholder="推送内容"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">推送渠道</label>
                  <div className="flex gap-2 mt-1">
                    {['dingtalk', 'webhook', 'wechat'].map(ch => (
                      <Button
                        key={ch}
                        variant={form.channel === ch ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setForm({ ...form, channel: ch })}
                      >
                        {channelLabels[ch]}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">日期</label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={e => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">时间</label>
                    <Input
                      type="time"
                      value={form.time}
                      onChange={e => setForm({ ...form, time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowCreate(false)}>取消</Button>
                  <Button onClick={handleCreate}>
                    <Send className="h-4 w-4 mr-2" />
                    创建定时
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
