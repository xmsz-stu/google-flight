/**
 * 解析 Google Flights Batchexecute (GetShoppingResults) 的原始 JSON 响应
 */

function parseDate(dateArr, timeArr) {
    if (!dateArr || !timeArr || dateArr.length < 3 || timeArr.length < 2) return null;
    const [y, m, d] = dateArr;
    const [h, min] = timeArr;
    if (y === null || m === null || d === null || h === null || min === null) return null;
    return `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}T${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`;
}

function processFlight(item) {
    if (!item || !Array.isArray(item) || item.length < 2) return null;
    
    // item[0] 是包装了多层的航班基本信息
    // 经验证结构为 item[0][0][0] 或者 item[0][0]
    let basic = item[0];
    while (Array.isArray(basic) && basic.length === 1 && Array.isArray(basic[0])) {
        basic = basic[0];
    }
    // 如果 basic[0] 是 "CZ" (字符串)，基本确定这就是我们要的层级
    // 注意: 也有可能 basic 本身就是我们要的数组
    if (!Array.isArray(basic)) return null;

    const pricing = item[1];
    if (!pricing || !Array.isArray(pricing)) return null;

    const rawSegments = basic[2] || [];
    const segments = rawSegments.map(seg => ({
        origin: seg[3],
        originName: seg[4],
        destination: seg[6],
        destinationName: seg[5],
        departure: parseDate(seg[20], seg[8]),
        arrival: parseDate(seg[21], seg[10]),
        carrier: seg[22] ? seg[22][3] : "Unknown",
        carrierCode: seg[22] ? seg[22][0] : "??",
        flightNumber: seg[22] ? seg[22][1] : "0000",
        duration: seg[11],
        aircraft: seg[17]
    })).filter(s => s.departure !== null);

    const leg = {
        origin: basic[3],
        destination: basic[6],
        departure: parseDate(basic[4], basic[5]),
        arrival: parseDate(basic[7], basic[8]),
        duration: basic[9],
        stops: segments.length - 1,
        segments: segments
    };

    const amount = pricing[0] ? pricing[0][1] : 0;
    
    return {
        id: pricing[1],
        price: {
            amount: amount,
            formatted: amount ? `¥${amount.toLocaleString()}` : "Price Null",
            currency: "CNY"
        },
        legs: [leg],
        deeplink: null
    };
}

function parseFlights(rawResponse) {
    try {
        const outerData = JSON.parse(rawResponse);
        const innerData = JSON.parse(outerData[0][2]);
        
        const results = [];
        
        // innerData[2][0] 是 "最佳航班" 列表
        if (innerData[2] && Array.isArray(innerData[2][0])) {
            innerData[2][0].forEach(item => {
                const f = processFlight(item);
                if (f) results.push(f);
            });
        }

        // innerData[3][0] 通常是 "其他航班" 列表
        if (innerData[3] && Array.isArray(innerData[3][0])) {
            innerData[3][0].forEach(item => {
                const f = processFlight(item);
                if (f) results.push(f);
            });
        }

        return {
            totalResults: results.length,
            flights: results
        };
    } catch (err) {
        console.error("❌ 解析失败:", err);
        return { totalResults: 0, flights: [] };
    }
}

if (require.main === module) {
    const fs = require('fs');
    const path = require('path');
    const resultFile = path.join(__dirname, 'result.json');
    if (fs.existsSync(resultFile)) {
        const result = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
        const parsed = parseFlights(result.data);
        console.log(JSON.stringify(parsed, null, 2));
    }
}

module.exports = { parseFlights };
