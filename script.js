// 时钟与欢迎词逻辑
function updateUI() {
    const now = new Date();
    const hour = now.getHours();
    const name = localStorage.getItem('customName') || "SOLDIER";
    
    // 1. 更新时钟
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                    now.getMinutes().toString().padStart(2, '0');
    document.getElementById('clock').textContent = timeStr;

    // 2. 更新欢迎语 (BF1 风格)
    let greeting = "午安";
    if(hour < 6) greeting = "深夜";
    else if(hour < 12) greeting = "早安";
    else if(hour < 18) greeting = "午安";
    else greeting = "晚安";

    document.getElementById('welcome-text').textContent = `${name}, ${greeting}。`;
}

// 保持时钟跳动
setInterval(updateUI, 1000);
updateUI();

// 搜索逻辑
const searchForm = document.getElementById('search-form');
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = document.getElementById('search-input').value;
    window.location.href = `https://www.bing.com/search?q=${encodeURIComponent(val)}`;
});

// 1. 设置图片配置
const totalBackgrounds = 20; // 假设你有 1.jpg 到 14.jpg
const bgPath = 'img/';

function setRandomBackground() {
    // 2. 生成随机数字
    const randomIndex = Math.floor(Math.random() * totalBackgrounds) + 1;
    
    // 3. 组合路径 (确保后缀名和你文件夹里的一致，比如 .jpg 或 .webp)
    const imgUrl = `${bgPath}${randomIndex}.jpg`;

    // 4. 应用到 body
    // 我们加上一层从透明到深色的渐变，增加战地1那种深邃感
    document.body.style.backgroundImage = `
        linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.2)), 
        url('${imgUrl}')
    `;
}

// 5. 页面加载时执行
setRandomBackground();

// (可选) 如果你想让它每隔 5 分钟自动换一张：
// setInterval(setRandomBackground, 300000);

async function refreshBiliCover() {
    const card = document.getElementById('bili-card');
    const title = document.getElementById('bili-title');

    // ========== 第 1 步：先显示缓存内容（如果有），秒开 ==========
    const cached = loca*************tem('bili_cache');
    if (cached) {
        try {
            const data = JSON.parse(cached);
            title.textContent = data.title;
            card.style.backgroundImage = data.bg;
        } catch (_) { /* 缓存坏了就当没有 */ }
    }

    // ========== 第 2 步：后台获取最新数据 ==========
    try {
        // 备选代理列表，一个不行自动换下一个
        const proxies = [
            (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
            (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
            (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        ];

        const biliUrl = 'https://api.bilibili.com/x/web-interface/popular?ps=20';
        let data = null;

        for (const buildProxy of proxies) {
            try {
                const resp = await fetch(buildProxy(biliUrl), { signal: AbortSignal.timeout(5000) });
                if (!resp.ok) continue;
                const json = await resp.json();
                const parsed = json.contents ? JSON.parse(json.contents) : json;
                if (parsed.code === 0) { data = parsed; break; }
            } catch (_) {
                continue; // 这个代理不行，换下一个
            }
        }

        if (!data) throw new Error('所有代理均失败');

        const list = data.data.list;
        const video = list[Math.floor(Math.random() * list.length)];
        const videoTitle = video.title;

        // ========== 第 3 步：先上基础渐变，用户立刻能看到字 ==========
        const fallbackBg = 'linear-gradient(145deg, #cc6699 0%, #1a0a1a 70%)';
        card.style.backgroundImage = fallbackBg;
        title.textContent = videoTitle;

        // ========== 第 4 步：图片后台预加载，不阻塞显示 ==========
        const imgUrl = video.pic.replace(/https?:\/\//, '');
        const proxiedImg = `https://images.weserv.nl/?url=${encodeURIComponent(imgUrl)}`;

        const img = new Image();
        img.onload = () => {
            // 图片加载成功 → 换上带图片的背景
            card.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url('${proxiedImg}')`;
        };
        // 图片加载失败的话…卡面还是那个渐变，不会空白
        img.src = proxiedImg;

        // ========== 第 5 步：缓存本次结果 ==========
        loca*************tem('bili_cache', JSON.stringify({
            title: videoTitle,
            bg: card.style.backgroundImage,
            time: Date.now()
        }));

    } catch (err) {
        console.error('B站情报获取失败:', err);
        // 如果有缓存内容，不覆盖——用户已经看到缓存内容了
        if (!cached) {
            title.textContent = '无法连接至情报总部';
            card.style.backgroundImage = 'linear-gradient(145deg, #2d1b00, #0d1117)';
        }
    }
}

// 立即执行一次
refreshBiliCover();
// 每 60 秒换一个热门封面，保持新鲜感
setInterval(refreshBiliCover, 60000);

// =============================================
// GitHub 趋势仓库 — 自生成预览卡片
// =============================================

/** 编程语言 -> GitHub 官方颜色 */
const LANGUAGE_COLORS = {
    'JavaScript': '#f1e05a',  'TypeScript': '#3178c6',
    'Python': '#3572a5',      'Go': '#00add8',
    'Rust': '#dea584',        'Java': '#b07219',
    'C++': '#f34b7d',         'C': '#555555',
    'C#': '#178600',          'Ruby': '#701516',
    'PHP': '#4f5d95',         'Swift': '#f05138',
    'Kotlin': '#a97bff',      'Dart': '#00b4ab',
    'Shell': '#89e051',       'HTML': '#e34c26',
    'CSS': '#563d7c',         'Vue': '#41b883',
    'Solidity': '#aa6746',    'Zig': '#ec915c',
    'Lua': '#000080',         'Scala': '#c22d40',
    'Elixir': '#6e4a7e',      'Haskell': '#5e5086',
    'Markdown': '#083fa1',    'TeX': '#3d6117',
    'Jupyter Notebook': '#DA5B0B',
};

/** 格式化 Star 数 (1200 -> 1.2k) */
function formatStars(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
}

/** 根据语言色生成渐变背景 — 这就是自生成"预览图" */
function buildLangGradient(langColor) {
    // 如果没有语言色，用默认战地橙
    const c = langColor || '#ff8d1e';
    return [
        `linear-gradient(145deg, ${c}99 0%, ${c}44 40%, #0d1117 75%)`,
        `repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px)`,
    ].join(', ');
}

/** 获取 GitHub 趋势仓库并更新卡片 */
async function refreshGithubTrending() {
    const card        = document.getElementById('git-card');
    const tag         = document.getElementById('git-tag');
    const title       = document.getElementById('git-title');
    const desc        = document.getElementById('repo-desc');
    const starsEl     = document.getElementById('repo-stars');
    const forksEl     = document.getElementById('repo-forks');
    const langDot     = document.getElementById('lang-dot');
    const langName    = document.getElementById('lang-name');

    // 计算 7 天前的日期
    const date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];

    tag.textContent = '⟳ GITHUB 趋势';

    try {
        const headers = { 'Accept': 'application/vnd.github.v3+json' };
        const token = localStorage.getItem('github_token');
        if (token) headers['Authorization'] = `token ${token}`;

        const res = await fetch(
            `https://api.github.com/search/repositories?q=created:>${dateStr}&sort=stars&order=desc&per_page=25`,
            { headers }
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (!data.items || data.items.length === 0) throw new Error('没有数据');

        // 从 top25 中随机挑一个，每次刷新都有新鲜感
        const repo = data.items[Math.floor(Math.random() * data.items.length)];

        const fullName    = repo.full_name;           // owner/repo
        const description = repo.description || '暂无描述';
        const stars       = formatStars(repo.stargazers_count);
        const forks       = formatStars(repo.forks_count);
        const language    = repo.language || '未知';
        const langColor   = LANGUAGE_COLORS[language] || '#888';

        // 设置自生成预览背景
        card.style.backgroundImage = buildLangGradient(langColor);

        // 更新内容
        tag.textContent      = `🔥 GITHUB 趋势 · ${language}`;
        title.textContent    = fullName;
        desc.textContent     = description;
        starsEl.innerHTML    = `★ ${stars}`;
        forksEl.innerHTML    = `⑂ ${forks}`;
        langDot.style.background = langColor;
        langName.textContent = language;

        // 存下跳转链接
        card.dataset.repoUrl = repo.html_url;

    } catch (err) {
        console.error('GitHub 趋势获取失败:', err);
        card.style.backgroundImage = 'linear-gradient(145deg, #2d1b00, #0d1117)';
        tag.textContent      = '⚠️ GITHUB 趋势';
        title.textContent    = '情报中断';
        desc.textContent     = '无法连接至 GitHub 情报总部';
        starsEl.innerHTML    = '★ --';
        forksEl.innerHTML    = '⑂ --';
        langDot.style.background = '#888';
        langName.textContent = '--';
        card.dataset.repoUrl = 'https://github.com/trending';
    }
}

// 点击卡片跳转到仓库
document.getElementById('git-card').addEventListener('click', function () {
    const url = this.dataset.repoUrl || 'https://github.com/trending';
    window.open(url, '_blank');
});

// 初始化
refreshGithubTrending();
// 每 5 分钟刷新一次，跟上趋势
setInterval(refreshGithubTrending, 300000);

// =============================================
// 人民网要闻 — 新闻卡片
// =============================================

const NEWS_RSS = 'http://www.people.com.cn/rss/politics.xml';
const RSS2JSON  = 'https://api.rss2json.com/v1/api.json';

async function refreshNewsCard() {
    const card   = document.getElementById('news-card');
    const tag    = document.getElementById('news-tag');
    const title  = document.getElementById('news-title');
    const desc   = document.getElementById('news-desc');
    const source = document.getElementById('news-source');
    const time   = document.getElementById('news-time');

    // ========== 第 1 步：先显示缓存，秒开 ==========
    const cached = loca*************tem('news_cache');
    if (cached) {
        try {
            const d = JSON.parse(cached);
            tag.textContent    = d.tag;
            title.textContent  = d.title;
            desc.textContent   = d.desc;
            source.textContent = d.source;
            time.textContent   = d.time;
            card.style.backgroundImage = d.bg;
            card.dataset.newsUrl = d.url;
        } catch (_) {}
    }

    // ========== 第 2 步：后台获取最新 ==========
    try {
        const resp = await fetch(
            `${RSS2JSON}?rss_url=${encodeURIComponent(NEWS_RSS)}`,
            { signal: AbortSignal.timeout(8000) }
        );
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (data.status !== 'ok' || !data.items || data.items.length === 0)
            throw new Error('没有数据');

        const articles = data.items;
        const article = articles[Math.floor(Math.random() * Math.min(articles.length, 8))];

        // 标题（去空）
        const artTitle = (article.title || '无标题').replace(/^\s*\[[^\]]*\]\s*/, '');
        // 摘要（取内容前一段）
        const artDesc = (article.description || '')
            .replace(/<[^>]+>/g, '')       // 去 HTML 标签
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 100) + '...';
        // 来源
        const artSource = article.author || '人民网';
        // 发布时间
        const pubDate = article.pubDate ? new Date(article.pubDate) : new Date();
        const timeAgo = formatTimeAgo(pubDate);
        // 链接
        const artUrl = article.link || 'http://www.people.com.cn';
        // 背景 — 红金渐变，呼应人民网风格
        const bg = 'linear-gradient(145deg, #8b1a1a 0%, #4a0e0e 35%, #1a0a0a 70%)';

        // 更新 DOM
        tag.textContent    = '📰 人民网 · 要闻';
        title.textContent  = artTitle;
        desc.textContent   = artDesc;
        source.textContent = `📡 ${artSource}`;
        time.textContent   = `🕐 ${timeAgo}`;
        card.style.backgroundImage = bg;
        card.dataset.newsUrl = artUrl;

        // 缓存
        loca*************tem('news_cache', JSON.stringify({
            tag: tag.textContent, title: artTitle, desc: artDesc,
            source: `📡 ${artSource}`, time: `🕐 ${timeAgo}`,
            bg: bg, url: artUrl
        }));

    } catch (err) {
        console.error('新闻获取失败:', err);
        if (!cached) {
            tag.textContent    = '⚠️ 新闻中断';
            title.textContent  = '无法连接至新闻总部';
            desc.textContent   = '请检查网络连接';
            source.textContent = '📡 --';
            time.textContent   = '🕐 --';
            card.style.backgroundImage = 'linear-gradient(145deg, #2d1b00, #0d1117)';
        }
    }
}

/** 格式化相对时间（如"3小时前"） */
function formatTimeAgo(date) {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)   return '刚刚';
    if (mins < 60)  return `${mins}分钟前`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return `${hrs}小时前`;
    const days = Math.floor(hrs / 24);
    return `${days}天前`;
}

// 点击新闻卡片跳转
document.getElementById('news-card').addEventListener('click', function () {
    const url = this.dataset.newsUrl || 'http://www.people.com.cn';
    window.open(url, '_blank');
});

// 初始化
refreshNewsCard();
// 每 10 分钟刷新新闻
setInterval(refreshNewsCard, 600000);