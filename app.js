var needle = require('needle');
let tweeterSecrets = require("./Secrets/tweeterSecrets.js");
let FindAllCryptoMentions = require("./TweetParsers/FindAllCryptoMentions.js");
let isTweetCoinBaseLaunch = require("./TweetParsers/isTweetCoinBaseLaunch.js");
let isTweetProCoinBaseLaunch = require("./TweetParsers/isTweetProCoinBaseLaunch.js");
const binanceFunctions = require("./Trading/binance.js");
const AMOUNT_TO_BUY_IN_USDT = 40;
const fs = require('fs');
//webApp
let tradeHistoryTmp = {};
const express = require('express')
const app = express()

let coinbaseID = "574032254";
let coinbasePro = "720487892670410753";
let meID = "1341850552926408707";

// The code below sets the bearer token from your environment variables
// To set environment variables on Mac OS X, run the export command below from the terminal: 
// export BEARER_TOKEN='YOUR-TOKEN'
const token = tweeterSecrets.bearer_token;

const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules'
const streamURL = 'https://api.twitter.com/2/tweets/search/stream';

// Edit rules as desired here below
const KianRule = { 'value': 'from:1341850552926408707 -is:retweet' };
const CoinbaseRule = { 'value': 'from:574032254 -is:retweet' };
const ProCoinbaseRule = { 'value': 'from:720487892670410753 -is:retweet' };
const rules = [KianRule, CoinbaseRule, ProCoinbaseRule];

let rules_ID_Names_pairs = {};

async function getAllRules() {
    const response = await needle('get', rulesURL, {
        headers: {
            "authorization": `Bearer ${token}`
        }
    })

    if (response.statusCode !== 200) {
        console.log(response);
        //throw new Error(response.body);
        throw new Error("GetRuleError");
        return null;
    }

    return (response.body);
}

async function deleteAllRules(rules) {

    if (!Array.isArray(rules.data)) {
        return null;
    }

    const ids = rules.data.map(rule => rule.id);

    const data = {
        "delete": {
            "ids": ids
        }
    }

    const response = await needle('post', rulesURL, data, {
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`
        }
    })

    if (response.statusCode !== 200) {
        throw new Error(response.body);
        return null;
    }

    return (response.body);

}

async function setRules() {

    const data = {
        "add": rules
    }

    const response = await needle('post', rulesURL, data, {
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`
        }
    })

    if (response.statusCode !== 201) {
        console.log(response.body.errors[0]);
        //throw new Error(response.body);
        throw new Error("SetRuleError");
        //throw new Error(response.body);
        return null;
    }

    return (response.body);

}

function streamConnect() {
    //Listen to the stream
    const stream = needle.get(streamURL, {
        headers: {
            Authorization: `Bearer ${token}`,
            timeout: 20000
        }
    });

    stream.on('data', data => {
        try {
            const json = JSON.parse(data);
            ProcessTweet(json)
        } catch (e) {
            // Keep alive signal received. Do nothing.
        }
    }).on('error', error => {
        if (error.code === 'ETIMEDOUT') {
            stream.emit('timeout');
        }
    });

    return stream;

}

(async () => {
    let currentRules;
    try {
        // Gets the complete list of rules currently applied to the stream
        currentRules = await getAllRules();

        // Delete all rules. Comment the line below if you want to keep your existing rules.
        await deleteAllRules(currentRules);

        // Add rules to the stream. Comment the line below if you don't want to add new rules.
        await setRules();
        newRules = await getAllRules();
        newRules.data.forEach(nr => {
            if (nr.value == CoinbaseRule.value) rules_ID_Names_pairs.coinbase = nr.id;
            if (nr.value == ProCoinbaseRule.value) rules_ID_Names_pairs.procoinbase = nr.id;
            if (nr.value == KianRule.value) rules_ID_Names_pairs.kian = nr.id;
        })

    } catch (e) {
        console.error(e);
        process.exit(-1);
    }
    //init tradeHistory
    fs.readFile('./History/tradeHistory.json', 'utf-8', (err, data) => {
        if (err) {
            console.log(err);
        } else {
            // parse JSON object
            tradeHistoryTmp = JSON.parse(data.toString());
            // Listen to the stream.
            // This reconnection logic will attempt to reconnect when a disconnection is detected.
            // To avoid rate limites, this logic implements exponential backoff, so the wait time
            // will increase if the client cannot reconnect to the stream.

            const filteredStream = streamConnect()
            let timeout = 0;
            filteredStream.on('timeout', () => {
                // Reconnect on error
                console.warn('A connection error occurred. Reconnecting…');
                setTimeout(() => {
                    timeout++;
                    streamConnect(token);
                }, 2 ** timeout);
                streamConnect(token);
            });

            app.use(express.static('public'));
            app.get('/trades', function (req, res) {
                res.json(tradeHistoryTmp);
            });

            app.listen(3000);
        }
    });
})();

//Process tweet:
function ProcessTweet(tweet) {
    //check if any target crypto is mentionned : 
    let cryptoMentioned = FindAllCryptoMentions(tweet.data.text);
    console.log("");
    console.log("===========[ NEW TWEET RECEIVED]===========");
    console.log("TEXT : " + tweet.data.text);
    if (cryptoMentioned.length > 0) {
        console.log("I have found " + cryptoMentioned.length + " crypto mentions in this tweet :");
        //checking triggered rule name
        if (tweet.matching_rules[0].id == rules_ID_Names_pairs.kian) {
            //My Tweet Process
            console.log("FROM : ME");
            let isLaunch = isTweetCoinBaseLaunch(tweet.data.text);
            if (isLaunch) {
                console.log("This is a launch !");
                cryptoMentioned.forEach(c => {
                    binanceFunctions.Buy(c.tag, AMOUNT_TO_BUY_IN_USDT).then(result => {
                        console.log("RESULTS : ");
                        console.log(result);
                        if (result) {
                            result.forEach(r => {
                                //updateHistoryForEachTrade
                                if (r.result) tradeHistoryTmp.trades.push({ owner: r.owner, order: r.result, date: new Date(Date.now()), trigger:"FromME" });
                                else tradeHistoryTmp.trades.push({
                                    owner: r.owner,
                                    order: {
                                        symbol: c.tag,
                                        side: "BUY",
                                        status: "ERROR"
                                    },
                                    date: new Date(Date.now()),
                                    trigger:"coinbase" 
                                });
                            });
                        } else {
                            console.log("FAILED TO BUY");
                            tradeHistoryTmp.trades.push({
                                owner: "global", order: {
                                    symbol: c.tag,
                                    side: "BUY",
                                    status: "ERROR"
                                },
                                date: new Date(Date.now()),
                                trigger:"coinbase" 
                            });
                        };
                        saveHistory();
                    }, err => console.log(err))
                });
            }
            else console.log("Not a launch");
        } else if (tweet.matching_rules[0].id == rules_ID_Names_pairs.coinbase) {
            //} else if (true){   //CoinbaseProcess
            let isLaunch = isTweetCoinBaseLaunch(tweet.data.text);
            console.log("FROM : Coinbase.com");
            if (isLaunch) {
                console.log("This is a launch !");
                cryptoMentioned.forEach(c => {
                    binanceFunctions.Buy(c.tag, AMOUNT_TO_BUY_IN_USDT).then(result => {
                        console.log("RESULTS : ");
                        console.log(result);
                        if (result) {
                            result.forEach(r => {
                                //updateHistoryForEachTrade
                                if (r.result) tradeHistoryTmp.trades.push({ owner: r.owner, order: r.result, date: new Date(Date.now()), trigger:"coinbase" });
                                else tradeHistoryTmp.trades.push({
                                    owner: r.owner,
                                    order: {
                                        symbol: c.tag,
                                        side: "BUY",
                                        status: "ERROR"
                                    },
                                    date: new Date(Date.now()),
                                    trigger:"coinbase" 
                                });
                            });
                        } else {
                            console.log("FAILED TO BUY");
                            tradeHistoryTmp.trades.push({
                                owner: "global", order: {
                                    symbol: c.tag,
                                    side: "BUY",
                                    status: "ERROR"
                                },
                                date: new Date(Date.now()),
                                trigger:"coinbase" 
                            });
                        };
                        saveHistory();
                    }, err => console.log(err))
                });
            }
            else console.log("Not a launch");
        } else if (tweet.matching_rules[0].id == rules_ID_Names_pairs.procoinbase) {
            //ProCoinbaseProcess
            let isLaunch = isTweetProCoinBaseLaunch(tweet.data.text);
            console.log("FROM : ProCoinbase.com");
            if (isLaunch) {
                console.log("This is a launch !");
                cryptoMentioned.forEach(c => {
                    binanceFunctions.Buy(c.tag, AMOUNT_TO_BUY_IN_USDT).then(result => {
                        if (result) {
                            result.forEach(r => {
                                //updateHistoryForEachTrade
                                if (r.result) tradeHistoryTmp.trades.push({ owner: r.owner, order: r.result, date: new Date(Date.now()), tweet:"pro.coinbase"});
                                else tradeHistoryTmp.trades.push({
                                    owner: r.owner,
                                    order: {
                                        symbol: c.tag,
                                        side: "BUY",
                                        status: "ERROR"
                                    },
                                    date: new Date(Date.now()),
                                    tweet:"pro.coinbase" 
                                });
                            })
                        } else {
                            console.log("FAILED TO BUY");
                            tradeHistoryTmp.trades.push({
                                owner: "global", order: {
                                    symbol: c.tag,
                                    side: "BUY",
                                    status: "ERROR"
                                },
                                date: new Date(Date.now()),
                                tweet:"pro.coinbase" 
                            });
                        };
                        saveHistory();
                    }, err => console.log(err))
                });
            }
            else console.log("Not a launch");
        }
    } else {
        console.log("No crypto found in this tweet.");
    }
}

function saveHistory() {
    try {
        fs.writeFileSync('./History/tradeHistory.json', JSON.stringify(tradeHistoryTmp));
    } catch (error) {
        console.error(err);
    }
}

/*
//TEST
fakeTweets = [
    {
        data: { id: '1', text: 'launching at coinbase.com LINK' },
        matching_rules: [{ id: 1, tag: null }]
    }
]

setTimeout(function () {
    fakeTweets.forEach(ft => {
        ProcessTweet(ft);
    })
}, 5000);*/