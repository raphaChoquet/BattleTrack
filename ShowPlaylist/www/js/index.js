/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var app = {};
var api = "https://api.deezer.com/";

app.initialize = function() {
    this.bindEvents();
};

app.bindEvents = function () {
    //document.addEventListener('deviceready', this.onDeviceReady, false);
    app.onDeviceReady();
};

app.onDeviceReady = function () {
    console.log("Device Ready");

    $.getJSON("playlists.json")
        .done(function (playlists) {
            app.displayPlaylists(playlists);
        });
};

app.displayPlaylists = function (playlists) {
    $.ajax({
        url: api + "playlist/" + playlists[0].playlist_id,
        type: 'GET',
        dataType: 'json'
    }).done(function playlistCallback(trackList) {
          console.log(trackList);
        //app.getRandTrack(trackList.tracks.data);
    });

};


app.getRandTrack = function (tracks) {
    console.log(tracks.length);
    var idTrack = Math.floor(Math.random() * tracks.length);
    var trackPlayer = new Audio(tracks[idTrack].preview);
    trackPlayer.play();
    trackPlayer.addEventListener('timeupdate', function () {
        var currentTime = trackPlayer.currentTime;
            console.log(trackPlayer.duration);
          
    });

};


app.initialize();
