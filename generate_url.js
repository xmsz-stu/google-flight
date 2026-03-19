const protobuf = require('protobufjs');
const path = require('path');

async function generateUrl() {
    const protoPath = path.join(__dirname, 'fast_flights/pb/flights.proto');
    // Important: we need to make sure we load the fields as they are in the proto
    // or use the camelCased versions that protobuf.js creates.
    const root = await protobuf.load(protoPath);

    const Info = root.lookupType('Info');
    const Seat = root.lookupEnum('Seat');
    const Trip = root.lookupEnum('Trip');
    const Passenger = root.lookupEnum('Passenger');

    const payload = {
        data: [
            {
                date: '2026-05-01',
                fromAirport: { airport: 'XMN' },
                toAirport: { airport: 'IST' }
            }
        ],
        seat: Seat.values.ECONOMY,
        passengers: [Passenger.values.ADULT],
        trip: Trip.values.ONE_WAY
    };

    const message = Info.fromObject(payload);
    const buffer = Info.encode(message).finish();
    const tfs = buffer.toString('base64');

    // Construct URL
    const baseUrl = 'https://www.google.com/travel/flights/search';
    const params = new URLSearchParams({
        tfs: tfs,
        hl: 'zh-CN',
        curr: 'CNY',
        gl: "CN"
    });

    console.log(`${baseUrl}?${params.toString()}`);
}

generateUrl().catch(console.error);
