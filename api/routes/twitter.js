const { Router } = require('express')
const querystring = require('querystring')

const router = Router()

const Twitter = require('twitter')

const client = req => new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: req.session.oauth.access_token,
  access_token_secret: req.session.oauth.access_token_secret
})

// An API wrapper for cursoring.
// Parameter "key" represents attribute for main content array in response. 
router.get('/twitter/util/concat_cursor/*', async (req, res, next) => {
  if (req.session && !req.session.oauth) {
    res.status(401).send('unauthorized')
  }
  req.query.cursor = -1
  const key = req.query.key ? req.query.key : 'users'

  const tmpClient = client(req)
  let data = []
  while (req.query.cursor !== 0) {
    let response = {}
    try {
      response = await tmpClient.get(req.params['0'], req.query)
      data = data.concat(response[key])
      req.query.cursor = response.next_cursor
    }
    catch (err) {
      console.log(err)
      break
    }
  }
  res.json(data)
})

// An API wrapper for concatenating by max_id.
// Assuming that response is an array. 
// Parameter "max_count" is passed to API as "count" parameter.
// Usage: Get 1000 tweets from @twitter by collecting 100 tweets per each API call.
//   GET /twitter/util/concat_id/statuses/user_timeline?screen_name=twtiter&count=1000&max_count=100
router.get('/twitter/util/concat_id/*', async (req, res, next) => {
  if (req.session && !req.session.oauth) {
    res.status(401).send('unauthorized')
  }
  const maxCount = req.query.max_count ? req.query.max_count : 200
  const totalCount = req.query.count ? req.query.count : maxCount
  delete req.query.max_count
  req.query.count = maxCount

  const tmpClient = client(req)
  let data = []
  let maxId = -1
  while (data.length < totalCount) {
    if (maxId !== -1) {
      req.query.max_id = maxId
    }
    let response = []
    try {
      response = await tmpClient.get(req.params['0'], req.query)
    }
    catch (err) {
      res.json(err)
    }
    data = data.concat(response)
    if (!response[response.length - 1]) {
      break
    }
    maxId = response[response.length - 1].id
  }
  res.json(data)
})

router.get('/twitter/util/search_tweets', async (req, res, next) => {
  if (req.session && !req.session.oauth) {
    res.status(401).send('unauthorized')
  }
  const maxCount = 100
  const totalCount = req.query.count ? req.query.count : maxCount
  req.query.count = maxCount

  const tmpClient = client(req)
  let data = []
  let maxId = 0
  while (data.length < totalCount) {
    req.query.max_id = maxId
    let response = {}
    try {
      response = await tmpClient.get('/search/tweets', req.query)
    }
    catch (err) {
      res.json(err)
    }
    const next_results = response.search_metadata.next_results
    data = data.concat(response.statuses)
    maxId = querystring.parse(next_results).max_id
  }
  res.json(data)
})

router.get('/twitter/*', (req, res, next) => {
  if (req.session && !req.session.oauth) {
    res.status(401).send('unauthorized')
  }
  client(req).get(req.params['0'], req.query)
    .then(response => {
      res.json(response)
    })
    .catch(err => {
      console.log(err)
      next(err)
    })
})

router.post('/twitter/*', (req, res, next) => {
  if (req.session && !req.session.oauth) {
    res.status(401).send('unauthorized')
  }
  client(req).post(req.params['0'], req.body)
    .then(response => {
      res.json(response)
    })
    .catch(err => {
      console.log(err)
      next(err)
    })
})

module.exports = router
