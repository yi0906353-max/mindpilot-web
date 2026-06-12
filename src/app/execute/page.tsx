'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { agentApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Zap,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  History,
  RefreshCw,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: '等待中', color: 'bg-gray-100 text-gray-600', icon: Clock },
  running: { label: '执行中', color: 'bg-blue-100 text-blue-600', icon: Loader2 },
  completed: { label: '完成', color: 'bg-green-100 text-green-600', icon: CheckCircle2 },
  failed: { label: '失败', color: 'bg-red-100 text-red-600', icon: XCircle },
};

const examples = [
  '帮我整理今天微信上老板发的消息',
  '查看明天的日程安排，看看有没有冲突',
  '给张三发一封邮件，说明天会议推迟到下午3点',
  '帮我总结一下这周的待办事项',
];

export default function ExecutePage() {
  const [input, setInput] = useState('');
  const [execution, setExecution] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);

  // 加载历史任务
  const loadTasks = async () => {
    try {
      const res = await agentApi.listTasks();
      setRecentTasks(res.data || []);
    } catch (e: any) {
      // 静默失败
    }
  };

  useEffect(() => { loadTasks(); }, []);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      const result = await agentApi.execute({ input: input.trim() });
      setExecution(result);
      setInput('');
      // 3 秒后刷新历史
      setTimeout(loadTasks, 3000);
    } catch (error) {
      toast.error('执行失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status] || statusConfig.pending;
  };

  const getStepStatusIcon = (status: string) => {
    const config = getStatusConfig(status);
    const Icon = config.icon;
    return <Icon className={`h-4 w-4 ${status === 'running' ? 'animate-spin' : ''}`} />;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="h-6 w-6 text-blue-600" />
          一句话执行
        </h1>

        {/* 输入区 */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="告诉我你想做什么..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  className="min-h-[100px] pr-24"
                />
                <Button
                  className="absolute bottom-3 right-3"
                  onClick={handleSubmit}
                  disabled={!input.trim() || loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      执行
                    </>
                  )}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {examples.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(example)}
                    className="text-xs"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 执行结果 */}
        {execution && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                执行结果
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusConfig(execution.status).color}>
                    {getStatusConfig(execution.status).label}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    ID: {execution.id?.slice(0, 8)}...
                  </span>
                </div>

                {execution.steps && execution.steps.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-500">执行步骤：</p>
                    {execution.steps.map((step: any, index: number) => (
                      <div
                        key={step.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {getStepStatusIcon(step.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              步骤 {index + 1}: {step.name}
                            </span>
                            <Badge
                              variant="outline"
                              className={getStatusConfig(step.status).color}
                            >
                              {getStatusConfig(step.status).label}
                            </Badge>
                            {step.tool_name && (
                              <Badge variant="outline" className="bg-purple-100 text-purple-700">
                                🔧 {step.tool_name}
                              </Badge>
                            )}
                          </div>
                          {step.output && (
                            <p className="text-sm text-gray-600 mt-1">{step.output}</p>
                          )}
                          {step.error && (
                            <p className="text-sm text-red-600 mt-1">{step.error}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {execution.result && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800 mb-1">最终结果：</p>
                    <p className="text-sm text-green-700 whitespace-pre-wrap">
                      {execution.result}
                    </p>
                  </div>
                )}

                {execution.error && (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm font-medium text-red-800 mb-1">错误：</p>
                    <p className="text-sm text-red-700">{execution.error}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 历史任务 */}
        {recentTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-gray-500" />
                历史任务
                <Button variant="ghost" size="sm" onClick={loadTasks}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTasks.map((task) => {
                  const status = getStatusConfig(task.status);
                  const StatusIcon = status.icon;
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                      onClick={() => setExecution(task)}
                    >
                      <StatusIcon className={`h-4 w-4 ${task.status === 'running' ? 'animate-spin' : ''}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{task.input}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(task.created_at).toLocaleString('zh-CN')}
                        </p>
                      </div>
                      {task.result && (
                        <p className="text-xs text-gray-500 truncate max-w-xs">{task.result}</p>
                      )}
                      <Badge className={status.color}>
                        {status.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
