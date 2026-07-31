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
    const cached = localStorage.getItem('bili_cache');
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
            card.classList.remove('fallback');
        };
        // 图片加载失败的话…卡面还是那个渐变，不会空白
        img.src = proxiedImg;

        // ========== 第 5 步：缓存本次结果 ==========
        localStorage.setItem('bili_cache', JSON.stringify({
            title: videoTitle,
            bg: card.style.backgroundImage,
            time: Date.now()
        }));

    } catch (err) {
        console.error('B站情报获取失败:', err);
        // 如果有缓存内容，不覆盖——用户已经看到缓存内容了
        if (!cached) {
            title.textContent = '无法连接至情报总部';
            // 黑暗底色，让小电视装饰显现出来
            card.style.backgroundImage = 'linear-gradient(145deg, #1a0f1a 0%, #0a0a0a 70%)';
            card.classList.add('fallback');
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
// 双城天气预报
// =============================================

/** WMO 天气代码 → 中文描述 + emoji */
const WMO_CODES = {
    0:  ['☀️', '晴'],
    1:  ['🌤', '晴间多云'],
    2:  ['⛅', '多云'],
    3:  ['☁️', '阴'],
    45: ['🌫', '雾'],
    48: ['🌫', '雾'],
    51: ['🌦', '小雨'],
    53: ['🌦', '中雨'],
    55: ['🌧', '大雨'],
    56: ['🌧', '冻雨'],
    57: ['🌧', '冻雨'],
    61: ['🌧', '小雨'],
    63: ['🌧', '中雨'],
    65: ['🌧', '大雨'],
    66: ['🌧', '冻雨'],
    67: ['❄️', '冻雨'],
    71: ['❄️', '小雪'],
    73: ['❄️', '中雪'],
    75: ['❄️', '大雪'],
    77: ['❄️', '雪粒'],
    80: ['🌦', '阵雨'],
    81: ['🌦', '阵雨'],
    82: ['🌧', '大阵雨'],
    85: ['❄️', '阵雪'],
    86: ['❄️', '大阵雪'],
    95: ['⛈', '雷暴'],
    96: ['⛈', '雷暴'],
    99: ['⛈', '雷暴'],
};

const CITIES = [
    { id: 'xa', name: '西安', lat: 34.26, lon: 108.94 },
    { id: 'ta', name: '泰安', lat: 36.19, lon: 117.13 },
];

async function refreshWeather() {
    const card  = document.getElementById('weather-card');

    // ========== 第 1 步：读缓存秒开 ==========
    const cached = localStorage.getItem('weather_cache');
    if (cached) {
        try {
            const d = JSON.parse(cached);
            document.getElementById('weather-title').textContent = d.title;
            for (const city of CITIES) {
                document.getElementById(`${city.id}-temp`).textContent  = d[city.id].temp;
                document.getElementById(`${city.id}-desc`).textContent  = d[city.id].desc;
                document.getElementById(`${city.id}-wind`).textContent  = d[city.id].wind;
            }
            document.getElementById('weather-update').textContent = d.update;
            // 背景由 CSS 固定，不需要从缓存恢复
        } catch (_) {}
    }

    // ========== 第 2 步：后台获取两个城市天气 ==========
    try {
        const results = await Promise.all(CITIES.map(city =>
            fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true&timezone=Asia/Shanghai`,
                { signal: AbortSignal.timeout(5000) }
            ).then(r => r.json())
        ));

        // 处理每个城市数据
        const data = {};
        for (let i = 0; i < CITIES.length; i++) {
            const w = results[i].current_weather;
            const code = w.weathercode;
            const [emoji, desc] = WMO_CODES[code] || ['❓', '未知'];
            data[CITIES[i].id] = {
                temp: `${emoji} ${Math.round(w.temperature)}°C`,
                desc: desc,
                wind: `💨 ${Math.round(w.windspeed)}km/h`,
            };
        }

        // 根据温度选底部色条颜色
        const avgTemp = results.reduce((s, r) => s + r.current_weather.temperature, 0) / results.length;
        const accentColor = avgTemp > 30 ? '#ff5a00'   // 酷热 → 炽橙
                          : avgTemp > 25 ? '#ffb800'   // 热 → 亮金
                          : avgTemp > 15 ? '#4a9eff'   // 温暖 → 亮蓝
                          : avgTemp > 5  ? '#6ab0d4'   // 凉爽 → 淡蓝
                          :                '#8ab4f8';  // 冷 → 冰蓝

        // 根据温度设背景渐变色 — 顶部带温度色晕，底部沉下去
        const bgGrad = avgTemp > 25
            ? 'linear-gradient(145deg, #4d2208 0%, #1a0e00 45%, #050505 70%)'
            : avgTemp > 10
            ? 'linear-gradient(145deg, #0a1a3d 0%, #050e1a 45%, #050505 70%)'
            : 'linear-gradient(145deg, #0f1f3a 0%, #080e1a 45%, #050505 70%)';
        card.style.backgroundImage = bgGrad;
        // 流光颜色跟随温度（CSS 变量驱动 ::before/::after 动画）
        card.style.setProperty('--glow-color', accentColor);

        // 更新时间
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;

        // 更新 DOM
        document.getElementById('weather-title').textContent = `🌤 天气情报 · 双城`;
        for (const city of CITIES) {
            document.getElementById(`${city.id}-temp`).textContent = data[city.id].temp;
            document.getElementById(`${city.id}-desc`).textContent = data[city.id].desc;
            document.getElementById(`${city.id}-wind`).textContent = data[city.id].wind;
        }
        document.getElementById('weather-update').textContent = `🕐 ${timeStr} 更新`;

        // 缓存
        const cacheData = { title: '🌤 天气情报 · 双城', update: `🕐 ${timeStr} 更新` };
        for (const city of CITIES) cacheData[city.id] = data[city.id];
        localStorage.setItem('weather_cache', JSON.stringify(cacheData));

    } catch (err) {
        console.error('天气获取失败:', err);
        if (!cached) {
            document.getElementById('weather-title').textContent = '🌤 天气情报';
            for (const city of CITIES) {
                document.getElementById(`${city.id}-temp`).textContent = '--°C';
                document.getElementById(`${city.id}-desc`).textContent = '暂不可用';
                document.getElementById(`${city.id}-wind`).textContent = '💨 --km/h';
            }
            document.getElementById('weather-update').textContent = '🕐 获取失败';
            card.style.backgroundImage = 'linear-gradient(145deg, #1a0a0a 0%, #0a0a0a 70%)';
            card.style.setProperty('--glow-color', '#ff8d1e'); // 战地橙兜底
        }
    }
}

// 初始化 — 延迟 3 秒再请求，免得跟 B站/GitHub 抢连接
setTimeout(refreshWeather, 3000);
// 每 15 分钟更新一次
setInterval(refreshWeather, 900000);

// =============================================
// 顶栏视图切换
// =============================================

document.querySelectorAll('.top-nav nav a[data-view]').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const viewName = this.dataset.view;

        // 切换导航高亮
        document.querySelectorAll('.top-nav nav a[data-view]').forEach(a =>
            a.classList.remove('active')
        );
        this.classList.add('active');

        // 切换视图
        document.querySelectorAll('.view').forEach(v =>
            v.classList.remove('active')
        );
        const target = document.getElementById('view-' + viewName);
        if (target) target.classList.add('active');
    });
});

// =============================================
// 待办清单（localStorage 持久化）
// =============================================

const TODO_KEY = 'bf1_todos';

function loadTodos() {
    try {
        return JSON.parse(localStorage.getItem(TODO_KEY)) || [];
    } catch (_) {
        return [];
    }
}

function saveTodos(todos) {
    localStorage.setItem(TODO_KEY, JSON.stringify(todos));
}

function renderTodos() {
    const todos = loadTodos();
    const list = document.getElementById('todo-list');
    const empty = document.getElementById('todo-empty');

    list.innerHTML = '';
    empty.style.display = todos.length === 0 ? 'block' : 'none';

    todos.forEach((todo, i) => {
        const li = document.createElement('li');
        li.className = 'todo-item' + (todo.done ? ' done' : '');

        const span = document.createElement('span');
        span.className = 'todo-text';
        span.textContent = todo.text;
        // 点击文字切换完成状态
        span.addEventListener('click', () => {
            todos[i].done = !todos[i].done;
            saveTodos(todos);
            renderTodos();
        });

        const del = document.createElement('button');
        del.className = 'todo-del';
        del.textContent = '✕';
        del.title = '删除';
        del.addEventListener('click', () => {
            todos.splice(i, 1);
            saveTodos(todos);
            renderTodos();
        });

        li.appendChild(span);
        li.appendChild(del);
        list.appendChild(li);
    });
}

// 添加待办
document.getElementById('todo-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && this.value.trim()) {
        const todos = loadTodos();
        todos.push({ text: this.value.trim(), done: false });
        saveTodos(todos);
        this.value = '';
        renderTodos();
    }
});

// 初始化渲染
renderTodos();