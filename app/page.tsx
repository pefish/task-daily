'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Task = { id: string; text: string; done: boolean; date: string };
type Expense = { id: string; title: string; amount: number; category: string; date: string };
const todayKey = () => new Date().toLocaleDateString('sv-SE');
const money = (value: number) => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(value);
const news = [
  ['01', '科技', '新一代人工智能工具加速走进日常工作流', '从写作、设计到数据分析，个人效率工具持续迎来更新。'],
  ['02', '财经', '消费市场释放新活力，服务消费关注度上升', '文旅、健康与数字服务成为近期讨论热点。'],
  ['03', '社会', '多地推出便民新举措，公共服务体验升级', '线上办理与跨区域协同进一步覆盖高频事项。'],
  ['04', '教育', '终身学习成为职场人的年度关键词', '微技能、项目制学习和实践型课程受到关注。'],
  ['05', '健康', '规律睡眠与轻量运动再次登上健康话题榜', '专家建议从可坚持的小习惯开始改善状态。'],
  ['06', '文化', '博物馆夜游与城市文化路线持续升温', '年轻人正在用新的方式打开传统文化。'],
  ['07', '职场', '弹性工作与专注力管理引发讨论', '更清晰的目标拆分成为提升效率的关键。'],
  ['08', '生活', '低成本整理法走红，给生活做一次减法', '从桌面到数字文件，轻量整理带来秩序感。'],
  ['09', '环保', '绿色出行与循环消费融入更多生活场景', '可重复使用和旧物交换成为新的生活选择。'],
  ['10', '趋势', '个人数字工具更重视数据隐私与长期陪伴', '简单、可信、可持续使用成为产品新方向。'],
];
const defaultTasks = ['晨间阅读 30 分钟', '完成今天最重要的一件事', '整理今日学习笔记'];

export default function Home() {
  const [active, setActive] = useState<'plan' | 'assets' | 'news'>('plan');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [taskText, setTaskText] = useState('');
  const [expenseOpen, setExpenseOpen] = useState(false);
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
        <div className="news-tip">☼ 今日热点已为你整理 · 内容为演示数据，接入新闻接口后可每日自动更新</div><div className="news-list">{news.map(([num, category, title, desc]) => <article key={num}><b>{num}</b><div><span>{category}</span><h2>{title}</h2><p>{desc}</p></div><button aria-label="查看新闻">↗</button></article>)}</div></>}
    </section></div>
  </main>;
}
