var utility_dict = new Typo();
var aff_data = utility_dict._readFile(chrome.extension.getURL('en_US.aff'));
var word_data = utility_dict._readFile(chrome.extension.getURL('en_US.dic'));
var dictionary = new Typo('en_US', aff_data, word_data);

var youtube2spotify_util = {
  spellcheck: function(word) {
    if (dictionary.check(word)) { // spelled correctly
      return word;
    }
    // misspelled word
    return '';
  },
  
  get_youtube_video_id: function(url) {
    if (url.indexOf('youtu.be') > -1) {
      return url.split('youtu.be/')[1];
    }
    if (url.indexOf('v=') > -1) {
      var video_id_etc = url.split('v=')[1];
      var index = video_id_etc.indexOf('&');
      if (index > -1) {
        return video_id_etc.substring(0, index);
      }
      return video_id_etc;
    }
    return url.split('.com/v/')[1];
  },

  get_subreddit: function(url) {
    // e.g., http://www.reddit.com/r/electronicmusic => electronicmusic
    var subreddit_etc = url.split('/r/')[1];
    if (subreddit_etc) {
      return subreddit_etc.split('/')[0];
    }
    return subreddit_etc;
  },

  get_spotify_track_search_url: function(query) {
    return 'http://ws.spotify.com/search/1/track.json?q=' + 
            encodeURIComponent(query);
  },

};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'spellcheck') {
    sendResponse({suggestion: youtube2spotify_util.spellcheck(request.word), 
                  index: request.index + 1});
  }
});