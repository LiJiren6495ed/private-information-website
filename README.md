# 一个个人信息聚合网页起始页

一个基于 **Tango Psychedelia** 视觉风格的极简浏览器起始页。

## 核心特性
- **视觉**：大字号重影时钟，很好看
- **超级搜索**：支持前缀跳转，一键直达 Bilibili、GitHub、Google。
- **本地字体集成**：通过 `@font-face` 完美还原设计细节。
- **响应式设计**：自动适配不同分辨率屏幕，告别坐标错位，应该行吧。

## 快捷搜索指南
在搜索框输入以下前缀加空格，即可切换引擎：
- `g [内容]` -> Google
- `b [内容]` -> Bilibili
- `gh [内容]` -> GitHub
- `w [内容]` -> Wikipedia
- `e [内容]` -> Bing

## 快捷应用入口
在搜索框下面塞了三个我能用的AI的入口。分别是：
- Gemini
- 豆包
- DeepSeek

## 文件说明
- `index.html`: 结构核心，包含时间逻辑与搜索拦截脚本。
- `style.css`: 视觉，定义了色彩、排版及滤镜。
- `fonts/`: 存放项目专属的本地字体文件。
- `README.md`: 你正在阅读的这份项目说明书。

## 部署
本项目已接入 **GitHub Pages**。
访问地址：`https://github.com/LiJiren6495ed/private-information-website.git`