
function play() {
    app.play();
}

var api = "https://api.deezer.com/";
var socket;
var roomID;
var app = {

    init: function () {
        socket = io();

        socket.on('retrievedRoomID', function (id) {
            roomID = id;
            socket.on('sendedQuizz', function (quizz) {
                alert('retrieve quizz');
                console.log('retrieve', quizz);
            });
        });
    }, 

    play: function () {
        var self = this;
        $.ajax({
            url: api + "playlist/908622995",
            type: 'GET',
            dataType: 'json'
        }).done(function playlistCallback(trackList) {
            var quizz = self.createQuizz(trackList.tracks.data);
            var game =  {
                quizz: quizz,
                id: roomID
            };
            console.log(game);
            socket.emit('sendQuizz', game);
        });
    },

    createQuizz: function (trackList) {
        var question1 = this.createQuestion(trackList);
        var question2 = this.createQuestion(trackList);
        var question3 = this.createQuestion(trackList);
        return [question1, question2, question3];
    },

    createQuestion: function (trackList) {
        var response = this.createResponse(trackList);
        var propositions = this.createProposition(response, trackList);

        return {
            response: response,
            propositions: propositions
        }
    },

    createResponse: function (trackList) {
        var trackRand = this.randomTrack(trackList);
        var response = {
            id: trackRand.id,
            name: trackRand.title,
            preview: trackRand.preview
        };
        return response;
    },

    createProposition: function (response, trackList) {
        var propositions = [response];

        while (propositions.length < 4) {
            var trackRand = this.randomTrack(trackList);
            if (!this.trackInArray(trackRand, propositions)) {
                propositions.push({
                    id: trackRand.id,
                    name: trackRand.title
                });
            }
        }
        return propositions;
    },

    randomTrack: function (trackList) {
        var idTrack = Math.floor(Math.random() * trackList.length);
        return trackList[idTrack];
    },

    trackInArray: function (track, list) {
        var find = false;
        var i = 0;
        while (!find && i < list.length) {
            if (track.id === list[i].id) {
                find = true;
            }
            i++;
        }
        return find;
    }
};

app.init();