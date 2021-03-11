const Binance = require('node-binance-api');
let binanceSecrets = require("../Secrets/binanceSecrets");
const util = require('util')

const binances = [];
binanceSecrets.forEach(b => {
    binances.push(new Binance().options({
        APIKEY: b.apikey,
        APISECRET: b.secretKey,
        useServerTime: true
    }))
});

let binanceFunctions = {};

binanceFunctions.Check = (cryptoTags) => {
    return binance.prices(cryptoTags, (error, ticker) => {
        return { error: error, ticker: ticker }
    });
}

/**
 * 
 * @param {*} cryptoTag the tag of the crypto to buy
 * @param {*} amount_in_usdt amount to buy in USDT
 * @return the app will buy the crypto forEach binanceSecret and return a tab with the results in case of success. false otherwise
 */
binanceFunctions.Buy = (cryptoTag, amount_in_usdt) => {
    return util.promisify(binances[0].prices)(cryptoTag + "USDT").then(ticker1 => {
        //Calculating quanity to buy
        let priceInUSDT = ticker1[cryptoTag + "USDT"];
        let dec = calcNbDecimals(priceInUSDT);
        let quantity = Number((amount_in_usdt / priceInUSDT).toFixed(dec));
        //BUY REQUEST
        let buyPromises = [];
        binances.forEach(b => {
            buyPromises.push(util.promisify(b.marketBuy)(cryptoTag + "USDT", quantity).then(s => {
                return s;
            }, err => {
                console.log(err.body);
                return false;
            }))
        });
        return Promise.all(buyPromises).then(results => {
            let returnValues = [];
            for (let i = 0; i < results.length; i++) {
                returnValues.push({ result: results[i], owner: binanceSecrets[i].owner });
            }
            return returnValues;
        })
    }, err1 => {
        return util.promisify(binances[0].prices)(cryptoTag + "BTC").then(ticker2 => {
            return util.promisify(binances[0].prices)("BTCUSDT").then(ticker3 => {
                //Calculating quanity to buy
                let priceInBTC = ticker2[cryptoTag + "BTC"];
                let priceBTCinUSDT = ticker3.BTCUSDT;
                let dec = calcNbDecimals(priceInBTC * priceBTCinUSDT);
                //let quantity = Number((amount_in_usdt / (priceInBTC * priceBTCinUSDT)).toFixed(dec));
                let decBTC = calcNbDecimals(priceBTCinUSDT);
                let BTCQty = Number((amount_in_usdt / priceBTCinUSDT).toFixed(decBTC));
                //BUY REQUEST
                let buyPromises = [];
                binances.forEach(b => {
                    buyPromises.push(util.promisify(b.marketBuy)("BTCUSDT", BTCQty).then(s => {
                        console.log("Bought BTC");
                        console.log(s);
                        let fee = 0;
                        s.fills.forEach(f => fee += f.commission);
                        console.log("TOTAL FEE : " + fee);
                        BTCQty = s.executedQty - fee;
                        let qtyToBuy = Number((BTCQty / priceInBTC).toFixed(dec));
                        console.log("qtyToBuy : " + qtyToBuy);
                        return util.promisify(b.marketBuy)(cryptoTag + "BTC", qtyToBuy).then(s2 => {
                            return s2;
                        }, err => {
                            console.log(err.body);
                            return false;
                        });
                    }, err => {
                        console.log(err.body);
                        return false;
                    }));
                });
                return Promise.all(buyPromises).then(results => {
                    let returnValues = [];
                    for (let i = 0; i < results.length; i++) {
                        returnValues.push({ result: results[i], owner: binanceSecrets[i].owner });
                    }
                    return returnValues;
                });
            }, err3 => {
                //Erreur ou pas de paire
                console.log("ERREUR 1 : " + err1.body);
                console.log("ERREUR 3 : " + err3.body);
                return false;
            })
        }, err2 => {
            //Erreur ou pas de paire
            console.log("ERREUR 1 : " + err1.body);
            console.log("ERREUR 2 : " + err2.body);
            return false;
        })
    });
}

function calcNbDecimals(price){
    if (price < 10000)
        if (price < 1000)
            if (price < 100)
                if (price < 10)
                    return 0;
                else return 1;
            else return 2;
        else return 3;
    else return 4;
}

module.exports = binanceFunctions;