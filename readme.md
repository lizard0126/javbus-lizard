# koishi-plugin-javbus-lizard

[![npm](https://img.shields.io/npm/v/koishi-plugin-javbus-lizard?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-javbus-lizard)

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

可以[点这里](https://github.com/lizard0126/anime-convention-lizard/issues)创建议题~
</details>
<details>
<summary>如果喜欢我的插件</summary>

可以[请我喝可乐](https://ifdian.net/a/lizard0126)，没准就有动力更新新功能了~
</details>

---
## 更新日志：

<details>

### 3.1.7
- 完善信息返回
### 3.1.6
- 修复了部分封面无法返回的问题
- 取消了根据关键词搜索影片的数量限制并添加了分页
### 3.1.5
- 修复了部分预览图返回错误的问题，给jew指令添加了结束指令
### 3.1.4
- 更改了预览图的获取方式，不再通过api而是直接从数组中获取
- 更改了图片发送方式
### 3.1.3
- 优化封面图获取方式，给所有请求添加了referer，获取封面更稳定了
- 修改了jew指令获取影片的方式，取消了有码影片的数量限制
### 3.1.2
- 优化代码结构，精简代码数量，将部分重复功能整合
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

</details>