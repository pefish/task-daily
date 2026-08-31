import { writeFile } from 'node:fs/promises';

const feedUrl = 'https://news.google.com/rss?hl=zh-CN&gl=CN&ceid=CN:zh-Hans';

const decodeXml = (value) => value
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const field = (block, name) => decodeXml(
  block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1]?.trim() || '',
);

const response = await fetch(feedUrl, { headers: { 'User-Agent': 'NuannuanOnline/1.0' } });
if (!response.ok) throw new Error(`Google News returned ${response.status}`);
const xml = await response.text();
const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 10).map((match, index) => {
  const block = match[1];
  const rawTitle = field(block, 'title');
  const source = field(block, 'source') || rawTitle.split(' - ').at(-1) || 'Google 新闻';
  const suffix = ` - ${source}`;
  return {
    id: String(index + 1).padStart(2, '0'),
    title: rawTitle.endsWith(suffix) ? rawTitle.slice(0, -suffix.length) : rawTitle,
    source,
    url: field(block, 'link'),
    publishedAt: field(block, 'pubDate'),
  };
}).filter((item) => item.title && item.url);

if (!items.length) throw new Error('Google News returned no items');
await writeFile('public/news.json', `${JSON.stringify({
  items,
  provider: 'Google 新闻',
  updatedAt: new Date().toISOString(),
  nextRefresh: '08:00 Asia/Shanghai',
}, null, 2)}\n`);
console.log(`Generated ${items.length} news items.`);
