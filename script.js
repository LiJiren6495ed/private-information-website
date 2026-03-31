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

    try {
        // 使用 allorigins 代理绕过 B 站 API 的跨域限制
        const proxy = 'https://api.allorigins.win/get?url=';
        const target = encodeURIComponent('https://api.bilibili.com/x/web-interface/popular?ps=20');
        
        const response = await fetch(proxy + target);
        const json = await response.json();
        const data = JSON.parse(json.contents);
        
        // 修改 refreshBiliCover 函数中的图片路径部分
        if (data.code === 0) {
            const list = data.data.list;
            const randomVideo = list[Math.floor(Math.random() * list.length)];

            // 1. 获取原图地址并去掉协议头
            let originalPic = randomVideo.pic.replace(/https?:\/\//, "");

            // 2. 使用 Weserv 代理（它是专门做这个的，非常稳定）
            // 语法：https://images.weserv.nl/?url=[图片地址]
            const proxiedPicUrl = `https://images.weserv.nl/?url=${encodeURIComponent(originalPic)}`;

            // 3. 应用背景
            card.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url('${proxiedPicUrl}')`;
    
            // 更新标题
            title.textContent = randomVideo.title;
            title.classList.remove('loading-text');
        }
    } catch (err) {
        console.error("B站情报获取失败:", err);
        title.textContent = "无法连接至情报总部";
    }
}

// 立即执行一次
refreshBiliCover();
// 每 30 秒换一个热门封面，保持新鲜感
setInterval(refreshBiliCover, 60000);