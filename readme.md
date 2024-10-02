# koishi-plugin-javbus-lizard

[![npm](https://img.shields.io/npm/v/koishi-plugin-javbus-lizard?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-javbus-lizard)

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