/*
 * Copyright 2013 Sarah Vessels
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// var _gaq = _gaq || [];
// _gaq.push(['_setAccount', 'UA-41000832-1']);
// _gaq.push(['_trackPageview']);

// (function() {
//   var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
//   ga.src = 'https://ssl.google-analytics.com/ga.js';
//   var s = document.getElementsByTagName('script')[0];
//   s.parentNode.insertBefore(ga, s);
// })();

var youtube2spotify_popup = {
  setup_options_link: function() {
    $('a[href="#options"]').click(function() {
      chrome.tabs.create({url: chrome.extension.getURL("options.html")});
      return false;
    });
  },

  create_artist_link: function(artist_data, spotify_choice) {
    var artist_link = $('<a href=""></a>');
    if (spotify_choice === 'desktop_application') {
      artist_link.attr('href', artist_data.app_url);
    } else {
      artist_link.attr('href', artist_data.web_url);
      artist_link.click(function() {
        chrome.tabs.create({url: $(this).attr('href')});
        return false;
      });
    }
    artist_link.text(artist_data.name);
    return artist_link;
  },

  create_artist_list_item: function(artist_data, spotify_choice) {
    var artist_li = $('<li></li>');
    artist_li.append(this.create_artist_link(artist_data, spotify_choice));
    return artist_li;
  },

  create_artist_list: function(track_data, spotify_choice) {
    var artist_list = $('<ul class="artists"></ul>');
    for (var j=0; j<track_data.artists.length; j++) {
      artist_list.append(
        this.create_artist_list_item(track_data.artists[j], spotify_choice)
      );
    }
    return artist_list;
  },

  create_track_link: function(track_data, spotify_choice) {
    var track_link = $('<a href=""></a>');
    if (spotify_choice === 'desktop_application') {
      track_link.attr('href', track_data.app_url);
    } else {
      track_link.attr('href', track_data.web_url);
    }
    track_link.click(function() {
      chrome.tabs.create({url: $(this).attr('href')});
      return false;
    });
    track_link.text(track_data.name);
    return track_link;
  },

  create_track_list_item: function(track_data, spotify_choice) {
    var li = $('<li></li>');
    li.append(this.create_track_link(track_data, spotify_choice));
    li.append(this.create_artist_list(track_data, spotify_choice));
    return li;
  },

  populate_track_list: function(track_ids, tracks, spotify_choice) {
    var list = $('ul');
    for (var i=0; i<track_ids.length; i++) {
      var track_id = track_ids[i];
      list.append(
        this.create_track_list_item(tracks[track_id], spotify_choice)
      );
    }
  },

  get_sorted_track_ids: function(tracks) {
    var track_ids = Object.keys(tracks);
    track_ids.sort(function(a, b) {
      var track_name_a = tracks[a].name;
      var track_name_b = tracks[b].name;
      if (track_name_a < track_name_b) {
        return -1;
      }
      return track_name_a > track_name_b ? 1 : 0;
    });
    return track_ids;
  },

  setup_trackset_links: function(track_ids) {
    var name = 'YouTubeTrackset';
    var joined_ids = track_ids.join(',');

    var app_link = $('a.app-trackset-link');
    app_link.unbind('click').click(function() {
      chrome.tabs.create({url: 'spotify:trackset:' + name + ':' + joined_ids});
      return false;
    });

    var web_link = $('a.web-trackset-link');
    web_link.unbind('click').click(function() {
      chrome.tabs.create({url: 'https://play.spotify.com/trackset/' + 
                               encodeURIComponent(name) + '/' + joined_ids});
      return false;
    });

    $('h2').fadeIn();
  },

  display_track_count: function(track_count) {
    $('#track-count').text(track_count);
  },

  update_track_list: function(spotify_choice) {
    var me = this;
    chrome.storage.local.get('youtube2spotify', function(data) {
      data = data.youtube2spotify || {};
      var tracks = data.tracks || {};
      var track_ids = me.get_sorted_track_ids(tracks);
      me.display_track_count(track_ids.length);
      me.setup_trackset_links(track_ids);
      me.populate_track_list(track_ids, tracks, spotify_choice);
    });
  },

  on_popup_opened: function() {
    this.setup_options_link();
    var me = this;
    chrome.storage.sync.get('youtube2spotify_options', function(opts) {
      opts = opts.youtube2spotify_options || {};
      var spotify_choice = opts.spotify || 'web_player';
      me.update_track_list(spotify_choice);
    });
  }
};

$(function() {
  youtube2spotify_popup.on_popup_opened();
  chrome.extension.sendRequest({action: 'check_for_youtube_links'});
});

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  if (request.action == 'spotify_links_updated') {
    youtube2spotify_popup.update_track_list(request.spotify_choice);
  }
});