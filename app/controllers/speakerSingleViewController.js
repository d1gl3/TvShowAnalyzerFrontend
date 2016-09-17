/**
 * Created by paullichtenberger on 28.07.16.
 */


seriesAnalyzer.controller('singleSpeakerController', ['$scope', '$http', 'CurrentSelectedSpeakerService', 'SeasonService', 'EpisodeService',
    function ($scope, $http, CurrentSelectedSpeakerService, SeasonService, EpisodeService) {

        function compareNumbers(a, b) {
            return a - b;
        }

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

        function compareStrings(a, b) {
            if (a.key < b.key)
                return -1;
            if (a.key > b.key)
                return 1;
            return 0;
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

        $http.get('http://85.214.56.43:8080/api/speakers')
            .success(function (data) {
                $scope.speakers = data;
            })
            .error(function (data) {
                console.log('Error: ' + data);
            });

        $scope.sort_int_array = function (array) {
            return array.sort(compareNumbers)
        };

        var get_speaker_stats = function (name, callback) {
            $http.get('http://85.214.56.43:8080/api/speakers/' + name)
                .success(function (data) {
                    callback(data);
                })
                .error(function (data) {
                    console.log('Error: ' + data);
                });
        };

        $scope.set_selected_speaker = function (name) {
            console.log(name);
            get_speaker_stats(name, function (speaker) {
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
                    values: length_list
                }];

            });

            set_speaker_season_data(name);
            set_speaker_episode_data(name);
        };

        $scope.$watch('speakerSeasonStats', function (new_value) {
            set_speaker_season_replik_line_chart_data(new_value);
        });

        $scope.$watch('speakerEpisodeStats', function (new_value) {
            set_speaker_episode_replik_line_chart_data(new_value);
        });

        var set_speaker_episode_replik_line_chart_data = function (episode_stats) {
            var avg_length_list = [],
                number_of_replicas_list = [],
                sum_length_list = [];

            var x = 1;

            for (var episode in episode_stats) {
                if (episode_stats.hasOwnProperty(episode)) {
                    var episode_data = episode_stats[episode];
                    if (episode_data.episode_data != null) {
                        avg_length_list.push({
                            x: x,
                            y: episode_data.episode_data.replicas_length_avg
                        });
                        number_of_replicas_list.push({
                            x: x,
                            y: episode_data.episode_data.number_of_replicas
                        });
                        sum_length_list.push({
                            x: x,
                            y: episode_data.episode_data.replicas_length_total
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

            $scope.replicaAverageEpisodes = [{
                key: $scope.selectedSpeaker.name,
                values: avg_length_list
            },
            {
                key: "Regression",
                values: getLinearRegressionLine(avg_length_list)
            }];

            $scope.replicaNumberEpisodes = [{
                key: $scope.selectedSpeaker.name,
                values: number_of_replicas_list
            },{
                key: "Regression",
                values: getLinearRegressionLine(number_of_replicas_list)
            }];

            $scope.replicaSumEpisodes = [{
                key: $scope.selectedSpeaker.name,
                values: sum_length_list
            }, {
                key: "Regression",
                values: getLinearRegressionLine(sum_length_list)
            }];
        };

        var set_speaker_season_replik_line_chart_data = function (speaker_stats) {
            var avg_length_list = [],
                number_of_replicas_list = [],
                sum_length_list = [];

            console.log(speaker_stats);
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

            $scope.replicaAverageSeasons = [{
                key: $scope.selectedSpeaker.name,
                bar: true,
                values: avg_length_list
            },{
                key: "Regression",
                values: getLinearRegressionLine(avg_length_list)
            }];

            $scope.replicaNumberSeasons = [{
                key: $scope.selectedSpeaker.name,
                bar: true,
                values: number_of_replicas_list
            },{
                key: "Regression",
                values: getLinearRegressionLine(number_of_replicas_list)
            }];

            $scope.replicaSumSeasons = [{
                key: $scope.selectedSpeaker.name,
                bar: true,
                values: sum_length_list
            },{
                key: "Regression",
                values: getLinearRegressionLine(sum_length_list)
            }];
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

                    speaker_season_stats.sort(function (a, b) {
                        return a.season_number - b.season_number;
                    });

                    $scope.speakerSeasonStats = speaker_season_stats
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

                    speaker_episode_stats.sort(fieldSorter(['season_number', 'episode_number']));

                    $scope.speakerEpisodeStats = speaker_episode_stats
                    console.log(speaker_episode_stats);
                }
            );
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

    }]);