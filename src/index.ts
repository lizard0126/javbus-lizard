import { Context, h, Schema } from 'koishi';
// npm publish --workspace koishi-plugin-javbus-lizard --access public --registry https://registry.npmjs.org
export const name = 'javbus-lizard';

export const usage = `

# NSFW警告!!!
## 用于查询番号返回磁力链接、封面预览、内容预览截图

项目整合修改自javbus和magnet-preview，api需要自行部署，参考项目[javbus-api](https://github.com/ovnrain/javbus-api)

请低调使用, 请勿配置于QQ或者是其他国内APP平台, 带来的后果请自行承担。

## 主要功能及示例调用：
<details>

- 番号搜索  示例指令：jav SSIS-834
  - 通过番号搜索影片的详细信息，包括影片标题、发行日期、女优。根据插件配置，还可以返回磁力链接、封面和预览图。

- 关键词搜索  示例指令：jkw 三上
  - 通过关键词搜索相关的影片。

- 最新今日影片  示例指令：jew
  - 可选参数：无码

  - 获取今日上传影片，若今日无新片则获取昨日上传的影片。都没有则获取目前最新的五部

  - 若添加参数无码，则返回最新上传的最多五部无码影片。
</details>

## 本次更新：
- 完善信息返回

## todo：
- 优化代码

- ……

---
<details>
<summary>如果要反馈建议或报告问题</summary>

可以[点这里](https://github.com/lizard0126/javbus-lizard/issues)创建议题~
</details>
<details>
<summary>如果喜欢我的插件</summary>

可以[请我喝可乐](https://ifdian.net/a/lizard0126)，没准就有动力更新新功能了~
</details>

`;

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
    samples: { src: string, referer: string }[];
  }

  //通过番号查找av信息
  async function fetchMovieDetail(number: string): Promise<MovieDetail> {
    const movieUrl = config.apiPrefix + movieDetailApi + number;

    let result: MovieDetail = {
      magnets: "",
      title: "",
      date: "",
      stars: [],
      img: "",
      samples: []
    };

    const movieData = await ctx.http.get(movieUrl);
    const { title, id, gid, date, uc, stars, img, samples } = movieData;

    result = { ...result, ...{ title, id, gid, date, uc, stars, img } };

    if (config.allowDownloadLink) {
      const magnetsUrl = config.apiPrefix + magnetDetailApi + `${id}?gid=${gid}&uc=${uc}`;
      const magnetsList = await ctx.http.get(magnetsUrl);
      if (magnetsList.length > 0) {
        result.magnets = `大小：${magnetsList[0].size}\n${magnetsList[0].link}`;
      }
    }

    if (config.allowPreviewCover && img) {
      const refererUrl = `https://www.javbus.com/${id}`;
      const imageResponse = await ctx.http.get(img, {
        headers: {
          referer: refererUrl,
        },
      });
      result.img = imageResponse;
    }

    if (config.allowPreviewMovie && samples && samples.length > 0) {
      const validSamples = samples.filter(sample => sample.src && sample.src.startsWith('http'));

      if (validSamples.length > 0) {
        result.samples = validSamples.map(sample => ({
          src: sample.src,
          referer: `https://www.javbus.com/${id}`
        }));
      } else {
        result.samples = [];
      }
    }

    return result;
  }

  async function sendForwardedMessages(session, screenshots, userId) {
    const bot = await session.bot;
    const UserInfo = await bot.getUser(userId);
    const nickname: string = UserInfo.username;

    const forwardMessages = await Promise.all(screenshots.map(async (screenshot) => {
      const attrs = {
        userId: userId,
        nickname: nickname,
      };

      const imageResponse = await ctx.http.get(screenshot.src, {
        headers: {
          referer: screenshot.referer,
        },
      });

      return h('message', attrs, h.image(imageResponse, { referer: screenshot.referer }));
    }));

    const forwardMessage = h('message', { forward: true, children: forwardMessages });

    try {
      await session.send(forwardMessage);
    } catch (error) {
      ctx.logger.error(`合并转发消息发送失败: ${error}`);
    }
  }

  ctx.command('jav <number:text>', '番号搜索影片')
    .action(async ({ session }, number) => {
      try {
        if (!number) return '请提供番号!';
        const result = await fetchMovieDetail(number);
        const { title, magnets, date, stars, img, samples } = result;
        const starsArray = stars.map(star => star.name);
        const starsname = starsArray.length > 1 ? starsArray.join(', ') : starsArray[0];

        let message = `标题: ${title}\n发行日期: ${date}\n女优: ${starsname}`;

        if (config.allowDownloadLink) {
          message += `\n磁力: ${magnets}`;
        }

        await session.sendQueued(message);

        if (config.allowPreviewCover && img) {
          await session.sendQueued(h.image(img));
        }

        if (config.allowPreviewMovie && samples.length > 0) {
          const [tipMessageId] = await session.send('正在获取预览图...');
          const screenshots = samples;

          if (screenshots && screenshots.length > 0) {
            await session.send(`成功获取到 ${screenshots.length} 张预览图，请耐心等待发送`);
            await sendForwardedMessages(session, screenshots, session.userId);
          } else {
            await session.send('获取预览图失败或预览图为空');
          }

          await session.bot.deleteMessage(session.channelId, tipMessageId);
        }
      } catch (err) {
        ctx.logger.error(`发生错误: ${err}`);
        return `发生错误请检查番号是否正确！\n${err}`;
      }
    });

  //根据关键词搜索av
  async function fetchMoviesByKeyword(keyword: string, session) {
    const searchUrl = config.apiPrefix + searchMovieApi + encodeURIComponent(keyword);
    let page = 1;
    let errorCount = 0;
    const maxErrorCount = 3;
    const timeoutDuration = 15 * 1000;
    let isSearchActive = true;

    try {
      const searchData = await ctx.http.get(searchUrl);
      if (!searchData || !Array.isArray(searchData.movies) || searchData.movies.length === 0) {
        return '未找到任何匹配的电影！';
      }

      const movies = searchData.movies;
      const totalPages = Math.ceil(movies.length / 5);

      const sendPageResults = (currentPage) => {
        const limitedMovies = movies.slice((currentPage - 1) * 5, currentPage * 5);
        const result = limitedMovies.map(async (movie) => {
          const { title, id, img, date } = movie;
          let message = `标题: ${title}\n发行日期: ${date}\n番号: ${id}`;

          if (config.allowPreviewCover && img) {
            const refererUrl = `https://www.javbus.com/${id}`;
            const imageResponse = await ctx.http.get(img, {
              headers: {
                referer: refererUrl,
              },
            });
            message += `\n封面: ${h.image(imageResponse)}`;
          }

          return message;
        });

        return Promise.all(result).then(responses => {
          return responses.join('\n\n') + `\n\n第 ${currentPage} 页，共 ${totalPages} 页`;
        });
      };

      const endSearch = (reason) => {
        isSearchActive = false;
        ctx.logger.info(`Ending search: ${reason}`);
        session.send(reason);
      };

      const startTimer = () => setTimeout(() => {
        if (isSearchActive) {
          endSearch('输入超时，搜索结束！');
        }
      }, timeoutDuration);

      while (isSearchActive && errorCount < maxErrorCount) {
        await session.send(await sendPageResults(page));
        await session.send('请选择页码数字，输入“0”停止搜索');

        const timer = startTimer();

        try {
          const userInput = await session.prompt(timeoutDuration);
          clearTimeout(timer);

          if (!isSearchActive) return;

          if (userInput === '0') {
            endSearch('搜索已手动结束！');
            return;
          }

          const userPageNumber = parseInt(userInput);

          if (!isNaN(userPageNumber) && userPageNumber >= 1 && userPageNumber <= totalPages) {
            page = userPageNumber;
          } else {
            errorCount++;
            if (errorCount >= maxErrorCount) {
              endSearch('错误次数过多，搜索结束！');
            } else {
              await session.send('无效的页码，请输入有效的数字！');
              return;
            }
          }
        } catch (e) {
          endSearch('输入超时，搜索结束！');
        }
      }
    } catch (err) {
      ctx.logger.error(`发生错误: ${err}`);
      return `发生错误! 请检查网络连接。${err}`;
    }
  }

  ctx.command('jkw <keyword:text>', '关键词搜索影片')
    .action(async ({ session }, keyword) => {
      if (!keyword) return '请输入关键词';
      await fetchMoviesByKeyword(keyword, session);
    });

  // 获取最新av
  async function fetchMoviesByTags(session) {
    const latestMoviesUrl = config.apiPrefix + movieDetailApi;
    const movieList = await ctx.http.get(latestMoviesUrl);

    if (!movieList || !Array.isArray(movieList.movies) || movieList.movies.length === 0) {
      return [];
    }

    let todayMovies = movieList.movies.filter(movie => movie.tags.includes('今日新種'));

    if (todayMovies.length > 0) {
      await session.send('查询到今日新片，正在搜索');
    } else {
      await session.send('今日暂无新片，正在搜索昨日新片');
      todayMovies = movieList.movies.filter(movie => movie.tags.includes('昨日新種'));

      if (todayMovies.length === 0) {
        await session.send('近日暂无新片，正在搜索现有影片');
        todayMovies = movieList.movies.slice(0, 5);
      }
    }

    return todayMovies;
  }

  async function fetchUncensoredMovies() {
    const uncensoredMoviesUrl = config.apiPrefix + uncensoredMovieApi;
    const uncensored = await ctx.http.get(uncensoredMoviesUrl);
    let result = [];

    if (!uncensored || !Array.isArray(uncensored.movies) || uncensored.movies.length === 0) {
      return '未找到任何影片！';
    }

    const limitedMovies = uncensored.movies.slice(0, 5);

    result = await Promise.all(limitedMovies.map(async (movie) => {
      const { title, id, img, date } = movie;

      let message = `标题: ${title}\n番号: ${id}\n发行日期: ${date}`;

      if (config.allowPreviewCover && img) {
        const refererUrl = `https://www.javbus.com/${id}`;
        const imageResponse = await ctx.http.get(img, {
          headers: {
            referer: refererUrl,
          },
        });
        message += `\n封面: ${h.image(imageResponse)}`;
      }

      return message;
    }));

    return result.join('\n\n');
  }

  ctx.command('jew [type:text]', '搜索最新影片，支持无码')
    .action(async ({ session }, type) => {
      try {
        if (type !== '无码') {
          return '如需关键词搜索请使用指令“jkw”\n本指令仅支持参数“无码”';
        }

        if (type === '无码') {
          const uncensoredMovies = await fetchUncensoredMovies();
          return uncensoredMovies;
        }

        const movies = await fetchMoviesByTags(session); // 传入 session

        if (movies.length === 0) {
          return '未找到任何影片！';
        }

        let page = 1;
        const totalPages = Math.ceil(movies.length / 5);
        const maxErrorCount = 3;
        let errorCount = 0;
        let isSearchActive = true;
        const timeoutDuration = 15 * 1000;

        const sendPageResults = async (currentPage) => {
          const paginatedMovies = movies.slice((currentPage - 1) * 5, currentPage * 5);

          const result = await Promise.all(paginatedMovies.map(async (movie) => {
            const { title, id, img, date, tags = [] } = movie;
            let message = `标题: ${title}\n番号: ${id}\n发行日期: ${date}\n标签: ${tags.join(', ')}`;

            if (config.allowPreviewCover && img) {
              const refererUrl = `https://www.javbus.com/${id}`;
              const imageResponse = await ctx.http.get(img, {
                headers: {
                  referer: refererUrl,
                },
              });
              message += `\n封面: ${h.image(imageResponse)}`;
            }

            return message;
          }));

          return result.join('\n\n') + `\n\n第 ${currentPage} 页，共 ${totalPages} 页`;
        };

        const endSearch = (reason) => {
          isSearchActive = false;
          ctx.logger.info(`Ending search: ${reason}`);
          session.send(reason);
        };

        const startTimer = () => setTimeout(() => {
          if (isSearchActive) {
            endSearch('输入超时，搜索结束！');
          }
        }, timeoutDuration);

        while (isSearchActive && errorCount < maxErrorCount) {
          await session.send(await sendPageResults(page));
          await session.send('请选择页码数字，输入“0”停止搜索');

          const timer = startTimer();

          try {
            const userInput = await session.prompt(timeoutDuration);
            clearTimeout(timer);

            if (!isSearchActive) return;

            if (userInput === '0') {
              endSearch('搜索已手动结束！');
              return;
            }

            const userPageNumber = parseInt(userInput);

            if (!isNaN(userPageNumber) && userPageNumber >= 1 && userPageNumber <= totalPages) {
              page = userPageNumber;
            } else {
              errorCount++;
              if (errorCount >= maxErrorCount) {
                endSearch('错误次数过多，搜索结束！');
              } else {
                await session.send('无效的页码，请输入有效的数字！');
                return;
              }
            }
          } catch (e) {
            endSearch('输入超时，搜索结束！');
          }
        }
      }
      catch (err) {
        ctx.logger.error(`发生错误: ${err}`);
        return `发生错误! 请检查网络连接。${err}`;
      }
    });
}