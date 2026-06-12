'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { contentApi, titlesApi, topicsApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  PenTool,
  Sparkles,
  Copy,
  Trash2,
  Send,
  Loader2,
  TrendingUp,
  Flame,
  X,
  Check,
  Edit3,
  FileText,
  ArrowUpRight,
  Zap,
} from 'lucide-react';

const platformConfig: Record<string, { name: string; icon: string; color: string }> = {
  xiaohongshu: { name: '小红书', icon: '📕', color: 'bg-red-100 text-red-700' },
  douyin: { name: '抖音', icon: '🎵', color: 'bg-gray-900 text-white' },
  wechat: { name: '公众号', icon: '📢', color: 'bg-green-100 text-green-700' },
  wechat_moments: { name: '朋友圈', icon: '💬', color: 'bg-blue-100 text-blue-700' },
  zhihu: { name: '知乎', icon: '🔍', color: 'bg-blue-100 text-blue-700' },
  weibo: { name: '微博', icon: '🔥', color: 'bg-orange-100 text-orange-700' },
};

const toneOptions = [
  { value: 'casual', label: '轻松活泼' },
  { value: 'professional', label: '专业严谨' },
  { value: 'humorous', label: '幽默有趣' },
];

interface GeneratedContent {
  id: string;
  topic: string;
  platform: string;
  tone?: string;
  content: string;
  created_at?: string;
  createdAt?: string;
}

export default function ContentPage() {
  // Tab 控制
  const [tab, setTab] = useState('generate');

  // 内容生成
  const [topic, setTopic] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['xiaohongshu']);
  const [tone, setTone] = useState('casual');
  const [keywords, setKeywords] = useState('');
  const [generating, setGenerating] = useState(false);
  const [batchResults, setBatchResults] = useState<GeneratedContent[]>([]);

  // 内容库
  const [library, setLibrary] = useState<GeneratedContent[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  // 热点
  const [loadingTopics, setLoadingTopics] = useState(false);

  // 标题生成
  const [titleTopic, setTitleTopic] = useState('');
  const [titlePlatform, setTitlePlatform] = useState('xiaohongshu');
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const [generatingTitles, setGeneratingTitles] = useState(false);

  // 推送
  const [pushing, setPushing] = useState<string | null>(null);

  // ========== 内容生成 ==========
  const handleGenerate = async () => {
    if (!topic.trim()) { toast.error('请输入主题'); return; }
    if (selectedPlatforms.length === 0) { toast.error('请选择至少一个平台'); return; }

    setGenerating(true);
    setBatchResults([]);

    try {
      if (selectedPlatforms.length === 1) {
        const res = await contentApi.generate({
          topic: topic.trim(),
          platform: selectedPlatforms[0],
          tone,
          keywords: keywords ? keywords.split(/[,，、\s]+/).filter(Boolean) : undefined,
        });
        setBatchResults([res]);
        toast.success('内容生成成功');
      } else {
        const res = await contentApi.batchGenerate({
          topic: topic.trim(),
          platforms: selectedPlatforms,
          tone,
          keywords: keywords ? keywords.split(/[,，、\s]+/).filter(Boolean) : undefined,
        });
        setBatchResults(res.data || []);
        toast.success(`已生成 ${res.total} 个平台内容`);
      }
      loadLibrary();
    } catch (e: any) {
      toast.error('生成失败: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  // ========== 内容库 ==========
  const loadLibrary = async () => {
    setLoadingLibrary(true);
    try {
      const res = await contentApi.list();
      setLibrary(res.data || []);
    } catch (e: any) {
      // 静默失败，内容库可能暂时不可用
    } finally {
      setLoadingLibrary(false);
    }
  };

  useEffect(() => { loadLibrary(); }, []);

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
      loadLibrary();
    } catch (e: any) {
      toast.error('更新失败: ' + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await contentApi.remove(id);
      toast.success('已删除');
      loadLibrary();
    } catch (e: any) {
      toast.error('删除失败: ' + e.message);
    }
  };

  // ========== 推送到渠道 ==========
  const handlePush = async (item: GeneratedContent) => {
    setPushing(item.id);
    try {
      const platformName = platformConfig[item.platform]?.name || item.platform;
      const title = `📝 ${item.topic} · ${platformName}`;
      const res = await fetch('/api/content/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`,
        },
        body: JSON.stringify({
          title,
          body: item.content,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`推送成功（${result.channel}）`);
      } else {
        toast.error(result.error || '推送失败');
      }
    } catch (e: any) {
      toast.error('推送失败: ' + e.message);
    } finally {
      setPushing(null);
    }
  };

  // ========== 热点话题 ==========
  const [allTopics, setAllTopics] = useState<any[]>([]);

  const loadTopics = async () => {
    setLoadingTopics(true);
    try {
      const realTopics = await topicsApi.fetchRealTopics();
      setAllTopics(realTopics);
    } catch (e: any) {
      try {
        const res = await topicsApi.list();
        setAllTopics(res.data || []);
      } catch {}
    } finally {
      setLoadingTopics(false);
    }
  };

  const topics = allTopics;

  useEffect(() => { loadTopics(); }, []);

  // ========== 标题生成 ==========
  const handleGenerateTitles = async () => {
    if (!titleTopic.trim()) { toast.error('请输入主题'); return; }
    setGeneratingTitles(true);
    try {
      const res = await titlesApi.generate({
        topic: titleTopic.trim(),
        platform: titlePlatform,
        count: 5,
      });
      setGeneratedTitles(res.data || []);
      toast.success(`已生成 ${res.data?.length || 0} 个标题`);
    } catch (e: any) {
      toast.error('生成失败: ' + e.message);
    } finally {
      setGeneratingTitles(false);
    }
  };

  // ========== 渲染 ==========
  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PenTool className="h-6 w-6 text-purple-600" />
            灵墨 · 内容创作
          </h1>
          <p className="text-sm text-gray-500 mt-1">AI 驱动的多平台内容生成、爆款标题、热点选题</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />AI 生成
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />内容库
            </TabsTrigger>
            <TabsTrigger value="topics" className="flex items-center gap-2">
              <Flame className="h-4 w-4" />热点话题
            </TabsTrigger>
            <TabsTrigger value="titles" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />爆款标题
            </TabsTrigger>
          </TabsList>

          {/* ========== Tab: AI 生成 ========== */}
          <TabsContent value="generate" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* 主题输入 */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">创作主题</label>
                    <Input
                      placeholder="输入你想创作的主题，例如：如何高效管理时间"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
                    />
                  </div>

                  {/* 平台选择 */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">目标平台（可多选）</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(platformConfig).map(([id, cfg]) => (
                        <Button
                          key={id}
                          variant={selectedPlatforms.includes(id) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => togglePlatform(id)}
                          className="flex items-center gap-1.5"
                        >
                          <span>{cfg.icon}</span>
                          {cfg.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* 风格 + 关键词 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">语气风格</label>
                      <div className="flex gap-2">
                        {toneOptions.map(t => (
                          <Button
                            key={t.value}
                            variant={tone === t.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setTone(t.value)}
                          >
                            {t.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">关键词（可选）</label>
                      <Input
                        placeholder="用逗号分隔，例如：效率,时间管理"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* 生成按钮 */}
                  <Button
                    onClick={handleGenerate}
                    disabled={!topic.trim() || generating || selectedPlatforms.length === 0}
                    className="w-full"
                    size="lg"
                  >
                    {generating ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" />AI 正在创作中...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" />生成内容{selectedPlatforms.length > 1 ? `（${selectedPlatforms.length} 个平台）` : ''}</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 生成结果 */}
            {batchResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  生成完成（{batchResults.length} 条）
                </h3>
                {batchResults.map((item) => (
                  <GeneratedCard
                    key={item.id}
                    item={item}
                    onCopy={handleCopy}
                    onPush={handlePush}
                    copied={copied}
                    pushing={pushing}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ========== Tab: 内容库 ========== */}
          <TabsContent value="library" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">已生成内容</h3>
              <Button variant="outline" size="sm" onClick={loadLibrary}>
                刷新
              </Button>
            </div>

            {loadingLibrary ? (
              <div className="text-center py-12 text-gray-400">
                <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
                加载中...
              </div>
            ) : library.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400">还没有生成过内容</p>
                <p className="text-xs text-gray-300 mt-1">去「AI 生成」开始创作吧</p>
              </div>
            ) : (
              <div className="space-y-3">
                {library.map((item) => {
                  const cfg = platformConfig[item.platform] || { name: item.platform, icon: '📄', color: 'bg-gray-100' };
                  return (
                    <Card key={item.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={cfg.color}>{cfg.icon} {cfg.name}</Badge>
                            <span className="text-sm font-medium">{item.topic}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400 mr-2">
                              {new Date(item.created_at || item.createdAt || '').toLocaleString('zh-CN')}
                            </span>
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
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={8}
                            className="mt-2"
                          />
                        ) : (
                          <pre className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg max-h-60 overflow-y-auto">
                            {item.content}
                          </pre>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ========== Tab: 热点话题 ========== */}
          <TabsContent value="topics" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                热点话题
              </h3>
              <Button variant="outline" size="sm" onClick={loadTopics}>
                刷新
              </Button>
            </div>

            {loadingTopics ? (
              <div className="text-center py-12 text-gray-400">
                <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
                加载热点中...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {topics.map((t) => (
                  <Card key={t.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setTopic(t.title); setTab('generate'); }}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <TrendingUp className={`h-4 w-4 ${t.trend === 'up' ? 'text-red-500' : t.trend === 'down' ? 'text-green-500' : 'text-gray-400'}`} />
                            <span className="text-lg font-bold text-gray-800">{t.title}</span>
                          </div>
                          <Badge variant="outline">{t.category}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-orange-100 text-orange-700">{t.heat}°</Badge>
                          <Badge variant="outline" className="text-xs">{t.platform}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">点击此话题跳转到 AI 生成</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ========== Tab: 爆款标题 ========== */}
          <TabsContent value="titles" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">标题主题</label>
                    <Input
                      placeholder="输入主题，例如：AI 写作工具推荐"
                      value={titleTopic}
                      onChange={(e) => setTitleTopic(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleGenerateTitles(); }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">目标平台</label>
                    <div className="flex gap-2">
                      {Object.entries(platformConfig).map(([id, cfg]) => (
                        <Button
                          key={id}
                          variant={titlePlatform === id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTitlePlatform(id)}
                        >
                          {cfg.icon} {cfg.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={handleGenerateTitles}
                    disabled={!titleTopic.trim() || generatingTitles}
                    className="w-full"
                  >
                    {generatingTitles ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" />生成中...</>
                    ) : (
                      <><Zap className="h-4 w-4 mr-2" />生成爆款标题</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {generatedTitles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>生成结果</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {generatedTitles.map((title, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="text-sm font-medium">{title}</span>
                        <Button variant="ghost" size="sm" onClick={() => handleCopy(title, `title-${i}`)}>
                          {copied === `title-${i}` ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

// ========== 生成结果卡片组件 ==========
function GeneratedCard({
  item,
  onCopy,
  onPush,
  copied,
  pushing,
}: {
  item: GeneratedContent;
  onCopy: (text: string, id: string) => void;
  onPush: (item: GeneratedContent) => void;
  copied: string | null;
  pushing: string | null;
}) {
  const cfg = platformConfig[item.platform] || { name: item.platform, icon: '📄', color: 'bg-gray-100' };
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge className={cfg.color}>{cfg.icon} {cfg.name}</Badge>
            <span className="text-sm font-medium">{item.topic}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => onCopy(item.content, item.id)}>
              {copied === item.id ? <Check className="h-3.5 w-3.5 text-green-500 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              {copied === item.id ? '已复制' : '复制'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onPush(item)} disabled={pushing === item.id}>
              {pushing === item.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <Send className="h-3.5 w-3.5 mr-1" />
              )}
              推送
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? '收起' : '展开'}
            </Button>
          </div>
        </div>
        <pre className={`text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg ${expanded ? '' : 'max-h-32 overflow-hidden'}`}>
          {item.content}
        </pre>
        {!expanded && item.content.length > 200 && (
          <p className="text-xs text-gray-400 text-center mt-1 cursor-pointer" onClick={() => setExpanded(true)}>
            点击展开全文
          </p>
        )}
      </CardContent>
    </Card>
  );
}
