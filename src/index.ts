import { Context, segment } from 'koishi'
import Schema from 'schemastery'


export const name = 'javbus'

export const usage = `

本插件自用，用于查询番号返回磁力链接与封面预览

命令前缀jav XXXX-1234，api需要自行部署，参考https://github.com/ovnrain/javbus-api

经测试2024/9/3可用，配置代理请打开TUN模式

该插件请低调使用, 请勿配置于QQ或者是其他国内APP平台, 带来的后果请自行承担
`

export interface Config {
  apiPrefix: string;
  allowDownloadLink: boolean;
  allowPreviewCover: boolean;
}

export const Config = Schema.object({
  apiPrefix: Schema.string()
    .default('')
    .required()
    .description('填写api,形如https://aaa.bbb.ccc'),
  allowDownloadLink: Schema.boolean()
    .default(false)
    .description('是否返回磁力链接'),
  allowPreviewCover: Schema.boolean()
    .default(false)
    .description('是否返回封面预览'),
})

export const movieDetailApi = '/api/movies/';
export const magnetDetailApi = '/api/magnets/';

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
        result.magnets = `磁力: ${magnetsList[0].size},${magnetsList[0].shareDate}\n${magnetsList[0].link}`;

        if (magnetsList.length > 1) {
          result.magnets += `\n磁力2: ${
            magnetsList[magnetsList.length - 1].size
          },${magnetsList[magnetsList.length - 1].shareDate}\n${
            magnetsList[magnetsList.length - 1].link
          }`;
        }
      }
    }
    return result;
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
      } catch(err) {
        console.log(err);
        return `发生错误!请检查网络连接、指令jav后是否添加空格、番号是否用-连接;  ${err}`;
      }
    });
}