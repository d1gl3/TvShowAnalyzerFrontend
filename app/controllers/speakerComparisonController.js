seriesAnalyzer.controller('speakerComparisonController', ['$scope', '$http', 'CurrentSelectedSpeakerService', 'SeasonService', 'EpisodeService', 'SettingService',
    function ($scope, $http, CurrentSelectedSpeakerService, SeasonService, EpisodeService, SettingService) {

        $scope.selectedSpeaker = [{}, {}];
        $scope.seasonHammingDistance = [];
        $scope.episodeHammingDistance = [];

        // Get the whole speaker data

        $http.get(SettingService.getBackendUrl() + '/api/speakers')
            .success(function (data) {
                $scope.speakers = data;
            })
            .error(function (data) {
                console.log('Error: ' + data);
            });

        // Set Data on speaker selection

        $scope.set_selected_speaker = function (name, pos) {
            get_speaker_stats(name, function (speaker) {
                $scope.selectedSpeaker[+pos] = speaker;
                var replica_lengths = $scope.selectedSpeaker[+pos].replicas_length_list;
                var length_list = format_replica_length_list(replica_lengths);

                // Set speaker word lists
                $scope.selectedSpeaker[+pos].speakerWords = $scope.selectedSpeaker[+pos].word_cloud_data;
                $scope.selectedSpeaker[+pos].speakerWordsNeg = $scope.selectedSpeaker[+pos].negative_words_cloud;
                $scope.selectedSpeaker[+pos].speakerWordsPos = $scope.selectedSpeaker[+pos].positive_words_cloud;

                // Set data for replica length distribution chart
                $scope.selectedSpeaker[+pos].replicaLengths = [
                    {
                        key: "Quantity",
                        bar: true,
                        values: length_list
                    },
                    {
                        key: "Regression",
                        bar: false,
                        values: getPolynomialRegressionLine(length_list).points
                    }
                ];
            });

            set_speaker_season_data(name, pos);
            set_speaker_episode_data(name, pos);
        };

        // Set Speaker Season Data for Comparison Graphs

        var set_speaker_season_data = function (name, pos) {
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

                    speaker_season_stats.sort(function (a, b) {
                        return a.season_number - b.season_number;
                    });

                    $scope.selectedSpeaker[pos].speakerSeasonStats = speaker_season_stats
                }
            );
        };

        // Set Speaker Episode Data for Comparison Graphs

        var set_speaker_episode_data = function (name, pos) {
            EpisodeService.GetEpisodes().then(
                function (result) {
                    var speaker_episode_stats = [];
                    for (var episode in result.data) {
                        if (result.data.hasOwnProperty(episode)) {
                            var _episode_speakers = result.data[episode].speakers;
                            var episode_speaker_stats = _.findWhere(_episode_speakers, {name: name});

                            if (episode_speaker_stats == undefined) {
                                continue;
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

                    speaker_episode_stats.sort(fieldSorter(['season_number', 'episode_number']));
                    console.log(speaker_episode_stats);

                    $scope.selectedSpeaker[pos].speakerEpisodeStats = speaker_episode_stats;

                }
            );
        };

        // Get speaker data from database

        var get_speaker_stats = function (name, callback) {
            $http.get(SettingService.getBackendUrl() + '/api/speakers/' + name)
                .success(function (data) {
                    callback(data);
                })
                .error(function (data) {
                    console.log('Error: ' + data);
                });
        };

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

                avg_length_list = [];
                number_of_replicas_list = [];
                sum_length_list = [];
                speaker_stats = $scope.selectedSpeaker[0].speakerSeasonStats;
                name = $scope.selectedSpeaker[0].name;

                for (var season in speaker_stats) {
                    if (speaker_stats.hasOwnProperty(season)) {
                        var season_data = speaker_stats[season];
                        if (season_data.season_data != null) {
                            avg_length_list.push({
                                x: season_data.season_number,
                                y: season_data.season_data.replicas_length_avg
                            });
                            number_of_replicas_list.push({
                                x: season_data.season_number,
                                y: season_data.season_data.number_of_replicas
                            });
                            sum_length_list.push({
                                x: season_data.season_number,
                                y: season_data.season_data.replicas_length_total
                            });
                        }
                        else {
                            avg_length_list.push({
                                x: season_data.season_number,
                                y: 0
                            });
                            number_of_replicas_list.push({
                                x: season_data.season_number,
                                y: 0
                            });
                            sum_length_list.push({
                                x: season_data.season_number,
                                y: 0
                            });
                        }
                    }
                }

                replicaAverageSeasons.push({
                        key: name,
                        bar: true,
                        values: avg_length_list
                    },
                    {
                        key: "Regression " + name,
                        values: getLinearRegressionLine(avg_length_list)
                    });

                replicaNumberSeasons.push({
                    key: name,
                    bar: true,
                    values: number_of_replicas_list
                }, {
                    key: "Regression " + name,
                    values: getLinearRegressionLine(number_of_replicas_list)
                });

                replicaSumSeasons.push({
                    key: name,
                    bar: true,
                    values: sum_length_list
                }, {
                    key: "Regression" + name,
                    values: getLinearRegressionLine(sum_length_list)
                });
            }

            if ($scope.selectedSpeaker[1].speakerSeasonStats) {

                avg_length_list = [];
                number_of_replicas_list = [];
                sum_length_list = [];
                speaker_stats = $scope.selectedSpeaker[1].speakerSeasonStats;
                name = $scope.selectedSpeaker[1].name;

                for (var season in speaker_stats) {
                    if (speaker_stats.hasOwnProperty(season)) {
                        var season_data = speaker_stats[season];
                        if (season_data.season_data != null) {
                            avg_length_list.push({
                                x: season_data.season_number,
                                y: season_data.season_data.replicas_length_avg
                            });
                            number_of_replicas_list.push({
                                x: season_data.season_number,
                                y: season_data.season_data.number_of_replicas
                            });
                            sum_length_list.push({
                                x: season_data.season_number,
                                y: season_data.season_data.replicas_length_total
                            });
                        }
                        else {
                            avg_length_list.push({
                                x: season_data.season_number,
                                y: 0
                            });
                            number_of_replicas_list.push({
                                x: season_data.season_number,
                                y: 0
                            });
                            sum_length_list.push({
                                x: season_data.season_number,
                                y: 0
                            });
                        }
                    }
                }

                replicaAverageSeasons.push({
                        key: name,
                        bar: true,
                        values: avg_length_list
                    },
                    {
                        key: "Regression " + name,
                        values: getLinearRegressionLine(avg_length_list)
                    });

                replicaNumberSeasons.push({
                    key: name,
                    bar: true,
                    values: number_of_replicas_list
                }, {
                    key: "Regression " + name,
                    values: getLinearRegressionLine(number_of_replicas_list)
                });

                replicaSumSeasons.push({
                    key: name,
                    bar: true,
                    values: sum_length_list
                }, {
                    key: "Regression" + name,
                    values: getLinearRegressionLine(sum_length_list)
                });
            }

            $scope.replicaAverageSeasons = replicaAverageSeasons;
            $scope.replicaNumberSeasons = replicaNumberSeasons;
            $scope.replicaSumSeasons = replicaSumSeasons;

        };

        // Construct data object for episode Comparison Graphs

        var set_speaker_episode_replik_line_chart_data = function (episodes) {
            var replicaAverageEpisodes = [],
                replicaNumberEpisodes = [],
                replicaSumEpisodes = [],
                avg_length_list = [],
                number_of_replicas_list = [],
                sum_length_list = [],
                name = null,
                speaker_stats = 0;

            if ($scope.selectedSpeaker[0].speakerEpisodeStats) {

                avg_length_list = [];
                number_of_replicas_list = [];
                sum_length_list = [];
                episodes = $scope.selectedSpeaker[0].speakerEpisodeStats;
                name = $scope.selectedSpeaker[0].name;

                var x = 1;

                for (var epi in episodes) {
                    if (episodes.hasOwnProperty(epi)) {
                        var episode = episodes[epi];
                        if (episode.episode_data != null) {
                            avg_length_list.push({
                                x: x,
                                y: episode.episode_data.replicas_length_avg
                            });
                            number_of_replicas_list.push({
                                x: x,
                                y: episode.episode_data.number_of_replicas
                            });
                            sum_length_list.push({
                                x: x,
                                y: episode.episode_data.replicas_length_total
                            });
                        }
                        else {
                            avg_length_list.push({
                                x: x,
                                y: 0
                            });
                            number_of_replicas_list.push({
                                x: x,
                                y: 0
                            });
                            sum_length_list.push({
                                x: x,
                                y: 0
                            });
                        }
                    }
                    x += 1;
                }

                replicaAverageEpisodes.push({
                        key: name,
                        bar: true,
                        values: avg_length_list
                    },
                    {
                        key: "Regression " + name,
                        values: getLinearRegressionLine(avg_length_list)
                    });

                replicaNumberEpisodes.push({
                    key: name,
                    bar: true,
                    values: number_of_replicas_list
                }, {
                    key: "Regression " + name,
                    values: getLinearRegressionLine(number_of_replicas_list)
                });

                replicaSumEpisodes.push({
                    key: name,
                    bar: true,
                    values: sum_length_list
                }, {
                    key: "Regression" + name,
                    values: getLinearRegressionLine(sum_length_list)
                });
            }

            if ($scope.selectedSpeaker[1].speakerEpisodeStats) {

                avg_length_list = [];
                number_of_replicas_list = [];
                sum_length_list = [];
                episodes = $scope.selectedSpeaker[1].speakerEpisodeStats;
                name = $scope.selectedSpeaker[1].name;

                var x = 1;

                for (var epi in episodes) {
                    if (episodes.hasOwnProperty(epi)) {
                        var episode = episodes[epi];
                        if (episode.episode_data != null) {
                            avg_length_list.push({
                                x: x,
                                y: episode.episode_data.replicas_length_avg
                            });
                            number_of_replicas_list.push({
                                x: x,
                                y: episode.episode_data.number_of_replicas
                            });
                            sum_length_list.push({
                                x: x,
                                y: episode.episode_data.replicas_length_total
                            });
                        }
                        else {
                            avg_length_list.push({
                                x: x,
                                y: 0
                            });
                            number_of_replicas_list.push({
                                x: x,
                                y: 0
                            });
                            sum_length_list.push({
                                x: x,
                                y: 0
                            });
                        }
                        x += 1;
                    }
                }

                replicaAverageEpisodes.push({
                        key: name,
                        bar: true,
                        values: avg_length_list
                    },
                    {
                        key: "Regression " + name,
                        values: getLinearRegressionLine(avg_length_list)
                    });

                replicaNumberEpisodes.push({
                    key: name,
                    bar: true,
                    values: number_of_replicas_list
                }, {
                    key: "Regression " + name,
                    values: getLinearRegressionLine(number_of_replicas_list)
                });

                replicaSumEpisodes.push({
                    key: name,
                    bar: true,
                    values: sum_length_list
                }, {
                    key: "Regression" + name,
                    values: getLinearRegressionLine(sum_length_list)
                });
            }

            console.log($scope.selectedSpeaker[0].speakerEpisodeStats);

            $scope.replicaAverageEpisodes = replicaAverageEpisodes;

            $scope.replicaNumberEpisodes = replicaNumberEpisodes;

            $scope.replicaSumEpisodes = replicaSumEpisodes;
        };

        // Set data for episode hamming distance graph

        var set_episodes_hamm_dist = function (season_number) {
            var episode_dist = [];
            var hamm_1 = $scope.selectedSpeaker[0].hamming_distances["season_" + season_number];
            var hamm_2 = $scope.selectedSpeaker[1].hamming_distances["season_" + season_number];

            for (var i = 1; i <= Object.keys(hamm_1).length - 1; i++) {
                var dist = calc_hamm(hamm_1["episode_" + i].episode_hamming_dist, hamm_2["episode_" + i].episode_hamming_dist);
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

            console.log($scope.episodeHammingDistance);
            $scope.$apply();
        };

        // Set data for season hamming distance graph

        var set_season_hamm_dist = function () {
            var season_dist = [];
            var hamm_1 = $scope.selectedSpeaker[0].hamming_distances;
            var hamm_2 = $scope.selectedSpeaker[1].hamming_distances;

            for (var i = 1; i <= 8; i++) {
                var dist = calc_hamm(hamm_1["season_" + i].season_hamming_dist, hamm_2["season_" + i].season_hamming_dist);
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
        };

        // Watch Scope Changes

        $scope.$watch('selectedSpeaker[0].speakerSeasonStats', function () {
            set_speaker_season_replik_line_chart_data();
        });

        $scope.$watch('selectedSpeaker[1].speakerSeasonStats', function () {
            set_speaker_season_replik_line_chart_data();
        });

        $scope.$watch('selectedSpeaker[0]', function (new_value) {
            if ($scope.selectedSpeaker[1].name != undefined) {
                set_season_hamm_dist();
            }
        });

        $scope.$watch('selectedSpeaker[1]', function (new_value) {
            if ($scope.selectedSpeaker[0].name != undefined) {
                set_season_hamm_dist();
            }
        });

        $scope.$watch('selectedSpeaker[0].speakerEpisodeStats', function () {
            set_speaker_episode_replik_line_chart_data();
        });

        $scope.$watch('selectedSpeaker[1].speakerEpisodeStats', function () {
            set_speaker_episode_replik_line_chart_data();
        });

        // NVD3 Module Options

        $scope.linechartOptionsReplicaNumber = {
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
                    return d.x;
                },
                y: function (d) {
                    return d.y;
                },
                useInteractiveGuideline: true,
                dispatch: {
                    stateChange: function (e) {
                        console.log("stateChange");
                    },
                    changeState: function (e) {
                        console.log("changeState");
                    },
                    tooltipShow: function (e) {
                        console.log("tooltipShow");
                    },
                    tooltipHide: function (e) {
                        console.log("tooltipHide");
                    }
                },
                xAxis: {
                    axisLabel: 'Season'
                },
                yAxis: {
                    axisLabel: 'Number of Replics',
                    tickFormat: function (d) {
                        return d3.format('.02f')(d);
                    },
                    axisLabelDistance: -10
                },
                callback: function (chart) {
                    console.log("!!! lineChart callback !!!");
                }
            },
            title: {
                enable: true,
                text: 'Number of Replics per Season'
            },
            subtitle: {
                enable: true,
                text: 'This chart shows the total number of replics per season for the selected Speaker',
                css: {
                    'text-align': 'center',
                    'margin': '10px 13px 0px 7px'
                }
            }
        };
        $scope.linechartOptionsReplicaAvg = {
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
                    return d.x;
                },
                y: function (d) {
                    return d.y;
                },
                useInteractiveGuideline: true,
                dispatch: {
                    stateChange: function (e) {
                        console.log("stateChange");
                    },
                    changeState: function (e) {
                        console.log("changeState");
                    },
                    tooltipShow: function (e) {
                        console.log("tooltipShow");
                    },
                    tooltipHide: function (e) {
                        console.log("tooltipHide");
                    }
                },
                xAxis: {
                    axisLabel: 'Season'
                },
                yAxis: {
                    axisLabel: 'Average Replic Length',
                    tickFormat: function (d) {
                        return d3.format('.02f')(d);
                    },
                    axisLabelDistance: -10
                },
                callback: function (chart) {
                    console.log("!!! lineChart callback !!!");
                }
            },
            title: {
                enable: true,
                text: 'Average Replic Length per Season'
            },
            subtitle: {
                enable: true,
                text: 'This chart shows the average replic length per season for the selected Speaker',
                css: {
                    'text-align': 'center',
                    'margin': '10px 13px 0px 7px'
                }
            }
        };
        $scope.linechartOptionsReplicaSum = {
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
                    return d.x;
                },
                y: function (d) {
                    return d.y;
                },
                useInteractiveGuideline: true,
                dispatch: {
                    stateChange: function (e) {
                        console.log("stateChange");
                    },
                    changeState: function (e) {
                        console.log("changeState");
                    },
                    tooltipShow: function (e) {
                        console.log("tooltipShow");
                    },
                    tooltipHide: function (e) {
                        console.log("tooltipHide");
                    }
                },
                xAxis: {
                    axisLabel: 'Season'
                },
                yAxis: {
                    axisLabel: '# of Words',
                    tickFormat: function (d) {
                        return d3.format('.02f')(d);
                    },
                    axisLabelDistance: -10
                },
                callback: function (chart) {
                    console.log("!!! lineChart callback !!!");
                }
            },
            title: {
                enable: true,
                text: 'Number of words per Season'
            },
            subtitle: {
                enable: true,
                text: 'This chart shows the total number of words per season for the selected Speaker',
                css: {
                    'text-align': 'center',
                    'margin': '10px 13px 0px 7px'
                }
            }
        };

        $scope.linechartOptionsReplicaNumberEpi = {
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
                    return d.x;
                },
                y: function (d) {
                    return d.y;
                },
                useInteractiveGuideline: true,
                dispatch: {
                    stateChange: function (e) {
                        console.log("stateChange");
                    },
                    changeState: function (e) {
                        console.log("changeState");
                    },
                    tooltipShow: function (e) {
                        console.log("tooltipShow");
                    },
                    tooltipHide: function (e) {
                        console.log("tooltipHide");
                    }
                },
                xAxis: {
                    axisLabel: 'Episode'
                },
                yAxis: {
                    axisLabel: 'Number of Replics',
                    tickFormat: function (d) {
                        return d3.format('.02f')(d);
                    },
                    axisLabelDistance: -10
                },
                callback: function (chart) {
                    console.log("!!! lineChart callback !!!");
                }
            },
            title: {
                enable: true,
                text: 'Number of Replics per Episode'
            },
            subtitle: {
                enable: true,
                text: 'This chart shows the total number of replics per Episode for the selected Speaker',
                css: {
                    'text-align': 'center',
                    'margin': '10px 13px 0px 7px'
                }
            }
        };
        $scope.linechartOptionsReplicaAvgEpi = {
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
                    return d.x;
                },
                y: function (d) {
                    return d.y;
                },
                useInteractiveGuideline: true,
                dispatch: {
                    stateChange: function (e) {
                        console.log("stateChange");
                    },
                    changeState: function (e) {
                        console.log("changeState");
                    },
                    tooltipShow: function (e) {
                        console.log("tooltipShow");
                    },
                    tooltipHide: function (e) {
                        console.log("tooltipHide");
                    }
                },
                xAxis: {
                    axisLabel: 'Episode'
                },
                yAxis: {
                    axisLabel: 'Average Replic Length',
                    tickFormat: function (d) {
                        return d3.format('.02f')(d);
                    },
                    axisLabelDistance: -10
                },
                callback: function (chart) {
                    console.log("!!! lineChart callback !!!");
                }
            },
            title: {
                enable: true,
                text: 'Average Replic Length per Episode'
            },
            subtitle: {
                enable: true,
                text: 'This chart shows the average replic length per episode for the selected Speaker',
                css: {
                    'text-align': 'center',
                    'margin': '10px 13px 0px 7px'
                }
            }
        };
        $scope.linechartOptionsReplicaSumEpi = {
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
                    return d.x;
                },
                y: function (d) {
                    return d.y;
                },
                useInteractiveGuideline: true,
                dispatch: {
                    stateChange: function (e) {
                        console.log("stateChange");
                    },
                    changeState: function (e) {
                        console.log("changeState");
                    },
                    tooltipShow: function (e) {
                        console.log("tooltipShow");
                    },
                    tooltipHide: function (e) {
                        console.log("tooltipHide");
                    }
                },
                xAxis: {
                    axisLabel: 'Episode'
                },
                yAxis: {
                    axisLabel: '# of Words',
                    tickFormat: function (d) {
                        return d3.format('.02f')(d);
                    },
                    axisLabelDistance: -10
                },
                callback: function (chart) {
                    console.log("!!! lineChart callback !!!");
                }
            },
            title: {
                enable: true,
                text: 'Number of words per Episode'
            },
            subtitle: {
                enable: true,
                text: 'This chart shows the total number of words per episode for the selected Speaker',
                css: {
                    'text-align': 'center',
                    'margin': '10px 13px 0px 7px'
                }
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
                dispatch: {
                    stateChange: function (e) {
                        console.log("stateChange");
                    },
                    changeState: function (e) {
                        console.log("changeState");
                    },
                    tooltipShow: function (e) {
                        console.log("tooltipShow");
                    },
                    tooltipHide: function (e) {
                        console.log("tooltipHide");
                    }
                },
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
                dispatch: {
                    stateChange: function (e) {
                        console.log("stateChange");
                    },
                    changeState: function (e) {
                        console.log("changeState");
                    },
                    tooltipShow: function (e) {
                        console.log("tooltipShow");
                    },
                    tooltipHide: function (e) {
                        console.log("tooltipHide");
                    }
                },
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

        $scope.options = {
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

        // Helper Functions

        function format_replica_length_list(replica_lengths) {
            var length_list = [];

            for (var len in replica_lengths) {
                if (replica_lengths.hasOwnProperty(len)) {
                    length_list.push([len.substring(1), replica_lengths[len]])
                }
            }

            length_list.sort(function (a, b) {
                return a[0] - b[0]
            });
            return length_list;
        };

        function compareNumbers(a, b) {
            return a - b;
        }

        function calc_hamm(str1, str2) {
            var dist = 0;

            var str1 = str1.toLowerCase();
            var str2 = str2.toLowerCase();

            for (var i = 0; i < str1.length; i++) {

                if (str2[i] && str2[i] !== str1[i]) {
                    dist += 1;
                }
                else if (!str2[i]) {
                    //  If there's no letter in the comparing string
                    dist += dist;
                }
            }

            return dist;
        };

        function fieldSorter(fields) {
            return function (a, b) {
                return fields
                    .map(function (o) {
                        var dir = 1;
                        if (o[0] === '-') {
                            dir = -1;
                            o = o.substring(1);
                        }
                        if (a[o] > b[o]) return dir;
                        if (a[o] < b[o]) return -(dir);
                        return 0;
                    })
                    .reduce(function firstNonZeroValue(p, n) {
                        return p ? p : n;
                    }, 0);
            };
        }

        function getLinearRegressionLine(value_array) {
            var regression_avg = ss.linearRegression(value_array.map(function (d) {
                return [+d.x, d.y];
            }));
            var lin_avg = ss.linearRegressionLine(regression_avg);
            var regression_list = [];

            for (var i = 0; i < value_array.length; i++) {
                regression_list.push({
                    x: value_array[i].x,
                    y: lin_avg(value_array[i].x)
                })
            }

            return regression_list;
        }

        function getPolynomialRegressionLine(value_array) {

            var data = value_array.map(function (d) {
                return [+d[0], d[1]];
            });

            return regression('polynomial', data, 2);
        }

    }]);