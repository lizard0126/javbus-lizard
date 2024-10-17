import { Context, segment, h } from 'koishi'
import Schema from 'schemastery'
// npm publish --workspace koishi-plugin-javbus-lizard --access public --registry https://registry.npmjs.org
// yarn build --workspace koishi-plugin-javbus-lizard
export const name = 'javbus-lizard';

export const usage = `

# NSFW警告!!!
## 用于查询番号返回磁力链接、封面预览、内容预览截图

项目整合修改自javbus和magnet-preview，api需要自行部署，参考项目[javbus-api](https://github.com/ovnrain/javbus-api)

经测试2024/10/12可用。请低调使用, 请勿配置于QQ或者是其他国内APP平台, 带来的后果请自行承担。

## 主要功能及示例调用：
- 番号搜索  示例指令：jav SSIS-834
  - 通过番号搜索影片的详细信息，包括影片标题、发行日期、女优。根据插件配置，还可以返回磁力链接、封面和预览图。

- 关键词搜索  示例指令：jkw 三上
  - 通过关键词搜索与关键词相关的最多五部影片。

- 最新影片  示例指令：jew
  - 可选参数：无码

  - 获取最新上传的最多五部影片。若添加参数无码，则返回最新上传的最多五部无码影片。

## 本次更新：
- 优化代码结构，精简代码数量，将部分重复功能整合

## todo：
- 搜索女优信息
- 因为上一条需要维护爬虫所以近期更新的可能性不大（）
- ……

## 若有更好的意见或建议，请[点此提issue](https://github.com/lizard0126/javbus-lizard/issues)或[加企鹅群](https://qm.qq.com/q/rqYGZYGKis)讨论。

`

export interface Config {
  apiPrefix: string;
  allowDownloadLink: boolean;
  allowPreviewCover: boolean;
  allowPreviewMovie: boolean;
}

export const Config = Schema.object({
  apiPrefix: Schema.string()
    .default('')
    .required()
    .description('填写api,形如https://aaa.bbb.ccc'),
  allowDownloadLink: Schema.boolean()
    .default(false)
    .description('是否返回磁链'),
  allowPreviewCover: Schema.boolean()
    .default(false)
    .description('是否返回封面'),
  allowPreviewMovie: Schema.boolean()
    .default(false)
    .description('是否返回预览'),
});

export const movieDetailApi = '/api/movies/';
export const magnetDetailApi = '/api/magnets/';
export const searchMovieApi = '/api/movies/search?keyword=';
export const uncensoredMovieApi = '/api/movies?type=uncensored';

export function apply(ctx: Context, config: Config) {
  interface MovieDetail {
    gid?: number;
    uc?: string;
    magnets: string;
    title?: string;
    date?: string;
    stars?: Array<{ name: string }>;
    img?: string;
  }

  //通过番号查找av信息
  async function getScreenshotsFromApi(magnetLink) {
    const apiUrl = `https://whatslink.info/api/v1/link?url=${encodeURIComponent(magnetLink)}`;
    try {
      const response = await ctx.http.get(apiUrl);
      if (response.screenshots && response.screenshots.length > 0) {
        return response.screenshots.map(screenshotData => screenshotData.screenshot);
      } else {
        return [];
      }
    } catch (err) {
      ctx.logger.error('获取截图失败:', err);
      return [];
    }
  }

  async function fetchMovieDetail(number: string): Promise<MovieDetail> {
    const movieUrl = config.apiPrefix + movieDetailApi + number;
    let result = {
      magnets: "",
    };

    const movieData = await ctx.http.get(movieUrl);
    const { title, id, gid, date, uc, stars, img } = movieData;
    result = { ...result, ...{ title, id, gid, date, uc, stars, img } };

    if (config.allowDownloadLink) {
      const magnetsUrl = config.apiPrefix + magnetDetailApi + `${id}?gid=${gid}&uc=${uc}`;
      const magnetsList = await ctx.http.get(magnetsUrl);
      if (magnetsList.length > 0) {
        result.magnets = `大小：${magnetsList[0].size}\n${magnetsList[0].link}`;
      }
    }

    return result;
  }

  async function sendForwardedMessages(session, screenshots, userId) {
    const bot = await session.bot;
    const UserInfo = await bot.getUser(userId);
    const nickname: string = UserInfo.username;

    const forwardMessages = screenshots.map((screenshot, index) => {
      ctx.logger.info(`正在准备合并转发的截图消息: ${index + 1} / ${screenshots.length}`);
      const attrs = {
        userId: userId,
        nickname: nickname,
      };
      return h('message', attrs, segment.image(screenshot)); // 确保内容是图片段
    });

    ctx.logger.info(`准备发送合并转发消息，截图数量: ${screenshots.length}`);

    // 使用 forward 属性创建合并转发消息
    const forwardMessage = h('message', { forward: true, children: forwardMessages });

    // 发送合并转发消息
    try {
      await session.send(forwardMessage);
      ctx.logger.info(`合并转发消息发送成功`);
    } catch (error) {
      ctx.logger.error(`合并转发消息发送失败: ${error}`);
    }
  }
  
  ctx.command('jav <number:text>', '查找javbus番号')
    .action(async ({ session }, number) => {
      try {
        if (!number) return '请提供番号!';
        const result = await fetchMovieDetail(number);
        const { title, magnets, date, stars, img } = result;
        const starsArray = stars.map(star => star.name);
        const starsname = starsArray.length > 1 ? starsArray.join(', ') : starsArray[0];

        let message = `标题: ${title}\n发行日期: ${date}\n女优: ${starsname}`;

        if (config.allowDownloadLink) {
          message += `\n磁力: ${magnets}`;
        }

        await session.sendQueued(message);

        if (config.allowPreviewCover && img) {
          await session.sendQueued(segment.image(img));
          ctx.logger.info('已发送封面图片');
        }
  
        if (config.allowPreviewMovie && result.magnets) {
          const magnetLink = result.magnets.split('\n').pop();
          ctx.logger.info(`获取预览截图，磁力链接: ${magnetLink}`);
          const [tipMessageId] = await session.send('正在获取截图...');
          const screenshots = await getScreenshotsFromApi(magnetLink);

          if (screenshots && screenshots.length > 0) {
            ctx.logger.info(`成功获取到 ${screenshots.length} 张截图`);
            await sendForwardedMessages(session, screenshots, session.userId);
          } else {
            await session.send('无法获取预览截图。');
            ctx.logger.warn('获取预览截图失败或截图为空');
          }
          
          await session.bot.deleteMessage(session.channelId, tipMessageId);
          ctx.logger.info('删除“正在获取截图”提示消息');
        }
      } catch (err) {
        ctx.logger.error(`发生错误: ${err}`);
        return `发生错误!请检查网络连接、指令jav后是否添加空格、番号是否用-连接;  ${err}`;
      }
    });

  //根据关键词搜索av
  async function fetchMoviesByKeyword(keyword: string) { 
    const searchUrl = config.apiPrefix + searchMovieApi + encodeURIComponent(keyword);
    let result = [];

    const searchData = await ctx.http.get(searchUrl);

    if (!searchData || !Array.isArray(searchData.movies) || searchData.movies.length === 0) {
      return '未找到任何匹配的电影！';
    }

    const limitedMovies = searchData.movies.slice(0, 5);

    result = limitedMovies.map((movie) => {
      const { title, id, img, date } = movie;
      let message = `标题: ${title}\n发行日期: ${date}\n番号: ${id}`;
      if (config.allowPreviewCover) {
        message += `\n封面: ${segment.image(img)}`;
      }
      return message;
    }).join('\n\n');
    return result;
  }

  ctx.command('jkw <keyword:text>', '通过关键词搜索')
    .action(async ({ session }, keyword) => {
      try {
        if (!keyword) return '请提供关键词!';
        const result = await fetchMoviesByKeyword(keyword);
        if (!result) return '未找到任何匹配的电影！';
        return result;
      } catch (err) {
        console.log(err);
        return `发生错误!请检查网络连接、指令jkw后是否添加空格;  ${err}`;
      }
    });

  // 获取最新av列表
  async function fetchMovies() {
    const latestMoviesUrl = config.apiPrefix + movieDetailApi;
    const movieList = await ctx.http.get(latestMoviesUrl);
    let result = [];

    if (!movieList || !Array.isArray(movieList.movies) || movieList.movies.length === 0) {
      return '未找到任何影片！';
    }

    const limitedMovies = movieList.movies.slice(0, 5);

    result = limitedMovies.map((movie) => {
      const { title, id, img, date, tags } = movie;

      let message = `标题: ${title}\n番号: ${id}\n发行日期: ${date}\n标签: ${tags.join(', ')}`;

      if (config.allowPreviewCover) {
        message += `\n封面: ${segment.image(img)}`;
      }
      return message;
    });
    return result.join('\n\n');
  }

  async function fetchUncensoredMovies() {
    const uncensoredMoviesUrl = config.apiPrefix + uncensoredMovieApi;
    const uncensored = await ctx.http.get(uncensoredMoviesUrl);
    let result = [];

    if (!uncensored || !Array.isArray(uncensored.movies) || uncensored.movies.length === 0) {
      return '未找到任何影片！';
    }

    const limitedMovies = uncensored.movies.slice(0, 5);

    result = limitedMovies.map((movie) => {
      const { title, id, img, date } = movie;

      let message = `标题: ${title}\n番号: ${id}\n发行日期: ${date}`;

      if (config.allowPreviewCover) {
        message += `\n封面: ${segment.image(img)}`;
      }
      return message;
    });

    return result.join('\n\n');
  }
  ctx.command('jew <mode:text>', '获取最新的影片，输入“jew+空格+无码”获取最新无码影片')
    .action(async ({ session }, mode) => {
      let result;
      try {
        if (mode && mode.includes('无码')) {
          result = await fetchUncensoredMovies();
        } else {
          result = await fetchMovies();
        }
        return result;
      } catch (err) {
        console.log(err);
        return `获取影片失败！请检查网络连接: ${err}`;
      }
    });
}