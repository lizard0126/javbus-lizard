import { Context, segment } from 'koishi'
import Schema from 'schemastery'


export const name = 'javbus-lizard'

export const usage = `

# NSFW警告!!!
## 用于查询番号返回磁力链接、封面预览、内容预览截图

项目整合修改自javbus和magnet-preview，api需要自行部署，参考项目[javbus-api](https://github.com/ovnrain/javbus-api)

经测试2024/10/2可用。请低调使用, 请勿配置于QQ或者是其他国内APP平台, 带来的后果请自行承担

## 主要功能及示例调用：
- 番号搜索：
  - 用户可以通过番号搜索电影的详细信息，包括电影标题、发行日期、女优。根据插件配置，还可以返回磁力链接、封面和预览图。
  
  - 示例指令：jav SSIS-834
  
  - 返回结果：
    - 标题: 完全引退 AV女優、最後の1日。三上悠亜ラストセックス
    - 发行日期: 2023-08-11
    - 女优: 三上悠亜
- 关键词搜索:
  - 用户可以通过关键词搜索与关键词相关的最多五部电影。
  
  - 示例指令：jkw 三上
  
  - 返回结果：
    前五个与关键词相关的影片，包括标题、番号和封面。

## 改进：
- 添加了对女优信息的处理和显示，处理了 stars 数组，确保女优名字正确格式化显示。

- 限制返回的电影数量为五个，处理了无结果的情况，返回相应提示。

- handleMagnetLink 函数负责处理磁力链接的预览图，结合了 Puppeteer 库，能在支持的环境中抓取页面截图。
## todo：
- 获取最新上传的影片列表

- 搜索女优信息

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
})

export const movieDetailApi = '/api/movies/';
export const magnetDetailApi = '/api/magnets/';
export const searchMovieApi = '/api/movies/search?keyword=';

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

  //捕获截图
  async function captureElementAsBuffer(element) {
    return await element.screenshot({ omitBackground: true });
  }
  
  //获取缩略图
  async function getThumbFromMagnet(ctx, magnetLink) { 
    const hash = magnetLink.split(':')[3].split('&')[0];
    const url = `https://beta.magnet.pics/m/${hash}`;
    const customUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36';
    //用pptr加载页面
    const page = await ctx.puppeteer.page(); 
    await page.setUserAgent(customUA);
    await page.goto(url, { waitUntil: 'networkidle0' });
    const thumbContainer = await page.$('.thumb-container');
    if (!thumbContainer) {
      await page.close();
      return Buffer.alloc(0);
    }
    const imageBuffer = await captureElementAsBuffer(thumbContainer);
    await page.close();
    return imageBuffer;
  }
  
  //处理磁链
  async function handleMagnetLink(ctx, session, url) { 
    const magnetLinkRegex = /magnet:\?xt=urn:btih:[a-zA-Z0-9]*/gi;
    if (!magnetLinkRegex.test(url)) {
      return '无效的磁力链接格式！';
    }
  
    const [tipMessageId] = await session.send('正在获取截图...');
    const combinedImageBuffer = await getThumbFromMagnet(ctx, url);
    session.bot.deleteMessage(session.channelId, tipMessageId);
    
    if (combinedImageBuffer.length === 0) {
      return '无法获取链接信息或未找到截图！';
    }
  
    return segment.image(combinedImageBuffer, 'image/png');
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
      const magnetsUrl =
        config.apiPrefix + magnetDetailApi + `${id}?gid=${gid}&uc=${uc}`;
      console.log("Fetching details from:", magnetsUrl);

      const magnetsList = await ctx.http.get(magnetsUrl);

      if (magnetsList.length > 0) {
        result.magnets = `磁力: 
          ${magnetsList[0].size},
          ${magnetsList[0].shareDate}
          \n${magnetsList[0].link}`;

      }
    }
    return result;
  }

  //根据关键词搜索电影
  async function fetchMoviesByKeyword(keyword: string) { 
    const searchUrl = config.apiPrefix + searchMovieApi + encodeURIComponent(keyword);
    let result = [];

    const searchData = await ctx.http.get(searchUrl);

    if (!searchData || !Array.isArray(searchData.movies) || searchData.movies.length === 0) {
    return '未找到任何匹配的电影！';
    }

    const limitedMovies = searchData.movies.slice(0, 5);

    result = limitedMovies.map((movie) => {
      const { title, id, img } = movie;

      let message = `标题: ${title}\n番号: ${id}`;

      if (config.allowPreviewCover) {
        message += `\n封面: ${segment.image(img)}`;
      }
      return message;
      
    });

    return result.join('\n\n');
  }

  ctx.command('jav <number:text>', '查找javbus番号')
    .action(async ({session}, number) => {
      try {
        if (!number) return '请提供番号!'
        const result = await fetchMovieDetail(number)
        const { title, magnets, date, stars, img } = result;
        const starsArray = stars.map(star => star.name);
        const starsname = starsArray.length > 1 ? starsArray.join(', ') : starsArray[0];

        let message = `标题: ${title}\n发行日期: ${date}\n女优: ${starsname}`;

        if (config.allowDownloadLink) {
          message += `\n磁力: ${magnets}`;
        }

        if (config.allowPreviewCover && img) {
          message += `\n封面: ${segment.image(img)}`;
        }

        await session.sendQueued(message);

        if (config.allowPreviewMovie && result.magnets) {
          const magnetLink = result.magnets.split('\n').pop();
          const magnetImage = await handleMagnetLink(ctx, session, magnetLink);
          
          if (magnetImage) {
            await session.send(magnetImage);
          } else {
            await session.send('无法生成磁力链接预览图。');
          }
        }

      } catch(err) {
        console.log(err);
        return `发生错误!请检查网络连接、指令jav后是否添加空格、番号是否用-连接;  ${err}`;
      }
    });

  ctx.command('jkw <keyword:text>', '通过关键词搜索')
    .action(async ({ session }, keyword) => {
      try {
        if (!keyword) return '请提供关键词!';
        const result = await fetchMoviesByKeyword(keyword);
        return result;
      
      } catch(err) {
        console.log(err);
        return `发生错误!请检查网络连接、指令jkw后是否添加空格;  ${err}`;
      }
    });

}