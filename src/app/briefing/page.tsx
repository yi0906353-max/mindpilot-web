'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { briefingApi } from '@/lib/api';
import {
  Calendar,
  CheckCircle2,
  Clock,
  RefreshCw,
  Zap,
  ListTodo,
  MessageSquare,
} from 'lucide-react';

interface BriefingData {
  id: string;
  title: string;
  summary: string;
  top_tasks: string[];
  messages_count: number;
  unread_highlights: Array<{
    source: string;
    sender: string;
    summary: string;
    priority: number;
  }>;
  created_at: string;
}

export default function BriefingPage() {
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchBriefing = async () => {
    setLoading(true);
    try {
      const { data } = await briefingApi.getLatest();
      setBriefing(data);
    } catch (error) {
      console.error('Failed to fetch briefing:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateBriefing = async () => {
    setGenerating(true);
    try {
      const { data } = await briefingApi.run();
      setBriefing(data);
    } catch (error) {
      console.error('Failed to generate briefing:', error);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">每日简报</h1>
          <Button
            onClick={generateBriefing}
            disabled={generating}
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                立即生成
              </>
            )}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : !briefing ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">还没有简报</p>
              <Button onClick={generateBriefing} disabled={generating}>
                <Zap className="h-4 w-4 mr-2" />
                生成第一份简报
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* 今日三件事 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-blue-600" />
                  今日三件事
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {briefing.top_tasks.map((task, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-sm">{task}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 消息摘要 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  消息概览
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-gray-600">未读消息</span>
                    <Badge variant="secondary">{briefing.messages_count} 条</Badge>
                  </div>

                  {briefing.unread_highlights && briefing.unread_highlights.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">重要消息：</p>
                      {briefing.unread_highlights.slice(0, 3).map((msg, index) => (
                        <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                          <span className="font-medium">{msg.sender}</span>
                          <span className="text-gray-400 mx-1">·</span>
                          <span className="text-gray-600">{msg.source}</span>
                          <p className="text-gray-500 mt-1">{msg.summary}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 简报摘要 */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  {briefing.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-600 whitespace-pre-wrap">{briefing.summary}</p>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  生成于 {new Date(briefing.created_at).toLocaleString('zh-CN')}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
