'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Task = { id: string; text: string; done: boolean; date: string };
type Expense = { id: string; title: string; amount: number; category: string; date: string };
type NewsItem = { id: string; title: string; source: string; url: string; publishedAt: string };
const todayKey = () => new Date().toLocaleDateString('sv-SE');
const money = (value: number) => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(value);
const defaultTasks = ['晨间阅读 30 分钟', '完成今天最重要的一件事', '整理今日学习笔记'];

export default function Home() {
  const [active, setActive] = useState<'plan' | 'assets' | 'news'>('plan');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [taskText, setTaskText] = useState('');
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsStatus, setNewsStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [ready, setReady] = useState(false);
  const today = todayKey();
  useEffect(() => {
    const storedTasks = JSON.parse(localStorage.getItem('nuannuan-tasks') || '[]') as Task[];
    const todaysTasks = storedTasks.filter((task) => task.date === today);
    setTasks(todaysTasks.length ? todaysTasks : defaultTasks.map((text, i) => ({ id: `${today}-${i}`, text, done: false, date: today })));
    setExpenses(JSON.parse(localStorage.getItem('nuannuan-expenses') || '[]'));
    setReady(true);
  }, [today]);
  useEffect(() => { if (ready) localStorage.setItem('nuannuan-tasks', JSON.stringify(tasks)); }, [tasks, ready]);
  useEffect(() => { if (ready) localStorage.setItem('nuannuan-expenses', JSON.stringify(expenses)); }, [expenses, ready]);
  useEffect(() => {
    if (active !== 'news' || newsStatus !== 'idle') return;
    setNewsStatus('loading');
    fetch('/api/news').then(async (response) => {
      if (!response.ok) throw new Error('news unavailable');
      const data = await response.json() as { items: NewsItem[] };
      setNews(data.items);
      setNewsStatus('ready');
    }).catch(() => setNewsStatus('error'));
  }, [active, newsStatus]);
  const completed = tasks.filter((task) => task.done).length;
  const dailySpend = expenses.filter((item) => item.date === today).reduce((sum, item) => sum + item.amount, 0);
  const monthlySpend = useMemo(() => expenses.filter((item) => item.date.startsWith(today.slice(0, 7))).reduce((sum, item) => sum + item.amount, 0), [expenses, today]);
  const addTask = (event: FormEvent) => { event.preventDefault(); if (!taskText.trim()) return; setTasks((items) => [...items, { id: crypto.randomUUID(), text: taskText.trim(), done: false, date: today }]); setTaskText(''); };
  const addExpense = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); const amount = Number(form.get('amount')); if (!amount) return; setExpenses((items) => [{ id: crypto.randomUUID(), title: String(form.get('title') || '日常开销'), amount, category: String(form.get('category')), date: today }, ...items]); event.currentTarget.reset(); setExpenseOpen(false); };
  const dateText = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());
  return <main>
    <header className="topbar"><button className="brand" onClick={() => setActive('plan')} aria-label="返回首页"><span>暖</span>暖暖online</button><div className="top-actions"><button className="round-button" aria-label="消息">♡</button><div className="avatar">暖</div></div></header>
    <div className="shell"><aside className="sidebar">
      <div className="hello"><div className="sun">☀</div><p>今天也要</p><strong>闪闪发光呀</strong><small>{dateText}</small></div>
      <nav aria-label="主要功能">
        <button className={active === 'plan' ? 'active' : ''} onClick={() => setActive('plan')}><i>✓</i><span>每日计划<small>把今天过得充实</small></span></button>
        <button className={active === 'assets' ? 'active' : ''} onClick={() => setActive('assets')}><i>¥</i><span>资产管理<small>认真记录每一笔</small></span></button>
        <button className={active === 'news' ? 'active' : ''} onClick={() => setActive('news')}><i>◉</i><span>每日热点<small>看见更大的世界</small></span></button>
      </nav><blockquote>“每天进步一点点，<br />日子就会闪闪发光。”<span>— 暖暖</span></blockquote>
    </aside><section className="content">
      {active === 'plan' && <><div className="page-title"><div><p>DAILY PLAN</p><h1>今天，想成为更好的自己 ♡</h1><span>完成一件，勾掉一件。小小的坚持，也值得被看见。</span></div><div className="progress-ring" style={{ '--progress': `${tasks.length ? completed / tasks.length * 360 : 0}deg` } as React.CSSProperties}><b>{completed}/{tasks.length}</b><small>已完成</small></div></div>
        <form className="task-input" onSubmit={addTask}><span>＋</span><input value={taskText} onChange={(e) => setTaskText(e.target.value)} placeholder="写下今天想完成的一件事..." /><button>添加计划</button></form>
        <div className="task-list">{tasks.map((task, index) => <div className={`task ${task.done ? 'done' : ''}`} key={task.id}><button className="check" onClick={() => setTasks((items) => items.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))}>{task.done ? '✓' : ''}</button><div><small>今日计划 {String(index + 1).padStart(2, '0')}</small><p>{task.text}</p></div><button className="delete" onClick={() => setTasks((items) => items.filter((item) => item.id !== task.id))} aria-label={`删除${task.text}`}>×</button></div>)}{!tasks.length && <div className="empty">今天还没有计划，写下第一件想完成的事吧。</div>}</div><div className="reset-note">✦ 每天零点，计划会自动开启新的一页</div></>}
      {active === 'assets' && <><div className="page-title"><div><p>ASSET NOTE</p><h1>认真生活，也认真记账</h1><span>看清每一笔去向，让花钱变得更从容。</span></div><button className="pink-button" onClick={() => setExpenseOpen(!expenseOpen)}>＋ 记一笔</button></div>
        <div className="money-cards"><div><small>今日支出</small><strong>{money(dailySpend)}</strong><span>共 {expenses.filter(i => i.date === today).length} 笔记录</span></div><div><small>本月支出</small><strong>{money(monthlySpend)}</strong><span>{today.slice(0, 7).replace('-', ' 年 ')} 月</span></div><div><small>给自己的提醒</small><strong className="quote">花得明白<br/>才能存得安心</strong></div></div>
        {expenseOpen && <form className="expense-form" onSubmit={addExpense}><input name="title" placeholder="花在了哪里？" required/><input name="amount" type="number" min="0.01" step="0.01" placeholder="金额" required/><select name="category"><option>餐饮</option><option>交通</option><option>学习</option><option>购物</option><option>其他</option></select><button>保存记录</button></form>}
        <div className="section-label"><h2>最近记录</h2><span>数据只保存在你的设备上</span></div><div className="expense-list">{expenses.map(item => <div key={item.id}><span className="expense-icon">¥</span><p><strong>{item.title}</strong><small>{item.date} · {item.category}</small></p><b>-{money(item.amount)}</b><button onClick={() => setExpenses(items => items.filter(i => i.id !== item.id))}>×</button></div>)}{!expenses.length && <div className="empty">还没有开销记录，今天也要理性消费呀。</div>}</div></>}
      {active === 'news' && <><div className="page-title"><div><p>TODAY&apos;S NEWS</p><h1>今天，世界发生了什么？</h1><span>每天 10 条热点，几分钟了解值得关注的新鲜事。</span></div><div className="news-date"><b>{new Date().getDate()}</b><span>{new Intl.DateTimeFormat('zh-CN', { month: 'short' }).format(new Date())}</span></div></div>
        <div className="news-tip">☼ 今日热点来自 Google 新闻 · 每 15 分钟自动刷新</div>
        {newsStatus === 'loading' && <div className="empty">正在为你整理今天的热点…</div>}
        {newsStatus === 'error' && <div className="empty">热点暂时没有加载成功。<button className="retry" onClick={() => setNewsStatus('idle')}>重新加载</button></div>}
        {newsStatus === 'ready' && <div className="news-list">{news.map((item) => <article key={item.id}><b>{item.id}</b><div><span>{item.source}</span><h2>{item.title}</h2><p>{new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(item.publishedAt))}</p></div><a href={item.url} target="_blank" rel="noreferrer" aria-label={`查看新闻：${item.title}`}>↗</a></article>)}</div>}</>}
    </section></div>
  </main>;
}
