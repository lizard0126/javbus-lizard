# koishi-plugin-javbus-lizard

[![npm](https://img.shields.io/npm/v/koishi-plugin-javbus-lizard?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-javbus-lizard)

# ⚠️ NSFW警告!!!
## 用于查询番号返回磁力链接、封面预览、内容预览截图

## API需要自行部署，参考项目 [javbus-api](https://github.com/ovnrain/javbus-api)

## 请低调使用，请勿配置于QQ或者其他国内APP平台，带来的后果请自行承担。

<details>
<summary><strong><span style="font-size: 1.3em; color: #2a2a2a;">使用方法</span></strong></summary>

### 通过番号搜索影片
#### 示例：
<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">jav ABP-123 // 搜索番号ABP-123</pre>

### 关键词搜索影片
#### 示例：
<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">jkw 高桥しょう子 // 搜索关键词高桥しょう子</pre>

### 获取最新影片
#### 支持的类型：
- **无码**：获取无码影片
- **省略**：则获取有码影片
#### 示例：
<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">jew // 获取最新有码影片</pre>
<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">jew 无码 // 获取最新无码影片</pre>
</details>

<details>
<summary><strong><span style="font-size: 1.3em; color: #2a2a2a;">如果要反馈建议或报告问题</span></strong></summary>

<strong>可以[点这里](https://github.com/lizard0126/javbus-lizard/issues)创建议题~</strong>
</details>

<details>
<summary><strong><span style="font-size: 1.3em; color: #2a2a2a;">如果喜欢我的插件</span></strong></summary>

<strong>可以[请我喝可乐](https://ifdian.net/a/lizard0126)，没准就有动力更新新功能了~</strong>
</details>

---
<details>
<summary><strong><span style="font-size: 1.3em; color: #2a2a2a;">更新日志</span></strong></summary>

### 4.2.5
- 优化错误信息的返回，优化代码结构
### 4.2.4
- 修复了默认获取磁链数量的错误，添加了调试信息
### 4.2.3
- 完善了磁链返回逻辑，可以选择优先获取顺序
### 4.2.2
- 适配了telegram平台媒体组数量限制（最多10张，分组发送）
### 4.2.0
- 支持tg平台发送媒体组（暂存至图床skyimg.de）
- 优化未发行影片的搜索，设置为可选项
### 4.1.0
- 更新了获取影片的url，现可获取一些偷跑的影片了
- 将合并转发功能设为可选项，目前仅支持onebot平台，后续可能会支持其他平台
### 4.0.0
- 重构代码，精简结构
- 去掉了冗余的分页操作
- 新增了配置项，可以选择返回的影片数量
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