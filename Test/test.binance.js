const binanceFunctions = require("../Trading/binance.js");
let binanceSecrets = require("../Secrets/binanceSecrets");
const Binance = require('node-binance-api');
const util = require('util')

/*
binanceFunctions.Buy("LINK", 16).then(s => {
    console.log(s);
}, err => {
    console.log("err");
});


const binances = [];
binanceSecrets.forEach(b => {
    binances.push(new Binance().options({
        APIKEY: b.apikey,
        APISECRET: b.secretKey
    }))
});

let buyPromises = [];
binances.forEach(b => {
    buyPromises.push(util.promisify(b.marketBuy)("LINKUSDT", 1).then(s => {
        console.log(s);
        return s;
    }, err => {
        console.log("err");
        return false;
    }))
});

Promise.all(buyPromises).then(results => {
    let returnValues = [];
    for (let i = 0; i < results.length; i++) {
        returnValues.push({ result: results[i], owner: binanceSecrets[i].owner });
    }
    console.log(returnValues);
})*/

binanceFunctions.Buy("BAND", 15).then(r => {
    console.log("RESULT :: ");
    console.log(r);
});