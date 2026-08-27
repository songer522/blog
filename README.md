# 博客文集

2005–2011 年新浪博客的离线存档，共 350 篇、829 张图片（654 张正文图片 + 175 张「这四年啊」）。

成品是一个单文件静态页面：没有框架、没有运行时依赖、不需要服务器。
`index.html` 内已包含全部文字与检索功能，图片放在 `images/`（正文）与 `thumbs/`（缩略图）。
直接双击 `index.html` 即可离线浏览。

唯二的外部依赖是留言功能与访问计数，均在离线时自动降级，不影响正文阅读：

- 留言板与文章留言：Waline，脚本与样式来自 unpkg，数据来自 `neverland-waline.vercel.app`；加载失败时显示一行提示。
- 页脚访问计数：hits.sh 徽章；加载失败时整块隐藏。

## 修改内容

`index.html` 是**生成**的，不要手改——正文数据在里面是压成一行的 JSON。
改 `data/` 或 `src/`，然后重新生成：

```sh
npm run build     # 重新生成 index.html
npm run check     # 只校验：index.html 与 data/ 不一致时报错退出
```

构建脚本 `build.js` 没有任何依赖，只用 Node 标准库。数据在生成时内联进
`index.html`，所以「双击即可离线打开」这一点不变。

`build.js` 在写文件前会校验，不通过就直接失败，不会写出坏的 `index.html`：

- 每个引用到的图片在 `images/` 与 `thumbs/` 中都存在，反过来也检查有没有没被引用的图片；
- 图片编号连续无重复（`i*` 与 `x*` 各自从 0 开始不能缺号），文章引用的图片必须在相册里；
- 每张图都有正整数的 `w` / `h`——缺了页面会在图片加载时跳版；
- `hl` / `系列` / `photos` 指向的文章与分类确实存在；
- 本文件里写的各项数量与 `data/` 实际条数一致（写过一次就不会再悄悄过期）。

| 路径 | 内容 |
|---|---|
| `index.html` | 生成物，也是提交进仓库、直接打开的那个文件 |
| `build.js` | 生成脚本（无依赖） |
| `src/template.html` | 页面骨架，含 `{{styles}}` `{{data}}` `{{app}}` `{{postCount}}` 占位符 |
| `src/styles.css` | 全站样式 |
| `src/app.js` | 全部前端逻辑（正文、时间轴、搜索、相册、系列、留言板） |
| `data/posts.json` | 350 篇正文 |
| `data/photos.json` | 654 张正文图片的元数据 |
| `data/extra.json` | 175 张「这四年啊」 |
| `data/wall.json` | 494 条留言板记录 |
| `data/meta.json` | 站点简介、精选、分类、系列 |
| `images/` | 829 张原图（`i*` 正文 654 张，`x*`「这四年啊」175 张） |
| `thumbs/` | 829 张缩略图，与 `images/` 一一对应 |

页脚与 `<meta description>` 里的篇数由 `data/posts.json` 的条数生成，不会写死。

原博客：blog.sina.com.cn/songyang1106
