var app = {
    api: "https://api.deezer.com/",
    me: {},
    currentGame: null,
    genres: null,
    socket: null,
    connected : false,

    init: function () {
        var self = this;
        document.addEventListener('deviceready', function () {
            self.onDeviceReady();
        }, false);

        $.getJSON('genres.json', function (genres) {
            self.genres = genres;
        });
    },

    onDeviceReady: function () {
        var self = this;

        var networkState = navigator.connection.type;

        if (networkState === Connection.NONE) {
            self.showImpossibleConnection();
        } else {
            self.connected = true;
            $( ":mobile-pagecontainer" ).pagecontainer("change", '#connect');
        } 

        self.bindEvent();
    },

    showImpossibleConnection: function () { 
        self.connected = false;
        $('#load .info').html("impossible");
        $('#load .loader').fadeOut();
        $('#load .warning').fadeIn();
    },

    bindEvent: function () {
        var self = this;
        $('#connect a').bind('tap', function () {
            self.connect();
        });

        $('#btnPlay').bind('tap', function () {
            $('#btnPlay').unbind('tap');
            self.play();
        });

        document.addEventListener("offline", function () {
            $( ":mobile-pagecontainer" ).pagecontainer("change", '#load');
            self.showImpossibleConnection();
        }, false);

        document.addEventListener('online', function () {
            $( ":mobile-pagecontainer" ).pagecontainer("change", '#connect');
        });
    },

    connect: function () {

        var self = this;
        function onPrompt(result) {
            if (result.buttonIndex === 1) {
                self.me = {
                    username: result.input1
                };
                $('#user').html('Bienvenue ' + self.me.username);
                $( ":mobile-pagecontainer" ).pagecontainer("change", '#lobby');
            }
        }


        navigator.notification.prompt(
            "Choissisez votre surnom",  // message
            onPrompt,                  // callback to invoke
            'Préparez-vous à jouer',            // title
            ['Ok','Exit'],             // buttonLabels
            'BattleTracker'                 // defaultText
        );


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
    },

    play: function () {
        var self = this;

        if (self.currentGame !== null) {
            self.socket = null;
            self.currentGame.clear();
            self.currentGame = null;
            self.play();
        }
        $('#btnPlay').hide();
        $('#lobby .ui-currentGames-btn').show();

        this.socket = io('https://battletrack-nodejs-raphachoquet.c9.io');
        this.socket.emit('joinRoom', this.me);

        this.socket.on('joinedRoom', function (gameRoom) {
            if  (self.currentGame !== null) {
                self.currentGame.opposant = app.findOpposant(gameRoom.users).username;
                $('.opponentPlayer').text(self.currentGame.opposant);

            } else if (gameRoom.users.length <= 1) {
                self.currentGame = game;
                self.currentGame.start('create', gameRoom);
                $( ":mobile-pagecontainer" ).pagecontainer("change", '#themeSelection');
            } else {
                self.currentGame = game;
                self.currentGame.start('wait', gameRoom);
                $( ":mobile-pagecontainer" ).pagecontainer("change", '#gameWait');
            }
        });

        this.socket.on('sendedSet', function (set) {
            if (!self.currentGame.waitTostart) {

            } else {
                self.currentGame.finishWait(set);       
            }
        });

        this.socket.on('sendedResult', function (opposantResult) {
            self.currentGame.currentSet.result.opposant = opposantResult;
            self.currentGame.displayResultsOfSet('opposant', self.currentGame.currentSet);
        });


        this.socket.on('disconnected', function () {
            alert('Excusez-nous, votre adversaire a abandonner la partie.');
            self.socket = null;
            self.currentGame.clear();
            self.currentGame = null;
            $( ":mobile-pagecontainer" ).pagecontainer( "change", '#lobby');
        });

        this.socket.on('endedGame', function () {
            self.socket = null;
            self.currentGame.clear();
            self.currentGame = null;
        }); 
    },

    findOpposant: function (users) {
        var find = false;
        var i = 0;
        var opposant = null;
        while(!find && i < users.length) {
            if (users[i].username !== this.me.username) {
                find = true;
                opposant = users[i];
            }
            i++;
        }   

        return opposant; 
    }   
};

var game = {
    id: null,
    sets: [],
    currentSet: null,
    alreadyPlayedTracks: [],
    waitTostart: false,
    opposant: null,
    
    clear: function () {
        this.id = null;
        this.sets = [];
        this.currentSet = null;
        this.alreadyPlayedTracks = [];
        this.waitTostart = false;
        this.opposant = null;
    },

    start: function (action, gameRoom) {

        var self = this;
        self.id = gameRoom.id;
        if (action === 'create') {
            this.choiceGenre();
        } else {
            $('#wait').fadeIn();
            self.opposant = app.findOpposant(gameRoom.users).username;
            $('.opponentPlayer').text(self.opposant);
            this.waitTostart = true;
            if (typeof gameRoom.set !== 'undefined') {
                this.finishWait(gameRoom.set);
            }
        }
        
    },

    finishWait: function (set) {
        var self = this;
        self.waitTostart = false;
        self.sets.push(set);
        self.currentSet = set;
        $('#wait .waiting').fadeOut(function () {
            $('#wait .theme').html('Théme: ' + self.currentSet.genre);
            $('#wait .theme').fadeIn();
            $('#wait a').fadeIn().click(function () {
                self.launchSet(set);
            });
        });
        if (typeof self.currentSet.result.opposant !== "undefined") {
            self.displayResultsOfSet('opposant', self.currentSet);
        }
    },

    choiceGenre: function () {
        var self = this;
        $('#choiceGenre').fadeIn();
        var choiceGenre = Q.Promise(function (resolve, reject) {
            genreManager.init(resolve, reject)
        });
        choiceGenre.then(function (genre) {
            self.initSet(genre);
        });
    },

    initSet: function (genre) {
        var self = this;
        var retrievedTracks = Q.Promise(function (resolve, reject) {
            app.retrievePlaylist(resolve, reject, genre.playlist_id);
        });

        retrievedTracks.then(function (tracksList) {
            var set = {
                id: self.sets.length,
                genre: genre.name,
                questions: self.createSet(tracksList.tracks.data),
                result: {
                    me: {total: 0}
                }
            };

            var gameRoom = {
                id: self.id,
                set: set
            }
            app.socket.emit('sendSet', gameRoom);
            self.sets.push(set);
            self.currentSet = set;
            self.launchSet(set);
        });
    },

    launchSet: function (set) {
            var self = this;
            $('#title-genre').html(set.genre);
            self.showQuestionsPage(set, 0);
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
        var waitResponse = Q.Promise(function (resolve, reject) {
            questionManager.init(resolve, set.questions[page]);
        });

        waitResponse.then(function (haveWin) {
            set.result.me['question-' + page] = haveWin;
            if (haveWin) {
                set.result.me.total++;
            }
            page++;
            if (page < 3) {
                self.showQuestionsPage(set, page);
            } else {
                self.showSummaryGame(set);
                if(typeof set.result.opposant !== "undefined") {
                    app.socket.emit('endGame', self.id);
                    app.socket = null;
                    app.currentGame.clear();
                    app.currentGame = null;
                }
            }
        });
    },

    showSummaryGame: function (set) {
        var param = {
            id: this.id,
            result: set.result.me
        };
        var $set = $('#set-' + set.id);
        app.socket.emit('sendResult', param);
        $set.find('.setCategory').text(set.genre);
        $set.find('img').removeClass('disabled');

        $( ":mobile-pagecontainer" ).pagecontainer( "change", '#currentGame'); 
        this.displayResultsOfSet('me', set);
    },

    displayResultsOfSet: function (key, set) {
        var self = this;
        var $set = $('#set-' + set.id);
        $set.find('.result-' + key + ' img').each( function (id, elmnt) {
            elmnt.src = set.result[key]['question-' + id] ? 'img/iconWin.png': 'img/iconLoose.png';
        });

        var score = parseInt($('.' + key + 'Score').text());
        $('.' + key + 'Score').text(score + set.result[key].total);
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
            class: 'ui-btn ui-btn-genre',
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

        $btn.click(function (evt) {
            evt.preventDefault();
            evt.stopPropagation();
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
        this.trackPlayer.pause();
        $btn.addClass('winning-btn');
        $('#propositions a').not(self.$btnResponse).addClass('losing-btn');

        $('#overlay').show();
        document.addEventListener('click', overWinClick, false);

        function overWinClick(evt) {
            
            evt.preventDefault();
            evt.stopPropagation();
            document.removeEventListener('click', overWinClick, false);
            $('#overlay').hide();
            self.next(true);
        }

    },

    lose: function ($btn) {
        var self = this;
        this.trackPlayer.pause();
        if (typeof $btn !== "undefined") {
            $btn.addClass('picked-loser-btn');
        }
        $('#propositions a').not(self.$btnResponse).addClass('losing-btn');
        $(self.$btnResponse).addClass('winning-btn');

        $('#overlay').show();
        document.addEventListener('click', overLoseClick, false);

        function overLoseClick(evt) {
            evt.preventDefault();
            evt.stopPropagation();
            document.removeEventListener('click', overLoseClick,false);
            $('#overlay').hide();
            self.next(false);
        }
    },

    next: function (haveWin) {
        delete this.trackPlayer;
        this.resolve(haveWin);
    }
}


app.init();

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

