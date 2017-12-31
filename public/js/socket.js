let trades;
let min;
let last100, last500;
let counter = 0;
let symbol;
let pairsDict = {
    "BCCBTC": "BCCBTC",
    "BCCUSD": "BCCUSDT",
    "BTCUSD": "BTCUSDT",
    "BTGBTC": "BTGBTC",
    "DSHBTC": "DASHBTC",
    "EOSBTC": "EOSBTC",
    "ETCBTC": "ETCBTC",
    "ETHBTC": "ETHBTC",
    "ETHUSD": "ETHUSDT",
    "IOTBTC": "IOTABTC",
    "IOTETH": "IOTAETH",
    "LTCBTC": "LTCBTC",
    "LTCUSD": "LTCUSDT",
    "NEOBTC": "NEOBTC",
    "NEOETH": "NEOETH",
    "NEOUSD": "NEOUSDT",
    "OMGBTC": "OMGBTC",
    "OMGETH": "OMGETH",
    "QTMBTC": "QTUMBTC",
    "QTMETH": "QTUMETH",
    "XMRBTC": "XMRBTC",
    "XRPBTC": "XRPBTC",
    "YYWBTC": "YOYOBTC",
    "YYWETH": "YOYOETH",
    "ZECBTC": "ZECBTC"
};


function recalculate() {
    // Reset
    last500 = {
        seller: {
            total: 0,
            big: 0,
            bigger: 0,
            volume: 0
        },
        buyer: {
            total: 0,
            big: 0,
            bigger: 0,
            volume: 0
        }
    };

    last100 = {
        seller: {
            total: 0,
            big: 0,
            bigger: 0,
            volume: 0
        },
        buyer: {
            total: 0,
            big: 0,
            bigger: 0,
            volume: 0
        }
    };

    for (var i = 0; i < 500; i++) {
        var t = trades[i];
        if (i >= 400) {
            if (t['m']) {
                last100.seller.total++;
                if (parseFloat(t['q']) > min) {
                    last100.seller.big++;
                    if (parseFloat(t['q']) > min * 2) {
                        last100.seller.bigger++;
                    }
                }
                last100.seller.volume += parseFloat(t['q']);
            } else {
                last100.buyer.total++;
                if (parseFloat(t['q']) > min) {
                    last100.buyer.big++;
                    if (parseFloat(t['q']) > min * 2) {
                        last100.buyer.bigger++;
                    }
                }
                last100.buyer.volume += parseFloat(t['q']);
            }
        }

        if (t['m']) {
            last500.seller.total++;
            if (parseFloat(t['q']) > min) {
                last500.seller.big++;
                if (parseFloat(t['q']) > min * 2) {
                    last500.seller.bigger++;
                }
            }
            last500.seller.volume += parseFloat(t['q']);
        } else {
            last500.buyer.total++;
            if (parseFloat(t['q']) > min) {
                last500.buyer.big++;
                if (parseFloat(t['q']) > min * 2) {
                    last500.buyer.bigger++;
                }
            }
            last500.buyer.volume += parseFloat(t['q']);
        }
    }

    // Rewrite values on page
    document.getElementById("seller_total100").innerHTML = last100.seller.total;
    document.getElementById("seller_total500").innerHTML = last500.seller.total;

    document.getElementById("seller_big100").innerHTML = last100.seller.big;
    document.getElementById("seller_big500").innerHTML = last500.seller.big;

    document.getElementById("seller_bigger100").innerHTML = last100.seller.bigger;
    document.getElementById("seller_bigger500").innerHTML = last500.seller.bigger;

    document.getElementById("seller_volume100").innerHTML = last100.seller.volume > 999 ? Math.round(last100.seller.volume / 1000) + 'k' : Math.round(last100.seller.volume);
    document.getElementById("seller_volume500").innerHTML = last500.seller.volume > 999 ? Math.round(last500.seller.volume / 1000) + 'k' : Math.round(last500.seller.volume);


    document.getElementById("buyer_total100").innerHTML = last100.buyer.total;
    document.getElementById("buyer_total500").innerHTML = last500.buyer.total;

    document.getElementById("buyer_big100").innerHTML = last100.buyer.big;
    document.getElementById("buyer_big500").innerHTML = last500.buyer.big;

    document.getElementById("buyer_bigger100").innerHTML = last100.buyer.bigger;
    document.getElementById("buyer_bigger500").innerHTML = last500.buyer.bigger;

    document.getElementById("buyer_volume100").innerHTML = last100.buyer.volume > 999 ? Math.round(last100.buyer.volume / 1000) + 'k' : Math.round(last100.buyer.volume);
    document.getElementById("buyer_volume500").innerHTML = last500.buyer.volume > 999 ? Math.round(last500.buyer.volume / 1000) + 'k' : Math.round(last500.buyer.volume);

    // Reset highlights
    [].forEach.call(document.getElementsByClassName("box"), function(e) {
        e.classList.remove("highlight")
    });

    // Highlight cells
    var boxes = document.getElementsByClassName("box");
    for (var i = 0; i < boxes.length; i++) {
        if (i === boxes.length - 1) {
            break;
        }
        if (i % 2 === 0) {
            if (parseInt(boxes[i].children[1].innerText) !== parseInt(boxes[i + 1].children[1].innerText)) {
                parseInt(boxes[i].children[1].innerText) > parseInt(boxes[i + 1].children[1].innerText) ? boxes[i].classList.add("highlight") : boxes[i + 1].classList.add("highlight");
            }
        }
    }
}

function update(trade) {
    // Default items are Binance trades
    var item = trade;
    // Handle Bitfinex trades
    if (trade.length !== undefined) {
        if (trade.length === 3) {
            if (trade.includes("tu")) {
                var data = {
                    'q': Math.abs(trade[2][2]).toString(),
                    'T': trade[2][1],
                    'm': (trade[2][2] < 0)
                };
                item = data;
            } else {
                return;
            }
        } else {
            return;
        }
    } else {
    }

    // Binance trades
    if (item['q'] !== undefined) {
        // Keep a fixed size of 500
        if (trades.length < 500) {
            trades.push(item);
        } else {
            trades.shift();
            trades.push(item);
        }
        // Update timestamp
        document.getElementById("last_trade_timestamp").innerHTML = new Date(parseInt(item['T'])).toTimeString().substring(0, 15);

        // Recalculate values on page every 300 updates
        counter++;
        if (counter => 300) {
            recalculate();
            counter = 0;
        }
    }
}

window.onload = function() {
    init();
    recalculate(); // to highlight initial values
    if (bfxUsed && bncUsed) {
        // Bfx symbol is the default
        connectSocketBitfinex(symbol);
        connectSocketBinance(pairsDict[symbol]);
    }
    else if (bncUsed) {
        // Bnc only, bnc symbol
        connectSocketBinance(symbol);
    }
    else if(bfxUsed) {
        // Bfx only, bfx symbol
        connectSocketBitfinex(symbol);
    }
};

function init() {
    // Enable charts and info footer
    document.getElementById("charts").style.display = 'flex';
    document.getElementById("info").style.display = 'block';

    // Load values from document
    trades = REST_TRADES;
    symbol = document.getElementById("symbol").innerHTML.trim();

    console.log("Symbol: " + symbol);

    min = parseFloat(document.getElementById("min").innerHTML);

    // Add placeholders for text input fields
    document.getElementById("form_min").placeholder = min;
    document.getElementById("form_symbol").placeholder = symbol.toUpperCase();

}

function connectSocketBinance(s) {
    var ws = new WebSocket(`wss://stream.binance.com:9443/ws/${s.toLowerCase()}@aggTrade`);

    // Each trade data object as parameter for update()
    ws.onmessage = function(event) {
        // console.log(event.data);
        update(JSON.parse(event.data));
    }
}

function connectSocketBitfinex(s) {
    var wss = new WebSocket('wss://api.bitfinex.com/ws/2');

    let msg = JSON.stringify({
        "event": "subscribe",
        "channel": "trades",
        "symbol": `t${s}`
    });

    wss.onmessage = (res) => update(JSON.parse(res.data));
    wss.onopen = () => wss.send(msg);
}