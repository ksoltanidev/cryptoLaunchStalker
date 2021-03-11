var Twitter = require('twitter');
let tweeterSecrets = require("./Secrets/tweeterSecrets");

var client = new Twitter(tweeterSecrets); 

let stream = client.stream('statuses/filter', { track: "javascript" })

stream.on('tweet', function (tweet) {
  console.log(tweet.text)
})

stream.on('error', function(error){
  console.log(error);
});