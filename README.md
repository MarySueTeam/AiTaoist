# 玄门命理

一个基于 React + Vite + Express 的命理测算 Web 应用，提供八字排盘、八字合盘、大六壬、小六壬、六爻等功能，并支持 AI 流式推演展示、运势图表和结果分享。

## 功能概览

- 八字排盘
  - 基础命盘解析
  - 五行强弱与喜忌分析
  - 性格、健康、财运、事业、情感、家庭总评
  - 大运流年深入推演
  - 流日运势查询
  - 走势图与评分面板
- 八字合盘
  - 双方八字契合度分析
  - 情感模式、未来走向、建议输出
- 大六壬
  - 四课、三传、天盘与断语
- 小六壬
  - 宫位排布、整体断语与建议
- 六爻
  - 时间起卦
  - 铜钱起卦
  - 本卦、变卦、爻辞、详细分析
- 通用能力
  - AI 流式逐字回显
  - 多模型切换
  - 图片导出与分享
  - 本地服务端代理，避免前端暴露 API Key


## 注意事项
测试时提示词主要针对gpt-5.2模型调优，所以默认模型为gpt-5.2  
该项目主要为提示词优化和前端显示结合的工程  
测试时发现同样使用5.2模型的情况下自己搭建的中转站与公益站的结果会有明显差异  
因此确信模型质量会影响输出结果，大家也可以根据自己的理解和实际情况进行调优  
该项目方向由于法规等因素不适合上架小程序/App 所以大家保留网页端的玩法就可以了  

## 技术栈

- 前端
  - React 19
  - Vite
  - TypeScript
  - Motion
  - Recharts
  - Lucide React
- 后端
  - Express
  - dotenv
- 命理计算
  - lunar-javascript

## 项目结构

```text
.
├─ src/
│  ├─ components/          # 表单、结果页、流式面板、帮助弹窗等 UI 组件
│  ├─ services/
│  │  ├─ fortuneService.ts # AI 请求与命理测算主逻辑
│  │  └─ shenshaRules.ts   # 神煞与部分八字辅助计算
│  ├─ utils/
│  │  └─ shareUtils.ts     # 导出图片与分享相关工具
│  ├─ types/
│  │  └─ toneMode.ts       # 语气模式类型
│  └─ App.tsx              # 应用入口与功能页切换
├─ server.js               # Express 代理服务
├─ package.json
└─ README.md
```

## 环境要求

- Node.js 18 及以上
- npm

建议使用较新的 Node 版本，以保证原生 `fetch`、流式响应和 ESM 行为稳定。

## 环境变量

在项目根目录创建 `.env.local` 或 `.env`。

示例：

```env
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=sk-xxxx
OPENAI_DEFAULT_MODEL=gpt-5.2
PORT=9999
```

说明：

- `OPENAI_BASE_URL`
  - OpenAI 兼容网关根地址，必须带 `/v1`
  - 例如 `https://api.openai.com/v1`
  - 如果使用第三方兼容网关，也应填写其 `/v1` 根路径
- `OPENAI_API_KEY`
  - 服务端代理使用的密钥
- `OPENAI_DEFAULT_MODEL`
  - 默认模型名称
  - 前端仍可在页面顶部切换模型
- `PORT`
  - 生产服务端口，可选，默认 `9999`

## 开发运行

1. 安装依赖

```bash
npm install
```

2. 启动前端开发服务器

```bash
npm run dev
```

默认会启动 Vite 开发服务。

## 生产运行

1. 构建前端

```bash
npm run build
```

2. 启动 Node 服务

```bash
npm run start
```

服务端会：

- 托管构建后的前端静态资源
- 代理模型列表请求
- 代理 AI 结构化输出请求

## 可用脚本

```bash
npm run dev
npm run build
npm run preview
npm run start
npm run lint
```

说明：

- `lint` 当前实际执行的是：

```bash
tsc --noEmit
```

如果本机没有安装依赖，可能会出现 `tsc is not recognized`。

## AI 请求架构

当前项目已统一切换为 OpenAI 兼容的 `Responses API`。

### 前端调用链

前端不会直接请求外部模型接口，而是请求同源代理：

- `GET /api/models`
- `POST /api/responses`

### 服务端代理链

[server.js](./server.js) 会将请求转发到：

- `${OPENAI_BASE_URL}/models`
- `${OPENAI_BASE_URL}/responses`

这样做有几个目的：

- 避免在浏览器中暴露 API Key
- 规避 HTTPS 页面下的跨域与混合内容问题
- 对接第三方 OpenAI 兼容网关时，统一在服务端切换配置

### 结构化输出

项目通过 `json_schema` 约束模型输出，并在前端解析 `Responses API` 的返回结构。

`Responses API` 成功响应的文本结果通常位于：

```text
output[0].content[0].text
```

当使用流式请求时，前端会解析 `response.output_text.delta` 等 SSE 事件，实现逐字回显。

## 主要页面说明

### 1. 八字排盘

输入：

- 性别
- 出生日期
- 出生时间
- 公历 / 农历
- 是否闰月
- 语气模式

输出：

- 四柱八字
- 藏干、神煞
- 五行占比
- 喜神、忌神、用神
- 整体命格与人生分项总评
- 大运流年详评
- 流日运势
- 图表走势

### 2. 八字合盘

输入两个人的出生信息，输出双方契合度、关系模式、未来走向与建议。

### 3. 大六壬

按起课时间和所问之事输出四课、三传、天盘和断课建议。

### 4. 小六壬

按时间与问事输出宫位结果、整体趋势和行动建议。

### 5. 六爻

支持：

- 时间起卦
- 铜钱摇卦

结果页展示本卦、变卦、爻辞和详细断语。

## 分享与导出

多个结果页支持导出图片。

相关实现位于：

- [src/utils/shareUtils.ts](./src/utils/shareUtils.ts)

导出逻辑依赖：

- `html-to-image`
- `html2canvas`

## 模型切换

页面顶部提供模型下拉框。

模型列表来源：

- 优先读取 `/api/models`
- 若远端模型列表获取失败，则回退到内置模型列表

默认模型：

- `gpt-5.2`

## 已知限制

- 第三方 OpenAI 兼容网关对 `json_schema` 和流式结构化输出的支持程度不完全一致
- 某些网关在复杂 schema、长 prompt、长输出同时存在时，可能出现提前断流或不严格遵守 schema
- 如果上游返回的是带代码块包裹的 JSON，项目会尽量提取并解析，但不保证所有不规范输出都能兼容
- `npm run lint` 依赖本地已正确安装 TypeScript 相关依赖

## 调试建议

如果遇到“解析失败”或流式异常，优先检查：

1. `OPENAI_BASE_URL` 是否正确，且是否带 `/v1`
2. 目标网关是否真实支持 `Responses API`
3. 目标网关是否支持：
   - `text.format.type = "json_schema"`
   - `strict = true`
   - 流式 `Responses API`
4. 浏览器控制台与服务端终端是否出现：
   - 提前断流
   - HTML 错误页
   - 非 JSON 文本
   - schema 未遵守

## 适合二次开发的入口

- 应用主流程
  - [src/App.tsx](./src/App.tsx)
- AI 请求与命理服务
  - [src/services/fortuneService.ts](./src/services/fortuneService.ts)
- 八字辅助规则
  - [src/services/shenshaRules.ts](./src/services/shenshaRules.ts)
- 代理服务
  - [server.js](./server.js)

  ## 界面预览

### 主界面

![界面预览](./photo/界面预览.png)

### 导出效果

![导出预览](./photo/导出预览.png)

## 免责声明

本项目用于传统命理文化展示、交互体验与娱乐参考，不构成医学、法律、投资、婚恋或其他现实决策建议。任何重要决定请结合现实情况自行判断。
