'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Task = { id: string; text: string; done: boolean; date: string };
type Expense = { id: string; title: string; amount: number; category: string; date: string };
type NewsItem = { id: string; title: string; source: string; url: string; publishedAt: string };
type FitnessItem = { id: 'dance' | 'vocal'; name: string; note: string; icon: string; done: boolean; date: string };
type Word = { word: string; phonetic: string; meaning: string; example: string };
type EnglishProgress = { date: string; learned: string[]; correct: string[] };
const todayKey = () => new Date().toLocaleDateString('sv-SE');
const money = (value: number) => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(value);
const newsPath = process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true' ? '/task-daily/news.json' : '/news.json';
const msUntilNextBeijingEight = () => {
  const now = new Date();
  const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  let next = Date.UTC(beijing.getUTCFullYear(), beijing.getUTCMonth(), beijing.getUTCDate(), 0, 0, 0);
  if (next <= now.getTime()) next += 24 * 60 * 60 * 1000;
  return next - now.getTime();
};
const defaultTasks = ['晨间阅读 30 分钟', '完成今天最重要的一件事', '整理今日学习笔记'];
const wordBank: Word[] = [
  { word: 'achieve', phonetic: '/əˈtʃiːv/', meaning: '实现；取得', example: 'Small steps help us achieve big goals.' },
  { word: 'balance', phonetic: '/ˈbæləns/', meaning: '平衡', example: 'Keep a balance between work and rest.' },
  { word: 'brave', phonetic: '/breɪv/', meaning: '勇敢的', example: 'Be brave enough to try something new.' },
  { word: 'calm', phonetic: '/kɑːm/', meaning: '平静的', example: 'Take a breath and stay calm.' },
  { word: 'create', phonetic: '/kriˈeɪt/', meaning: '创造', example: 'We can create a better routine.' },
  { word: 'curious', phonetic: '/ˈkjʊəriəs/', meaning: '好奇的', example: 'Stay curious about the world.' },
  { word: 'decide', phonetic: '/dɪˈsaɪd/', meaning: '决定', example: 'Decide what matters most today.' },
  { word: 'energy', phonetic: '/ˈenədʒi/', meaning: '精力；能量', example: 'A short walk gives me energy.' },
  { word: 'focus', phonetic: '/ˈfəʊkəs/', meaning: '专注', example: 'Focus on one task at a time.' },
  { word: 'gentle', phonetic: '/ˈdʒentl/', meaning: '温柔的', example: 'Be gentle with yourself.' },
  { word: 'habit', phonetic: '/ˈhæbɪt/', meaning: '习惯', example: 'Reading is a useful habit.' },
  { word: 'improve', phonetic: '/ɪmˈpruːv/', meaning: '改进；进步', example: 'Practice helps us improve.' },
  { word: 'journey', phonetic: '/ˈdʒɜːni/', meaning: '旅程', example: 'Learning is a lifelong journey.' },
  { word: 'kindness', phonetic: '/ˈkaɪndnəs/', meaning: '善意', example: 'A little kindness changes the day.' },
  { word: 'listen', phonetic: '/ˈlɪsn/', meaning: '倾听', example: 'Listen carefully before you answer.' },
  { word: 'moment', phonetic: '/ˈməʊmənt/', meaning: '时刻', example: 'Enjoy this quiet moment.' },
  { word: 'notice', phonetic: '/ˈnəʊtɪs/', meaning: '注意到', example: 'Notice the progress you make.' },
  { word: 'patient', phonetic: '/ˈpeɪʃnt/', meaning: '耐心的', example: 'Be patient with the process.' },
  { word: 'practice', phonetic: '/ˈpræktɪs/', meaning: '练习', example: 'Practice English every day.' },
  { word: 'prepare', phonetic: '/prɪˈpeə/', meaning: '准备', example: 'Prepare your plan the night before.' },
  { word: 'progress', phonetic: '/ˈprəʊɡres/', meaning: '进步；进展', example: 'Every effort is progress.' },
  { word: 'remember', phonetic: '/rɪˈmembə/', meaning: '记住', example: 'Remember to review new words.' },
  { word: 'simple', phonetic: '/ˈsɪmpl/', meaning: '简单的', example: 'Keep your daily plan simple.' },
  { word: 'steady', phonetic: '/ˈstedi/', meaning: '稳定的', example: 'Steady effort brings results.' },
  { word: 'strength', phonetic: '/streŋθ/', meaning: '力量', example: 'Consistency is a quiet strength.' },
  { word: 'support', phonetic: '/səˈpɔːt/', meaning: '支持', example: 'Good friends support each other.' },
  { word: 'value', phonetic: '/ˈvæljuː/', meaning: '重视；价值', example: 'Value your time and attention.' },
  { word: 'wonder', phonetic: '/ˈwʌndə/', meaning: '想知道；惊奇', example: 'I wonder what I can learn today.' },
  { word: 'confident', phonetic: '/ˈkɒnfɪdənt/', meaning: '自信的', example: 'Daily practice makes you confident.' },
  { word: 'discover', phonetic: '/dɪˈskʌvə/', meaning: '发现', example: 'Discover one new idea every day.' },
];
const dailyWordsFor = (date: string) => {
  const seed = date.split('-').reduce((sum, part) => sum * 31 + Number(part), 7);
  return [...wordBank].sort((a, b) => ((a.word.charCodeAt(0) * seed) % 97) - ((b.word.charCodeAt(0) * seed) % 97) || a.word.localeCompare(b.word)).slice(0, 10);
};

export default function Home() {
  const [active, setActive] = useState<'plan' | 'fitness' | 'english' | 'assets' | 'news'>('plan');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fitness, setFitness] = useState<FitnessItem[]>([]);
  const [englishProgress, setEnglishProgress] = useState<EnglishProgress>({ date: '', learned: [], correct: [] });
  const [englishMode, setEnglishMode] = useState<'learn' | 'spell'>('learn');
  const [spellIndex, setSpellIndex] = useState(0);
  const [spelling, setSpelling] = useState('');
  const [spellResult, setSpellResult] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [taskText, setTaskText] = useState('');
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsStatus, setNewsStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [newsRefreshTick, setNewsRefreshTick] = useState(0);
  const [ready, setReady] = useState(false);
  const today = todayKey();
  const dailyWords = useMemo(() => dailyWordsFor(today), [today]);
  useEffect(() => {
    const storedTasks = JSON.parse(localStorage.getItem('nuannuan-tasks') || '[]') as Task[];
    const todaysTasks = storedTasks.filter((task) => task.date === today);
    setTasks(todaysTasks.length ? todaysTasks : defaultTasks.map((text, i) => ({ id: `${today}-${i}`, text, done: false, date: today })));
    setExpenses(JSON.parse(localStorage.getItem('nuannuan-expenses') || '[]'));
    const storedFitness = JSON.parse(localStorage.getItem('nuannuan-fitness') || '[]') as FitnessItem[];
    const todaysFitness = storedFitness.filter((item) => item.date === today);
    setFitness(todaysFitness.length ? todaysFitness : [
      { id: 'dance', name: '跳舞', note: '舒展身体，跟着节奏快乐运动', icon: '♫', done: false, date: today },
      { id: 'vocal', name: '声乐', note: '练习气息和发声，找到自己的声音', icon: '♪', done: false, date: today },
    ]);
    const storedEnglish = JSON.parse(localStorage.getItem('nuannuan-english') || 'null') as EnglishProgress | null;
    setEnglishProgress(storedEnglish?.date === today ? storedEnglish : { date: today, learned: [], correct: [] });
    setReady(true);
  }, [today]);
  useEffect(() => { if (ready) localStorage.setItem('nuannuan-tasks', JSON.stringify(tasks)); }, [tasks, ready]);
  useEffect(() => { if (ready) localStorage.setItem('nuannuan-expenses', JSON.stringify(expenses)); }, [expenses, ready]);
  useEffect(() => { if (ready) localStorage.setItem('nuannuan-fitness', JSON.stringify(fitness)); }, [fitness, ready]);
  useEffect(() => { if (ready) localStorage.setItem('nuannuan-english', JSON.stringify(englishProgress)); }, [englishProgress, ready]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNews([]);
      setNewsStatus('idle');
      setNewsRefreshTick((tick) => tick + 1);
    }, msUntilNextBeijingEight());
    return () => window.clearTimeout(timer);
  }, [newsRefreshTick]);
  useEffect(() => {
    if (active !== 'news' || newsStatus !== 'idle') return;
    setNewsStatus('loading');
    fetch(`${newsPath}?v=${newsRefreshTick}`).then(async (response) => {
      if (!response.ok) throw new Error('news unavailable');
      const data = await response.json() as { items: NewsItem[] };
      setNews(data.items);
      setNewsStatus('ready');
    }).catch(() => setNewsStatus('error'));
  }, [active, newsStatus, newsRefreshTick]);
  const completed = tasks.filter((task) => task.done).length;
  const dailySpend = expenses.filter((item) => item.date === today).reduce((sum, item) => sum + item.amount, 0);
  const monthlySpend = useMemo(() => expenses.filter((item) => item.date.startsWith(today.slice(0, 7))).reduce((sum, item) => sum + item.amount, 0), [expenses, today]);
  const addTask = (event: FormEvent) => { event.preventDefault(); if (!taskText.trim()) return; setTasks((items) => [...items, { id: crypto.randomUUID(), text: taskText.trim(), done: false, date: today }]); setTaskText(''); };
  const addExpense = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); const amount = Number(form.get('amount')); if (!amount) return; setExpenses((items) => [{ id: crypto.randomUUID(), title: String(form.get('title') || '日常开销'), amount, category: String(form.get('category')), date: today }, ...items]); event.currentTarget.reset(); setExpenseOpen(false); };
  const speak = (word: string) => { if (!('speechSynthesis' in window)) return; window.speechSynthesis.cancel(); const voice = new SpeechSynthesisUtterance(word); voice.lang = 'en-US'; voice.rate = 0.82; window.speechSynthesis.speak(voice); };
  const checkSpelling = (event: FormEvent) => { event.preventDefault(); if (!spelling.trim()) return; const current = dailyWords[spellIndex]; const isCorrect = spelling.trim().toLowerCase() === current.word.toLowerCase(); setSpellResult(isCorrect ? 'correct' : 'wrong'); if (isCorrect) setEnglishProgress(progress => ({ ...progress, correct: Array.from(new Set([...progress.correct, current.word])) })); };
  const nextWord = () => { setSpellIndex(index => (index + 1) % dailyWords.length); setSpelling(''); setSpellResult('idle'); };
  const dateText = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());
  return <main>
    <header className="topbar"><button className="brand" onClick={() => setActive('plan')} aria-label="返回首页"><span>暖</span>暖暖online</button><div className="top-actions"><button className="round-button" aria-label="消息">♡</button><div className="avatar">暖</div></div></header>
    <div className="shell"><aside className="sidebar">
      <div className="hello"><div className="sun">☀</div><p>今天也要</p><strong>闪闪发光呀</strong><small>{dateText}</small></div>
      <nav aria-label="主要功能">
        <button className={active === 'plan' ? 'active' : ''} onClick={() => setActive('plan')}><i>✓</i><span>今日计划<small>把今天过得充实</small></span></button>
        <button className={active === 'fitness' ? 'active' : ''} onClick={() => setActive('fitness')}><i>♬</i><span>健身打卡<small>让身体充满活力</small></span></button>
        <button className={active === 'english' ? 'active' : ''} onClick={() => setActive('english')}><i>Aa</i><span>英语学习<small>每天掌握10个单词</small></span></button>
        <button className={active === 'assets' ? 'active' : ''} onClick={() => setActive('assets')}><i>¥</i><span>资产管理<small>认真记录每一笔</small></span></button>
        <button className={active === 'news' ? 'active' : ''} onClick={() => setActive('news')}><i>◉</i><span>今日热点<small>看见更大的世界</small></span></button>
      </nav><blockquote>“每天进步一点点，<br />日子就会闪闪发光。”<span>— 暖暖</span></blockquote>
    </aside><section className="content">
      {active === 'plan' && <><div className="page-title"><div><p>DAILY PLAN</p><h1>今天，想成为更好的自己 ♡</h1><span>完成一件，勾掉一件。小小的坚持，也值得被看见。</span></div><div className="progress-ring" style={{ '--progress': `${tasks.length ? completed / tasks.length * 360 : 0}deg` } as React.CSSProperties}><b>{completed}/{tasks.length}</b><small>已完成</small></div></div>
        <form className="task-input" onSubmit={addTask}><span>＋</span><input value={taskText} onChange={(e) => setTaskText(e.target.value)} placeholder="写下今天想完成的一件事..." /><button>添加计划</button></form>
        <div className="task-list">{tasks.map((task, index) => <div className={`task ${task.done ? 'done' : ''}`} key={task.id}><button className="check" onClick={() => setTasks((items) => items.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))}>{task.done ? '✓' : ''}</button><div><small>今日计划 {String(index + 1).padStart(2, '0')}</small><p>{task.text}</p></div><button className="delete" onClick={() => setTasks((items) => items.filter((item) => item.id !== task.id))} aria-label={`删除${task.text}`}>×</button></div>)}{!tasks.length && <div className="empty">今天还没有计划，写下第一件想完成的事吧。</div>}</div><div className="reset-note">✦ 每天零点，计划会自动开启新的一页</div></>}
      {active === 'fitness' && <><div className="page-title"><div><p>FITNESS CHECK-IN</p><h1>今天，也要元气满满 ♡</h1><span>动一动、唱一唱，用喜欢的方式照顾自己的身体。</span></div><div className="progress-ring" style={{ '--progress': `${fitness.filter(item => item.done).length / 2 * 360}deg` } as React.CSSProperties}><b>{fitness.filter(item => item.done).length}/2</b><small>已打卡</small></div></div>
        <div className="fitness-grid">{fitness.map((item) => <article className={item.done ? 'checked' : ''} key={item.id}><div className="fitness-icon">{item.icon}</div><div><small>今日运动</small><h2>{item.name}</h2><p>{item.note}</p></div><button onClick={() => setFitness(items => items.map(current => current.id === item.id ? { ...current, done: !current.done } : current))}>{item.done ? '✓ 已打卡' : '打卡'}</button></article>)}</div>
        <div className="fitness-quote">“不是为了变成别人，而是为了成为更有活力的自己。”</div><div className="reset-note">✦ 健身打卡每天零点自动重置</div></>}
      {active === 'english' && <><div className="page-title"><div><p>DAILY ENGLISH</p><h1>每天 10 个单词，慢慢变厉害 ♡</h1><span>先听、再记、最后拼写，把今天的单词真正变成自己的。</span></div><div className="progress-ring" style={{ '--progress': `${englishProgress.learned.length / 10 * 360}deg` } as React.CSSProperties}><b>{englishProgress.learned.length}/10</b><small>已学习</small></div></div>
        <div className="english-tabs" role="tablist" aria-label="英语学习模式"><button className={englishMode === 'learn' ? 'active' : ''} onClick={() => setEnglishMode('learn')}>单词学习</button><button className={englishMode === 'spell' ? 'active' : ''} onClick={() => { setEnglishMode('spell'); setSpellResult('idle'); setSpelling(''); }}>拼写练习 <span>{englishProgress.correct.length}/10</span></button></div>
        {englishMode === 'learn' && <div className="word-grid">{dailyWords.map((item, index) => { const learned = englishProgress.learned.includes(item.word); return <article className={learned ? 'learned' : ''} key={item.word}><div className="word-number">{String(index + 1).padStart(2, '0')}</div><div className="word-main"><div><h2>{item.word}</h2><button className="sound-button" onClick={() => speak(item.word)} aria-label={`朗读 ${item.word}`}>▶</button></div><span>{item.phonetic}</span><strong>{item.meaning}</strong><p>{item.example}</p></div><button className="learn-button" onClick={() => setEnglishProgress(progress => ({ ...progress, learned: learned ? progress.learned.filter(word => word !== item.word) : [...progress.learned, item.word] }))}>{learned ? '✓ 已学会' : '标记学会'}</button></article>; })}</div>}
        {englishMode === 'spell' && <div className="spell-card"><div className="spell-progress"><span>拼写 {spellIndex + 1} / 10</span><div><i style={{ width: `${(spellIndex + 1) * 10}%` }} /></div></div><button className="spell-sound" onClick={() => speak(dailyWords[spellIndex].word)}><b>▶</b><span>播放单词发音</span></button><small>根据释义，写出正确的英文单词</small><h2>{dailyWords[spellIndex].meaning}</h2><form onSubmit={checkSpelling}><input className={spellResult} value={spelling} onChange={(event) => { setSpelling(event.target.value); setSpellResult('idle'); }} placeholder="在这里输入英文拼写" autoComplete="off" autoCapitalize="none" spellCheck={false} aria-label="输入英文拼写" /><button type="submit">检查拼写</button></form>{spellResult === 'correct' && <div className="spell-feedback correct">太棒了，拼写正确！</div>}{spellResult === 'wrong' && <div className="spell-feedback wrong">再试一次吧。提示：首字母是 <b>{dailyWords[spellIndex].word[0].toUpperCase()}</b></div>}<button className="next-word" onClick={nextWord}>下一个单词 →</button></div>}
        <div className="reset-note">✦ 每天零点自动更换新一组单词，学习记录同步重置</div></>}
      {active === 'assets' && <><div className="page-title"><div><p>ASSET NOTE</p><h1>认真生活，也认真记账</h1><span>看清每一笔去向，让花钱变得更从容。</span></div><button className="pink-button" onClick={() => setExpenseOpen(!expenseOpen)}>＋ 记一笔</button></div>
        <div className="money-cards"><div><small>今日支出</small><strong>{money(dailySpend)}</strong><span>共 {expenses.filter(i => i.date === today).length} 笔记录</span></div><div><small>本月支出</small><strong>{money(monthlySpend)}</strong><span>{today.slice(0, 7).replace('-', ' 年 ')} 月</span></div><div><small>给自己的提醒</small><strong className="quote">花得明白<br/>才能存得安心</strong></div></div>
        {expenseOpen && <form className="expense-form" onSubmit={addExpense}><input name="title" placeholder="花在了哪里？" required/><input name="amount" type="number" min="0.01" step="0.01" placeholder="金额" required/><select name="category"><option>餐饮</option><option>交通</option><option>学习</option><option>购物</option><option>其他</option></select><button>保存记录</button></form>}
        <div className="section-label"><h2>最近记录</h2><span>数据只保存在你的设备上</span></div><div className="expense-list">{expenses.map(item => <div key={item.id}><span className="expense-icon">¥</span><p><strong>{item.title}</strong><small>{item.date} · {item.category}</small></p><b>-{money(item.amount)}</b><button onClick={() => setExpenses(items => items.filter(i => i.id !== item.id))}>×</button></div>)}{!expenses.length && <div className="empty">还没有开销记录，今天也要理性消费呀。</div>}</div></>}
      {active === 'news' && <><div className="page-title"><div><p>TODAY&apos;S NEWS</p><h1>今天，世界发生了什么？</h1><span>每天 10 条热点，几分钟了解值得关注的新鲜事。</span></div><div className="news-date"><b>{new Date().getDate()}</b><span>{new Intl.DateTimeFormat('zh-CN', { month: 'short' }).format(new Date())}</span></div></div>
        <div className="news-tip">☼ 今日热点来自 Google 新闻 · 每天早晨 8:00 更新</div>
        {newsStatus === 'loading' && <div className="empty">正在为你整理今天的热点…</div>}
        {newsStatus === 'error' && <div className="empty">热点暂时没有加载成功。<button className="retry" onClick={() => setNewsStatus('idle')}>重新加载</button></div>}
        {newsStatus === 'ready' && <div className="news-list">{news.map((item) => <article key={item.id}><b>{item.id}</b><div><span>{item.source}</span><h2>{item.title}</h2><p>{new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(item.publishedAt))}</p></div><a href={item.url} target="_blank" rel="noreferrer" aria-label={`查看新闻：${item.title}`}>↗</a></article>)}</div>}</>}
    </section></div>
  </main>;
}
