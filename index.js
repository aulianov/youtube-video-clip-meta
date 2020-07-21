const request = require('request-promise-native')
const cheerio = require('cheerio')
const cookieJar = request.jar()

module.exports = async function getVideoClipMeta (videoId, opts) {
  return new Promise(function(resolve, reject) {
    if (!videoId || typeof videoId !== 'string') {
      reject(new Error('No video ID was provided.'))
    } else {
      const language = (opts && typeof opts === 'object' && "language" in opts) ? opts.language : 'en-US'
      //console.log(`Fetching YouTube page for ${videoId}`)
      fetchVideoPage(videoId, language)
      .then(body => parseVideoInfo(body))
      .then(videoInfo => {
        if (!videoInfo || !videoInfo.title) {
          reject(new Error("Video does not exist"))
        } else {
          resolve(videoInfo)
        }
      })
      .catch(error => reject(error))
    }
  })
}

function fetchVideoPage (videoId, language) {
  return request({
    url: 'https://www.youtube.com/watch?v=' + videoId,
    jar: cookieJar,
    headers: {
      Host: 'www.youtube.com',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:45.0) Gecko/20100101 Firefox/45.0',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': language,
      Connection: 'keep-alive',
      'Cache-Control': 'max-age=0'
    }
  }).catch(error => {
    throw new Error(error)
  })
}

async function parseVideoInfo (body) {
  const $ = cheerio.load(body, {decodeEntities: false})
  const videoId = $('.watch-main-col meta[itemprop=videoId]').attr('content')
  //console.log(`Start parsing YouTube page ${videoId}`)
  const paid = $('.watch-main-col meta[itemprop=paid]').attr('content') || null
  const unlisted = $('.watch-main-col meta[itemprop="unlisted"]').attr('content') || null
  const isFamilyFriendly = $('.watch-main-col meta[itemprop="isFamilyFriendly"]').attr('content') || null
  const duration = $('.watch-main-col meta[itemprop="duration"]').attr('content') || null
  const regionsAllowed = $('.watch-main-col meta[itemprop="regionsAllowed"]').attr('content') || null
  const views = $('.watch-main-col meta[itemprop="interactionCount"]').attr('content') || null
  var dislikeCount //$('.like-button-renderer-dislike-button-unclicked span').text() || null
  var likeCount //$('.like-button-renderer-like-button-unclicked span').text() || null
  var tags = []
  var channelThumbnailUrl
  //Yes, the jQuery each method is synchronous.
  $('meta[property="og:video:tag"]').each(function(i, elem) {
    tags[i] = $(this).attr('content');
  })
  // parse Likes/Dislikes count from raw html source
  let startRawString = body.indexOf('sentimentBarRenderer')
  if (startRawString) {
    let rawString = body.slice(startRawString , body.indexOf('}}', startRawString))
    let matched = rawString.match(/([0-9\s]+)\/([0-9\s]+)/ig)
    if (matched && matched[0]) {
      let r = matched[0].split('/')
      if (r && r[0] && r[1]) {
        likeCount = parseInt(r[0].replace(/\s/g,'')) || null
        dislikeCount = parseInt(r[1].replace(/\s/g,'')) || null
      }
    }
  }
  // parse channelThumbnailUrl from raw html
  try {
    let startRawString = body.indexOf('[{', body.indexOf('thumbnails', body.indexOf('videoOwnerRenderer')))
    let rawString = body.slice(startRawString, body.indexOf('}]', startRawString))
    eval("var thumbnails = " + rawString + '}]')
    if (thumbnails && Array.isArray(thumbnails) && thumbnails.length) {
      channelThumbnailUrl = thumbnails.slice(-1)[0]['url']
    }
  } catch(err) {}
  //output array
  const videoInfo = {
    videoId: videoId,
    url: $('.watch-main-col link[itemprop=url]').attr('href'),
    language: $('html').attr('lang'),
    title: $('.watch-main-col meta[itemprop=name]').attr('content'),
    description: $('.watch-main-col #eow-description').html() || $('.watch-main-col meta[itemprop=description]').attr('content'),
    owner: $('[itemprop=author] [itemprop=name]').attr('content'),
    channelId: $('.watch-main-col meta[itemprop=channelId]').attr('content'),
    thumbnailUrl: $('.watch-main-col link[itemprop=thumbnailUrl]').attr('href'),
    datePublished: $('.watch-main-col meta[itemprop=datePublished]').attr('content'),
    genre: $('.watch-main-col meta[itemprop=genre]').attr('content'),
    paid: paid === 'True' ? true : (paid === 'False' ? false : undefined),
    unlisted: unlisted === 'True' ? true : (unlisted === 'False' ? false : undefined),
    isFamilyFriendly: isFamilyFriendly === 'True' ? true : (isFamilyFriendly === 'False' ? false : undefined),
    duration: duration ? parseDuration(duration) : undefined,
    views: views ? parseInt(views, 10) : undefined,
    regionsAllowed: regionsAllowed ? regionsAllowed.split(',') : undefined,
    dislikeCount: Number.isInteger(dislikeCount) ? dislikeCount : undefined,
    likeCount: Number.isInteger(likeCount) ? likeCount : undefined,
    channelThumbnailUrl: channelThumbnailUrl || undefined,
    tags: tags
  }
  //console.log(videoInfo)
  return videoInfo
}

function parseDuration (raw) {
  var m = /^[a-z]*(?:(\d+)M)?(\d+)S$/i.exec(raw)
  if (!m) return

  var minutes = m[1] ? parseInt(m[1], 10) : 0
  var seconds = m[2] ? parseInt(m[2], 10) : 0
  return minutes * 60 + seconds
}
