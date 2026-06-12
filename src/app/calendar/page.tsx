'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Calendar,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  X,
  Loader2,
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  color: string;
  conflict?: boolean;
}

const colorOptions = [
  { value: 'blue', label: '蓝色', class: 'bg-blue-500' },
  { value: 'green', label: '绿色', class: 'bg-green-500' },
  { value: 'red', label: '红色', class: 'bg-red-500' },
  { value: 'amber', label: '黄色', class: 'bg-amber-500' },
  { value: 'purple', label: '紫色', class: 'bg-purple-500' },
];

// 模拟日程数据
const defaultEvents: CalendarEvent[] = [
  { id: '1', title: '产品评审会', description: 'Q3 产品规划评审', start_time: '2026-06-12T10:00', end_time: '2026-06-12T11:30', color: 'blue' },
  { id: '2', title: '与张三午餐', description: '讨论合作方案', start_time: '2026-06-12T12:00', end_time: '2026-06-12T13:00', color: 'green' },
  { id: '3', title: '技术方案讨论', description: '微服务架构设计', start_time: '2026-06-12T14:00', end_time: '2026-06-12T15:00', color: 'purple', conflict: true },
  { id: '4', title: '客户演示', description: 'MindPilot 功能演示', start_time: '2026-06-12T15:30', end_time: '2026-06-12T16:30', color: 'amber' },
];

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>(defaultEvents);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', start_time: '', end_time: '', color: 'blue' });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // 检测冲突
  const detectConflicts = (evts: CalendarEvent[]) => {
    return evts.map((e, i) => {
      const start = new Date(e.start_time).getTime();
      const end = new Date(e.end_time).getTime();
      const hasConflict = evts.some((other, j) => {
        if (i === j) return false;
        const otherStart = new Date(other.start_time).getTime();
        const otherEnd = new Date(other.end_time).getTime();
        return start < otherEnd && end > otherStart;
      });
      return { ...e, conflict: hasConflict };
    });
  };

  // 按日期筛选
  const filteredEvents = events
    .filter(e => e.start_time.startsWith(selectedDate))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const conflictCount = filteredEvents.filter(e => e.conflict).length;

  const handleAdd = () => {
    if (!form.title || !form.start_time || !form.end_time) {
      toast.error('请填写完整信息');
      return;
    }
    const newEvent: CalendarEvent = {
      id: String(Date.now()),
      ...form,
    };
    const updated = detectConflicts([...events, newEvent]);
    setEvents(updated);
    setShowAdd(false);
    setForm({ title: '', description: '', start_time: '', end_time: '', color: 'blue' });
    toast.success('日程已添加');
  };

  const handleDelete = (id: string) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(detectConflicts(updated));
    toast.success('日程已删除');
  };

  const formatTime = (dt: string) => {
    const d = new Date(dt);
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              日程管理
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {filteredEvents.length} 个日程
              {conflictCount > 0 && (
                <span className="text-red-500 ml-2">⚠️ {conflictCount} 个冲突</span>
              )}
            </p>
          </div>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-2" />新建日程
          </Button>
        </div>

        {/* 日期选择 */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => {
            const d = new Date(selectedDate);
            d.setDate(d.getDate() - 1);
            setSelectedDate(d.toISOString().split('T')[0]);
          }}>← 前一天</Button>
          <Input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-48"
          />
          <Button variant="outline" size="sm" onClick={() => {
            const d = new Date(selectedDate);
            d.setDate(d.getDate() + 1);
            setSelectedDate(d.toISOString().split('T')[0]);
          }}>后一天 →</Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}>
            今天
          </Button>
        </div>

        {/* 冲突警告 */}
        {conflictCount > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-sm text-red-700">
              发现 {conflictCount} 个日程冲突，请调整时间
            </span>
          </div>
        )}

        {/* 日程列表 */}
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400">当天没有日程</p>
            </div>
          ) : (
            filteredEvents.map(event => (
              <Card key={event.id} className={`hover:shadow-sm transition-shadow ${event.conflict ? 'border-2 border-red-300' : ''}`}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-1 h-12 rounded-full ${colorOptions.find(c => c.value === event.color)?.class || 'bg-blue-500'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{event.title}</span>
                        {event.conflict && (
                          <Badge className="bg-red-100 text-red-700">
                            <AlertTriangle className="h-3 w-3 mr-1" />冲突
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{event.description}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTime(event.start_time)} - {formatTime(event.end_time)}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(event.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* 新建弹窗 */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>新建日程</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowAdd(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">标题</label>
                  <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="日程标题" />
                </div>
                <div>
                  <label className="text-sm font-medium">描述</label>
                  <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} placeholder="日程描述（选填）" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">开始时间</label>
                    <Input type="datetime-local" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">结束时间</label>
                    <Input type="datetime-local" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">颜色</label>
                  <div className="flex gap-2 mt-1">
                    {colorOptions.map(c => (
                      <button
                        key={c.value}
                        className={`w-8 h-8 rounded-full ${c.class} ${form.color === c.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                        onClick={() => setForm({...form, color: c.value})}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowAdd(false)}>取消</Button>
                  <Button onClick={handleAdd}>添加</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
