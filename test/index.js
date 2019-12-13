const expect = require('chai').expect
const getVideoClipMeta = require('../index')

describe('youtube-video-clip-meta', function () {

  it('should export a function', function () {
    expect(require('../index')).to.be.a('function')
  })

  it('should support async/await mode and arrow function', async () => {
    this.timeout(60000)
    const videoInfo = await getVideoClipMeta('Rb0UmrCXxVA', {language: 'fr'})
    expect(videoInfo).to.exist
    expect(videoInfo).to.have.a.property('title').which.is.a('string')
  })

  it('should support promises mode', function () {
    this.timeout(60000)
    return getVideoClipMeta('Rb0UmrCXxVA', {language: 'fr'}).then(function (videoInfo) {
      expect(videoInfo).to.exist
      expect(videoInfo).to.have.a.property('title').which.is.a('string')
    })
  })

  it('should return errors for promises', function () {
    this.timeout(60000)
    return getVideoClipMeta('fakeID').catch(function (error) {
      expect(error).to.exist
    })
  })

  it('should fail if video does not exist', () => {
    this.timeout(60000)
    return getVideoClipMeta('abc123xyz')
      .then(videoInfo => {
        expect.fail('Should fail')
      })
      .catch(e => {
        expect(/not exist/i.test(e.message)).to.be.true
      })
  })

  it('should return video info', function () {
    this.timeout(60000)
    return getVideoClipMeta('Rb0UmrCXxVA', {language: 'ru'}).then(function (videoInfo) {
      expect(videoInfo).to.exist
      expect(videoInfo).to.have.a.property('videoId').which.is.a('string')
      expect(videoInfo).to.have.a.property('url').which.is.a('string')
      expect(videoInfo).to.have.a.property('language').which.is.a('string')
      expect(videoInfo).to.have.a.property('title').which.is.a('string')
      expect(videoInfo).to.have.a.property('description').which.is.a('string')
      expect(videoInfo).to.have.a.property('owner').which.is.a('string')
      expect(videoInfo).to.have.a.property('channelId').which.is.a('string')
      expect(videoInfo).to.have.a.property('thumbnailUrl').which.is.a('string')
      expect(videoInfo).to.have.a.property('datePublished').which.is.a('string')
      expect(videoInfo).to.have.a.property('genre').which.is.a('string')
      expect(videoInfo).to.have.a.property('paid').which.is.a('boolean')
      expect(videoInfo).to.have.a.property('unlisted').which.is.a('boolean')
      expect(videoInfo).to.have.a.property('isFamilyFriendly').which.is.a('boolean')
      expect(videoInfo).to.have.a.property('duration').which.is.a('number').above(0)
      expect(videoInfo).to.have.a.property('views').which.is.a('number').above(0)
      expect(videoInfo).to.have.a.property('regionsAllowed').which.is.a('array')
      expect(videoInfo.regionsAllowed).to.have.length.above(0)
      expect(videoInfo).to.have.a.property('likeCount').which.is.a('number').above(0)
      expect(videoInfo).to.have.a.property('dislikeCount').which.is.a('number').above(0)
      expect(videoInfo).to.have.a.property('channelThumbnailUrl').which.is.a('string')
      expect(videoInfo).to.have.a.property('tags').which.is.a('array')
      expect(videoInfo.tags).to.have.length.above(0)
      expect(videoInfo).to.have.a.property('commentCount').which.is.a('number').above(0)
    })
  })
  
})
