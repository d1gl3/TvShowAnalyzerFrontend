/**
 * Created by paullichtenberger on 28.07.16.
 */


seriesAnalyzer.controller('singleSpeakerController', ['$scope', '$http', '$q', 'CurrentSelectedSpeakerService', 'SeasonService', 'EpisodeService',
    'SettingService', 'UtilityService', 'SpeakerService',
    function ($scope, $http, $q, CurrentSelectedSpeakerService, SeasonService, EpisodeService, SettingService, UtilityService, SpeakerService) {

        var util = UtilityService;

        // Get Season and TV Show Data before initializing views
        $q.all([
            SeasonService.GetSeasons(),
            EpisodeService.GetEpisodes(),
            SpeakerService.GetSpeakers()
        ]).then(function (results) {
            $scope.seasons = results[0].data;
            $scope.episodes = results[1].data;
            $scope.speakers = results[2].data;

            $scope.showSpeakerSelection = true;

            window.onresize = null;
        });

        function get_speaker_stats(name, callback) {
            SpeakerService.GetSpeakerByName(name).then(function (speaker) {
                callback(speaker.data);
            });
        }

        // Construct data object for season Comparison Graphs
        function set_speaker_season_replik_line_chart_data() {

            var replicaAverageSeasons = [],
                replicaNumberSeasons = [],
                replicaSumSeasons = [],
                speaker_stats = 0;

            if ($scope.speakerSeasonStats) {
                speaker_stats = $scope.speakerSeasonStats;
                name = $scope.selectedSpeaker.name;

                var calculated_speech_stats = util.aggregateSpeakerSeasonSpeechData(speaker_stats);

                replicaAverageSeasons.push(
                    util.barChartObject(name, calculated_speech_stats.avg)
                );

                replicaNumberSeasons.push(
                    util.barChartObject(name, calculated_speech_stats.num)
                );

                replicaSumSeasons.push(
                    util.barChartObject(name, calculated_speech_stats.sum)
                );
            }

            $scope.replicaAverageSeasons = replicaAverageSeasons;
            $scope.replicaNumberSeasons = replicaNumberSeasons;
            $scope.replicaSumSeasons = replicaSumSeasons;

            console.log(replicaAverageSeasons);
            console.log(replicaNumberSeasons);
            console.log(replicaSumSeasons);

        }

        // Construct data object for episode Comparison Graphs
        function set_speaker_episode_replik_line_chart_data() {
            var replicaAverageEpisodes = [],
                replicaNumberEpisodes = [],
                replicaSumEpisodes = [],
                avg_length_list = [],
                number_of_replicas_list = [],
                sum_length_list = [],
                name = null,
                speaker_stats = 0;

            if ($scope.speakerEpisodeStats) {
                speaker_stats = $scope.speakerEpisodeStats;
                name = $scope.selectedSpeaker.name;
                avg_length_list = [];
                number_of_replicas_list = [];
                sum_length_list = [];

                var x = 1;

                for (var el in speaker_stats) {
                    if (speaker_stats.hasOwnProperty(el)) {
                        var episode_data = speaker_stats[el];
                        avg_length_list.push([
                            x,
                            episode_data.episode_data != null ? episode_data.episode_data.replicas_length_avg : 0
                        ]);
                        number_of_replicas_list.push([
                            x,
                            episode_data.episode_data != null ? episode_data.episode_data.number_of_replicas : 0
                        ]);
                        sum_length_list.push([
                            x,
                            episode_data.episode_data != null ? episode_data.episode_data.replicas_length_total : 0
                        ]);
                    }
                    x += 1;
                }

                replicaAverageEpisodes.push(
                    util.barChartObject(name, avg_length_list)
                );

                replicaNumberEpisodes.push(
                    util.barChartObject(name, number_of_replicas_list)
                );

                replicaSumEpisodes.push(
                    util.barChartObject(name, sum_length_list)
                );
            }

            $scope.replicaAverageEpisodes = replicaAverageEpisodes;

            $scope.replicaNumberEpisodes = replicaNumberEpisodes;

            $scope.replicaSumEpisodes = replicaSumEpisodes;
        }

        function set_speaker_season_data(name) {

            var speaker_season_stats = [];
            for (var season in $scope.seasons) {
                if ($scope.seasons.hasOwnProperty(season)) {
                    var _season_speakers = $scope.seasons[season].speakers;
                    var season_speaker_stats = _.findWhere(_season_speakers, {name: name});
                    speaker_season_stats.push({
                        season_number: $scope.seasons[season].season_number,
                        season_data: season_speaker_stats
                    });
                } else {
                    speaker_season_stats.push({
                        season_number: $scope.seasons[season].season_number,
                        season_data: null
                    });
                }
            }

            speaker_season_stats.sort(util.sort_by_key("season_number"));

            $scope.speakerSeasonStats = speaker_season_stats;
        }

        function set_speaker_episode_data(name) {
            var speaker_episode_stats = [];
            for (var episode in $scope.episodes) {
                if ($scope.episodes.hasOwnProperty(episode)) {
                    var _episode_speakers = $scope.episodes[episode].speakers;
                    var episode_speaker_stats = _.findWhere(_episode_speakers, {name: name});
                    speaker_episode_stats.push({
                        season_number: $scope.episodes[episode].season_number,
                        episode_number: $scope.episodes[episode].episode_number,
                        episode_data: episode_speaker_stats
                    });
                } else {
                    speaker_episode_stats.push({
                        season_number: $scope.episodes[episode].season_number,
                        episode_number: $scope.episodes[episode].episode_number,
                        episode_data: null
                    });
                }
            }

            speaker_episode_stats.sort(util.fieldSorter(['season_number', 'episode_number']));

            $scope.speakerEpisodeStats = speaker_episode_stats;
        }

        $scope.downloadReplicaCSV = function () {
            var replica_lengths = $scope.replicaLengths[0].values;
            var csvContent = "SpeachLength, Value\n";
            replica_lengths.forEach(function (lengthArray, index) {
                var dataString = lengthArray.join(",");
                csvContent += index < replica_lengths.length ? dataString + "\n" : dataString;
            });

            var speaker_name = $scope.selectedSpeaker.name;
            var hiddenElement = document.createElement('a');

            hiddenElement.href = 'data:attachment/csv,' + encodeURI(csvContent);
            hiddenElement.target = '_blank';
            hiddenElement.download = 'SpeachLengths_'.concat(speaker_name).concat('.csv');
            hiddenElement.click();
        };

        $scope.set_selected_speaker = function (name) {
            get_speaker_stats(name, function (speaker) {
                if (speaker != null) {
                    $scope.selectedSpeaker = speaker;
                    $scope.speakerWords = $scope.selectedSpeaker.word_cloud_data;
                    $scope.speakerWordsNeg = $scope.selectedSpeaker.negative_words_cloud;
                    $scope.speakerWordsPos = $scope.selectedSpeaker.positive_words_cloud;

                    $scope.replicaLengths = [{
                        key: "Quantity",
                        bar: true,
                        values: util.get_formated_length_list($scope.selectedSpeaker.replicas_length_list).slice(0, 50)
                    }];
                    set_speaker_season_data(name);
                    set_speaker_episode_data(name);
                }
            });
        };

        $scope.$watch('dropdownSelectedSpeaker', function (speaker) {
            if (typeof speaker !== "undefined") {
                $scope.set_selected_speaker(speaker);
            }
        });

        $scope.$watch('speakerSeasonStats', function (new_value) {
            if (new_value != undefined) {
                set_speaker_season_replik_line_chart_data(new_value);
            }
        });

        $scope.$watch('speakerEpisodeStats', function (new_value) {
            if (new_value != undefined) {
                set_speaker_episode_replik_line_chart_data(new_value);
            }
        });

        $scope.speechLengthDistributionOptions = {
            chart: {
                type: 'discreteBarChart',
                height: 300,
                margin: {
                    top: 20,
                    right: 20,
                    bottom: 65,
                    left: 50
                },
                x: function (d) {
                    return d[0];
                },
                y: function (d) {
                    return d[1] / 100000;
                },
                showValues: false,
                valueFormat: function (d) {
                    return d3.format(',.0f')(d);
                },
                duration: 800,
                xAxis: {
                    axisLabel: 'Length',
                    tickFormat: function (d) {
                        return d3.format(',.0f')(d)
                    },
                    rotateLabels: 30,
                    showMaxMin: false
                },
                yAxis: {
                    axisLabel: 'Occurences',
                    axisLabelDistance: -10,
                    tickFormat: function (d) {
                        return d3.format(",.0f")(d * 100000);
                    }
                },
                tooltip: {
                    keyFormatter: function (d) {
                        return d3.format(',.0f')(d);
                    }
                },
                zoom: {
                    enabled: true,
                    scaleExtent: [1, 10],
                    useFixedDomain: false,
                    useNiceScale: false,
                    horizontalOff: false,
                    verticalOff: true,
                    unzoomEventType: 'dblclick.zoom'
                }
            }
        };

        $scope.linechartOptionsReplicaNumber = util.getBaseLineChartOptions();
        $scope.linechartOptionsReplicaNumber.title = {
            enable: true,
            text: 'Number Of Speeches Per Season'
        };
        $scope.linechartOptionsReplicaNumber.subtitle = {
            enable: true,
            text: 'This chart shows the total number of speeches per season for the selected speaker',
            css: {
                'text-align': 'center',
                'margin': '10px 13px 0px 7px'
            }
        };

        $scope.linechartOptionsReplicaAvg = util.getBaseLineChartOptions();
        $scope.linechartOptionsReplicaAvg.title = {
            enable: true,
            text: 'Average Speech Length Per Season'
        };
        $scope.linechartOptionsReplicaAvg.subtitle = {
            enable: true,
            text: 'This chart shows the total number of speeches per season for the selected speaker',
            css: {
                'text-align': 'center',
                'margin': '10px 13px 0px 7px'
            }
        };

        $scope.linechartOptionsReplicaSum = util.getBaseLineChartOptions();
        $scope.linechartOptionsReplicaSum.title = {
            enable: true,
            text: 'Number Of Words Per Season'
        };
        $scope.linechartOptionsReplicaSum.subtitle = {
            enable: true,
            text: 'This chart shows the total number of words per season for the selected speaker',
            css: {
                'text-align': 'center',
                'margin': '10px 13px 0px 7px'
            }
        };

        $scope.linechartOptionsReplicaNumberEpi = util.getBaseLineChartOptions();
        $scope.linechartOptionsReplicaNumberEpi.title = {
            enable: true,
            text: 'Number Of Speeches Per Episode'
        };
        $scope.linechartOptionsReplicaNumberEpi.subtitle = {
            enable: true,
            text: 'This chart shows the total number of speeches per episode for the selected speaker',
            css: {
                'text-align': 'center',
                'margin': '10px 13px 0px 7px'
            }
        };

        $scope.linechartOptionsReplicaAvgEpi = util.getBaseLineChartOptions();
        $scope.linechartOptionsReplicaAvgEpi.title = {
            enable: true,
            text: 'Average Speech Length Per Episode'
        };
        $scope.linechartOptionsReplicaAvgEpi.subtitle = {
            enable: true,
            text: 'This chart shows the total number of speeches per episode for the selected speaker',
            css: {
                'text-align': 'center',
                'margin': '10px 13px 0px 7px'
            }
        };

        $scope.linechartOptionsReplicaSumEpi = util.getBaseLineChartOptions();
        $scope.linechartOptionsReplicaSumEpi.title = {
            enable: true,
            text: 'Number Of Words Per Episode'
        };
        $scope.linechartOptionsReplicaSumEpi.subtitle = {
            enable: true,
            text: 'This chart shows the total number of words per episode for the selected speaker',
            css: {
                'text-align': 'center',
                'margin': '10px 13px 0px 7px'
            }
        };

    }]);