const express = require('express');
const bodyParser = require('body-parser');
const request = require('request-promise');
const pairs = require('./public/pairs.json');
const app = express();


app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
    res.render('index', {
        last100: null,
        last500: null,
        error: null
    });
});

// Trades from both exchanges
var bigTradesList;

// TODO
var min;
var bfxUsed, bncUsed;

app.post('/', async function(req, res) {
    bigTradesList = [];
    let symbol = req.body.symbol.toUpperCase();
    min = req.body.min;
    bfxUsed = false;
    bncUsed = false;

    // Ind. pairs
    const bfx = pairs['pairs_bfx'];
    const bnc = pairs['pairs_bnc'];
    // Dictionary
    const pairsDict = pairs['pairs_dict'];

    if (pairsDict[symbol]) {
        console.log("Bitfinex and Binance.");
        restBitfinex(symbol).then(restBinance.bind(null, pairsDict[symbol])).then(renderPage.bind(null, res, symbol));
    } else if (bfx.includes(symbol)) {
        console.log("Bitfinex only.");
        restBitfinex(symbol).then(renderPage.bind(null, res, symbol));
    } else if (bnc.includes(symbol)) {
        console.log("Binance only.");
        restBinance(symbol).then(renderPage.bind(null, res, symbol));
    }
});

var renderPage = function(res, symbol) {
    console.log("Preparing trades.");

    // Order trades by their timestamps
    bigTradesList.sort(function(a, b) {
        if (a['T'] < b['T']) {
            return -1;
        }
        if (a['T'] > b['T']) {
            return 1;
        }
        if (a['T'] === b['T']) {
            return 0;
        }
    });

    console.log("Sorted: " + (bigTradesList[0]['T'] < bigTradesList[bigTradesList.length - 1]['T']));
    console.log("First - Last: " + bigTradesList[0]['T'] + " - " + bigTradesList[bigTradesList.length - 1]['T']);

    // Limiting list to 500 trades
    bigTradesList.splice(500, bigTradesList.length - 500);
    console.log("Spliced: " + bigTradesList.length);

    let last500 = {
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
    let last100 = {
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

    // Last element is the latest trade
    let last_trade_timestamp = bigTradesList[499]['T'];
    console.log("Last trade: " + last_trade_timestamp);

    for (var i = 0; i < bigTradesList.length; i++) {
        var item = bigTradesList[i];

        // Last 100
        if (i >= 400) {
            if (item['m']) {
                // 'm': True -> Seller
                last100.seller.total++;
                last100.seller.volume += parseFloat(item['q']);
                if (parseFloat(item['q']) > min) {
                    last100.seller.big++;
                    if (parseFloat(item['q']) > min * 2) {
                        last100.seller.bigger++;
                    }
                }
            } else {
                last100.buyer.total++;
                last100.buyer.volume += parseFloat(item['q']);
                if (parseFloat(item['q']) > min) {
                    last100.buyer.big++;
                    if (parseFloat(item['q']) > min * 2) {
                        last100.buyer.bigger++;
                    }
                }
            }
        }

        // Last 500
        if (item['m']) {
            // 'm': True -> Seller
            last500.seller.total++;
            last500.seller.volume += parseFloat(item['q']);
            if (parseFloat(item['q']) > min) {
                last500.seller.big++;
                if (parseFloat(item['q']) > min * 2) {
                    last500.seller.bigger++;
                }
            }
        } else {
            last500.buyer.total++;
            last500.buyer.volume += parseFloat(item['q']);
            if (parseFloat(item['q']) > min) {
                last500.buyer.big++;
                if (parseFloat(item['q']) > min * 2) {
                    last500.buyer.bigger++;
                }
            }
        }
    }

    console.log("Rendering page.");
    res.render('socket', {
            last100: last100,
            last500: last500,
            symbol: symbol.trim(),
            last_trade_timestamp: last_trade_timestamp,
            trades: bigTradesList,
            min: min,
            bfxUsed: bfxUsed,
            bncUsed: bncUsed,
            error: null
        });
    console.log("--------------------");
}

var restBinance = async function(symbol) {
    let url = `https://api.binance.com/api/v1/aggTrades?symbol=${symbol}`;

    await request(url, function(err, response, body) {
        if (err) {
            console.log("Connection error: Binance");
        } else {
            let trades = JSON.parse(body);
            if (trades.length != 500) {
                console.log("Wrong symbol error: Binance");
            } else {
                console.log("REST Data downloaded: Binance " + symbol);
                var data;
                for (var i = 0; i < trades.length; i++) {
                    data = {
                        'q': null,
                        'T': null,
                        'm': null
                    };
                    if (trades[i]['q'] !== undefined) {
                        data['q'] = trades[i]['q'];
                        data['T'] = trades[i]['T'];
                        data['m'] = trades[i]['m'];
                        bigTradesList.push(data);
                    }
                }
                bncUsed = true;
            }
        }
    });
}

var restBitfinex = async function(symbol) {
    let url = `https://api.bitfinex.com/v2/trades/t${symbol}/hist?limit=500`;

    await request(url, function(err, response, body) {
        if (err) {
            console.log("Connection error: Bitfinex");
        } else {
            let trades = JSON.parse(body)
            if (trades.length != 500) {
                console.log("Wrong symbol error: Bitfinex");
            } else {
                console.log("REST Data downloaded: Bitfinex " + symbol);
                var data;
                for (var i = 0; i < trades.length; i++) {
                    data = {
                        'q': null,
                        'T': null,
                        'm': null
                    };
                    if (trades[i][2] !== undefined) {
                        data['q'] = Math.abs(trades[i][2]);
                        data['T'] = trades[i][1];
                        (trades[i][2] < 0) ? data['m'] = true: data['m'] = false;
                        bigTradesList.push(data);
                    }
                }
                bfxUsed = true;
            }
        }
    });
}

app.listen(process.env.PORT || 3000, function() {
    console.log('Listening on port 3000...');
});