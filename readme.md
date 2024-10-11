# koishi-plugin-javbus-lizard

[![npm](https://img.shields.io/npm/v/koishi-plugin-javbus-lizard?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-javbus-lizard)

# NSFW警告!!!
## 用于查询番号返回磁力链接、封面预览、内容预览截图

项目整合修改自javbus和magnet-preview，api需要自行部署，参考项目[javbus-api](https://github.com/ovnrain/javbus-api)

经测试2024/10/11可用。请低调使用, 请勿配置于QQ或者是其他国内APP平台, 带来的后果请自行承担

## 主要功能及示例调用：
- 番号搜索  示例指令：jav SSIS-834
  - 通过番号搜索影片的详细信息，包括影片标题、发行日期、女优。根据插件配置，还可以返回磁力链接、封面和预览图。

- 关键词搜索  示例指令：jkw 三上
  - 通过关键词搜索与关键词相关的最多五部影片。

- 最新影片  示例指令：jew/jew无码
  - 获取最新上传的最多五部影片。

## 改进：
- 新增了最新上传的影片列表获取，分为有码和无码

- 完善了番号搜索的返回，将封面与影片信息分开发送

## todo：
- 搜索女优信息

- ……

`