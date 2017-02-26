/**
 * Created by paullichtenberger on 13.02.17.
 */


angular.module('my-controllers').controller("downloadController", ["$scope", "$http", "$q", "EpisodeService", "SeasonService", "TvShowService", "UtilityService", "SpeakerService",
    function ($scope, $http, $q, EpisodeService, SeasonService, TvShowService, UtilityService, SpeakerService) {

        var util = UtilityService;

        $q.all([
            EpisodeService.GetEpisodes(),
            SeasonService.GetSeasons(),
            TvShowService.GetTvShow(),
            SpeakerService.GetSpeakers()
        ]).then(function (results) {
            $scope.all_episodes = results[0].data;
            $scope.all_seasons = results[1].data;
            $scope.tv_show_data = results[2].data;
            $scope.all_speakers = results[3].data;

            window.onresize = null;
        });

        $scope.loadTvShowSpeakers = function () {
            $scope.tv_show_speakers = $scope.all_speakers;
            console.log($scope.all_speakers);
        };

        $scope.downloadEpisodeNumberOfSpeechesPerSpeaker = function () {
            var numberOfSpeechesSpeakerPerEpisode = prepareEpisodeNumberOfSpeechesPerSpeaker();

            downloadCSVFile("SpeakerNumberOfSpeechesPerEpisodes", numberOfSpeechesSpeakerPerEpisode);
        };

        $scope.downloadSpeakerEpisodeSpeechDist = function (speaker_name) {
            var speakerEpisodeReplikDistribution = prepareSpeakerEpisodeReplikDist(speaker_name);

            downloadCSVFile("Speaker_" + speaker_name + "_Episode_Speech_Distribution", speakerEpisodeReplikDistribution);
        };

        $scope.downloadSpeakerEpisodeStats = function (speaker_name) {
            var speakerEpisodeStats = prepareSpeakerEpisodeStats(speaker_name);

            downloadCSVFile("Speaker_" + speaker_name + "_Episode_Stats", speakerEpisodeStats);
        };

        $scope.downloadSpeakerStats = function (speaker) {
            var speakerSeasonStats = prepareSpeakerSeasonStats(speaker.name);

            downloadCSVFile("Season_Speaker_" + speaker.name + "_Statistics", speakerSeasonStats);
        };

        $scope.downloadSeasonSpeachDist = function () {
            var season_speech_dist = prepareSeasonsSpeachDistCSV();

            downloadCSVFile("Season_Speech_Distribution", season_speech_dist);
        };

        $scope.downloadSeasonSpeakerStatistics = function (season_number) {
            var seasonSpeakerStats = prepareSeasonSpeakerStats(season_number);

            downloadCSVFile("Season_" + season_number + "_Speaker_Stats", seasonSpeakerStats);
        };

        $scope.downloadSeasonStats = function () {
            var season_stats = prepareSeasonStats();

            downloadCSVFile("Season_Stats", season_stats);
        };

        $scope.downloadSeasonEpisodeStats = function (season_number) {
            var season_episode_stats = prepareSeasonEpisodeStats(season_number);

            downloadCSVFile("Season_" + season_number + "_Episode_Stats", season_episode_stats);
        };

        $scope.downloadSeasonEpisodeSpeechDist = function (season_number) {
            var season_episode_speech_dist = prepareSeasonEpisodeSpeechDistribution(season_number);

            downloadCSVFile("Season_" + season_number + "_Episode_Speech_Distribution", season_episode_speech_dist);
        };

        var downloadCSVFile = function (name, data) {
            var hiddenElement = document.createElement('a');

            hiddenElement.href = 'data:attachment/csv,' + encodeURI(data);
            hiddenElement.target = '_blank';
            hiddenElement.download = name + '.csv';
            hiddenElement.click();
        };

        var prepareSpeakerEpisodeReplikDist = function (speaker_name) {
            var seasons = $scope.all_seasons.sort(util.fieldSorter(['season_number']));

            var csvData = "";

            var header_list = ["value"];
            var episode_dist_list = [];
            var speaker_max_length = 0;

            for (var season in seasons) {
                if (seasons.hasOwnProperty(season)) {
                    var season_number = seasons[season].season_number;

                    var season_episodes = _.filter($scope.all_episodes, function (episode) {
                        return episode.season_number == season_number
                    });
                    var season_episodes_sorted = season_episodes.sort(util.fieldSorter(['episode_number']))

                    for (var episode in season_episodes_sorted) {

                        var episode_dist_dict = {};

                        if (season_episodes_sorted.hasOwnProperty(episode)) {
                            var _episode = season_episodes_sorted[episode];
                            var _episode_speaker = _.find(_episode.speakers, {name: speaker_name});

                            header_list.push("Season_" + season_number + "_Episode_" + _episode.episode_number);

                            if (_episode_speaker == null) {
                                episode_dist_list.push({});
                                continue;
                            } else {
                                var episode_dist = _episode_speaker.replicas_length_list;

                                for (var len in episode_dist) {
                                    if (episode_dist.hasOwnProperty(len)) {
                                        var nLen = +len.substring(1);
                                        episode_dist_dict[nLen] = episode_dist[len];
                                        if (nLen > speaker_max_length) speaker_max_length = nLen;
                                    }
                                }
                                episode_dist_list.push(episode_dist_dict);
                            }
                        }
                    }
                }
            }

            console.log(speaker_max_length);
            csvData += header_list.join(',') + '\n';
            console.log(csvData);

            for (var j = 1; j <= speaker_max_length; j++) {
                var line_list = [j];
                for (var epi in episode_dist_list) {
                    var _episode = episode_dist_list[epi];

                    if (j in _episode) {
                        line_list.push(_episode[j]);
                    } else {
                        line_list.push("0");
                    }
                }
                csvData += line_list.join(",") + "\n"
            }

            return csvData;
        };

        var prepareSpeakerSeasonStats = function (speaker_name) {

            var csvData = "season, number of speeches, number of words, longest speech, shortest speech, " +
                "average speech length, speech length median, season speech percentage, season word percentage\n";

            var seasons = $scope.all_seasons.sort(util.fieldSorter(['season_number']));

            for (var season in seasons) {
                if (seasons.hasOwnProperty(season)) {
                    var _season = seasons[season];
                    var _season_number = _season.season_number,
                        _season_speakers = _season.speakers;

                    var _season_speaker = _.find(_season_speakers, {name: speaker_name});

                    csvData += [_season_number, _season_speaker.number_of_replicas, _season_speaker.replicas_length_total, _season_speaker.replicas_length_max,
                            _season_speaker.replicas_length_min, _season_speaker.replicas_length_avg, _season_speaker.replicas_length_med,
                            _season_speaker.replik_percentage, _season_speaker.word_percentage].join(",") + '\n';
                }
            }

            return csvData;
        };

        var prepareEpisodeNumberOfSpeechesPerSpeaker = function () {

            var csvData = "";
            var header_list = ["Season/Episode"];
            var episodes = $scope.all_episodes.sort(util.fieldSorter(['season_number', 'episode_number']));
            var speaker_dicts = {};

            for (var speaker in $scope.all_speakers) {
                if ($scope.all_speakers.hasOwnProperty(speaker)) {
                    speaker_dicts[$scope.all_speakers[speaker].name] = {};
                }
            }

            for (var episode in episodes) {
                if (episodes.hasOwnProperty(episode)) {
                    var _episode = episodes[episode];
                    var _episode_number = _episode.episode_number,
                        _season_number = _episode.season_number,
                        _episode_speakers = _episode.speakers;

                    for (var epi_speaker in _episode_speakers) {
                        if (_episode_speakers.hasOwnProperty(epi_speaker)) {
                            speaker_dicts[_episode_speakers[epi_speaker].name][_season_number + "_" + _episode_number] = _episode_speakers[epi_speaker].number_of_replicas;
                        }
                    }
                }
            }

            for (var s in $scope.all_speakers.sort(util.fieldSorter(['name']))){
                header_list.push($scope.all_speakers[s].name);
            }

            csvData += header_list.join(',') + "\n";

            for (var _episode in episodes) {

                if (episodes.hasOwnProperty(_episode)) {
                    var key = episodes[_episode].season_number + '_' + episodes[_episode].episode_number;
                    var epi_line_list = [key];

                    for (var _s in $scope.all_speakers.sort(util.fieldSorter(['name']))){
                        var name = $scope.all_speakers[_s].name;
                        if (key in speaker_dicts[name]){
                            epi_line_list.push(speaker_dicts[name][key]);
                        }else{
                            epi_line_list.push(0);
                        }
                    }

                    csvData += epi_line_list.join(',') + '\n';
                }
            }

            console.log(csvData);
            return csvData;
        };

        var prepareSpeakerEpisodeStats = function (speaker_name) {
            var csvData = "season, episode, number of speeches, number of words, longest speech, shortest speech, " +
                "average speech length, speech length median, season speech percentage, season word percentage\n";

            var episodes = $scope.all_episodes.sort(util.fieldSorter(['season_number', 'episode_number']));

            for (var episode in episodes) {
                if (episodes.hasOwnProperty(episode)) {
                    var _episode = episodes[episode];
                    var _episode_number = _episode.episode_number,
                        _season_number = _episode.season_number,
                        _episode_speakers = _episode.speakers;

                    var _episode_speaker = _.find(_episode_speakers, {name: speaker_name});

                    if (_episode_speaker != null) {

                        csvData += [_season_number, _episode_number, _episode_speaker.number_of_replicas, _episode_speaker.replicas_length_total, _episode_speaker.replicas_length_max,
                                _episode_speaker.replicas_length_min, _episode_speaker.replicas_length_avg, _episode_speaker.replicas_length_med,
                                _episode_speaker.replik_percentage, _episode_speaker.word_percentage].join(",") + '\n';
                    } else {
                        csvData += [0, 0, 0, 0, 0, 0, 0, 0, 0, 0].join(',') + '\n'
                    }
                }
            }

            return csvData;
        };

        var prepareSeasonEpisodeStats = function (season_number) {
            var episodes = _.filter($scope.all_episodes, function (episode) {
                return episode.season_number == season_number
            });

            episodes = episodes.sort(util.fieldSorter(['episode_number']));

            var csvData = "episode, number of speeches, number of words, longest speech, shortest speech, " +
                "average speech length, speech length median, configuration densities, number of scenes, number of speakers\n";

            for (var episode in episodes) {
                if (episodes.hasOwnProperty(episode)) {
                    var _episode = episodes[episode];

                    csvData += [_episode.episode_number, _episode.number_of_replicas, _episode.replicas_length_total, _episode.replicas_length_max,
                            _episode.replicas_length_min, _episode.replicas_length_avg, _episode.replicas_length_med,
                            _episode.configuration_density, _episode.number_of_scenes, _episode.speakers.length].join(",") + '\n';
                }
            }

            return csvData;
        };

        var prepareSeasonSpeakerStats = function (season_number) {
            var csvData = "speaker, number of speeches, number of words, longest speech, shortest speech, " +
                "average speech length, speech length median, number of episodes with appearance,  season speech percentage, season word percentage\n";

            var season = _.find($scope.all_seasons, {season_number: season_number});
            var speakers = season.speakers;

            for (var speaker in speakers) {
                if (speakers.hasOwnProperty(speaker)) {
                    var _speaker = speakers[speaker];
                    console.log(_speaker);
                    csvData += [_speaker.name, _speaker.number_of_replicas, _speaker.replicas_length_total, _speaker.replicas_length_max,
                            _speaker.replicas_length_min, _speaker.replicas_length_avg, _speaker.replicas_length_med,
                            _speaker.appeared_in_episodes.length, _speaker.replik_percentage, _speaker.word_percentage].join(",") + '\n';
                }
            }


            return csvData;
        };

        var prepareSeasonStats = function () {

            var csvData = "season, number of speeches, number of words, longest speech, shortest speech, " +
                "average speech length, speech length median, configuration densities, number of episodes, number of speakers\n";

            var seasons = seasons.sort(util.fieldSorter(['season_number']));

            for (var season in seasons) {
                if (seasons.hasOwnProperty(season)) {
                    var _season = seasons[season];

                    csvData += [_season.season_number, _season.number_of_replicas, _season.replicas_length_total, _season.replicas_length_max,
                            _season.replicas_length_min, _season.replicas_length_avg, _season.replicas_length_med,
                            _season.configuration_density, _season.number_of_episodes, _season.speakers.length].join(",") + '\n';
                }
            }

            return csvData;
        };

        var prepareSeasonEpisodeSpeechDistribution = function (season_number) {
            var episodes = _.filter($scope.all_episodes, function (episode) {
                return episode.season_number == season_number
            });

            episodes = episodes.sort(util.fieldSorter(['episode_number']));

            var speach_dists = {},
                max_length = 0,
                header_names = ["Value"],
                csv_content = "";

            for (var k = 1; k <= episodes.length; k++) {
                header_names.push("Episode" + k);
            }
            csv_content += header_names.join(",") + "\n";

            for (var episode in episodes) {
                if (episodes.hasOwnProperty(episode)) {
                    var _episode = episodes[episode];

                    if (_episode.replicas_length_max > max_length) max_length = _episode.replicas_length_max;

                    speach_dists[_episode.episode_number] = _episode.replicas_length_list;
                }
            }

            for (var i = 1; i <= max_length; i++) {
                var line = i + ",";

                for (var j = 1; j <= episodes.length; j++) {
                    if (speach_dists[j]['_' + i] != null) {
                        line += j != episodes.length ? speach_dists[j]['_' + i] + ',' : speach_dists[j]['_' + i] + '\n';
                    } else {
                        line += j != episodes.length ? '0,' : '0\n';
                    }
                }
                csv_content += line;
            }

            return csv_content;
        };

        var prepareSeasonsSpeachDistCSV = function () {

            var speach_dists = {},
                max_length = 0,
                csv_content = "Value, Season1, Season2, Season3, Season4, Season5, Season6, Season7, Season8\n";

            for (var season in $scope.all_seasons) {
                if ($scope.all_seasons.hasOwnProperty(season)) {
                    var _season = $scope.all_seasons[season];

                    if (_season.replicas_length_max > max_length) max_length = _season.replicas_length_max;

                    speach_dists[_season.season_number] = _season.replicas_length_list;
                }
            }

            for (var i = 1; i <= max_length; i++) {
                var line = i + ",";

                for (var j = 1; j <= 8; j++) {
                    if (speach_dists[j]['_' + i] != null) {
                        line += j != 8 ? speach_dists[j]['_' + i] + ',' : speach_dists[j]['_' + i] + '\n';
                    } else {
                        line += j != 8 ? '0,' : '0\n';
                    }
                }
                csv_content += line;
            }

            return csv_content;
        }

    }]);
