# Youtube Video Clip Meta

## Purpose

A Node.js module that fetches meta information about YouTube videos. The information is scraped directly from the YouTube website, so no need for a Google API-key.

**This project is in no way affiliated with YouTube.**

## Installation

Install as a module via npm.

```bash
$ npm install aulianov/youtube-video-clip-meta
```

## Usage

`http//www.youtube.com/watch?v={videoId}`

``` javascript
const getVideoClipMeta = require('youtube-video-clip-meta')
getVideoClipMeta(videoId, {language: 'fr'})
.then(videoInfo => {
  console.log(videoInfo)
})
.catch(error => {
  console.log(error)
})

```

| Parameter     | Meaning       |
|:--------------|:---------------|
| videoId       | ID of youtube Video |
| params        | (optional) language option

## Result

```
{
  videoId: '{video Id}',
  url: '{video url}',
  language: '{language}',
  title: '{video title}',
  description: '{video description as HTML}',
  owner: '{video owner}',
  channelId: '{owner channel id}',
  thumbnailUrl: '{video thumbnail url}',
  datePublished: '{video publication date as YYYY-mm-dd}',
  genre: '{video genre}',
  paid: {true/false},
  unlisted: {true/false},
  isFamilyFriendly: {true/false},
  duration: {video duration in seconds},
  views: {number of views},
  regionsAllowed: [ '{two letter country code}', ... ],
  likeCount: {number of likes},
  dislikeCount: {number of dislikes},
  channelThumbnailUrl: {channel thumbnail url},
  "tags": [{array of tags}],
  commentCount: {number of comments},
}

```
