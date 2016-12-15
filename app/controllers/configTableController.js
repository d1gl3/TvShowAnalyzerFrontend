angular.module('my-controllers').controller("configTableController", ["$scope", "$http", "$q", "EpisodeService", "SeasonService", "TvShowService", "UtilityService",
    function ($scope, $http, $q, EpisodeService, SeasonService, TvShowService, UtilityService) {

        var util = UtilityService;
        // Get All Data For Config Tables

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

        var color = d3.scale.category20();

        function getFormatedLengthList(replica_lengths) {
            var length_list = [];

            for (var len in replica_lengths) {
                if (replica_lengths.hasOwnProperty(len)) {
                    length_list.push([+len.substring(1), replica_lengths[len]])
                }
            }

            length_list.sort(function (a, b) {
                return a[0] - b[0];
            });

            return [util.barChartObject("Quantity", length_list)];
        }

        // Sets the configuration table cell classes to set the color
        $scope.setColor = util.setColor;

        // Prepares all data for Season Config Table View
        $scope.$watch("selectedSeason", function (new_season) {
            if (typeof new_season == "undefined") return;

            var force_data_all = new_season.force_directed_data,
                nodes = force_data_all.nodes,
                links = force_data_all.links;
            $scope.max_weight = Math.max.apply(Math, links.map(function (o) {
                return o.weight;
            }));
            $scope.forceDirectedData = {
                links: links.filter(util.filter_by_weight),
                nodes: nodes
            };

            $scope.replica_length_list = getFormatedLengthList(new_season.replicas_length_list);

            var episodes = $scope.all_episodes.filter(function (el) {
                return el.season_number == $scope.selectedSeason.season_number;
            });
            $scope.configuration_densities = util.calculate_configuration_densities(episodes);
        });

        // Prepares the data when viewing an Episode
        $scope.$watch("selectedEpisode", function (new_episode) {
            if (typeof new_episode === 'undefined') return;
            $scope.replica_length_list = getFormatedLengthList(new_episode.replicas_length_list);
        });

        $scope.forceDirectedOptionsSeasons = {
            chart: {
                charge: -240,
                friction: 0.6,
                gravity: 0.3,
                height: 500,
                type: "forceDirectedGraph",
                width: (function () {
                    return nv.utils.windowSize().width;
                })(),
                margin: {
                    top: 20, right: 20, bottom: 20, left: 20
                },
                linkStrength: function (d) {
                    return (1 / (1 + d.weight));
                },
                linkDist: function (d) {
                    return ($scope.max_weight + 50) - d.weight;
                },
                radius: function (d) {
                    return d.weight;
                },
                color: function (d) {
                    return color(d.group);
                }
                ,
                nodeExtras: function (node) {
                    node && node
                        .append("text")
                        .attr("dx", 8)
                        .attr("dy", ".35em")
                        .text(function (d) {
                            return d.name;
                        })
                        .style("font-size", "10px");
                }
            }
        };

        $scope.barOptions = {
            chart: {
                type: "discreteBarChart",
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
                    return d3.format(",.0f")(d);
                },
                duration: 800,
                xAxis: {
                    axisLabel: "Length",
                    tickFormat: function (d) {
                        if ((d % 5) == 0) {
                            return d3.format(",.0f")(d);
                        }
                    },
                    showMaxMin: false
                },
                yAxis: {
                    axisLabel: "Occurences",
                    axisLabelDistance: -10,
                    tickFormat: function (d) {
                        return d3.format(",.0f")(d * 100000);
                    }
                },
                tooltip: {
                    keyFormatter: function (d) {
                        return d3.format(",.0f")(d);
                    }
                },
                zoom: {
                    enabled: true,
                    scaleExtent: [1, 10],
                    useFixedDomain: false,
                    useNiceScale: false,
                    horizontalOff: false,
                    verticalOff: true,
                    unzoomEventType: "dblclick.zoom"
                }
            }
        };

        $scope.barOptionsConfigurationDensities = {
            chart: {
                type: "lineChart",
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
                    return d3.format(",.0f")(d);
                },
                duration: 800,
                xAxis: {
                    axisLabel: "Length",
                    tickFormat: function (d) {
                        return d3.format(",.0f")(d);
                    },
                    rotateLabels: 30,
                    showMaxMin: false
                },
                yAxis: {
                    axisLabel: "Occurences",
                    axisLabelDistance: -10,
                    tickFormat: function (d) {
                        return d3.format(",.2f")(d);
                    }
                },
                yDomain: [0, 1],
                tooltip: {
                    keyFormatter: function (d) {
                        return d3.format(",.0f")(d);
                    }
                },
                zoom: {
                    enabled: true,
                    scaleExtent: [1, 10],
                    useFixedDomain: false,
                    useNiceScale: false,
                    horizontalOff: false,
                    verticalOff: true,
                    unzoomEventType: "dblclick.zoom"
                }
            }
        };

        $scope.options = {
            chart: {
                type: "forceDirectedGraph",
                height: 500,
                linkStrength: function (d) {
                    return (1 / (1 + d.weight));
                },
                friction: 0.9,
                linkDist: function (d) {
                    return 3 * (100 - d.weight * d.weight);
                },
                charge: -120,
                gravity: 0.3,
                width: (function () {
                    return nv.utils.windowSize().width;
                })(),
                radius: function (d) {
                    return d.weight * 3;
                },
                margin: {
                    top: 20, right: 20, bottom: 20, left: 20
                }
                ,
                color: function (d) {
                    return color(d.group);
                }
                ,
                nodeExtras: function (node) {
                    node && node
                        .append("text")
                        .attr("dx", 8)
                        .attr("dy", ".35em")
                        .text(function (d) {
                            return d.name;
                        })
                        .style("font-size", "10px");
                }
            }
        };

    }]);
