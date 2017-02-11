seriesAnalyzer.controller('speakerComparisonController', ['$scope', '$http', 'CurrentSelectedSpeakerService', 'SeasonService',
    'EpisodeService', 'SettingService', 'UtilityService', 'SpeakerService',
    function ($scope, $http, CurrentSelectedSpeakerService, SeasonService, EpisodeService, SettingService, UtilityService, SpeakerService) {

        var util = UtilityService;

        $scope.selectedSpeaker = [{}, {}];
        $scope.seasonHammingDistance = [];
        $scope.episodeHammingDistance = [];

        // Get the whole speaker data
        SpeakerService.GetSpeakers().then(
            function (data) {
                $scope.speakers = data;
            }
        );

        // Set Data on speaker selection
        $scope.set_selected_speaker = function (name, pos) {
            SpeakerService.GetSpeakerByName(name).then(function (speaker) {
                var _speaker = speaker.data;
                var replica_lengths = _speaker.replicas_length_list;
                var length_list = util.format_replica_length_list(replica_lengths);

                $scope.selectedSpeaker[+pos] = _speaker;

                // Set speaker word lists
                $scope.selectedSpeaker[+pos].speakerWords = _speaker.word_cloud_data;
                $scope.selectedSpeaker[+pos].speakerWordsNeg = _speaker.negative_words_cloud;
                $scope.selectedSpeaker[+pos].speakerWordsPos = _speaker.positive_words_cloud;

                // Set data for replica length distribution chart
                $scope.selectedSpeaker[+pos].replicaLengths = [
                    util.barChartObject("Quantity", length_list)
                ];
            });

            set_speaker_season_data(name, pos);
            set_speaker_episode_data(name, pos);
        };

        // Set Speaker Season Data for Comparison Graphs
        function set_speaker_season_data(name, pos) {
            SeasonService.GetSeasons().then(
                function (result) {
                    var speaker_season_stats = [];
                    for (var season in result.data) {
                        if (result.data.hasOwnProperty(season)) {
                            var _season_speakers = result.data[season].speakers;
                            var season_speaker_stats = _.findWhere(_season_speakers, {name: name});
                            speaker_season_stats.push({
                                season_number: result.data[season].season_number,
                                season_data: season_speaker_stats
                            });
                        } else {
                            speaker_season_stats.push({
                                season_number: result.data[season].season_number,
                                season_data: null
                            });
                        }
                    }

                    speaker_season_stats.sort(util.sort_by_key("season_number"));

                    $scope.selectedSpeaker[pos].speakerSeasonStats = speaker_season_stats
                }
            );
        }

        // Set Speaker Episode Data for Comparison Graphs
        function set_speaker_episode_data(name, pos) {
            EpisodeService.GetEpisodes().then(
                function (result) {
                    $scope.all_episodes = result.data;

                    var speaker_episode_stats = [];
                    for (var episode in result.data) {
                        if (result.data.hasOwnProperty(episode)) {
                            var _episode_speakers = result.data[episode].speakers;
                            var episode_speaker_stats = _.findWhere(_episode_speakers, {name: name});

                            if (episode_speaker_stats == undefined) {
                                episode_speaker_stats = {
                                    replicas_length_total: 0,
                                    number_of_replicas: 0,
                                    replicas_length_avg: 0
                                }
                            }

                            speaker_episode_stats.push({
                                season_number: result.data[episode].season_number,
                                episode_number: result.data[episode].episode_number,
                                episode_data: episode_speaker_stats
                            });
                        } else {
                            speaker_episode_stats.push({
                                season_number: result.data[episode].season_number,
                                episode_number: result.data[episode].episode_number,
                                episode_data: null
                            });
                        }
                    }

                    speaker_episode_stats.sort(util.fieldSorter(['season_number', 'episode_number']));

                    $scope.selectedSpeaker[pos].speakerEpisodeStats = speaker_episode_stats;
                }
            );
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

            if ($scope.selectedSpeaker[0].speakerSeasonStats) {
                speaker_stats = $scope.selectedSpeaker[0].speakerSeasonStats;
                name = $scope.selectedSpeaker[0].name;
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
                    util.barChartObject(name, avg_length_list),
                    util.lineChartObject("Regression" + name, util.getPolynomialRegressionCurve(avg_length_list))
                );

                replicaNumberSeasons.push(
                    util.barChartObject(name, number_of_replicas_list),
                    util.lineChartObject("Regression" + name, util.getPolynomialRegressionCurve(number_of_replicas_list))
                );

                replicaSumSeasons.push(
                    util.barChartObject(name, sum_length_list),
                    util.lineChartObject("Regression" + name, util.getPolynomialRegressionCurve(sum_length_list))
                );
            }

            if ($scope.selectedSpeaker[1].speakerSeasonStats) {
                speaker_stats = $scope.selectedSpeaker[1].speakerSeasonStats;
                name = $scope.selectedSpeaker[1].name;
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
                    util.barChartObject(name, avg_length_list),
                    util.lineChartObject("Regression" + name, util.getPolynomialRegressionCurve(avg_length_list))
                );

                replicaNumberSeasons.push(
                    util.barChartObject(name, number_of_replicas_list),
                    util.lineChartObject("Regression" + name, util.getPolynomialRegressionCurve(number_of_replicas_list))
                );

                replicaSumSeasons.push(
                    util.barChartObject(name, sum_length_list),
                    util.lineChartObject("Regression" + name, util.getPolynomialRegressionCurve(sum_length_list))
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

            if ($scope.selectedSpeaker[0].speakerEpisodeStats) {
                speaker_stats = $scope.selectedSpeaker[0].speakerEpisodeStats;
                name = $scope.selectedSpeaker[0].name;
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
                    util.barChartObject(name, avg_length_list),
                    util.lineChartObject("Regression" + name, util.getPolynomialRegressionCurve(avg_length_list))
                );

                replicaNumberEpisodes.push(
                    util.barChartObject(name, number_of_replicas_list),
                    util.lineChartObject("Regression" + name, util.getPolynomialRegressionCurve(number_of_replicas_list))
                );

                replicaSumEpisodes.push(
                    util.barChartObject(name, sum_length_list),
                    util.lineChartObject("Regression" + name, util.getPolynomialRegressionCurve(sum_length_list))
                );
            }

            if ($scope.selectedSpeaker[1].speakerEpisodeStats) {
                speaker_stats = $scope.selectedSpeaker[1].speakerEpisodeStats;
                name = $scope.selectedSpeaker[1].name;
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
                    util.barChartObject(name, avg_length_list),
                    util.lineChartObject("Regression" + name, util.getPolynomialRegressionCurve(avg_length_list))
                );

                replicaNumberEpisodes.push(
                    util.barChartObject(name, number_of_replicas_list),
                    util.lineChartObject("Regression" + name, util.getPolynomialRegressionCurve(number_of_replicas_list))
                );

                replicaSumEpisodes.push(
                    util.barChartObject(name, sum_length_list),
                    util.lineChartObject("Regression" + name, util.getPolynomialRegressionCurve(sum_length_list))
                );
            }

            $scope.replicaAverageEpisodes = replicaAverageEpisodes;

            $scope.replicaNumberEpisodes = replicaNumberEpisodes;

            $scope.replicaSumEpisodes = replicaSumEpisodes;
        };

        // Set data for episode hamming distance graph
        function set_episodes_hamm_dist(season_number) {
            var episode_dist = [];
            var hamm_1 = $scope.selectedSpeaker[0].hamming_distances["season_" + season_number];
            var hamm_2 = $scope.selectedSpeaker[1].hamming_distances["season_" + season_number];

            for (var i = 1; i <= Object.keys(hamm_1).length - 1; i++) {
                var dist = util.calc_hamm(hamm_1["episode_" + i].episode_hamming_dist, hamm_2["episode_" + i].episode_hamming_dist);
                episode_dist.push({
                    x: i,
                    y: dist
                });
            }

            $scope.episodeHammingDistance = [{
                key: "HammingDistance",
                bar: true,
                area: true,
                values: episode_dist
            }];

            $scope.$apply();
        }

        // Set data for season hamming distance graph
        function set_season_hamm_dist(speakers) {
            console.log(speakers);
            var season_dist = [];
            var hamm_1 = speakers[0].hamming_distances;
            var hamm_2 = speakers[1].hamming_distances;

            for (var i = 1; i <= 8; i++) {
                var dist = util.calc_hamm(hamm_1["season_" + i].season_hamming_dist, hamm_2["season_" + i].season_hamming_dist);
                season_dist.push({
                    x: i,
                    y: dist
                });
            }

            $scope.seasonHammingDistance = [{
                key: "HammingDistance",
                bar: true,
                area: true,
                values: season_dist
            }];
        }

        function set_probability_curve(speakers) {
            console.log("SET CURVES");
            var absolut_enc = [],
                relative_enc = [],
                speaker1 = speakers[0].name,
                speaker2 = speakers[1].name,
                count = 1;

            var episodes = $scope.all_episodes;

            episodes.sort(util.fieldSorter(['season_number', 'episode_number']));

            for (var epi in episodes) {
                if (episodes.hasOwnProperty(epi)) {
                    var _abs_enc = episodes[epi].speaker_probabilities.couple[speaker1][speaker2],
                        prob1 = episodes[epi].speaker_probabilities.single[speaker1],
                        prob2 = episodes[epi].speaker_probabilities.single[speaker2];

                    if (isNaN(_abs_enc)) _abs_enc = 0;

                    var delta = _abs_enc - (episodes[epi].number_of_scenes * prob1 * prob2);

                    relative_enc.push({
                        count: count,
                        delta: delta,
                        episode_number: episodes[epi].episode_number,
                        season_number: episodes[epi].season_number
                    });
                    count += 1;

                    console.log(episodes[epi].season_number, episodes[epi].episode_number, delta)
                }
            }

            $scope.probabilities = [
                {
                    key: "Probability Delta",
                    bar: false,
                    area: false,
                    values: relative_enc
                }];

            console.log(relative_enc);
        }

        function calculate_correlations(replica_list_dict) {

            var correlation_coefficients = {};

            for (var list in replica_list_dict) {
                if (replica_list_dict.hasOwnProperty(list)) {
                    var listname = replica_list_dict[list].mtype;
                    var arrays = replica_list_dict[list].filter(function (el) {
                        return el.bar == true;
                    });

                    var values1 = [],
                        values2 = [];

                    for (var i = 0; i < arrays[0].values.length; i++) {
                        values1.push(parseInt(arrays[0].values[i][1]));
                        values2.push(parseInt(arrays[1].values[i][1]));
                    }

                    correlation_coefficients[listname] = ss.sampleCorrelation(values1, values2);
                }
            }

            console.log(correlation_coefficients);
        }

        // Watch Scope Changes
        $scope.$watchGroup(['replicaAverageEpisodes', 'replicaNumberEpisodes', 'replicaSumEpisodes'], function (new_values) {
            if (typeof new_values[0] === "undefined" || typeof new_values[1] === "undefined" || typeof new_values[2] === "undefined") return;

            if ($scope.selectedSpeaker[0] && $scope.selectedSpeaker[1]) {
                new_values[0].mtype = "avg";
                new_values[1].mtype = "num";
                new_values[2].mtype = "sum";
                calculate_correlations(new_values);
            }
        });

        $scope.$watchGroup(['selectedSpeaker[0].speakerSeasonStats', 'selectedSpeaker[1].speakerSeasonStats'], function () {
            set_speaker_season_replik_line_chart_data();
        });

        $scope.$watchGroup(['selectedSpeaker[0]', 'selectedSpeaker[1]'], function (speakers) {
            console.log(speakers);
            if (speakers[0].name != undefined && speakers[1].name != undefined) {
                set_season_hamm_dist(speakers);
                set_probability_curve(speakers);
            }
        });

        $scope.$watchGroup(['selectedSpeaker[0].speakerEpisodeStats', 'selectedSpeaker[1].speakerEpisodeStats'], function () {
            set_speaker_episode_replik_line_chart_data();
        });

        // NVD3 Module Options

        var baseLineChartOptions = {
            chart: {
                type: 'lineChart',
                height: 450,
                margin: {
                    top: 20,
                    right: 20,
                    bottom: 40,
                    left: 55
                },
                x: function (d) {
                    return d[0];
                },
                y: function (d) {
                    return d[1];
                },
                useInteractiveGuideline: true,
                xAxis: {
                    axisLabel: 'Season'
                },
                yAxis: {
                    axisLabel: 'Number of Replics',
                    tickFormat: function (d) {
                        return d3.format('.02f')(d);
                    },
                    axisLabelDistance: -10
                }
            }
        };

        $scope.linechartOptionsReplicaNumber = baseLineChartOptions;
        $scope.linechartOptionsReplicaNumber.title = {
            enable: true,
            text: 'Number of Replics per Season'
        };
        $scope.linechartOptionsReplicaNumber.subtitle = {
            enable: true,
            text: 'This chart shows the total number of replics per season for the selected Speaker',
            css: {
                'text-align': 'center',
                'margin': '10px 13px 0px 7px'
            }
        };

        $scope.linechartOptionsReplicaAvg = baseLineChartOptions;
        $scope.linechartOptionsReplicaAvg.title = {
            enable: true,
            text: 'Average Replic Length per Season'
        };
        $scope.linechartOptionsReplicaAvg.subtitle = {
            enable: true,
            text: 'This chart shows the average replic length per season for the selected Speaker',
            css: {
                'text-align': 'center',
                'margin': '10px 13px 0px 7px'
            }
        };

        $scope.linechartOptionsReplicaSum = baseLineChartOptions;
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

        $scope.linechartOptionsReplicaNumberEpi = baseLineChartOptions;
        $scope.linechartOptionsReplicaNumberEpi.title = {
            enable: true,
            text: 'Number of Replics per Episode'
        };
        $scope.linechartOptionsReplicaNumberEpi.subtitle = {
            enable: true,
            text: 'This chart shows the total number of replics per Episode for the selected Speaker',
            css: {
                'text-align': 'center',
                'margin': '10px 13px 0px 7px'
            }
        };

        $scope.linechartOptionsReplicaAvgEpi = baseLineChartOptions;
        $scope.linechartOptionsReplicaAvgEpi.title = {
            enable: true,
            text: 'Average Replic Length per Episode'
        };
        $scope.linechartOptionsReplicaAvgEpi.subtitle = {
            enable: true,
            text: 'This chart shows the average replic length per episode for the selected Speaker',
            css: {
                'text-align': 'center',
                'margin': '10px 13px 0px 7px'
            }
        };

        $scope.linechartOptionsReplicaSumEpi = baseLineChartOptions;
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

        $scope.linechartOptionsSeasonHamming = {
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
                    return d.x;
                },
                y: function (d) {
                    return d.y;
                },
                useInteractiveGuideline: true,
                xAxis: {
                    axisLabel: 'Season'
                },
                yAxis: {
                    axisLabel: 'Hamming Distance',
                    tickFormat: function (d) {
                        return d3.format('.02f')(d);
                    },
                    axisLabelDistance: -10
                },
                interactiveLayer: {
                    dispatch: {
                        elementClick: function (e) {
                            set_episodes_hamm_dist(Math.round(e.pointXValue));
                        }
                    }
                }
            },
            title: {
                enable: true,
                text: 'Season Hamming Distance'
            }
        };
        $scope.linechartOptionsEpisodeHamming = {
            chart: {
                type: 'lineChart',
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
                        console.log(d.series[0].values[d.pointIndex].episode_number);
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