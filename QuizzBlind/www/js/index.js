var app = {
    api: "https://api.deezer.com/",
    me: {},
    currentGame: null,
    genres: null,
    init: function () {
        var self = this;

        $.getJSON('genres.json', function (genres) {
            self.genres = genres;
        });

        this.bindEvent();
    },
    bindEvent: function () {
        var self = this;
        $('#connect').click(function () {
            self.connect();
        });

        $('#btnPlay').click(function () {
            self.currentGame = game;
            self.currentGame.start();
        });
    },
    connect: function () {
        this.me = {
            username: prompt('Username :')
        }
        $('#user').html('Bienvenue ' + this.me.username);
    },
    retrievePlaylist: function (resolve, reject, id) {
        $.ajax({
            url: this.api + "playlist/" + id,
            type: 'GET',
            dataType: 'json'
        }).done(function (tracksList) {
           resolve(tracksList);
        }).fail(function (jqXHR, textStatus) {
            alert(textStatus);
        });
    }
};

var game = {
    sets: [],
    currentSet: null,
    alreadyPlayedTracks: [],
    start: function () {
        var self = this;
        var choiceGenre = new Promise(function (resolve, reject) {
            genreManager.init(resolve, reject)
        });
        choiceGenre.then(function (genre) {
            self.launchSet(genre);
        });
    },

    launchSet: function (genre) {
        var self = this;
        var retrievedTracks = new Promise(function (resolve, reject) {
            app.retrievePlaylist(resolve, reject, genre.playlist_id);
        });

        retrievedTracks.then(function (tracksList) {
            var set = {
                genre: genre.name,
                questions: self.createSet(tracksList.tracks.data),
                result: {
                    me: {},
                    opposante: {}
                }
            };
            self.sets.push(set);
            self.currentSet = set;
            $('#title-genre').html(set.genre);
            self.showQuestionsPage(set, 0);
        });
    },

    createSet: function (tracks) {
        var questions = [];
        while (questions.length < 3 & questions.length < tracks.length) {
            var question = this.createQuestion(tracks);
            questions.push(question);
        }
        return questions;
    },

    createQuestion: function (tracks) {
        var response = this.createResponse(tracks);
        var propositions = this.createProposition(response.info, tracks);

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
                name: trackRand.artist.name + ' - <em>' + trackRand.title + '</em>',
                isResponse: true
            },
            preview: trackRand.preview
        };
        return response;
    },

    createProposition: function (response, tracks) {
        var propositions = [response];

        while (propositions.length < 4) {
            var trackRand = this.getRandomTrack(tracks);
            if (!propositions.objectInArray(trackRand, 'id')) {
                propositions.push({
                    id: trackRand.id,
                    name: trackRand.artist.name + ' - <em>' + trackRand.title + '</em>',
                    isResponse: false
                });
            }
        }
        return propositions;
    },

    getRandomTrack: function (tracks) {
        var idTrack = Math.floor(Math.random() * tracks.length);
        return tracks[idTrack];  
    },

    showQuestionsPage: function (set, page) {
        var self = this;
        var waitResponse = new Promise(function (resolve, reject) {
            questionManager.init(resolve, set.questions[page]);
        });

        waitResponse.then(function (haveWin) {
            set.result.me['question-' + page] = haveWin;
            page++;
            if (page < 3) {
                self.showQuestionsPage(set, page);
            } else {
                alert(JSON.stringify(set.result.me));
            }
        });
    }
};


var genreManager = {
    resolve: null,
    genres: null,
    init: function (resolve, reject) {
        this.resolve = resolve;
        this.genres = app.genres;
        this.displayGenres();
    },

    displayGenres: function () {
        var genresSelected = this.pick3Genres(this.genres);
        var list = '';
        $('#list-genre').empty();
        for (var i = 0; i < genresSelected.length; ++i) {
            this.createBtnGenre(genresSelected[i]);
        }
    },

    createBtnGenre: function (genre) {
        var self = this;
        var $btn = $('<a>', {
            href: '#gameStart',
            dataTransition: 'fade',
            class: 'ui-btn ui-icon-play ui-btn-icon-left ui-btn-genre',
            text: genre.name
        });

        $btn.appendTo($('#list-genre'));

        $btn.click(function () {
            self.resolve(genre);
        });
    },

    pick3Genres: function (genres) {
        var genresPicked= [];
        while (genresPicked.length < 3 & genresPicked.length < genres.length) {
            var genreRand = this.getRandomGenre(genres);
            if (!genresPicked.objectInArray(genreRand, 'id')) {
                genresPicked.push(genreRand);
            }
        }
        return genresPicked;
    },

    getRandomGenre: function (genres) {
        return genres[Math.floor(Math.random() * genres.length)];
    }
};


var questionManager = {
    question: null,
    $btnResponse: null,
    trackPlayer: null,
    init: function (resolve, question) {
        this.resolve = resolve;
        this.question = question;
        this.displayProposition(question.proposition);
        this.createPlayer(question.preview);
    },
    displayProposition: function () {
        var propositions = this.question.propositions.shuffle();
        $('#propositions').empty();
        for (var i = 0; i < propositions.length; i++) {
            this.createBtnProposition(propositions[i]);
        }
    },
    createPlayer: function (preview) {
        var self = this;
        var trackPlayer = new Audio(preview);
        trackPlayer.play();
        var $progressBarProgression = $('.progressBarProgression');
        trackPlayer.addEventListener('timeupdate', function () {
            var percent = (trackPlayer.currentTime * 100 / trackPlayer.duration);
            $progressBarProgression.css('width', percent + '%');
            if (percent === 100) {
                self.lose();            
            }
        });

        this.trackPlayer = trackPlayer;
    },
    createBtnProposition: function (proposition) {
        var self = this;
        var $btn = $('<a>', {
            href: '#',
            dataTransition: 'fade',
            class: 'ui-btn ui-btn-proposition',
            html: proposition.name
        });

        $btn.click(function () {
            if (proposition.isResponse) {
                self.win($btn);
            } else {
                self.lose($btn);
            }
        });

        $btn.appendTo($('#propositions'));

        if (proposition.isResponse) {
            this.$btnResponse = $btn;
        }
    },
    win: function ($btn) {
        var self = this;


        window.setTimeout(function () {
            self.next(true);
        }, 100);
    },
    lose: function ($btn) {
        var self = this;


        window.setTimeout(function () {
            self.next(false);
        }, 100);
    },
    next: function (haveWin) {
        this.trackPlayer.pause();
        delete this.trackPlayer;
        this.resolve(haveWin);
    }
}


app.init();



// 


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
