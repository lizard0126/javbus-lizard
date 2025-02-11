var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Config: () => Config,
  apply: () => apply,
  name: () => name,
  usage: () => usage
});
module.exports = __toCommonJS(src_exports);
var import_koishi = require("koishi");
var name = "javbus-lizard";
var usage = `
# ⚠️ NSFW警告!!!
## 用于查询番号返回磁力链接、封面预览、内容预览截图

## API需要自行部署，参考项目 [javbus-api](https://github.com/ovnrain/javbus-api)

## 请低调使用，请勿配置于QQ或者其他国内APP平台，带来的后果请自行承担。
---

<details>
<summary><strong><span style="font-size: 1.3em; color: #2a2a2a;">使用方法</span></strong></summary>

### 通过番号搜索影片
#### 示例：
<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">jav ABP-123 // 搜索番号ABP-123</pre>

### 关键词搜索影片
#### 示例：
<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">jkw 高桥しょう子 // 搜索关键词高桥しょう子</pre>

### 获取最新影片
#### 支持的类型：
- **无码**：获取无码影片
- **省略**：则获取有码影片
#### 示例：
<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">jew // 获取最新有码影片</pre>
<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">jew 无码 // 获取最新无码影片</pre>
</details>

<details>
<summary><strong><span style="font-size: 1.3em; color: #2a2a2a;">如果要反馈建议或报告问题</span></strong></summary>

<strong>可以[点这里](https://github.com/lizard0126/javbus-lizard/issues)创建议题~</strong>
</details>

<details>
<summary><strong><span style="font-size: 1.3em; color: #2a2a2a;">如果喜欢我的插件</span></strong></summary>

<strong>可以[请我喝可乐](https://ifdian.net/a/lizard0126)，没准就有动力更新新功能了~</strong>
</details>
`;
var Config = import_koishi.Schema.object({
  api: import_koishi.Schema.string().default("").required().description("api形如https://aaa.bbb.ccc"),
  magnet: import_koishi.Schema.boolean().default(false).description("是否返回磁链"),
  cover: import_koishi.Schema.boolean().default(false).description("是否返回封面"),
  preview: import_koishi.Schema.boolean().default(false).description("是否返回预览"),
  count: import_koishi.Schema.number().default(5).min(1).max(30).description("每次搜索最多获取的影片数量")
});
var movieApi = "/api/movies/";
var uncensoredApi = "/api/movies?type=uncensored";
var searchApi = "/api/movies/search?keyword=";
var magnetApi = "/api/magnets/";
function apply(ctx, config) {
  async function fetchImage(url, referer) {
    const imageBuffer = await ctx.http.get(url, {
      headers: { referer },
      responseType: "arraybuffer"
    });
    return `data:image/jpeg;base64,${Buffer.from(imageBuffer).toString("base64")}`;
  }
  __name(fetchImage, "fetchImage");
  async function forward(session, messages, userId) {
    const bot = await session.bot;
    const UserInfo = await bot.getUser(userId);
    const nickname = UserInfo.username;
    const messageCount = messages.length;
    const [tipMessageId] = await session.send(`共 ${messageCount} 条消息合并转发中...`);
    const forwardMessages = await Promise.all(
      messages.map(async (msg) => {
        const attrs = { userId, nickname };
        const imageData = await fetchImage(msg.src, msg.referer);
        if (msg.text) {
          return (0, import_koishi.h)("message", attrs, `${msg.text}
`, import_koishi.h.image(imageData));
        } else {
          return (0, import_koishi.h)("message", attrs, import_koishi.h.image(imageData));
        }
      })
    );
    const forwardMessage = (0, import_koishi.h)("message", { forward: true, children: forwardMessages });
    try {
      await session.send(forwardMessage);
      await session.bot.deleteMessage(session.channelId, tipMessageId);
    } catch (error) {
      await session.send(`合并转发消息发送失败: ${error}`);
      await session.bot.deleteMessage(session.channelId, tipMessageId);
    }
  }
  __name(forward, "forward");
  async function fetchMovie(number) {
    const movieUrl = config.api + movieApi + number;
    let result = {
      magnet: "",
      title: "",
      img: "",
      date: "",
      videoLength: "",
      stars: [],
      samples: []
    };
    const movieData = await ctx.http.get(movieUrl);
    const { gid, uc, id, title, img, date, videoLength, stars, samples } = movieData;
    result = { ...result, gid, uc, title, img, date, videoLength, stars };
    if (config.magnet) {
      const magnetUrl = config.api + magnetApi + `${id}?gid=${gid}&uc=${uc}`;
      const magnetList = await ctx.http.get(magnetUrl);
      if (magnetList.length > 0) {
        result.magnet = `磁链[1]大小：${magnetList[0].size}
${magnetList[0].link}`;
        if (magnetList.length > 1) {
          result.magnet += `

磁链[2]大小：${magnetList[1].size}
${magnetList[1].link}`;
          if (magnetList.length > 2) {
            result.magnet += `

磁链[3]大小：${magnetList[2].size}
${magnetList[2].link}`;
          }
        }
      }
    }
    if (config.cover && img) {
      result.img = await fetchImage(img, `https://www.javbus.com/${id}`);
    }
    if (config.preview && samples.length > 0) {
      result.samples = samples.filter((sample) => sample.src && sample.src.startsWith("http")).map((sample) => ({
        src: sample.src,
        referer: `https://www.javbus.com/${id}`
      }));
    }
    return result;
  }
  __name(fetchMovie, "fetchMovie");
  async function fetchKeyword(keyword) {
    const keywordUrl = config.api + searchApi + encodeURIComponent(keyword);
    try {
      const searchData = await ctx.http.get(keywordUrl);
      return searchData.movies.slice(0, config.count).map((movie) => ({
        id: movie.id,
        title: movie.title,
        img: movie.img,
        date: movie.date,
        tags: movie.tags
      }));
    } catch (error) {
      return [];
    }
  }
  __name(fetchKeyword, "fetchKeyword");
  async function newMovie(url) {
    try {
      const searchData = await ctx.http.get(url);
      return searchData.movies.slice(0, config.count).map((movie) => ({
        id: movie.id,
        title: movie.title,
        img: movie.img,
        date: movie.date,
        tags: movie.tags
      }));
    } catch (error) {
      return [];
    }
  }
  __name(newMovie, "newMovie");
  ctx.command("jav [number:text]", "通过番号搜索影片").action(async ({ session }, number) => {
    if (!number) return "请提供番号!\n\n可用的子指令有：\njew  获取最新影片\njkw  关键词搜索影片";
    try {
      const movie = await fetchMovie(number);
      if (!movie.title) return "未找到影片信息，请检查番号是否正确。";
      let message = `标题：${movie.title}
发行日期：${movie.date}
影片时长：${movie.videoLength}分钟
女优：${movie.stars.map((star) => star.name).join("、")}

`;
      if (config.magnet) {
        message += `${movie.magnet}`;
      }
      await session.send(message);
      if (config.cover && movie.img) {
        await session.send(import_koishi.h.image(movie.img));
      }
      if (config.preview && movie.samples.length > 0) {
        const messages = movie.samples.map((sample) => ({
          src: sample.src
        }));
        await forward(session, messages, session.userId);
      }
    } catch (error) {
      return `发生错误，请检查番号是否正确！
${error.message}`;
    }
  });
  ctx.command("jav [number:text]", "通过番号搜索影片").subcommand("jkw <keyword:text>", "关键词搜索影片").action(async ({ session }, keyword) => {
    if (!keyword) {
      return "请提供搜索关键词！";
    }
    try {
      const movies = await fetchKeyword(keyword);
      if (!movies.length) {
        return "未找到相关影片。";
      }
      const messages = movies.map((movie) => ({
        text: `标题：${movie.title}
发行日期：${movie.date}
标签：${movie.tags.join(", ")}

番号：${movie.id}`,
        src: movie.img,
        referer: `https://www.javbus.com/${movie.id}`
      }));
      await forward(session, messages, session.userId);
    } catch (error) {
      return `发生错误，请稍后再试。
${error.message}`;
    }
  });
  ctx.command("jav [number:text]", "通过番号搜索影片").subcommand("jew [type:text]", "获取最新影片").action(async ({ session }, type) => {
    let listUrl = config.api;
    if (type) {
      if (type === "无码") {
        listUrl += uncensoredApi;
        ctx.logger.info(listUrl);
      } else {
        return "如需关键词搜索请使用指令 “jkw”\n本指令仅支持参数 “无码”";
      }
    } else {
      listUrl += movieApi;
      ctx.logger.info(listUrl);
    }
    try {
      const movies = await newMovie(listUrl);
      if (!movies.length) {
        return "未找到相关影片。";
      }
      const messages = movies.map((movie) => ({
        text: `标题：${movie.title}
发行日期：${movie.date}
标签：${movie.tags.join(", ")}

番号：${movie.id}`,
        src: movie.img,
        referer: `https://www.javbus.com/${movie.id}`
      }));
      await forward(session, messages, session.userId);
    } catch (error) {
      return `发生错误，请稍后再试。
${error.message}`;
    }
  });
}
__name(apply, "apply");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Config,
  apply,
  name,
  usage
});
