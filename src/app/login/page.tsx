'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain, Sparkles, Shield, Zap, Mail, Phone, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

type AuthTab = 'login' | 'register';
type LoginMethod = 'email' | 'phone';

export default function LoginPage() {
  const { login } = useAuth();
  const [authTab, setAuthTab] = useState<AuthTab>('login');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [needsCode, setNeedsCode] = useState(false);

  // 格式校验
  const validateInput = (): string | null => {
    if (loginMethod !== 'phone') {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(email)) return '请输入真实的邮箱地址，如 your@email.com';
      return null;
    }
    if (loginMethod === 'phone') {
      const re = /^1[3-9]\d{9}$/;
      if (!re.test(phone)) return '请输入 11 位真实手机号，如 13800138000';
      return null;
    }
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateInput();
    if (err) { setError(err); return; }
    setLoading(true);
    setError('');
    try {
      const loginEmail = loginMethod === 'phone' ? `${phone}@phone.mindpilot` : email;
      await login(loginEmail, password);
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const [devCode, setDevCode] = useState('');

  const handleSendCode = async () => {
    const account = loginMethod === 'phone' ? phone : email;
    if (!account) { setError(`请输入${loginMethod === 'phone' ? '手机号' : '邮箱'}`); return; }
    setLoading(true);
    setError('');
    setDevCode('');
    try {
      const res = await fetch('/api/v1/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account }),
      });
      const data = await res.json();
      if (data.dev_code) {
        setDevCode(data.dev_code);
        toast.success(`验证码已发送，开发模式验证码：${data.dev_code}`);
      } else {
        toast.success('验证码已发送');
      }
      let timer = 60;
      setCountdown(timer);
      const interval = setInterval(() => { timer--; setCountdown(timer); if (timer <= 0) clearInterval(interval); }, 1000);
    } catch {
      setError('发送验证码失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateInput();
    if (err) { setError(err); return; }
    if (!password || password.length < 6) { setError('密码至少 6 位'); return; }
    const account = loginMethod === 'phone' ? `${phone}@phone.mindpilot` : email;
    if (!needsCode) { setNeedsCode(true); handleSendCode(); return; }
    if (!code) { setError('请输入验证码'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: account,
          password,
          display_name: displayName || account.split('@')[0],
          code,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '注册失败'); return; }
      await login(account, password);
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white p-12 flex-col justify-center relative overflow-hidden">
        {/* 装饰性渐变圆 */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="max-w-md relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <Brain className="h-10 w-10" /><span className="text-2xl font-bold">MindPilot</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">你的 AI 个人助理平台</h1>
          <p className="text-blue-100 text-lg mb-10">管理消息、创作内容、自动推送 — 一个平台搞定所有事。</p>
          <div className="space-y-6">
            {[
              { icon: Sparkles, title: 'AI 内容创作', desc: '一键生成多平台内容' },
              { icon: Zap, title: '智能推送', desc: '钉钉/微信自动推送' },
              { icon: Shield, title: '安全认证', desc: '验证码登录' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center"><f.icon className="h-5 w-5" /></div>
                <div><p className="font-medium">{f.title}</p><p className="text-sm text-blue-200">{f.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6 md:mb-8">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">MindPilot</span>
          </div>

          <div className="flex gap-2 mb-6">
            <Button variant={authTab === 'login' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => { setAuthTab('login'); setError(''); }}>
              登录
            </Button>
            <Button variant={authTab === 'register' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => { setAuthTab('register'); setError(''); }}>
              <UserPlus className="h-4 w-4 mr-1" />注册
            </Button>
          </div>

          <h2 className="text-2xl font-bold mb-2">{authTab === 'login' ? '欢迎回来' : '创建账号'}</h2>
          <p className="text-gray-500 mb-6">{authTab === 'login' ? '登录你的账号以继续' : '注册新账号开始使用'}</p>

          {/* 登录方式 */}
          {authTab === 'login' && (
            <div className="flex gap-2 mb-6">
              <Button variant={loginMethod === 'email' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setLoginMethod('email')}><Mail className="h-4 w-4 mr-1" />邮箱</Button>
              <Button variant={loginMethod === 'phone' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setLoginMethod('phone')}><Phone className="h-4 w-4 mr-1" />手机</Button>
            </div>
          )}

          {/* 注册方式 */}
          {authTab === 'register' && (
            <div className="flex gap-2 mb-6">
              <Button variant={loginMethod === 'email' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setLoginMethod('email')}><Mail className="h-4 w-4 mr-1" />邮箱注册</Button>
              <Button variant={loginMethod === 'phone' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setLoginMethod('phone')}><Phone className="h-4 w-4 mr-1" />手机注册</Button>
            </div>
          )}

          {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200 mb-4">{error}</div>}

          {/* ===== 登录表单 ===== */}
          {authTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {loginMethod === 'email' ? (
                <div className="space-y-2"><Label>邮箱</Label><Input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-11" /></div>
              ) : (
                <div className="space-y-2"><Label>手机号</Label><Input type="tel" placeholder="13800138000" value={phone} onChange={e => setPhone(e.target.value)} required className="h-11" /></div>
              )}
              <div className="space-y-2"><Label>密码</Label><Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="h-11" /></div>
              <Button type="submit" className="w-full h-11" disabled={loading}>{loading ? '登录中...' : '登录'}</Button>
            </form>
          ) : null}

          {/* ===== 注册表单 ===== */}
          {authTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2"><Label>昵称</Label><Input placeholder="你的名字" value={displayName} onChange={e => setDisplayName(e.target.value)} className="h-11" /></div>
              {loginMethod === 'phone' ? (
                <div className="space-y-2"><Label>手机号</Label><Input type="tel" placeholder="13800138000" value={phone} onChange={e => setPhone(e.target.value)} required className="h-11" /></div>
              ) : (
                <div className="space-y-2"><Label>邮箱</Label><Input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-11" /></div>
              )}
              <div className="space-y-2"><Label>密码</Label><Input type="password" placeholder="至少 6 位" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="h-11" /></div>
              <Button type="submit" className="w-full h-11" disabled={loading}>{loading ? '注册中...' : needsCode ? `验证并注册 (${countdown > 0 ? `${countdown}s` : ''})` : '发送验证码'}</Button>
              {needsCode && (
                <div className="space-y-3">
                  {devCode && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                      <p className="text-xs text-green-600 mb-1">📱 开发模式验证码</p>
                      <p className="text-2xl font-bold text-green-700 tracking-widest">{devCode}</p>
                      <button type="button" className="text-xs text-blue-500 hover:underline mt-1" onClick={() => setCode(devCode)}>点击填入</button>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>验证码</Label>
                    <Input placeholder="6 位验证码" value={code} onChange={e => setCode(e.target.value)} maxLength={6} className="h-11 text-center text-lg tracking-widest" autoFocus />
                  </div>
                  <button type="button" className="text-xs text-blue-600 hover:underline" onClick={handleSendCode} disabled={countdown > 0}>{countdown > 0 ? `${countdown}s 后可重发` : '重新发送'}</button>
                </div>
              )}
            </form>
          )}

          <p className="text-center text-xs text-gray-400 mt-8">MindPilot © 2026 · Powered by AI</p>
        </div>
      </div>
    </div>
  );
}
