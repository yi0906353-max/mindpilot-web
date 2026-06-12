'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { settingsApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Key,
  Eye,
  EyeOff,
  Send,
  CheckCircle2,
  Clock,
  Loader2,
  Zap,
  MessageCircle,
  Bot,
} from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingDingtalk, setTestingDingtalk] = useState(false);
  const [testingWx, setTestingWx] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [settings, setSettings] = useState({
    app_id: '',
    app_secret: '',
    template_id: '',
    open_id: '',
    webhook_url: '',
    dingtalk_url: '',
    dingtalk_secret: '',
  });
  const [status, setStatus] = useState<Record<string, boolean>>({});

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await settingsApi.getWechat();
      const data = res.data;
      setSettings({
        app_id: data.app_id || '',
        app_secret: data.app_secret || '',
        template_id: data.template_id || '',
        open_id: data.open_id || '',
        webhook_url: data.webhook_url || '',
        dingtalk_url: data.dingtalk_url || '',
        dingtalk_secret: data.dingtalk_secret || '',
      });
      setStatus(data.status || {});
    } catch (e: any) {
      toast.error('加载设置失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await settingsApi.updateWechat(settings);
      toast.success('设置已保存');
      loadSettings();
    } catch (e: any) {
      toast.error('保存失败: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const testDingtalk = async () => {
    setTestingDingtalk(true);
    try {
      await settingsApi.testDingtalk();
      toast.success('钉钉推送成功！请检查钉钉群');
    } catch (e: any) {
      toast.error('钉钉测试失败: ' + e.message);
    } finally {
      setTestingDingtalk(false);
    }
  };

  const testWebhook = async () => {
    setTesting(true);
    try {
      await settingsApi.testWebhook();
      toast.success('Webhook 测试推送成功！请检查企业微信群');
    } catch (e: any) {
      toast.error('测试失败: ' + e.message);
    } finally {
      setTesting(false);
    }
  };

  const testWechatPush = async () => {
    setTestingWx(true);
    try {
      await settingsApi.testWechatPush();
      toast.success('公众号推送成功！请检查微信');
    } catch (e: any) {
      toast.error('公众号推送失败: ' + e.message);
    } finally {
      setTestingWx(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold">推送设置</h1>
          <p className="text-sm text-gray-500 mt-1">配置消息推送通道，支持多渠道</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.href = '/onboarding'}>
            🚀 新手引导
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
            加载中...
          </div>
        ) : (
          <>
            {/* 渠道 1: 钉钉机器人 — 推荐 */}
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-600" />
                  <CardTitle>钉钉机器人</CardTitle>
                  <Badge className="bg-blue-100 text-blue-700">推荐</Badge>
                  {status.dingtalk_ready && (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> 已就绪
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                  💡 最简单的推送方案。在钉钉群里添加自定义机器人，复制 Webhook URL 即可。
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Webhook URL</label>
                    <Input
                      value={settings.dingtalk_url}
                      onChange={e => setSettings({ ...settings, dingtalk_url: e.target.value })}
                      placeholder="https://oapi.dingtalk.com/robot/send?access_token=xxxxx"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      钉钉群 → 群设置 → 智能群助手 → 添加机器人 → 自定义 → 复制 Webhook 地址
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">加签密钥（可选）</label>
                    <Input
                      value={settings.dingtalk_secret}
                      onChange={e => setSettings({ ...settings, dingtalk_secret: e.target.value })}
                      placeholder="SECxxx...（如果机器人设置了加签）"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button onClick={saveSettings} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    保存配置
                  </Button>
                  <Button
                    variant="outline"
                    onClick={testDingtalk}
                    disabled={testingDingtalk || !settings.dingtalk_url}
                  >
                    {testingDingtalk ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    测试推送
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 渠道 2: 企业微信 Webhook */}
            <Card className="opacity-75">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  <CardTitle>企业微信机器人</CardTitle>
                  {status.webhook_ready && (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> 已就绪
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  在企业微信群里添加机器人获取 Webhook URL。需要企业微信账号。
                </div>
                <div>
                  <label className="text-sm font-medium">Webhook URL</label>
                  <Input
                    value={settings.webhook_url}
                    onChange={e => setSettings({ ...settings, webhook_url: e.target.value })}
                    placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxx"
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <Button onClick={saveSettings} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    保存配置
                  </Button>
                  <Button
                    variant="outline"
                    onClick={testWebhook}
                    disabled={testing || !settings.webhook_url}
                  >
                    {testing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    测试推送
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 渠道 3: 微信公众号模板消息 */}
            <Card className="opacity-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-blue-600" />
                  <CardTitle>微信公众号模板消息</CardTitle>
                  {status.ready ? (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> 已就绪
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700">
                      <Clock className="h-3 w-3 mr-1" /> 待配置
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-amber-50 rounded-lg text-sm text-amber-800">
                  ⚠️ 需要服务号 + 公网 IP 白名单 + 模板消息审核，配置较复杂。建议优先使用钉钉方案。
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">AppID</label>
                    <Input value={settings.app_id} onChange={e => setSettings({ ...settings, app_id: e.target.value })} placeholder="wx1234567890abcdef" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">AppSecret</label>
                    <div className="relative">
                      <Input type={showSecret ? 'text' : 'password'} value={settings.app_secret} onChange={e => setSettings({ ...settings, app_secret: e.target.value })} placeholder="请输入 AppSecret" className="pr-10" />
                      <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">TemplateID</label>
                    <Input value={settings.template_id} onChange={e => setSettings({ ...settings, template_id: e.target.value })} placeholder="模板消息 ID" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">OpenID</label>
                    <Input value={settings.open_id} onChange={e => setSettings({ ...settings, open_id: e.target.value })} placeholder="oXXXXXXXXXXXXXXXXXXXXXXXXXXX" />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button onClick={saveSettings} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    保存配置
                  </Button>
                  <Button variant="outline" onClick={testWechatPush} disabled={testingWx || !status.ready}>
                    {testingWx ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    测试公众号推送
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
