var Twitter = require('twitter');

let coinbaseID = "574032254";

var client = new Twitter({
  consumer_key: 'rcegczcSvRDrEndm0qnWnCFeC',
  consumer_secret: 'pJKtBnDEB5EIuSzLaHf4wK6iYc4Dlr2viOxVcwLKZPbSbshLfA',
  bearer_token: 'AAAAAAAAAAAAAAAAAAAAAFaxKwEAAAAAY81kmsdntScvIw%2FQm0NOECcSzm4%3D69DnnFQX3ZVWZFH11wgp0ZWa5oKqmTgwEcywnOF3DimDIsJIie'
});

var params = {
  q: '574032254',
  count: 3,
  result_type: 'recent',
  lang: 'en'
}

/*
//https://api.twitter.com/1.1/statuses/user_timeline.json
client.get('search/tweets', params, function (err, data, response) {
  if (!err) {
    let i = 1;
    data.statuses.forEach(tw => {
      console.log("---------[TWEET N°" + i + "]----------");
      console.log(tw.created_at);
      console.log(tw.text);
      i++;
    })
  } else {
    console.log(err);
  }
})
*/

let stream = client.stream('statuses/filter', { track: "javascript" })

stream.on('tweet', function (tweet) {
  console.log(tweet.text)
})

stream.on('error', function(error){
  console.log(error);
});