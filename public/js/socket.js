let trades;
let min;
let last100, last500;
let counter = 0;

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
        if (i > 399) {
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

    document.getElementById("seller_volume100").innerHTML = last100.seller.volume > 999 ? Math.round(last100.seller.volume/1000) + 'k' : Math.round(last100.seller.volume);
    document.getElementById("seller_volume500").innerHTML = last500.seller.volume > 999 ? Math.round(last500.seller.volume/1000) + 'k' : Math.round(last500.seller.volume);


    document.getElementById("buyer_total100").innerHTML = last100.buyer.total;
    document.getElementById("buyer_total500").innerHTML = last500.buyer.total;

    document.getElementById("buyer_big100").innerHTML = last100.buyer.big;
    document.getElementById("buyer_big500").innerHTML = last500.buyer.big;

    document.getElementById("buyer_bigger100").innerHTML = last100.buyer.bigger;
    document.getElementById("buyer_bigger500").innerHTML = last500.buyer.bigger;

    document.getElementById("buyer_volume100").innerHTML = last100.buyer.volume > 999 ? Math.round(last100.buyer.volume/1000) + 'k' : Math.round(last100.buyer.volume);
    document.getElementById("buyer_volume500").innerHTML = last500.buyer.volume > 999 ? Math.round(last500.buyer.volume/1000) + 'k' : Math.round(last500.buyer.volume);

    // Highlight cells
    // Reset highlights
    [].forEach.call(document.getElementsByClassName("box"), function (e) {e.classList.remove("highlight")});
    // cond ? yes : no
    last500.buyer.total > last500.seller.total ? highlight("buyer_total500") : highlight("seller_total500");
    last500.buyer.volume > last500.seller.volume ? highlight("buyer_volume500") : highlight("seller_volume500");
    last500.buyer.big > last500.seller.big ? highlight("buyer_big500") : highlight("seller_big500");
    last500.buyer.bigger > last500.seller.bigger ? highlight("buyer_bigger500") : highlight("seller_bigger500");

    last100.buyer.total > last100.seller.total ? highlight("buyer_total100") : highlight("seller_total100");
    last100.buyer.volume > last100.seller.volume ? highlight("buyer_volume100") : highlight("seller_volume100");
    last100.buyer.big > last100.seller.big ? highlight("buyer_big100") : highlight("seller_big100");
    last100.buyer.bigger > last100.seller.bigger ? highlight("buyer_bigger100") : highlight("seller_bigger100");
}

function highlight(id) {
    var e = document.getElementById(id);
    // Box is parent
    e.parentElement.classList.add("highlight");
}

function update(item) {
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

window.onload = function() {
    init();
    connectSocket();
};

function init() {
    // Enable charts and info footer
    document.getElementById("charts").style.display = 'flex';
    document.getElementById("info").style.display = 'block';

    // Load values from document
    trades = REST_TRADES;
    min = parseFloat(document.getElementById("min").innerHTML);

}

function connectSocket() {
    var symbol = document.getElementById("symbol").innerHTML.trim().toLowerCase();
    var ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@aggTrade`);

    // Each trade data object as parameter for update()
    ws.onmessage = function(event) {
        //console.log(event.data);
        update(JSON.parse(event.data));
    }
}