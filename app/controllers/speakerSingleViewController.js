/**
 * Created by paullichtenberger on 28.07.16.
 */


seriesAnalyzer.controller('singleSpeakerController', ['$scope', '$http', 'CurrentSelectedSpeakerService', 'SeasonService', 'EpisodeService',
    'SettingService', 'UtilityService', 'SpeakerService',
    function ($scope, $http, CurrentSelectedSpeakerService, SeasonService, EpisodeService, SettingService, UtilityService, SpeakerService) {

        var util = UtilityService;

        // Get the whole speaker data
        SpeakerService.GetSpeakers().then(
            function (data) {
                $scope.speakers = data;
            }
        );

        var get_speaker_stats = function (name, callback) {
            SpeakerService.GetSpeakerByName(name).then(function (speaker) {
                callback(speaker.data);
            });
        };

        $scope.downloadReplicaCSV = function () {
            console.log("CLICK");
            var replica_lengths = $scope.replicaLengths[0].values;
            var csvContent = "SpeachLength, Value\n";
            var max_length = $scope.replicaLengths[0].values[$scope.replicaLengths[0].values.length - 1];
            console.log(max_length);
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
                    var replica_lengths = $scope.selectedSpeaker.replicas_length_list;
                    var length_list = [];

                    for (var len in replica_lengths) {
                        if (replica_lengths.hasOwnProperty(len)) {
                            length_list.push([len.substring(1), replica_lengths[len]])
                        }
                    }

                    length_list.sort(function (a, b) {
                        return a[0] - b[0]
                    });

                    $scope.speakerWords = $scope.selectedSpeaker.word_cloud_data;
                    $scope.speakerWordsNeg = $scope.selectedSpeaker.negative_words_cloud;
                    $scope.speakerWordsPos = $scope.selectedSpeaker.positive_words_cloud;

                    $scope.replicaLengths = [{
                        key: "Quantity",
                        bar: true,
                        values: length_list.slice(0, 50)
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

            if ($scope.speakerSeasonStats) {
                speaker_stats = $scope.speakerSeasonStats;
                name = $scope.selectedSpeaker.name;
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

        var set_speaker_season_data = function (name) {
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

                    $scope.speakerSeasonStats = speaker_season_stats;
                }
            );
        };

        var set_speaker_episode_data = function (name) {
            EpisodeService.GetEpisodes().then(
                function (result) {
                    var speaker_episode_stats = [];
                    for (var episode in result.data) {
                        if (result.data.hasOwnProperty(episode)) {
                            var _episode_speakers = result.data[episode].speakers;
                            var episode_speaker_stats = _.findWhere(_episode_speakers, {name: name});
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

                    $scope.speakerEpisodeStats = speaker_episode_stats;
                }
            );
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
                    return d[0];
                },
                y: function (d) {
                    return d[1];
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
                    return d[0];
                },
                y: function (d) {
                    return d[1];
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
                    return d[0];
                },
                y: function (d) {
                    return d[1];
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
                    return d[0];
                },
                y: function (d) {
                    return d[1];
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
                    return d[0];
                },
                y: function (d) {
                    return d[1];
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
                    return d[0];
                },
                y: function (d) {
                    return d[1];
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

    }]);