const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
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

app.post('/', function(req, res) {
    let symbol = req.body.symbol.toUpperCase();
    let min = req.body.min;
    let url = `https://api.binance.com/api/v1/aggTrades?symbol=${symbol}`;

    request(url, function(err, response, body) {
        if (err) {
            res.render('index', {
                last100: null,
                last500: null,
                error: 'Error, please try again'
            });
        } else {
            let trades = JSON.parse(body)
            if (trades.length != 500) {
                res.render('index', {
                    last100: null,
                    last500: null,
                    error: 'Wrong symbol, please try again'
                });
            } else {
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

                let last_trade_timestamp = trades[499]['T'];
                trades.forEach(function(item, index) {
                    // Last 100
                    if (index >= 400) {
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
                                last100.seller.bigger++;
                            }
                        }
                    } else {
                        last500.buyer.total++;
                        last500.buyer.volume += parseFloat(item['q']);
                        if (parseFloat(item['q']) > min) {
                            last500.buyer.big++;
                            if (parseFloat(item['q']) > min * 2) {
                                last100.buyer.bigger++;
                            }
                        }
                    }
                });
                res.render('socket', {
                    last100: last100,
                    last500: last500,
                    symbol: symbol,
                    last_trade_timestamp: last_trade_timestamp,
                    trades: trades,
                    min: min,
                    error: null
                });
            }
        }
    });
})

app.listen(process.env.PORT || 3000, function() {
    console.log('Listening on port 3000...');
});