'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { contentApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  History,
  Search,
  Copy,
  Trash2,
  Edit3,
  Check,
  X,
  Loader2,
  FileText,
  Filter,
  Calendar,
  Send,
} from 'lucide-react';

interface ContentItem {
  id: string;
  topic: string;
  platform: string;
  tone?: string;
  content: string;
  created_at?: string;
  createdAt?: string;
}

const platformConfig: Record<string, { name: string; icon: string; color: string }> = {
  xiaohongshu: { name: '小红书', icon: '📕', color: 'bg-red-100 text-red-700' },
  douyin: { name: '抖音', icon: '🎵', color: 'bg-gray-900 text-white' },
  wechat: { name: '公众号', icon: '📢', color: 'bg-green-100 text-green-700' },
  wechat_moments: { name: '朋友圈', icon: '💬', color: 'bg-blue-100 text-blue-700' },
  zhihu: { name: '知乎', icon: '🔍', color: 'bg-blue-100 text-blue-700' },
  weibo: { name: '微博', icon: '🔥', color: 'bg-orange-100 text-orange-700' },
};

export default function HistoryPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await contentApi.list();
      setItems(res.data || []);
    } catch (e: any) {
      toast.error('加载失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, []);

  const filtered = items.filter(item => {
    const matchSearch = item.topic.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase());
    const matchPlatform = platformFilter === 'all' || item.platform === platformFilter;
    return matchSearch && matchPlatform;
  });

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('已复制到剪贴板');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleEdit = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      await contentApi.edit(id, editContent);
      toast.success('内容已更新');
      setEditingId(null);
      loadItems();
    } catch (e: any) {
      toast.error('更新失败: ' + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除？')) return;
    try {
      await contentApi.remove(id);
      toast.success('已删除');
      loadItems();
    } catch (e: any) {
      toast.error('删除失败: ' + e.message);
    }
  };

  const handlePush = async (item: ContentItem) => {
    const cfg = platformConfig[item.platform] || { name: item.platform, icon: '📄' };
    const title = `📝 ${item.topic} · ${cfg.name}`;
    try {
      const res = await fetch('/api/content/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body: item.content }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('推送成功');
      } else {
        toast.error(result.error || '推送失败');
      }
    } catch (e: any) {
      toast.error('推送失败: ' + e.message);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex justify-between items-center gap-4">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <History className="h-6 w-6 text-purple-600 shrink-0" />
              内容历史
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">共 {items.length} 条内容</p>
          </div>
          <Button variant="outline" onClick={loadItems} className="shrink-0">刷新</Button>
        </div>

        {/* 搜索 + 筛选 */}
        <div className="flex flex-col gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input placeholder="搜索主题或内容..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['all', ...Object.keys(platformConfig)].map(p => (
              <Button key={p} variant={platformFilter === p ? 'default' : 'outline'} size="sm" onClick={() => setPlatformFilter(p)}>
                {p === 'all' ? '全部' : (platformConfig[p]?.icon + ' ' + platformConfig[p]?.name)}
              </Button>
            ))}
          </div>
        </div>

        {/* 内容列表 */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />加载中...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">{items.length === 0 ? '暂无内容' : '没有匹配的内容'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => {
              const cfg = platformConfig[item.platform] || { name: item.platform, icon: '📄', color: 'bg-gray-100 text-gray-700' };
              const date = item.created_at || item.createdAt;
              return (
                <Card key={item.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={cfg.color}>{cfg.icon} {cfg.name}</Badge>
                        <span className="text-sm font-medium">{item.topic}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {date && (
                          <span className="text-xs text-gray-400 mr-2">
                            {new Date(date).toLocaleString('zh-CN')}
                          </span>
                        )}
                        {editingId === item.id ? (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(item.id)}>
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}>
                              <X className="h-3.5 w-3.5 text-gray-400" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingId(item.id); setEditContent(item.content); }}>
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(item.content, item.id)}>
                              {copied === item.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePush(item)}>
                              <Send className="h-3.5 w-3.5 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    {editingId === item.id ? (
                      <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={8} className="mt-2" />
                    ) : (
                      <pre className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                        {item.content}
                      </pre>
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
