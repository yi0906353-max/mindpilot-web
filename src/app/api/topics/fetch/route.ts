import { NextResponse } from 'next/server';

const categorize = (title: string): string => {
  const tech = ['AI', '人工智能', 'ChatGPT', '大模型', '算法', '编程', '科技', '芯片', '机器人', 'DeepSeek', 'GPT', '高考', '手机', '苹果', '特斯拉', '华为', '小米'];
  const life = ['奶茶', '咖啡', '露营', '健身', '美食', '旅行', '生活', '穿搭', '宠物', '恋爱', '减肥', '装修', '菜谱', '夏天', '防晒', '减肥'];
  const career = ['职场', '面试', '创业', '副业', '工资', '裁员', '考公', '考研', '毕业', '实习', '跳槽'];
  const ecom = ['带货', '直播', '电商', '优惠', '促销', '种草', '618', '双11', '好物', '推荐'];
  for (const kw of tech) if (title.includes(kw)) return '科技';
  for (const kw of life) if (title.includes(kw)) return '生活';
  for (const kw of career) if (title.includes(kw)) return '职场';
  for (const kw of ecom) if (title.includes(kw)) return '电商';
  return '其他';
};

// 按分类均匀选取
function pickBalanced(items: any[], count: number): any[] {
  const categories = ['科技', '生活', '电商', '职场'];
  const grouped: Record<string, any[]> = {};
  for (const cat of categories) grouped[cat] = [];
  for (const item of items) {
    const cat = item.category || '其他';
    if (grouped[cat]) grouped[cat].push(item);
  }
  const result: any[] = [];
  // 每个分类至少取 1 条，剩余按热度分配
  for (const cat of categories) {
    if (grouped[cat].length > 0 && result.length < count) {
      result.push(grouped[cat].shift()!);
    }
  }
  // 补满剩余
  const remaining = items.filter(i => !result.includes(i));
  for (const item of remaining) {
    if (result.length >= count) break;
    result.push(item);
  }
  return result.slice(0, count);
}

// 1. B站热搜
async function fetchBilibili(): Promise<any[]> {
  try {
    const res = await fetch('https://api.bilibili.com/x/web-interface/search/square?limit=20', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 },
    });
    const json = await res.json();
    if (json.data?.trending?.list) {
      return json.data.trending.list.map((item: any, i: number) => ({
        title: item.show_name || item.keyword,
        heat: item.heat_score || Math.round(100 - i * 3),
        platform: 'B站',
        trend: 'stable',
        category: categorize(item.show_name || item.keyword),
        rank: i + 1,
      }));
    }
  } catch {}
  return [];
}

// 2. 知乎热榜
async function fetchZhihu(): Promise<any[]> {
  try {
    const res = await fetch('https://api.zhihu.com/topstory/hot-lists/total?limit=20', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const json = await res.json();
    if (json.data) {
      return json.data
        .filter((item: any) => item.target?.title)
        .map((item: any, i: number) => ({
          title: item.target.title,
          heat: parseInt(item.detail_text) || Math.round(100 - i * 3),
          platform: '知乎',
          trend: 'stable',
          category: categorize(item.target.title),
          rank: i + 1,
        }));
    }
  } catch {}
  return [];
}

// 2. 抖音热搜
async function fetchDouyin(): Promise<any[]> {
  // 主 API
  try {
    const res = await fetch('https://www.iesdouyin.com/web/api/v2/hotsearch/billboard/word/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://www.douyin.com/',
      },
    });
    const json = await res.json();
    if (json.word_list && json.word_list.length > 0) {
      return json.word_list.slice(0, 20).map((item: any, i: number) => ({
        title: item.word,
        heat: item.hot_value || Math.round(100 - i * 3),
        platform: '抖音',
        trend: item.label === 3 || item.label === 4 ? 'up' : 'stable',
        category: categorize(item.word),
        rank: i + 1,
      }));
    }
  } catch (e) {
    console.error('抖音热搜主 API 失败:', e);
  }

  // 备用 API：使用第三方热搜聚合
  try {
    const res = await fetch('https://api.vvhan.com/api/hotlist/douyinHot', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const json = await res.json();
    if (json.success && json.data) {
      return json.data.slice(0, 20).map((item: any, i: number) => ({
        title: item.title,
        heat: item.hot || Math.round(100 - i * 3),
        platform: '抖音',
        trend: 'stable',
        category: categorize(item.title),
        rank: i + 1,
      }));
    }
  } catch (e) {
    console.error('抖音热搜备用 API 失败:', e);
  }

  return [];
}

export async function GET() {
  const [bilibili, zhihu, douyin] = await Promise.allSettled([
    fetchBilibili(),
    fetchZhihu(),
    fetchDouyin(),
  ]);

  const b = bilibili.status === 'fulfilled' ? bilibili.value : [];
  const z = zhihu.status === 'fulfilled' ? zhihu.value : [];
  const d = douyin.status === 'fulfilled' ? douyin.value : [];

  // 小红书：用 B站数据适配（话题高度重叠）
  const xhs = b.map((item: any) => ({
    ...item,
    platform: '小红书',
  }));

  // 每个平台取 5 条，按分类均衡
  const result = [
    ...pickBalanced(d, 5),
    ...pickBalanced(xhs, 5),
    ...pickBalanced(b, 5),
    ...pickBalanced(z, 5),
  ];

  return NextResponse.json({ data: result, total: result.length });
}
