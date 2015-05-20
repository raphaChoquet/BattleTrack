
var api = "https://api.deezer.com/";
var app = {
    alreadyPlayedTracks: [],
    play: function () {
        var self = this;

        $.getJSON('playlists.json', function (playlists) {
            self.playlists = playlists;
            app.displayGenre(playlists);
        });
    },

    displayGenre: function (playlists) {
        var genres = this.pick3Genre(playlists);
        var list = '';
        $('#list-genre').empty();
        for (var i = 0; i < genres.length; ++i) {
            $('#list-genre').append('<a href="#gameStart" data-transition="fade" class="ui-btn ui-icon-play ui-btn-icon-left" onclick="app.launchSet(' + genres[i].id + ')">' + genres[i].genre + '</a>');
        }
    },

    pick3Genre: function (playlists) {
        var genres = [];
        while (genres.length < 3 & genres.length < playlists.length) {
            var genreRand = this.getRandomGenre(playlists);
            if (!genres.objectInArray(genreRand, 'genre')) {
                genres.push(genreRand);
            }
        }
        return genres;
    },

    getRandomGenre: function (playlists) {
        return playlists[Math.floor(Math.random() * playlists.length)];
    },

    launchSet: function (id) {
        var self = this;
        var genre = this.playlists.findObject('id', id);
        $.ajax({
            url: api + "playlist/" + genre.playlist_id,
            type: 'GET',
            dataType: 'json'
        }).done(function playlistCallback(trackList) {
            var set = {
                genre: genre.genre,
                questions: self.createSet(trackList.tracks.data)
            };

            self.displayQuestion(set.questions[0]);
        });
    },

    createSet: function (trackList) {
        var questions = [];
        while (questions.length < 3 & questions.length < trackList.length) {
            var question = this.createQuestion(trackList);
            questions.push(question);
        }
        return questions;
    },

    createQuestion: function (trackList) {
        var response = this.createResponse(trackList);
        var propositions = this.createProposition(response.info, trackList);

        return {
            preview: response.preview,
            propositions: propositions
        }
    },

    createResponse: function (trackList) {
        
        var isNoPlayed = false;
        while (!isNoPlayed) {
            var trackRand = this.getRandomTrack(trackList);
            if ($.inArray(trackRand.preview, this.alreadyPlayedTracks) === -1) {
                isNoPlayed = true;
            }
        }        
        this.alreadyPlayedTracks.push(trackRand.preview);
        var response = {
            info: {
                id: trackRand.id,
                name: trackRand.title,
                isResponse: true
            },
            preview: trackRand.preview
        };
        return response;
    },

    createProposition: function (response, trackList) {
        var propositions = [response];

        while (propositions.length < 4) {
            var trackRand = this.getRandomTrack(trackList);
            if (!propositions.objectInArray(trackRand, 'id')) {
                propositions.push({
                    id: trackRand.id,
                    name: trackRand.title,
                    isResponse: false
                });
            }
        }
        return propositions;
    },

    getRandomTrack: function (trackList) {
        var idTrack = Math.floor(Math.random() * trackList.length);
        return trackList[idTrack];
    },

    displayQuestion: function (question) {
        
    }
};


Array.prototype.objectInArray = function (object, comparator) {
    var find = false;
    var i = 0;
    while (!find && i < this.length) {
        if (object[comparator] === this[i][comparator]) {
            find = true;
        }
        i++;
    }
    return find;
}

Array.prototype.findObject = function (key, value) {
    var objectFind;
    var find = false;
    var i = 0;
    while (!find && i < this.length) {
        if (this[i][key] === value) {
            find = true;
            objectFind = this[i];
        }
        i++;
    }
    return objectFind;
}

Array.prototype.shuffle = function () {
    var array = this;
    var currentIndex = array.length;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        var randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        var temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}
