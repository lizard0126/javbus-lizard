import { Context, h, Schema } from 'koishi';
import FormData from 'form-data';
// npm publish --workspace koishi-plugin-javbus-lizard --access public --registry https://registry.npmjs.org
export const name = 'javbus-lizard';

export const usage = `
# ⚠️ NSFW警告!!!
## 用于查询番号返回磁力链接、封面预览、内容预览截图

## API需要自行部署，参考项目 [javbus-api](https://github.com/ovnrain/javbus-api)。原项目当前版本部署有问题，需退回至标签2.1.2版本部署

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

export const Config = Schema.intersect([
  Schema.object({
    api: Schema.string().default('').required().description('api形如 https://aaa.bbb.ccc'),
    count: Schema.number().default(5).min(1).max(30).description('每次搜索最多获取的影片数量'),
    ifPre: Schema.boolean().default(false).description('是否展示未发行影片（影响最新影片展示，不影响 jav 指令搜索）'),
    ifForward: Schema.boolean().default(false).description('是否合并转发（已适配 onebot、telegram 平台）'),
    debug: Schema.boolean().default(false).description('是否启用日志调试信息输出'),
  }).description('基础设置'),
  Schema.object({
    cover: Schema.boolean().default(false).description('是否返回封面'),
    preview: Schema.boolean().default(false).description('是否返回预览'),
    magnet: Schema.boolean().default(true).description('是否返回磁链'),
  }).description('获取设置'),
  Schema.union([
    Schema.object({
      magnet: Schema.const(true),
      magnetPriority: Schema.union([
        Schema.const('default').description('默认顺序'),
        Schema.const('subtitle').description('中文字幕优先'),
        Schema.const('size-asc').description('磁链从小到大'),
        Schema.const('size-desc').description('磁链从大到小'),
      ])
        .default('default')
        .description('磁链获取顺序'),
      magnetCount: Schema.union([
        Schema.const(-1).description('获取全部磁链'),
        Schema.number().min(1).default(5).description('限制最多获取的磁链数量'),
      ])
        .description('返回的磁链数量'),
    }),
    Schema.object({}),
  ]),
]);

const movieApi = '/api/movies/';
const magnetApi = '/api/magnets/';
const fetchApi = '/api/movies?magnet=all';
const fetchApi0 = '/api/movies';
const uncensoredApi = '/api/movies?magnet=all&type=uncensored';
const uncensoredApi0 = '/api/movies?type=uncensored';
const searchApi = '/api/movies/search?magnet=all&keyword=';
const searchApi0 = '/api/movies/search?keyword=';

export function apply(ctx: Context, config) {
  interface MovieDetail {
    gid?: number;
    uc?: string;
    magnet: string;
    title: string;
    img: string;
    date: string;
    videoLength: string;
    stars: Array<{ name: string }>;
    samples: Array<{ src: string; referer: string; }>;
  }
  interface Movies {
    id: string;
    title: string;
    img: string;
    date: string;
    tags: Array<{ name: string }>;
  }

  //请求图片
  async function fetchImage(url: string, referer: string): Promise<string> {
    const imageBuffer = await ctx.http.get(url, {
      headers: { referer },
      responseType: 'arraybuffer'
    });

    return `data:image/jpeg;base64,${Buffer.from(imageBuffer).toString('base64')}`;
  }

  //请求图片buffer
  async function fetchImageBuffer(url: string, referer: string): Promise<Buffer> {
    const arrayBuffer = await ctx.http.get<ArrayBuffer>(url, {
      headers: { referer },
      responseType: 'arraybuffer',
    });

    return Buffer.from(arrayBuffer);
  }

  //上传图片到skyimg.de图床
  async function uploadImage(ctx, buffer) {
    const form = new FormData()
    form.append('file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' })
    const response = await ctx.http.post('https://skyimg.de/api/upload', form.getBuffer(),
      { headers: form.getHeaders() })

    return response
  }

  //合并转发
  async function forward(session, messages) {
    const bot = await session.bot;
    const platform = bot.platform;
    const messageCount = messages.length;
    const [tipMessageId] = await session.send(`共 ${messageCount} 条消息合并转发中...`);

    if (platform === 'onebot') {
      const UserInfo = await bot.getUser(session.userId);
      const nickname: string = UserInfo.username;
      const forwardMessages = await Promise.all(
        messages.map(async (msg) => {
          const attrs = { userId: session.userId, nickname: nickname };

          const imageData = await fetchImage(msg.src, msg.referer);
          if (msg.text) {
            return h('message', attrs, `${msg.text}\n`, h.image(imageData));
          } else {
            return h('message', attrs, h.image(imageData));
          }
        })
      );

      const forwardMessage = h('message', { forward: true, children: forwardMessages });

      try {
        await session.send(forwardMessage);
        await session.bot.deleteMessage(session.channelId, tipMessageId);
      } catch (error) {
        await session.send(`合并转发消息发送失败`);
        ctx.logger.error(error);
        await session.bot.deleteMessage(session.channelId, tipMessageId);
      }

    } else if (platform === 'telegram') {
      const group = await Promise.all(
        messages.map(async (msg) => {
          const imageBuffer = await fetchImageBuffer(msg.src, msg.referer)
          const result = await uploadImage(ctx, imageBuffer);
          const imgUrl = result[0].url

          return {
            type: 'photo',
            media: imgUrl,
            caption: (msg.text || '').slice(0, 1024),
          }
        })
      );

      let groupCount = 1;
      if (group.length > 10 && group.length <= 20) {
        groupCount = 2;
      } else if (group.length > 20 && group.length <= 30) {
        groupCount = 3;
      }
      const groups: typeof group[] = Array.from({ length: groupCount }, () => []);
      group.forEach((item, index) => {
        groups[index % groupCount].push(item);
      });

      try {
        for (const g of groups) {
          await bot.internal.sendMediaGroup({
            chat_id: session.channelId,
            media: g,
          });
          await bot.deleteMessage(session.channelId, tipMessageId);
        }
      } catch (error) {
        await session.send(`合并转发消息发送失败`);
        ctx.logger.error(error);
      }

    } else {
      await session.send(`当前平台（${platform}）暂不支持合并转发功能。`);
      await bot.deleteMessage(session.channelId, tipMessageId);
    }
  }

  //搜索影片详情
  async function fetchMovie(number: string): Promise<MovieDetail> {
    const movieUrl = config.api + movieApi + number;
    if (config.debug) ctx.logger.info('[影片搜索 URL]', movieUrl);

    let result: MovieDetail = {
      magnet: "",
      title: "",
      img: "",
      date: "",
      videoLength: "",
      stars: [],
      samples: [],
    };

    const movieData = await ctx.http.get(movieUrl);
    const { gid, uc, id, title, img, date, videoLength, stars, samples } = movieData;
    result = { ...result, gid, uc, title, img, date, videoLength, stars };

    if (config.magnet) {
      const magnetUrl = config.api + magnetApi + `${id}?gid=${gid}&uc=${uc}`;
      if (config.debug) ctx.logger.info('[磁链请求 URL]', magnetUrl);
      let magnetList = await ctx.http.get(magnetUrl);

      switch (config.magnetPriority) {
        case 'subtitle':
          magnetList = [
            ...magnetList.filter(m => m.hasSubtitle),
            ...magnetList.filter(m => !m.hasSubtitle),
          ];
          break;
        case 'size-asc':
          magnetList = magnetList.sort((a, b) =>
            a.numberSize - b.numberSize
          );
          break;
        case 'size-desc':
          magnetList = magnetList.sort((a, b) =>
            b.numberSize - a.numberSize
          );
          break;
      }

      let limit;
      if (typeof config.magnetCount === 'number') {
        limit = config.magnetCount === -1 ? magnetList.length : config.magnetCount;
      }

      if (magnetList.length > 0) {
        result.magnet = magnetList
          .slice(0, limit)
          .map((m, i) => `磁链[${i + 1}]大小：${m.size}\n${m.link}`)
          .join('\n\n');
      }
    }

    if (config.cover && img) {
      result.img = await fetchImage(img, `https://www.javbus.com/${id}`);
    }

    if (config.preview && samples.length > 0) {
      result.samples = samples
        .filter(sample => sample.src && sample.src.startsWith("http"))
        .map(sample => ({
          src: sample.src,
          referer: `https://www.javbus.com/${id}`,
        }));
    }
    if (config.debug) ctx.logger.info('[影片详情]', result);

    return result;
  }

  //关键词搜索影片
  async function fetchKeyword(keyword: string): Promise<Movies[]> {
    let keywordUrl;
    if (config.ifPre) keywordUrl = config.api + searchApi + encodeURIComponent(keyword);
    else keywordUrl = config.api + searchApi0 + encodeURIComponent(keyword);

    try {
      const searchData = await ctx.http.get(keywordUrl);
      if (config.debug) ctx.logger.info('[搜索结果]', searchData);

      return searchData.movies.slice(0, config.count)
        .map((movie) => ({
          id: movie.id,
          title: movie.title,
          img: movie.img,
          date: movie.date,
          tags: movie.tags,
        }));
    } catch (error) {
      return [];
    }
  }

  //获取最新影片
  async function newMovie(url: string): Promise<Movies[]> {
    try {
      const searchData = await ctx.http.get(url);
      if (config.debug) ctx.logger.info('[搜索结果]', searchData);

      return searchData.movies.slice(0, config.count)
        .map((movie) => ({
          id: movie.id,
          title: movie.title,
          img: movie.img,
          date: movie.date,
          tags: movie.tags,
        }));
    } catch (error) {
      return [];
    }
  }

  ctx.command('jav [number:text]', '通过番号搜索影片')
    .action(async ({ session }, number) => {
      if (!number) return '请提供番号!\n\n可用的子指令有：\njew  获取最新影片\njkw  关键词搜索影片';
      try {
        const movie = await fetchMovie(number);
        if (!movie.title) return "未找到影片信息，请检查番号是否正确。";

        let message = `标题：${movie.title}\n发行日期：${movie.date}\n影片时长：${movie.videoLength}分钟\n女优：${movie.stars.map(star => star.name).join("、")}\n\n`;

        if (config.magnet) {
          message += `${movie.magnet}`;
        }

        await session.send(message);

        if (config.cover && movie.img) {
          await session.send(h.image(movie.img));
        }

        if (config.preview && movie.samples.length > 0) {
          if (config.ifForward) {
            const messages = movie.samples.map(sample => ({
              src: sample.src
            }));
            await forward(session, messages);
          } else {
            for (const sample of movie.samples) {
              await session.send(h.image(await fetchImage(sample.src, sample.referer)));
            }
          }
        }
      } catch (error) {
        await session.send(`搜索失败，番号错误或影片暂未发行！`);
        ctx.logger.error(error);
        return
      }
    });

  ctx.command('jav [number:text]', '通过番号搜索影片')
    .subcommand("jkw <keyword:text>", "关键词搜索影片")
    .action(async ({ session }, keyword) => {
      if (!keyword) {
        return "请提供搜索关键词！";
      }

      try {
        const movies = await fetchKeyword(keyword);

        if (!movies.length) {
          return "未找到相关影片。";
        }

        const messages = movies.map(movie => ({
          text: `标题：${movie.title}\n发行日期：${movie.date}\n标签：${movie.tags.join(", ")}\n\n番号：${movie.id}`,
          src: movie.img,
          referer: `https://www.javbus.com/${movie.id}`,
        }));

        if (config.ifForward) {
          await forward(session, messages);
        } else {
          for (const msg of messages) {
            await session.send(msg.text + h.image(await fetchImage(msg.src, msg.referer)));
          }
        }
      } catch (error) {
        await session.send(`搜索失败，请使用日文关键词！`);
        ctx.logger.error(error);
        return
      }
    });

  ctx.command('jav [number:text]', '通过番号搜索影片')
    .subcommand("jew [type:text]", "获取最新影片")
    .action(async ({ session }, type) => {
      let listUrl = config.api
      if (type) {
        if (type === "无码") {
          if (config.ifPre) listUrl += uncensoredApi;
          else listUrl += uncensoredApi0;
        } else {
          return '如需关键词搜索请使用指令 “jkw”\n本指令仅支持参数 “无码”';
        }
      } else {
        if (config.ifPre) listUrl += fetchApi;
        else listUrl += fetchApi0;
      }

      try {
        const movies = await newMovie(listUrl);

        if (!movies.length) {
          return "未找到相关影片。";
        }

        const messages = movies.map(movie => ({
          text: `标题：${movie.title}\n发行日期：${movie.date}\n标签：${movie.tags.join(", ")}\n\n番号：${movie.id}`,
          src: movie.img,
          referer: `https://www.javbus.com/${movie.id}`,
        }));

        if (config.ifForward) {
          await forward(session, messages);
        } else {
          for (const msg of messages) {
            await session.send(msg.text + h.image(await fetchImage(msg.src, msg.referer)));
          }
        }
      } catch (error) {
        await session.send(`获取失败！`);
        ctx.logger.error(error);
        return
      }
    });
}