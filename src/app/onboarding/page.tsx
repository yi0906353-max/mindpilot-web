'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { settingsApi } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Rocket,
  CheckCircle2,
  ArrowRight,
  Bot,
  Send,
  Sparkles,
  ClipboardCheck,
  PartyPopper,
} from 'lucide-react';

const steps = [
  {
    id: 'welcome',
    title: '欢迎使用 MindPilot',
    description: '你的 AI 个人助理平台，帮你管理消息、生成内容、自动推送。',
    icon: Rocket,
  },
  {
    id: 'channel',
    title: '配置推送渠道',
    description: '钉钉是最简单的推送方案，1 分钟搞定。',
    icon: Bot,
  },
  {
    id: 'test',
    title: '测试推送',
    description: '发送一条测试消息，确认推送通道已打通。',
    icon: Send,
  },
  {
    id: 'content',
    title: '开始创作',
    description: '用灵墨 AI 生成内容，一键推送到钉钉。',
    icon: Sparkles,
  },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [dingtalkUrl, setDingtalkUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const router = useRouter();

  const step = steps[currentStep];

  const handleSaveChannel = async () => {
    if (!dingtalkUrl.trim()) {
      toast.error('请输入钉钉 Webhook URL');
      return;
    }
    setSaving(true);
    try {
      await settingsApi.updateWechat({ dingtalk_url: dingtalkUrl.trim() });
      toast.success('钉钉配置已保存');
      setCompleted({ ...completed, channel: true });
      setCurrentStep(2);
    } catch (e: any) {
      toast.error('保存失败: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestPush = async () => {
    setTesting(true);
    try {
      await settingsApi.testDingtalk();
      toast.success('测试推送成功！请检查钉钉群');
      setCompleted({ ...completed, test: true });
      setCurrentStep(3);
    } catch (e: any) {
      toast.error('测试失败: ' + e.message);
    } finally {
      setTesting(false);
    }
  };

  const handleFinish = () => {
    router.push('/content');
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-8">
        {/* 进度条 */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                i < currentStep ? 'bg-green-500 text-white' :
                i === currentStep ? 'bg-blue-600 text-white' :
                'bg-gray-200 text-gray-500'
              }`}>
                {i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-12 h-0.5 ${i < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* 步骤内容 */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <step.icon className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl">{step.title}</CardTitle>
            <p className="text-gray-500 text-sm">{step.description}</p>
          </CardHeader>
          <CardContent>
            {/* Step 0: Welcome */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-800">📬 收件箱</p>
                    <p className="text-blue-600">统一管理所有消息</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="font-medium text-purple-800">📝 内容创作</p>
                    <p className="text-purple-600">AI 生成多平台内容</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="font-medium text-green-800">📤 一键推送</p>
                    <p className="text-green-600">推送到钉钉/微信</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="font-medium text-amber-800">📊 监控</p>
                    <p className="text-amber-600">服务状态实时监控</p>
                  </div>
                </div>
                <Button className="w-full" onClick={() => setCurrentStep(1)}>
                  开始配置 <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Step 1: Configure Channel */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                  <p className="font-medium mb-1">如何获取钉钉 Webhook：</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-700">
                    <li>打开钉钉，进入任意群聊</li>
                    <li>点击右上角「群设置」→「智能群助手」</li>
                    <li>点击「添加机器人」→ 选择「自定义」</li>
                    <li>起个名字（如"MindPilot"）→ 复制 Webhook 地址</li>
                  </ol>
                </div>
                <div>
                  <label className="text-sm font-medium">钉钉 Webhook URL</label>
                  <Input
                    value={dingtalkUrl}
                    onChange={e => setDingtalkUrl(e.target.value)}
                    placeholder="https://oapi.dingtalk.com/robot/send?access_token=xxxxx"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setCurrentStep(0)}>上一步</Button>
                  <Button onClick={handleSaveChannel} disabled={saving || !dingtalkUrl.trim()} className="flex-1">
                    {saving ? '保存中...' : '保存并继续'}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Test Push */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg text-sm text-green-800">
                  <p className="font-medium">✅ 钉钉已配置</p>
                  <p className="text-green-700">现在发送一条测试消息，确认推送通道正常。</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>上一步</Button>
                  <Button onClick={handleTestPush} disabled={testing} className="flex-1">
                    {testing ? '发送中...' : '发送测试消息'}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Start Creating */}
            {currentStep === 3 && (
              <div className="space-y-4 text-center">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <PartyPopper className="h-12 w-12 mx-auto text-blue-600 mb-3" />
                  <p className="text-lg font-bold text-gray-800">配置完成！</p>
                  <p className="text-gray-600 text-sm mt-1">你现在可以开始用灵墨创作内容并推送到钉钉了。</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>上一步</Button>
                  <Button onClick={handleFinish} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
                    <Sparkles className="h-4 w-4 mr-2" />
                    开始创作内容
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 跳过 */}
        <div className="text-center mt-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/content')}>
            跳过引导，直接使用
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
