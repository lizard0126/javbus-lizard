import { Context, Schema } from 'koishi';
export declare const name = "javbus-lizard";
export declare const usage = "\n# \u26A0\uFE0F NSFW\u8B66\u544A!!!\n## \u7528\u4E8E\u67E5\u8BE2\u756A\u53F7\u8FD4\u56DE\u78C1\u529B\u94FE\u63A5\u3001\u5C01\u9762\u9884\u89C8\u3001\u5185\u5BB9\u9884\u89C8\u622A\u56FE\n\n## API\u9700\u8981\u81EA\u884C\u90E8\u7F72\uFF0C\u53C2\u8003\u9879\u76EE [javbus-api](https://github.com/ovnrain/javbus-api)\n\n## \u8BF7\u4F4E\u8C03\u4F7F\u7528\uFF0C\u8BF7\u52FF\u914D\u7F6E\u4E8EQQ\u6216\u8005\u5176\u4ED6\u56FD\u5185APP\u5E73\u53F0\uFF0C\u5E26\u6765\u7684\u540E\u679C\u8BF7\u81EA\u884C\u627F\u62C5\u3002\n---\n\n<details>\n<summary><strong><span style=\"font-size: 1.3em; color: #2a2a2a;\">\u4F7F\u7528\u65B9\u6CD5</span></strong></summary>\n\n### \u901A\u8FC7\u756A\u53F7\u641C\u7D22\u5F71\u7247\n#### \u793A\u4F8B\uFF1A\n<pre style=\"background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;\">jav ABP-123 // \u641C\u7D22\u756A\u53F7ABP-123</pre>\n\n### \u5173\u952E\u8BCD\u641C\u7D22\u5F71\u7247\n#### \u793A\u4F8B\uFF1A\n<pre style=\"background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;\">jkw \u9AD8\u6865\u3057\u3087\u3046\u5B50 // \u641C\u7D22\u5173\u952E\u8BCD\u9AD8\u6865\u3057\u3087\u3046\u5B50</pre>\n\n### \u83B7\u53D6\u6700\u65B0\u5F71\u7247\n#### \u652F\u6301\u7684\u7C7B\u578B\uFF1A\n- **\u65E0\u7801**\uFF1A\u83B7\u53D6\u65E0\u7801\u5F71\u7247\n- **\u7701\u7565**\uFF1A\u5219\u83B7\u53D6\u6709\u7801\u5F71\u7247\n#### \u793A\u4F8B\uFF1A\n<pre style=\"background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;\">jew // \u83B7\u53D6\u6700\u65B0\u6709\u7801\u5F71\u7247</pre>\n<pre style=\"background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;\">jew \u65E0\u7801 // \u83B7\u53D6\u6700\u65B0\u65E0\u7801\u5F71\u7247</pre>\n</details>\n\n<details>\n<summary><strong><span style=\"font-size: 1.3em; color: #2a2a2a;\">\u5982\u679C\u8981\u53CD\u9988\u5EFA\u8BAE\u6216\u62A5\u544A\u95EE\u9898</span></strong></summary>\n\n<strong>\u53EF\u4EE5[\u70B9\u8FD9\u91CC](https://github.com/lizard0126/javbus-lizard/issues)\u521B\u5EFA\u8BAE\u9898~</strong>\n</details>\n\n<details>\n<summary><strong><span style=\"font-size: 1.3em; color: #2a2a2a;\">\u5982\u679C\u559C\u6B22\u6211\u7684\u63D2\u4EF6</span></strong></summary>\n\n<strong>\u53EF\u4EE5[\u8BF7\u6211\u559D\u53EF\u4E50](https://ifdian.net/a/lizard0126)\uFF0C\u6CA1\u51C6\u5C31\u6709\u52A8\u529B\u66F4\u65B0\u65B0\u529F\u80FD\u4E86~</strong>\n</details>\n";
export interface Config {
    api: string;
    magnet: boolean;
    cover: boolean;
    preview: boolean;
    ifForward: boolean;
    ifPre: boolean;
    count: number;
}
export declare const Config: Schema<Schemastery.ObjectS<{
    api: Schema<string, string>;
    magnet: Schema<boolean, boolean>;
    cover: Schema<boolean, boolean>;
    preview: Schema<boolean, boolean>;
    ifForward: Schema<boolean, boolean>;
    ifPre: Schema<boolean, boolean>;
    count: Schema<number, number>;
}>, Schemastery.ObjectT<{
    api: Schema<string, string>;
    magnet: Schema<boolean, boolean>;
    cover: Schema<boolean, boolean>;
    preview: Schema<boolean, boolean>;
    ifForward: Schema<boolean, boolean>;
    ifPre: Schema<boolean, boolean>;
    count: Schema<number, number>;
}>>;
export declare function apply(ctx: Context, config: Config): void;
