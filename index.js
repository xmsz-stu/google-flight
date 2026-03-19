const { Hono } = require('hono');
const protobuf = require('protobufjs');
const path = require('path');
const { chromium } = require('playwright');
const pLimit = require('p-limit').default;

const app = new Hono();
// 核心配置
const CONCURRENCY_LIMIT = parseInt(process.env.CONCURRENCY_LIMIT || '3', 10);
const limit = pLimit(CONCURRENCY_LIMIT);

let globalBrowser = null;

// 浏览器预热
async function getBrowser() {
    if (!globalBrowser) {
        console.log('🚀 [Browser] 正在启动常驻浏览器进程...');
        globalBrowser = await chromium.launch({
            headless: process.env.HEADLESS === 'true',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log('✅ [Browser] 浏览器已就绪');
    }
    return globalBrowser;
}

getBrowser().catch(err => console.error('❌ [Browser] 启动失败:', err));

async function getTfs(date, from, to) {
    const protoPath = path.join(__dirname, 'fast_flights/pb/flights.proto');
    const root = await protobuf.load(protoPath);
    const Info = root.lookupType('Info');
    const Seat = root.lookupEnum('Seat');
    const Trip = root.lookupEnum('Trip');
    const Passenger = root.lookupEnum('Passenger');

    const payload = {
        data: [{ date: date, fromAirport: { airport: from }, toAirport: { airport: to } }],
        seat: Seat.values.ECONOMY,
        passengers: [Passenger.values.ADULT],
        trip: Trip.values.ONE_WAY
    };

    const message = Info.fromObject(payload);
    const buffer = Info.encode(message).finish();
    return buffer.toString('base64');
}

async function fetchFlights(tfs, requestId) {
    const start = Date.now();
    console.log(`[${requestId}] 🛫 开始执行抓取任务...`);

    const browser = await getBrowser();
    const context = await browser.newContext({
        viewport: { width: 1280, height: 1000 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
    });

    // 资源加载优化
    await context.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,otf}', route => route.abort());
    await context.route(/google-analytics\.com|googletagmanager\.com|googleoptimize\.com|doubleclick\.net|ads\.google\.com/, route => route.abort());

    const page = await context.newPage();
    let flightData = null;

    page.on('response', async response => {
        const url = response.url();
        if (url.includes('GetShoppingResults') || url.includes('batchexecute')) {
            try {
                const text = await response.text();
                if (text.includes('[[') && text.length > 3000) {
                    flightData = text.split('\n').find(ln => ln.includes('[[') && ln.length > 3000);
                    if (flightData) console.log(`[${requestId}] 🎯 成功截获数据流 (${(flightData.length / 1024).toFixed(1)} KB)`);
                }
            } catch (err) { }
        }
    });

    const targetUrl = `https://www.google.com/travel/flights/search?tfs=${tfs}&hl=zh-CN&curr=CNY&gl=CN`;

    try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        let timer = 0;
        const maxWait = 9000;
        while (!flightData && timer < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 300));
            timer += 300;
        }
    } catch (err) {
        console.error(`[${requestId}] ❌ 导航/抓取出错:`, err.message);
    } finally {
        await context.close();
        const duration = ((Date.now() - start) / 1000).toFixed(2);
        console.log(`[${requestId}] 🏁 任务结束，耗时: ${duration}s`);
    }

    return flightData;
}

const { parseFlights } = require('./parser');

app.get('/flights', async (c) => {
    const date = c.req.query('date');
    const from = c.req.query('from');
    const to = c.req.query('to');
    const requestId = Math.random().toString(36).substring(7);

    console.log(`\n\x1b[36m[Incoming Request]\x1b[0m ID: ${requestId} | ${from} -> ${to} | Date: ${date}`);

    if (!date || !from || !to) {
        console.log(`[${requestId}] ⚠️ 参数错误，拒绝请求`);
        return c.json({ error: 'Missing parameters: date, from, to are required' }, 400);
    }

    try {
        const tfs = await getTfs(date, from, to);
        console.log(`[${requestId}] 📎 生成 TFS: ${tfs.substring(0, 15)}...`);

        // 使用并发限制
        const rawDataStr = await limit(() => fetchFlights(tfs, requestId));

        if (rawDataStr) {
            const parsedData = parseFlights(rawDataStr);
            console.log(`[${requestId}] ✨ 成功解析出 ${parsedData.totalResults} 条航班数据`);

            return c.json({
                success: true,
                requestId,
                params: { date, from, to },
                data: parsedData
            });
        } else {
            console.log(`[${requestId}] 🛑 未能捕获到航班数据`);
            return c.json({ success: false, requestId, message: 'No flight data captured' }, 404);
        }
    } catch (err) {
        console.error(`[${requestId}] 💥 服务器崩溃:`, err.message);
        return c.json({ error: err.message, requestId }, 500);
    }
});

const port = parseInt(process.env.PORT || '3428', 10);
console.log(`\n\x1b[32mBun Server is running on http://localhost:${port}\x1b[0m`);

export default {
    port,
    idleTimeout: 60,
    fetch: app.fetch
};
