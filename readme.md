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

## todo：
- 搜索女优信息

- ……

`

## 更新日志：
### 3.1.1
- 将预览图发送改为合并转发，解决部分群无法发送的问题
- 修复jkw指令返回问题
### 3.1.0
- 修改预览图获取逻辑
### 3.0.0
- 新增了最新影片获取功能
### 2.0.0
- 新增了关键词搜索功能
### 1.1.1
- 修复已知问题
### 1.1.0
- 新增了预览图功能
### 1.0.2
- 添加依赖
### 1.0.1
- 修复了封面获取失败的问题
### 1.0.0 
- 自用插件，用于查询番号返回磁力链接与封面预览