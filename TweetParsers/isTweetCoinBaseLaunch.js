const cb = "https://t.co/sc0cuzadjl";

module.exports = function isTweetCoinBaseLaunch(tweetText){
    return (tweetText.toLowerCase().includes("launching at coinbase.com") || tweetText.toLowerCase().includes("launching at " + cb));
}