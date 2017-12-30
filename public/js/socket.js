let trades;
let min;
let last100, last500;
let counter = 0;
let symbol;

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
    [].forEach.call(document.getElementsByClassName("box"), function (e) {e.classList.remove("highlight")});

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
    recalculate(); // to highlight initial values
    connectSocket();
};

function init() {
    // Enable charts and info footer
    document.getElementById("charts").style.display = 'flex';
    document.getElementById("info").style.display = 'block';

    // Load values from document
    trades = REST_TRADES;
    symbol = document.getElementById("symbol").innerHTML.trim().toLowerCase();
    min = parseFloat(document.getElementById("min").innerHTML);

    // Add placeholders for text input fields
    document.getElementById("form_min").placeholder = min;
    document.getElementById("form_symbol").placeholder = symbol.toUpperCase();

}

function connectSocket() {
    var ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@aggTrade`);

    // Each trade data object as parameter for update()
    ws.onmessage = function(event) {
        //console.log(event.data);
        update(JSON.parse(event.data));
    }
}