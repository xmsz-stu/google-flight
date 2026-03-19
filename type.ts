export interface SearchResults {
    /** 搜索结果总数 */
    totalResults: number;
    /** 搜索状态 (例如: "complete", "incomplete") */
    status?: string;
    /** 航班列表 */
    flights: Flight[];
}

export interface Flight {
    /** 航班唯一标识符 */
    id: string;
    /** 价格信息 */
    price: {
        /** 数值金额 (用于计算/排序) */
        amount: number;
        /** 格式化后的显示金额 (如 "¥1,234") */
        formatted: string;
        /** 货币单位 (如 "CNY") */
        currency: string;
    };
    /** 航程信息 (单程为1个leg，往返为2个leg) */
    legs: {
        /** 出发地 IATA 代码 */
        origin: string;
        /** 目的地 IATA 代码 */
        destination: string;
        /** 出发时间 (ISO格式) */
        departure: string;
        /** 到达时间 (ISO格式) */
        arrival: string;
        /** 总飞行时长 (分钟) */
        duration: number;
        /** 经停次数 (0 表示直飞) */
        stops: number;
        /** 具体航段信息 (如果是转机，会有多个segment) */
        segments: {
            /** 该航段出发地 */
            origin: string;
            /** 出发地名称 */
            originName?: string;
            /** 该航段目的地 */
            destination: string;
            /** 目的地名称 */
            destinationName?: string;
            /** 该航段出发时间 */
            departure: string;
            /** 该航段到达时间 */
            arrival: string;
            /** 执飞航空公司名称 */
            carrier: string;
            /** 航空公司代码 (如 "CX") */
            carrierCode: string;
            /** 航班号 (如 "123") */
            flightNumber: string;
            /** 该航段飞行时长 (分钟) */
            duration: number;
            /** 飞机型号 */
            aircraft?: string;
        }[];
    }[];
    /** 预订跳转链接 */
    deeplink: string | null;
}