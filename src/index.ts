import { Context, h, Schema } from 'koishi';
// npm publish --workspace koishi-plugin-javbus-lizard --access public --registry https://registry.npmjs.org
export const name = 'javbus-lizard';

export const usage = `
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


export interface Config {
  api: string;
  magnet: boolean;
  cover: boolean;
  preview: boolean;
  ifForward: boolean;
  count: number;
}

export const Config = Schema.object({
  api: Schema.string().default('').required().description('api形如https://aaa.bbb.ccc'),
  magnet: Schema.boolean().default(true).description('是否返回磁链'),
  cover: Schema.boolean().default(false).description('是否返回封面'),
  preview: Schema.boolean().default(false).description('是否返回预览'),
  ifForward: Schema.boolean().default(false).description('是否合并转发（已适配onebot、telegram平台）'),
  count: Schema.number().default(5).min(1).max(30).description('每次搜索最多获取的影片数量'),
});

const movieApi = '/api/movies/';                                //获取影片详情
const magnetApi = '/api/magnets/';                              //获取影片磁力链接
const fetchApi = '/api/movies?magnet=all';                      //获取影片列表
const uncensoredApi = '/api/movies?magnet=all&type=uncensored'; //获取无码影片列表
const searchApi = '/api/movies/search?magnet=all&keyword=';     //关键词搜索影片

export function apply(ctx: Context, config: Config) {
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

  async function fetchImageBuffer(url: string, referer: string): Promise<Buffer> {
    const arrayBuffer = await ctx.http.get<ArrayBuffer>(url, {
      headers: { referer },
      responseType: 'arraybuffer',
    });

    return Buffer.from(arrayBuffer);
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
        await session.send(`合并转发消息发送失败: ${error}`);
        await session.bot.deleteMessage(session.channelId, tipMessageId);
      }

    } else if (platform === 'telegram') {



      try {
        const group = messages.map(msg => ({
          type: 'photo',
          media: msg.src,
          caption: (msg.text || '').slice(0, 1024),
        }));

        ctx.logger.info(group);

        await bot.internal.sendMediaGroup(session.channelId, group);

        await bot.deleteMessage(session.channelId, tipMessageId);
      } catch (error) {
        ctx.logger.error('消息发送失败:', error);
      }



    } else {
      await session.send(`当前平台（${platform}）暂不支持合并转发功能。`);
      await bot.deleteMessage(session.channelId, tipMessageId);
    }
  }

  //搜索影片详情
  async function fetchMovie(number: string): Promise<MovieDetail> {
    const movieUrl = config.api + movieApi + number;

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
      const magnetList = await ctx.http.get(magnetUrl);

      if (magnetList.length > 0) {
        result.magnet = `磁链[1]大小：${magnetList[0].size}\n${magnetList[0].link}`;
        if (magnetList.length > 1) {
          result.magnet += `\n\n磁链[2]大小：${magnetList[1].size}\n${magnetList[1].link}`;
          if (magnetList.length > 2) {
            result.magnet += `\n\n磁链[3]大小：${magnetList[2].size}\n${magnetList[2].link}`;
          }
        }
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

    return result;
  }

  //关键词搜索影片
  async function fetchKeyword(keyword: string): Promise<Movies[]> {
    const keywordUrl = config.api + searchApi + encodeURIComponent(keyword);

    try {
      const searchData = await ctx.http.get(keywordUrl);

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
        return `发生错误，请检查番号是否正确！\n${error.message}`;
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
        return `发生错误，请稍后再试。\n${error.message}`;
      }
    });

  ctx.command('jav [number:text]', '通过番号搜索影片')
    .subcommand("jew [type:text]", "获取最新影片")
    .action(async ({ session }, type) => {
      let listUrl = config.api
      if (type) {
        if (type === "无码") {
          listUrl += uncensoredApi;
          ctx.logger.info(listUrl);
        } else {
          return '如需关键词搜索请使用指令 “jkw”\n本指令仅支持参数 “无码”';
        }
      } else {
        listUrl += fetchApi;
        ctx.logger.info(listUrl);
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
        return `发生错误，请稍后再试。\n${error.message}`;
      }
    });

  ctx.command('t', '测试')
    .action(async ({ session }) => {
      await session.send('测试开始');
      try {
        const mediaGroup = [
          {
            type: 'photo',
            media: 'https://pics.dmm.co.jp/digital/video/ipx00666/ipx00666jp-1.jpg',
            //  caption: '第一张图片',
          },
          {
            type: 'photo',
            media: 'https://pics.dmm.co.jp/digital/video/ipx00666/ipx00666jp-1.jpg',
            //  caption: '第二张图片',
          },
        ];

        await session.bot.internal.sendMediaGroup({
          chat_id: '-1001771140342',
          media: mediaGroup,
        });
        return '发送成功'

      } catch (error) {
        return `发生错误，请稍后再试。\n${error.message}`;
      }
    });






}