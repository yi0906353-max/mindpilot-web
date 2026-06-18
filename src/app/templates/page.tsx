'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { templateApi } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, Search, FileText } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  channel: string;
  subject: string;
  body: string;
  variables: string[];
  created_at: string;
}

const channelLabels: Record<string, string> = {
  wechat: '微信',
  email: '邮件',
  sms: '短信',
  dingtalk: '钉钉',
  webhook: '企业微信',
};

const channelColors: Record<string, string> = {
  wechat: 'bg-green-100 text-green-700',
  email: 'bg-blue-100 text-blue-700',
  sms: 'bg-amber-100 text-amber-700',
  dingtalk: 'bg-blue-100 text-blue-700',
  webhook: 'bg-purple-100 text-purple-700',
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState<Template | null>(null);
  const [channelFilter, setChannelFilter] = useState('all');
  const [form, setForm] = useState({ name: '', channel: 'wechat', subject: '', body: '', variables: '' });

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await templateApi.list();
      setTemplates(res.data || []);
    } catch (e: any) {
      toast.error('加载模板失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTemplates(); }, []);

  const filtered = templates.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase());
    const matchChannel = channelFilter === 'all' || t.channel === channelFilter;
    return matchSearch && matchChannel;
  });

  const openEditor = (template?: Template) => {
    if (template) {
      setEditingId(template.id);
      setForm({
        name: template.name,
        channel: template.channel,
        subject: template.subject,
        body: template.body,
        variables: (template.variables || []).join(','),
      });
    } else {
      setEditingId(null);
      setForm({ name: '', channel: 'wechat', subject: '', body: '', variables: '' });
    }
    setShowEditor(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error('请输入模板名称'); return; }
    const data = {
      ...form,
      variables: form.variables.split(',').map(v => v.trim()).filter(Boolean),
    };
    try {
      if (editingId) {
        await templateApi.update(editingId, data);
        toast.success('模板已更新');
      } else {
        await templateApi.create(data);
        toast.success('模板已创建');
      }
      setShowEditor(false);
      loadTemplates();
    } catch (e: any) {
      toast.error('保存失败: ' + e.message);
    }
  };

  const deleteTemplate = async () => {
    if (!showDelete) return;
    try {
      await templateApi.delete(showDelete.id);
      toast.success('模板已删除');
      setShowDelete(null);
      loadTemplates();
    } catch (e: any) {
      toast.error('删除失败: ' + e.message);
    }
  };

  const preview = (subject: string, body: string, variables: string[]) => {
    const testData: Record<string, string> = {};
    variables.forEach(v => {
      const key = v.trim();
      if (key === 'UserName') testData[key] = '张三';
      else if (key === 'Summary') testData[key] = '今日共有5条未读消息';
      else if (key === 'ThreeThings') testData[key] = '1. 处理重要消息\n2. 回复待办事项\n3. 查看每日简报';
      else if (key === 'ActionItems') testData[key] = '• 回复张三\n• 查看简报';
      else if (key.includes('Time')) testData[key] = '2025-01-15 14:00';
      else testData[key] = '测试数据';
    });
    let rendered = subject + '\n\n' + body;
    variables.forEach(v => {
      const key = v.trim();
      rendered = rendered.replace(new RegExp('\\{\\{\\.' + key + '\\}\\}', 'g'), testData[key] || '');
    });
    return rendered;
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex justify-between items-center gap-4">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold">通知模板</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">管理微信、邮件、短信通知模板</p>
          </div>
          <Button onClick={() => openEditor()}>
            <Plus className="h-4 w-4 mr-2" />新建模板
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input placeholder="搜索模板..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['all', 'wechat', 'dingtalk', 'email', 'sms'].map(ch => (
              <Button
                key={ch}
                variant={channelFilter === ch ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChannelFilter(ch)}
              >
                {ch === 'all' ? '全部' : channelLabels[ch] || ch}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">{templates.length === 0 ? '暂无模板，点击上方按钮创建' : '没有匹配的模板'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {filtered.map(t => (
              <Card key={t.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Badge className={channelColors[t.channel] || 'bg-gray-100 text-gray-700'}>
                      {channelLabels[t.channel] || t.channel}
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditor(t)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowDelete(t)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-2">{t.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{t.subject}</p>
                  <div className="text-xs text-gray-400 flex flex-wrap gap-1">
                    {(t.variables || []).map(v => (
                      <code key={v} className="bg-gray-100 px-1.5 py-0.5 rounded">{v}</code>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 编辑器弹窗 */}
        {showEditor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{editingId ? '编辑模板' : '新建模板'}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowEditor(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">模板名称</label>
                  <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="例如：每日早报" />
                </div>
                <div>
                  <label className="text-sm font-medium">渠道</label>
                  <select value={form.channel} onChange={e => setForm({...form, channel: e.target.value})} className="w-full p-2 border rounded-md text-sm">
                    <option value="wechat">微信</option>
                    <option value="email">邮件</option>
                    <option value="sms">短信</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">标题模板</label>
                  <Input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="支持变量: {{.UserName}} {{.Title}}" />
                </div>
                <div>
                  <label className="text-sm font-medium">正文模板</label>
                  <Textarea value={form.body} onChange={e => setForm({...form, body: e.target.value})} rows={6} placeholder="支持变量: {{.UserName}} {{.Summary}} {{.ThreeThings}}" />
                </div>
                <div>
                  <label className="text-sm font-medium">变量（逗号分隔）</label>
                  <Input value={form.variables} onChange={e => setForm({...form, variables: e.target.value})} placeholder="UserName,Summary,ThreeThings" />
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-2">预览效果</p>
                  <pre className="text-sm whitespace-pre-wrap text-gray-700">{preview(form.subject, form.body, form.variables.split(',').filter(v => v.trim()))}</pre>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowEditor(false)}>取消</Button>
                  <Button onClick={save}>保存</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 删除确认弹窗 */}
        {showDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>确认删除</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  确定要删除模板 <strong>{showDelete.name}</strong> 吗？此操作不可撤销。
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowDelete(null)}>取消</Button>
                  <Button variant="destructive" onClick={deleteTemplate}>删除</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
