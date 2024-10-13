import { Context, segment } from 'koishi'
import Schema from 'schemastery'
import { jsx, jsxs } from '@satorijs/element/jsx-runtime';
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

- 最新影片  示例指令：jew/jew无码
  - 获取最新上传的最多五部影片。

## 改进：
- 将预览图发送改为合并转发，解决部分群无法发送的问题

- 修复jkw指令返回问题

## todo：
- 搜索女优信息

- 优化指令及代码

- ……

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
      console.error('获取截图失败:', err);
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
        }

        if (config.allowPreviewMovie && result.magnets) {
          const magnetLink = result.magnets.split('\n').pop();
          const [tipMessageId] = await session.send('正在获取截图...');
          const screenshots = await getScreenshotsFromApi(magnetLink);
          
          if (screenshots && screenshots.length > 0) {
            const forwardMessage = jsx("message", {
              forward: true,
              children: screenshots.map(screenshot => 
                jsxs("message", {
                  children: [
                    jsx("author", { "user-id": session.selfId }), // 当前机器人为发送者
                    jsx("image", { src: screenshot })  // 包含截图的图片消息
                  ]
                })
              )
            });
          
            // 发送合并转发消息
            await session.send(forwardMessage);
          } else {
            await session.send('无法获取预览截图。');
          }
          session.bot.deleteMessage(session.channelId, tipMessageId);
        }

      } catch (err) {
        console.log(err);
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

  // 获取最新有码av列表
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

  ctx.command('jew', '获取最新的影片')
    .action(async ({ session }) => {
      try {
        const result = await fetchMovies();
        return result;
      } catch (err) {
        console.log(err);
        return `获取影片失败！请检查网络连接: ${err}`;
      }
    });

    // 获取最新无码av列表
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

  ctx.command('jew无码', '获取最新的无码影片')
    .action(async ({ session }) => {
      try {
        const result = await fetchUncensoredMovies();
        return result;
      } catch (err) {
        console.log(err);
        return `获取影片失败！请检查网络连接: ${err}`;
      }
    });
}