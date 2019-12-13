const request = require('request-promise')
const cheerio = require('cheerio')
const cookieJar = request.jar()

module.exports = function getVideoClipMeta (videoId, opts) {
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
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:42.0) Gecko/20100101 Firefox/42.0',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': language,
      Connection: 'keep-alive',
      'Cache-Control': 'max-age=0'
    }
  }).catch(error => {
    throw new Error(error)
  })
}

function fetchCommentCount (videoId, sessionToken, commentToken) {
  return request({
    jar: cookieJar,
    method: 'POST',
    url: 'https://www.youtube.com/watch_fragments_ajax',
    qs: {
      v: videoId,
      tr: 'scroll',
      distiller: '1',
      ctoken: commentToken,
      frags: 'comments',
      spf: 'load'
    },
    headers: {
      'accept-language': 'en-US;q=1.0,en;q=0.9',
      'content-type': 'application/x-www-form-urlencoded',
      'cache-control': 'no-cache'
    },
    form: {
      session_token: sessionToken,
      client_url: 'https://www.youtube.com/watch?v=' + videoId
    }
  }).then(body => {
    const response = JSON.parse(body)
    if (response && response.body && response.body['watch-discussion']) {
      const $ = cheerio.load(response.body['watch-discussion'])
      const m = /comments?\s*.\s*([\d,]+)/i.exec(
        $('.comment-section-header-renderer').text()
      )
      if (m && m[1]) {
        return parseInt(m[1].replace(/[\s,]/g, ''), 10)
      }
    }
    return 0
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
  const dislikeCount = $('.like-button-renderer-dislike-button-unclicked span').text() || null
  const likeCount = $('.like-button-renderer-like-button-unclicked span').text() || null
  var tags = []
  //Yes, the jQuery each method is synchronous.
  $('meta[property="og:video:tag"]').each(function(i, elem) {
    tags[i] = $(this).attr('content');
  })
  const commentCount = await fetchCommentCount(videoId, extractSessionToken(body), extractCommentToken(body)) || 0
  const videoInfo = {
    videoId: videoId,
    url: $('.watch-main-col link[itemprop=url]').attr('href'),
    language: $('html').attr('lang'),
    title: $('.watch-main-col meta[itemprop=name]').attr('content'),
    description: $('.watch-main-col #eow-description').html() || $('.watch-main-col meta[itemprop=description]').attr('content'),
    owner: $('.yt-user-info > a').text(),
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
    dislikeCount: dislikeCount ? parseVotes(dislikeCount) : undefined,
    likeCount: likeCount ? parseVotes(likeCount) : undefined,
    channelThumbnailUrl: $('.yt-user-photo .yt-thumb-clip img').data('thumb'),
    tags: tags,
    commentCount: commentCount
  }
  //console.log(videoInfo)
  return videoInfo
}

function extractSessionToken (body) {
  var m = /XSRF_TOKEN':\s*"(.+?)",/i.exec(body)
  return m ? m[1] : undefined
}

function extractCommentToken (body) {
  var m = /COMMENTS_TOKEN':\s*"(.+?)",/i.exec(body)
  return m ? m[1] : undefined
}

function parseDuration (raw) {
  var m = /^[a-z]*(?:(\d+)M)?(\d+)S$/i.exec(raw)
  if (!m) return

  var minutes = m[1] ? parseInt(m[1], 10) : 0
  var seconds = m[2] ? parseInt(m[2], 10) : 0
  return minutes * 60 + seconds
}

function parseVotes (raw) {
  var rawCleaned = raw.replace(/([\D])/gim, '')
  return parseInt(rawCleaned, 10)
}
