let cryptoList = require("../Cryptos/cryptoList.js");

module.exports = function FindAllCryptoMentions(tweetText) {
    //cryptoList.cryptos.forEach(c => {
    let result = [];
    for (let i = 0; i < cryptoList.cryptos.length; i++) {
        let c = cryptoList.cryptos[i];
        if (tweetText.toLowerCase().includes(c.fullName.toLowerCase()) || tweetText.includes(c.tag)) result.push(c);
        else {
            let found = false;
            for (let j = 0; j < c.othernames_case_insensitive.length; j++) {//c.othernames.forEach(on => {
                on = c.othernames_case_insensitive[j]
                if (tweetText.toLowerCase().includes(on.toLowerCase())) {
                    result.push(c);
                    found = true;
                    break;
                }
            };
            if (found) break;
            for (let j = 0; j < c.othernames_case_sensitive.length; j++) {//c.othernames.forEach(on => {
                on = c.othernames_case_sensitive[j]
                if (tweetText.includes(on)) {
                    result.push(c);
                    break;
                }
            }
        }
    };
    return result;
}