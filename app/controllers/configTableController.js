seriesAnalyzer.controller('configTableController', ['$scope', '$http', '$q', 'EpisodeService', 'SeasonService', 'TvShowService',
    function ($scope, $http, $q, EpisodeService, SeasonService, TvShowService) {
        $q.all([
            EpisodeService.GetEpisodes(),
            SeasonService.GetSeasons(),
            TvShowService.GetTvShow()
        ]).then(function (results) {
            $scope.all_episodes = results[0].data;
            $scope.all_seasons = results[1].data;
            $scope.tv_show_data = results[2].data;
            window.onresize = null;
        });

        var filter_by_weight = function (link) {
            return link.weight >= 2;
        };

        $scope.set_color = function (value) {
            console.log(value);
            if (value==1){
                return "info";
            }

            if (value==0){
                return "warning";
            }

            return "active";
        };

        $scope.barOptions = {
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

        $scope.barOptionsConfigurationDensities = {
            chart: {
                type: 'lineChart',
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
                    return d[1];
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
                        return d3.format(",.2f")(d);
                    }
                },
                yDomain: [0, 1],
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

        function getLinearRegressionCurve(value_array) {

            var regression_points = regression('polynomial', value_array, 4).points;
            return regression_points;
        }

        var color = d3.scale.category20();
        $scope.options = {
            chart: {
                type: 'forceDirectedGraph',
                height: 500,
                linkStrength: function (d) {
                    return (1 / (1 + d.weight))
                },
                friction: 0.9,
                linkDist: function (d) {
                    return 3 * (100 - d.weight * d.weight);
                },
                charge: -120,
                gravity: 0.3,
                width: (function () {
                    return nv.utils.windowSize().width
                })(),
                radius: function (d) {
                    return d.weight * 3;
                },
                margin: {
                    top: 20, right: 20, bottom: 20, left: 20
                }
                ,
                color: function (d) {
                    return color(d.group)
                }
                ,
                nodeExtras: function (node) {
                    node && node
                        .append("text")
                        .attr("dx", 8)
                        .attr("dy", ".35em")
                        .text(function (d) {
                            return d.name
                        })
                        .style('font-size', '10px');
                }
            }
        };

        $scope.$watch("selectedSeason", function (new_season) {
            if (new_season != undefined) {
                var force_data_all = new_season.force_directed_data,
                    nodes = force_data_all.nodes,
                    links = force_data_all.links;
                $scope.max_weight = Math.max.apply(Math, links.map(function (o) {
                    return o.weight;
                }));
                $scope.forceDirectedData = {
                    links: links.filter(filter_by_weight),
                    nodes: nodes
                };

                console.log(new_season.replicas_length_list);
                $scope.get_formated_length_list(new_season.replicas_length_list);

                $scope.calculate_configuration_densities(new_season.season_number);
            }
        });

        $scope.calculate_configuration_densities = function (season_number) {

            var episodes = $scope.all_episodes.filter(function (el) {
                return el.season_number == season_number;
            });

            var config_densities = [];

            for (var el in episodes) {
                if (episodes.hasOwnProperty(el)) {
                    var episode = episodes[el];
                    console.log(episode.episode_number);
                    config_densities.push([+episode.episode_number, episode.configuration_density]);
                }
            }

            config_densities.sort(function (a, b) {
                return a[0] - b[0]
            });

            var linear_reg = getLinearRegressionCurve(config_densities);

            $scope.configuration_densities = [{
                key: "Quantity",
                bar: true,
                values: config_densities
            }, {
                key: "Regression",
                values: linear_reg
            }];
        };

        $scope.$watch("selectedEpisode", function (new_episode) {
            console.log(new_episode.replicas_length_list);
            $scope.get_formated_length_list(new_episode.replicas_length_list);
        });

        $scope.get_formated_length_list = function (replica_lengths) {
            var length_list = [];

            for (var len in replica_lengths) {
                if (replica_lengths.hasOwnProperty(len)) {
                    length_list.push([+len.substring(1), replica_lengths[len]])
                }
            }

            length_list.sort(function (a, b) {
                return a[0] - b[0]
            });

            $scope.replica_length_list = [{
                key: "Quantity",
                bar: true,
                values: length_list
            }];
        };

        $scope.forceDirectedOptionsSeasons = {
            chart: {
                type: 'forceDirectedGraph',
                height: 500,
                linkStrength: function (d) {
                    return (1 / (1 + d.weight))
                },
                friction: 0.6,
                linkDist: function (d) {
                    return ($scope.max_weight + 50) - d.weight;
                },
                charge: -240,
                gravity: 0.3,
                width: (function () {
                    return nv.utils.windowSize().width
                })(),
                radius: function (d) {
                    return d.weight;
                },
                margin: {
                    top: 20, right: 20, bottom: 20, left: 20
                }
                ,
                color: function (d) {
                    return color(d.group)
                }
                ,
                nodeExtras: function (node) {
                    node && node
                        .append("text")
                        .attr("dx", 8)
                        .attr("dy", ".35em")
                        .text(function (d) {
                            return d.name
                        })
                        .style('font-size', '10px');
                }
            }
        }
        ;

    }]);
