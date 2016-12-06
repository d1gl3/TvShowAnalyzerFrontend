/**
 * Created by paullichtenberger on 03.08.16.
 */

'use strict';

angular.module('my-controllers').controller('tvShowGraficsController', ['$scope', '$q', 'SeasonService', 'TvShowService',
    function ($scope, $q, SeasonService, TvShowService) {

        var compare_strings = function (a, b) {
            if (a.key < b.key)
                return -1;
            if (a.key > b.key)
                return 1;
            return 0;
        };

        var filter_by_weight = function (link) {
            return (link.weight >= $scope.slider.min) && (link.weight <= $scope.slider.max);
        };

        var set_force_directed_data = function (data) {
            var force_data_all = data.force_directed_data,
                nodes = force_data_all.nodes,
                links = force_data_all.links;

            links = links.filter(filter_by_weight);

            $scope.slider.options.ceil = $scope.max_weight;

            $scope.forceDirectedData = {
                links: links,
                nodes: nodes
            };

            console.log($scope.forceDirectedData);
        };

        TvShowService.GetTvShow().then(function (result) {
            $scope.tv_show = result.data;

            $scope.max_weight = Math.max.apply(Math, result.data.force_directed_data.links.map(function (o) {
                return o.weight;
            }));

            set_force_directed_data(result.data);

            var replica_lengths = $scope.tv_show.replicas_length_list;
            var length_list = [];

            for (var len in replica_lengths) {
                if (replica_lengths.hasOwnProperty(len)) {
                    length_list.push([+len.substring(1), replica_lengths[len]])
                }
            }

            length_list.sort(function (a, b) {
                return a[0] - b[0];
            });

            console.log(length_list);

            $scope.tvShowReplicaLengths = [{
                key: "Quantity",
                bar: true,
                values: length_list
            }];

            var reversed_length_list = jQuery.extend(true, [], length_list);
            reversed_length_list.sort(function (a, b) {
                return b[1] - a[1];
            });

            $scope.tvShowReplicaLengthsDistribution = reversed_length_list;
        });

        SeasonService.GetSeasons().then(function (result) {
            $scope.all_seasons = result.data;

            var replik_percentage = [],
                word_percentage = [],
                number_of_speakers = [];

            for (var season in $scope.all_seasons) {
                if ($scope.all_seasons.hasOwnProperty(season)) {
                    var season_obj = $scope.all_seasons[season];
                    replik_percentage.push([season_obj.season_number, season_obj.number_of_replicas]);
                    word_percentage.push([season_obj.season_number, season_obj.replicas_length_total]);
                    number_of_speakers.push([season_obj.season_number, season_obj.speakers.length]);
                }
            }

            $scope.replicaNumberDistribution = [{
                key: "Quantity",
                bar: true,
                values: replik_percentage.sort(compare_strings)
            }];

            $scope.replicaWordDistribution = [{
                key: "Quantity",
                bar: true,
                values: word_percentage.sort(compare_strings)
            }];

            $scope.numberOfSpeakersDistribution = [{
                key: "Quantity",
                bar: true,
                values: number_of_speakers.sort(compare_strings)
            }];

            $scope.calculate_configuration_densities(result.data);
        });

        function getLinearRegressionCurve(value_array) {
            return regression('polynomial', value_array, 4).points;
        }


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

        $scope.calculate_configuration_densities = function (seasons) {

            var config_densities = [];

            for (var el in seasons) {
                if (seasons.hasOwnProperty(el)) {
                    var season = seasons[el];
                    console.log(season.season_number);
                    config_densities.push([+season.season_number, season.configuration_density]);
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

        $scope.set_color = function (value) {
            if (value == 1) {
                return "info";
            }

            if (value == 0) {
                return "warning";
            }

            return "active";
        };

        $scope.$watch("slider.min", function () {
            set_force_directed_data($scope.tv_show);
        }, true);

        $scope.$watch("slider.max", function () {
            set_force_directed_data($scope.tv_show);
        }, true);

        $scope.slider = {
            min: 0,
            max: 200,
            options: {
                floor: 0,
                ceil: 150
            }
        };

        var color = d3.scale.category20();
        $scope.forceDirectedOptions = {
            chart: {
                type: 'forceDirectedGraph',
                height: 1000,
                linkStrength: 0.1,
                friction: 0.9,
                linkDist: function (d) {
                    return (($scope.max_weight) - d.weight) / 2;
                },
                charge: -120,
                gravity: 0.1,
                width: (function () {
                    return nv.utils.windowSize().width
                })(),
                radius: function (d) {
                    return d.weight * 2;
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

        $scope.barOptions = {
            chart: {
                type: 'historicalBarChart',
                height: 300,
                margin: {
                    top: 20,
                    right: 20,
                    bottom: 65,
                    left: 50
                },
                color: d3.scale.category20(),
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
                        if (d % 5 == 0) return d3.format(',.0f')(d);
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
                    scaleExtent: [1, 100],
                    useFixedDomain: true,
                    useNiceScale: false,
                    horizontalOff: false,
                    verticalOff: true,
                    unzoomEventType: 'dblclick.zoom'
                }
            }
        };

        $scope.barOptions2 = {
            chart: {
                type: 'discreteBarChart',
                height: 450,
                margin: {
                    top: 20,
                    right: 20,
                    bottom: 60,
                    left: 55
                },
                x: function (d) {
                    return d[0];
                },
                y: function (d) {
                    return d[1];
                },
                showValues: true,
                valueFormat: function (d) {
                    return d3.format(',.0f')(d);
                },
                transitionDuration: 500,
                xAxis: {
                    axisLabel: 'Season'
                }
            }
        };

        $scope.options = [{
            chart: {
                type: 'pieChart',
                height: 500,
                x: function (d) {
                    return d[0];
                },
                y: function (d) {
                    return d[1];
                },
                showLabels: true,
                showValues: true,
                duration: 500,
                donut: true,
                noData: "There Is No Data To Display",
                labelsOutside: true,
                labelThreshold: 0.01,
                labelSunbeamLayout: true,
                legend: {
                    margin: {
                        top: 5,
                        right: 35,
                        bottom: 5,
                        left: 0
                    }
                }
            }
        },
            {
                chart: {
                    type: 'pieChart',
                    height: 400,
                    x: function (d) {
                        return d[0];
                    },
                    y: function (d) {
                        return d[1];
                    },
                    showLabels: true,
                    showLegend: false,
                    duration: 500,
                    donut: true,
                    noData: "There Is No Data To Display",
                    labelsOutside: true,
                    labelThreshold: 0.01,
                    labelSunbeamLayout: true,
                    legend: {
                        margin: {
                            top: 5,
                            right: 35,
                            bottom: 5,
                            left: 0
                        }
                    }
                }
            }];

// $scope.$watch('selectedSeason', function(old, new_v) {
//     $scope.update_selected_season_data(new_v);
// });
//
// $scope.update_selected_season_data = function () {
//
//     var replica_lengths = $scope.selectedSeason.replicas_length_list;
//     var length_list = [];
//
//     for (var len in replica_lengths) {
//         if (replica_lengths.hasOwnProperty(len)) {
//             length_list.push([len.substring(1), replica_lengths[len]])
//         }
//     }
//
//     length_list.sort(function (a, b) {
//         return a[0] - b[0]
//     });
//     console.log(length_list);
//
//     $scope.seasonReplicaLengths = [{
//         key: "Quantity",
//         bar: true,
//         values: length_list
//     }];
//
//     $scope.seasonReplicaLengthsDistribution = length_list.sort(function (a, b) {
//         return b[1] - a[1]
//     });
// };
    }])
;
