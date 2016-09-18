/**
 * Created by paullichtenberger on 30.06.16.
 */

// server.js

// set up ========================
var express = require('express');
var app = express();                               // create our app w/ express
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)

var cors = require('cors');

var MongoClient = require('mongodb').MongoClient, assert = require('assert');

var db = require('./db');

//var Episode = require('app/models/episode.js');

// Connection URL
var url = 'mongodb://localhost:27017/big_bang_theory';

// configuration =================

app.use(express.static(__dirname + '/assets'));                 // set the static files location /public/img will be /img for users
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended': 'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({type: 'application/vnd.api+json'})); // parse application/vnd.api+json as json
app.use(methodOverride());

// use it before all route definitions
app.use(cors({origin: '*'}));

db.connect(url, function (err) {
    if (err) {
        console.log('Unable to connect to Mongo.');
    } else {
        app.listen(8080, function () {
            console.log('Listening on port 8080...');
        });
    }
});

function find_tv_show_stats(callback) {
    var tv_show_collection = db.get().collection('tv_show_collection');
    // Find some documents
    tv_show_collection.findOne({'name':'the_big_bang_theory'}, function (err, doc) {
        if (doc) {
            callback(doc);
        } else {
            console.log("Error!!!!!!!!!!!!");
            callback("An Error Occured");
        }
    });
}

var find_all_episodes = function (callback) {
    var epi_collection = db.get().collection('episode_collection');
    // Find some documents
    epi_collection.find({}).toArray(function (err, docs) {
        if(docs) {
            callback(docs);
        }else{
            console.log("ERRORROR");
        }
    });
};

var find_all_seasons = function (callback) {
    var season_collection = db.get().collection('season_collection');
    // Find some documents
    season_collection.find({}).toArray(function (err, docs) {
        assert.equal(err, null);
        callback(docs);
    });
};

var find_speaker_by_name = function (name, callback) {
    db.get().collection('speaker_collection').findOne({"name": name}, function (err, doc) {
        if (doc) {
            callback(doc);
        } else {
            callback(err, "An Error Occured");
        }
    });
};

var find_episode_by_season_and_episode = function (season, episode, callback) {
    var cursor = db.get().collection('episode_collection').find({"season_number": season, "episode_number": episode});
    cursor.each(function (err, doc) {
        assert.equal(err, null);
        if (doc != null) {
            callback(doc);
        } else {
            callback();
        }
    });
};

app.get('/api/tv_show', function (req, res) {

    find_tv_show_stats(function (err, result) {
        if (err) {
            res.send(err);
        }
        else {
            res.json(result);
        }
    })
});

function get_all_speakers(callback) {
    var speaker_collection = db.get().collection('speaker_collection');
    // Find some documents
    speaker_collection.find({}).toArray(function (err, docs) {
        assert.equal(err, null);
        callback(docs);
    });
}

app.get('/api/speakers/:name', function (req, res) {
    var name = req.params.name;


    find_speaker_by_name(name, function (err, result) {
        if (err) {
            console.log("Sent err");
            res.status(404).send(err);
        }
        else {
            console.log("Sent result");
            res.json(result);
        }
    })

});

app.get('/api/speakers', function (req, res) {

    get_all_speakers(function (err, result) {
        if (err)
            res.send(err);

        else
            res.json(result);
    })

});

app.get('/api/seasons', function (req, res) {
    find_all_seasons(function (err, result) {
        if (err)
            res.send(err);

        else
            res.json(result);
    })
});

app.get('/api/episodes/', function (req, res) {

        find_all_episodes(function (err, result) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err) {
                res.send(err);
            }else {
                res.json(result); // return all todos in JSON format
            }
        });

});