seriesAnalyzer.controller('speakerComparisonController', ['$rootScope', '$scope', '$http', '$q', 'CurrentSelectedSpeakerService', 'SeasonService',
    'EpisodeService', 'SettingService', 'UtilityService', 'SpeakerService',
    function ($rootScope, $scope, $http, $q, CurrentSelectedSpeakerService, SeasonService, EpisodeService, SettingService, UtilityService, SpeakerService) {

        var util = UtilityService;

        $rootScope.$on('$routeChangeStart', function (event, next, current) {
            if (typeof(current) !== 'undefined') {
                window.nv.charts = {};
                window.nv.graphs = [];
                window.nv.logs = {};
                // remove resize listeners
                window.onresize = null;
            }
        });

        $scope.selectedSpeaker = [{}, {}];
        $scope.seasonHammingDistance = [];
        $scope.episodeHammingDistance = [];
        $scope.speakers = null;
        $scope.episodes = null;
        $scope.seasons = null;
        $scope.showSpeakerSelection = false;

        if ($scope.speakers == null || $scope.episodes == null || $scope.seasons == null) {
            $q.all([
                EpisodeService.GetEpisodes(),
                SeasonService.GetSeasons(),
                SpeakerService.GetSpeakers()
            ]).then(function (results) {
                $scope.episodes = results[0].data;
                $scope.seasons = results[1].data;
                $scope.speakers = results[2].data;

                initSpeakerSelection();
                window.onresize = null;
            });
        }

        function initSpeakerSelection() {
            $scope.showSpeakerSelection = true;
        }

        $scope.$watchGroup(['speaker1', 'speaker2'], function (speakers) {
            if (speakers[0] != null && speakers[1] != null) {
                set_episodes_hamm_dist();
                set_probability_curve();
            }
            if (speakers[0] != null) {
                set_speaker_season_data(speakers[0]);
                set_speaker_episode_data(speakers[0]);
            }
            if (speakers[1] != null) {
                set_speaker_season_data(speakers[1]);
                set_speaker_episode_data(speakers[1]);
            }
        });

        // Set Data on speaker selection
        $scope.set_selected_speaker = function (name, pos) {
            SpeakerService.GetSpeakerByName(name).then(function (speaker) {
                var _speaker = speaker.data;
                var replica_lengths = _speaker.replicas_length_list;
                var length_list = util.format_replica_length_list(replica_lengths);

                switch (pos) {
                    case 0:
                        $scope.speaker1 = _speaker;
                        break;
                    case 1:
                        $scope.speaker2 = _speaker;
                        break;
                }

                $scope.selectedSpeaker[+pos] = _speaker;

                // Set data for replica length distribution chart
                $scope.selectedSpeaker[+pos].replicaLengths = [
                    util.barChartObject("Quantity", length_list)
                ];

                set_speaker_season_data(name, pos);
                set_speaker_episode_data(name, pos);
            });
        };

        // Set Speaker Season Data for Comparison Graphs
        function set_speaker_season_data(speaker) {

            var speaker_season_stats = [];
            for (var season in $scope.seasons) {
                if ($scope.seasons.hasOwnProperty(season)) {
                    var _season_speakers = $scope.seasons[season].speakers;
                    var season_speaker_stats = _.findWhere(_season_speakers, {name: speaker.name});
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

            speaker.speakerSeasonStats = speaker_season_stats;

        }

        // Set Speaker Episode Data for Comparison Graphs
        function set_speaker_episode_data(speaker) {
            var speaker_episode_stats = [];
            for (var episode in $scope.episodes) {
                if ($scope.episodes.hasOwnProperty(episode)) {
                    var _episode_speakers = $scope.episodes[episode].speakers;
                    var episode_speaker_stats = _.findWhere(_episode_speakers, {name: speaker.name});

                    if (episode_speaker_stats == undefined) {
                        episode_speaker_stats = {
                            replicas_length_total: 0,
                            number_of_replicas: 0,
                            replicas_length_avg: 0
                        }
                    }

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

            speaker.speakerEpisodeStats = speaker_episode_stats;
        }

        // Construct data object for season Comparison Graphs
        var set_speaker_season_replik_line_chart_data = function () {

            var replicaAverageSeasons = [],
                replicaNumberSeasons = [],
                replicaSumSeasons = [],
                avg_length_list = [],
                number_of_replicas_list = [],
                sum_length_list = [],
                name = null,
                speaker_stats = 0;

            if ($scope.speaker1 && $scope.speaker1.speakerSeasonStats) {
                speaker_stats = $scope.speaker1.speakerSeasonStats;
                name = $scope.speaker1.name;
                avg_length_list = [];
                number_of_replicas_list = [];
                sum_length_list = [];

                for (var el in speaker_stats) {
                    if (speaker_stats.hasOwnProperty(el)) {
                        var season_data = speaker_stats[el];
                        avg_length_list.push([
                            season_data.season_number,
                            season_data.season_data != null ? season_data.season_data.replicas_length_avg : 0
                        ]);
                        number_of_replicas_list.push([
                            season_data.season_number,
                            season_data.season_data != null ? season_data.season_data.number_of_replicas : 0
                        ]);
                        sum_length_list.push([
                            season_data.season_number,
                            season_data.season_data != null ? season_data.season_data.replicas_length_total : 0
                        ]);
                    }
                }

                replicaAverageSeasons.push(
                    util.barChartObject(name, avg_length_list)
                );

                replicaNumberSeasons.push(
                    util.barChartObject(name, number_of_replicas_list)
                );

                replicaSumSeasons.push(
                    util.barChartObject(name, sum_length_list)
                );
            }

            if ($scope.speaker2 && $scope.speaker2.speakerSeasonStats) {

                speaker_stats = $scope.speaker2.speakerSeasonStats;
                name = $scope.speaker2.name;
                avg_length_list = [];
                number_of_replicas_list = [];
                sum_length_list = [];

                for (var el in speaker_stats) {
                    if (speaker_stats.hasOwnProperty(el)) {
                        var season_data = speaker_stats[el];
                        avg_length_list.push([
                            season_data.season_number,
                            season_data.season_data != null ? season_data.season_data.replicas_length_avg : 0
                        ]);
                        number_of_replicas_list.push([
                            season_data.season_number,
                            season_data.season_data != null ? season_data.season_data.number_of_replicas : 0
                        ]);
                        sum_length_list.push([
                            season_data.season_number,
                            season_data.season_data != null ? season_data.season_data.replicas_length_total : 0
                        ]);
                    }
                }

                replicaAverageSeasons.push(
                    util.barChartObject(name, avg_length_list)
                );

                replicaNumberSeasons.push(
                    util.barChartObject(name, number_of_replicas_list)
                );

                replicaSumSeasons.push(
                    util.barChartObject(name, sum_length_list)
                );
            }

            $scope.replicaAverageSeasons = replicaAverageSeasons;
            $scope.replicaNumberSeasons = replicaNumberSeasons;
            $scope.replicaSumSeasons = replicaSumSeasons;
        };

        // Construct data object for episode Comparison Graphs
        var set_speaker_episode_replik_line_chart_data = function () {
            var replicaAverageEpisodes = [],
                replicaNumberEpisodes = [],
                replicaSumEpisodes = [],
                avg_length_list = [],
                number_of_replicas_list = [],
                sum_length_list = [],
                name = null,
                speaker_stats = 0;

            if ($scope.speaker1 && $scope.speaker1.speakerEpisodeStats) {
                speaker_stats = $scope.speaker1.speakerEpisodeStats;
                name = $scope.speaker1.name;
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

            if ($scope.speaker2 && $scope.speaker2.speakerEpisodeStats) {
                speaker_stats = $scope.speaker2.speakerEpisodeStats;
                name = $scope.speaker2.name;
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
        };

        // Set data for season hamming distance graph
        function set_episodes_hamm_dist() {
            var episode_dist = [];
            var episode_labels = [];

            var count = 1;

            for (var j = 1; j <= 8; j++) {
                var hamm_1_epi = $scope.selectedSpeaker[0].hamming_distances["season_" + j];
                var hamm_2_epi = $scope.selectedSpeaker[1].hamming_distances["season_" + j];
                for (var i = 1; i <= Object.keys(hamm_1_epi).length - 1; i++) {
                    var dist = util.calc_hamm(hamm_1_epi["episode_" + i].episode_hamming_dist, hamm_2_epi["episode_" + i].episode_hamming_dist);
                    episode_dist.push({
                        x: count,
                        y: dist
                    });
                    episode_labels.push(j + "_" + i);
                    count += 1;
                }
            }

            $scope.episode_labels = episode_labels;

            $scope.seasonHammingDistance = [{
                key: "HammingDistance",
                bar: true,
                area: true,
                values: episode_dist
            }];
        }

        function set_probability_curve() {
            var relative_enc = [],
                count = 1;

            $scope.episodes.sort(util.fieldSorter(['season_number', 'episode_number']));

            for (var epi in $scope.episodes) {
                if ($scope.episodes.hasOwnProperty(epi)) {
                    if (typeof $scope.episodes[epi].speaker_probabilities.couple === "undefined") console.log($scope.episodes[epi]);

                    var delta = 0;

                    if (typeof $scope.episodes[epi].speaker_probabilities.couple[$scope.speaker1.name] != 'undefined'
                        && typeof $scope.episodes[epi].speaker_probabilities.couple[$scope.speaker2.name] != 'undefined') {

                        var _abs_enc = $scope.episodes[epi].speaker_probabilities.couple[$scope.speaker1.name][$scope.speaker2.name],
                            prob1 = $scope.episodes[epi].speaker_probabilities.single[$scope.speaker1.name],
                            prob2 = $scope.episodes[epi].speaker_probabilities.single[$scope.speaker2.name];
                        delta = _abs_enc - ($scope.episodes[epi].number_of_scenes * prob1 * prob2);
                    }

                    relative_enc.push({
                        count: count,
                        delta: delta,
                        episode_number: $scope.episodes[epi].episode_number,
                        season_number: $scope.episodes[epi].season_number
                    });
                    count += 1;
                }
            }

            $scope.probabilities = [
                {
                    key: "Probability Delta",
                    bar: false,
                    area: false,
                    values: relative_enc
                }];
        }

        $scope.$watchGroup(['speaker1.speakerSeasonStats', 'speaker2.speakerSeasonStats'], set_speaker_season_replik_line_chart_data);

        $scope.$watchGroup(['speaker1.speakerEpisodeStats', 'speaker2.speakerEpisodeStats'], set_speaker_episode_replik_line_chart_data);

        $scope.$on('$locationChangeStart', function (event) {
            window.onresize = null;
        });

        // NVD3 Module Options

        var options1 = util.getBaseLineChartOptionsSpeakers();
        var options2 = util.getBaseLineChartOptionsSpeakers();
        var options3 = util.getBaseLineChartOptionsSpeakers();
        var options4 = util.getBaseLineChartOptionsSpeakers();
        var options5 = util.getBaseLineChartOptionsSpeakers();
        var options6 = util.getBaseLineChartOptionsSpeakers();

        options1.title = {
            enable: true,
            text: 'Number of Speeches per Season'
        };
        options1.subtitle = {
            enable: true,
            text: 'This chart shows the total number of speeches per season for the selected Speaker',
            css: {
                'text-align': 'center',
                'margin': '10px 13px 0px 7px'
            }
        };
        options1.yAxis = {
            axisLabel: 'Number of speeches',
            tickFormat: function (d) {
                return d3.format('.02f')(d);
            },
            axisLabelDistance: -10
        };

        $scope.linechartOptionsReplicaNumber = options1;

        options2.title = {
            enable: true,
            text: 'Average Speech Length per Season'
        };
        options2.subtitle = {
            enable: true,
            text: 'This chart shows the average speech length per season for the selected Speaker',
            css: {
                'text-align': 'center',
                'margin': '10px 13px 0px 7px'
            }
        };
        options2.yAxis = {
            axisLabel: 'Average length of speeches',
            tickFormat: function (d) {
                return d3.format('.02f')(d);
            },
            axisLabelDistance: -10
        };
        $scope.linechartOptionsReplicaAvg = options2


        $scope.linechartOptionsReplicaSum = util.getBaseLineChartOptionsSpeakers();
        $scope.linechartOptionsReplicaSum.title = {
            enable: true,
            text: 'Number of words per Season'
        };
        $scope.linechartOptionsReplicaSum.subtitle = {
            enable: true,
            text: 'This chart shows the total number of words per season for the selected Speaker',
            css: {
                'text-align': 'center',
                'margin': '10px 13px 0px 7px'
            }
        };
        $scope.linechartOptionsReplicaSum.yAxis = {
            axisLabel: 'Number of words',
            tickFormat: function (d) {
                return d3.format('.02f')(d);
            },
            axisLabelDistance: -10
        };

        $scope.linechartOptionsReplicaNumberEpi = util.getBaseLineChartOptionsSpeakers();
        $scope.linechartOptionsReplicaNumberEpi.title = {
            enable: true,
            text: 'Number of Speeches per Episode'
        };
        $scope.linechartOptionsReplicaNumberEpi.subtitle = {
            enable: true,
            text: 'This chart shows the total number of replics per Episode for the selected Speaker',
            css: {
                'text-align': 'center',
                'margin': '10px 13px 0px 7px'
            }
        };
        $scope.linechartOptionsReplicaNumberEpi.xAxis = {
            axisLabel: 'Episode'
        };
        $scope.linechartOptionsReplicaNumberEpi.yAxis = {
            axisLabel: 'Number of speeches',
            tickFormat: function (d) {
                return d3.format('.02f')(d);
            },
            axisLabelDistance: -10
        };


        $scope.linechartOptionsReplicaAvgEpi = util.getBaseLineChartOptionsSpeakers();
        $scope.linechartOptionsReplicaAvgEpi.title = {
            enable: true,
            text: 'Average Speech Length per Episode'
        };
        $scope.linechartOptionsReplicaAvgEpi.subtitle = {
            enable: true,
            text: 'This chart shows the average speech length per episode for the selected Speaker',
            css: {
                'text-align': 'center',
                'margin': '10px 13px 0px 7px'
            }
        };
        $scope.linechartOptionsReplicaAvgEpi.xAxis = {
            axisLabel: 'Episode'
        };
        $scope.linechartOptionsReplicaAvgEpi.yAxis = {
            axisLabel: 'Average length of speeches',
            tickFormat: function (d) {
                return d3.format('.02f')(d);
            },
            axisLabelDistance: -10
        };



        $scope.linechartOptionsReplicaSumEpi = util.getBaseLineChartOptionsSpeakers();
        $scope.linechartOptionsReplicaSumEpi.title = {
            enable: true,
            text: 'Number of words per Episode'
        };
        $scope.linechartOptionsReplicaSumEpi.subtitle = {
            enable: true,
            text: 'This chart shows the total number of words per episode for the selected Speaker',
            css: {
                'text-align': 'center',
                'margin': '10px 13px 0px 7px'
            }
        };
        $scope.linechartOptionsReplicaSumEpi.xAxis = {
            axisLabel: 'Episode'
        };
        $scope.linechartOptionsReplicaSumEpi.yAxis = {
            axisLabel: 'Number of words',
            tickFormat: function (d) {
                return d3.format('.02f')(d);
            },
            axisLabelDistance: -10
        };


        $scope.linechartOptionsSeasonHamming = {
            chart: {
                type: 'discreteBarChart',
                height: 550,
                margin: {
                    top: 20,
                    right: 20,
                    bottom: 40,
                    left: 55
                },
                noData: "No data available. Chart is computed as soon as you chose two characters.",
                x: function (d) {
                    return d.x;
                },
                y: function (d) {
                    return d.y;
                },
                useInteractiveGuideline: true,
                xAxis: {
                    axisLabel: 'Season',
                    rotateLabels: -90,
                    tickFormat: function (d) {
                        return $scope.episode_labels[d-1];
                    }
                },
                yAxis: {
                    axisLabel: 'Hamming Distance',
                    tickFormat: function (d) {
                        return d3.format('.02f')(d);
                    },
                    axisLabelDistance: -10
                }
            },
            title: {
                enable: true,
                text: 'Season Hamming Distance'
            }
        };

        $scope.linechartOptionsEpisodeHamming = {
            chart: {
                type: 'historicalBarChart',
                height: 450,
                margin: {
                    top: 20,
                    right: 20,
                    bottom: 40,
                    left: 55
                },
                noData: "No data available. Please select a Season by clicking on the Graph on the left side.",
                x: function (d) {
                    return d.x;
                },
                y: function (d) {
                    return d.y;
                },
                useInteractiveGuideline: true,
                xAxis: {
                    axisLabel: 'Episode'
                },
                yAxis: {
                    axisLabel: 'Hamming Distance',
                    tickFormat: function (d) {
                        return d3.format('.02f')(d);
                    },
                    axisLabelDistance: -10
                }
            },
            title: {
                enable: true,
                text: 'Episodes Hamming Distance'
            }
        };

        $scope.linechartOptionsProbs = {
            chart: {
                type: 'lineChart',
                height: 450,
                margin: {
                    top: 20,
                    right: 20,
                    bottom: 40,
                    left: 55
                },
                noData: "No data available. Chart is computed as soon as you chose two characters.",
                x: function (d) {
                    return d.count;
                },
                y: function (d) {
                    return d.delta;
                },
                xAxis: {
                    axisLabel: 'Episodes'
                },
                yAxis: {
                    axisLabel: 'Probability Delta',
                    tickFormat: function (d) {
                        return d3.format('.02f')(d);
                    },
                    axisLabelDistance: -10
                },
                tooltip: {
                    contentGenerator: function (d) {
                        return '<h3>Delta: ' + d.series[0].values[d.pointIndex].delta + '</h3>' +
                            '<h4>Season: ' + d.series[0].values[d.pointIndex].season_number + '</h4>' +
                            '<h4>Episode: ' + d.series[0].values[d.pointIndex].episode_number + '</h4>';
                    }
                }
            },
            title: {
                enable: true,
                text: 'Speaker Configuration Probability'
            }
        };

        $scope.discreteBarChartOptions = {
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
                    return d[1] > 0 ? d[1] / 100000 : 0;
                },
                showValues: false,
                valueFormat: function (d) {
                    return d3.format(',.0f')(d);
                },
                duration: 800,
                xAxis: {
                    axisLabel: 'Length',
                    tickFormat: function (d) {
                        if (d % 5 == 0) {
                            return d3.format(',.0f')(d)
                        }
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
    }]);