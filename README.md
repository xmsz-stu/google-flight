# Google Flights Web Scraper & API ✈️

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-blue.svg)](https://nodejs.org/)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=flat&logo=bun&logoColor=white)](https://bun.sh/)

这是一个基于 **Playwright** 和 **Hono** (运行在 Bun) 开发的高性能 Google Flights (谷歌航班) 数据爬虫。它可以绕过复杂的参数加密，实时获取机票价格、航空公司、起降时间等详细信息。

## ✨ 功能特性

- 🚀 **高性能**: 使用 Bun 运行时，配合 `p-limit` 控制并发，稳定高效。
- 🛡️ **反爬绕过**: 自动解析 Google Flights 的 `tfs` (Travel Flight Search) 加密参数，模拟真实用户行为。
- 📊 **数据精准**: 直接截获 Google API 的响应数据流，经过 Protobuf 解析与自定义 Parser，数据结构化程度高。
- 🌐 **RESTful API**: 提供简单易用的 HTTP 接口，输入出发地、目的地和日期即可获取结果。
- 🛠️ **资源优化**: 自动过滤图片、广告等无用资源加载，极速渲染，节省流量。

## 🛠️ 技术栈

- **Runtime**: [Bun](https://bun.sh/) (高效的 JavaScript 运行时)
- **Framework**: [Hono](https://hono.dev/) (超轻量级 Web 框架)
- **Automation**: [Playwright](https://playwright.dev/) (浏览器自动化测试与抓取)
- **Serialization**: [Protobufjs](https://github.com/protobufjs/protobuf.js) (处理 Google 内部二进制协议)

## 🚀 快速开始

### 1. 安装依赖
推荐使用 Bun：
```bash
bun install
```

### 2. 环境配置
在根目录创建 `.env` 文件：
```env
PORT=3428
HEADLESS=true
CONCURRENCY_LIMIT=3
```

### 3. 启动服务
```bash
bun index.js
```

## 📖 API 使用说明

### 获取航班信息
**URL**: `/flights`
**Method**: `GET`
**Query Parameters**:
- `from`: 出发机场代码 (例如: `XMN`)
- `to`: 到达机场代码 (例如: `IST`)
- `date`: 出发日期 (`YYYY-MM-DD`)

**示例请求**:
```bash
curl "http://localhost:3428/flights?from=XMN&to=IST&date=2026-05-01"
```

## 🔍 SEO & 关键词 (Keywords)

Google Flights Scraper, 谷歌航班爬虫, 机票数据抓取, Python Google Flights API 代替方案, Node.js Playwright Crawler, 实时机票价格查询, Google Travel Data Extraction, 机票比价 API, 自动获取谷歌航班数据.

## ⚖️ 免责声明

本项目仅供学习和研究目的使用。请务必遵守 Google 的服务条款。开发者不对任何因使用本项目而导致的封号、法律诉讼或任何形式的损失负责。

## 📄 开源协议

[MIT](https://choosealicense.com/licenses/mit/)
