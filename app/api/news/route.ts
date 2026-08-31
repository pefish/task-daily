type NewsItem = { id: string; title: string; source: string; url: string; publishedAt: string };

const FEED_URL = 'https://news.google.com/rss?hl=zh-CN&gl=CN&ceid=CN:zh-Hans';

function decodeXml(value: string) {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function field(block: string, name: string) {
  return decodeXml(block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1]?.trim() || '');
}

function parseFeed(xml: string): NewsItem[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 10).map((match, index) => {
    const block = match[1];
    const rawTitle = field(block, 'title');
    const source = field(block, 'source') || rawTitle.split(' - ').at(-1) || 'Google 新闻';
    const suffix = ` - ${source}`;
    return { id: String(index + 1).padStart(2, '0'), title: rawTitle.endsWith(suffix) ? rawTitle.slice(0, -suffix.length) : rawTitle, source, url: field(block, 'link'), publishedAt: field(block, 'pubDate') };
  }).filter((item) => item.title && item.url);
}

export async function GET() {
  try {
    const response = await fetch(FEED_URL, { headers: { 'User-Agent': 'NuannuanOnline/1.0' }, next: { revalidate: 900 } });
    if (!response.ok) throw new Error(`News feed returned ${response.status}`);
    const items = parseFeed(await response.text());
    if (!items.length) throw new Error('News feed was empty');
    return Response.json({ items, provider: 'Google 新闻', updatedAt: new Date().toISOString() });
  } catch {
    return Response.json({ items: [], error: '热点暂时没有加载成功，请稍后再试。' }, { status: 503 });
  }
}
