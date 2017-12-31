# Last Trades

Let's user see the last 100 and 500 trade volume and a couple of useful info on a selected currency pair on Bitfinex and Binance.
It was just for prototyping, so it's not clean and well written, wouldn't recommend for prod.

![alt text](https://i.imgur.com/bRhaUXm.png)

User inputs the currency pair and a threshold amount of currency to differenciate big buyers (bigger = min*2), then the initial data gets loaded from the REST API's of Bitfinex and Binance and once the page is loaded, new data is received via websockets. Though it's possible to use any individual currency pairs on Bitfinex/Binance, symbols should default to Bitfinex-style in order to get data from both exchanges.
The values are highlighted according to their respective comparison as a simple buy/sell indicator.
