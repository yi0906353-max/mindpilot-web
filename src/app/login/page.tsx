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
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 text-white p-12 flex-col justify-center">
        <div className="max-w-md">
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

          {/* OAuth */}
          {authTab === 'login' && (
            <>
              <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">或使用第三方登录</span></div></div>
              <div className="space-y-3">
                <Button variant="outline" className="w-full h-11" onClick={() => window.location.href = '/api/v1/auth/oauth/github/callback'}>
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>GitHub 登录
                </Button>
                <Button variant="outline" className="w-full h-11" onClick={() => window.location.href = '/api/v1/auth/oauth/google/callback'}>
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>Google 登录
                </Button>
              </div>
            </>
          )}

          <p className="text-center text-xs text-gray-400 mt-8">MindPilot © 2026 · Powered by AI</p>
        </div>
      </div>
    </div>
  );
}
