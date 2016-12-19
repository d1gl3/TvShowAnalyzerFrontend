/**
 * Created by paullichtenberger on 03.08.16.
 */

'use strict';

angular.module('my-controllers').filter('range', function () {
    return function (input, total) {
        total = parseInt(total);

        for (var i = 1; i < total; i++) {
            input.push(i);
        }

        return input;
    };
});

angular.module('my-controllers').controller('tvShowGraficsController', ['$scope', '$q', 'SeasonService', 'TvShowService', 'UtilityService', 'DTOptionsBuilder',
    function ($scope, $q, SeasonService, TvShowService, UtilityService, DTOptionsBuilder) {

        var util = UtilityService;

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
        };

        function get_tv_show_data() {
            TvShowService.GetTvShow().then(function (result) {
                $scope.tv_show = result.data;
                $scope.tv_show_config_matrix = $scope.tv_show.configuration_matrix

                $scope.max_weight = Math.max.apply(Math, result.data.force_directed_data.links.map(function (o) {
                    return o.weight;
                }));

                set_force_directed_data(result.data);

                var replica_lengths = $scope.tv_show.replicas_length_list;
                var length_list = [];

                for (var len in replica_lengths) {
                    if (replica_lengths.hasOwnProperty(len)) {
                        length_list.push([+len.substring(1), replica_lengths[len], "Test"])
                    }
                }

                length_list.sort(util.sort_by_key(0));

                $scope.tvShowReplicaLengths = [{
                    key: "Quantity",
                    bar: true,
                    values: length_list.slice(1, 51)
                }];

                var reversed_length_list = jQuery.extend(true, [], length_list);
                reversed_length_list.sort(util.sort_by_key(1));

                $scope.tvShowReplicaLengthsDistribution = reversed_length_list;
            });
        }

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

            $scope.replicaNumberDistribution = [util.barChartObject("Quantity", replik_percentage.sort(util.sort_by_key(0)))];

            $scope.replicaWordDistribution = [util.barChartObject("Quantity", word_percentage.sort(util.sort_by_key(0)))];

            $scope.numberOfSpeakersDistribution = [util.barChartObject("Quantity", number_of_speakers.sort(util.sort_by_key(0)))];

            $scope.configuration_densities = util.calculate_configuration_densities(result.data);

            get_tv_show_data();
        });

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
                callback: function (chart) {
                    chart.update();
                },
                showValues: false,
                valueFormat: function (d) {
                    return d3.format(',.0f')(d);
                },
                duration: 800,
                xAxis: {
                    axisLabel: 'Length',
                    tickFormat: function (d) {
                        return "Season" + d3.format(',.0f')(d)
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

        $scope.setColor = util.setColor;

        $scope.$watchGroup(["slider.min", "slider.max"], function () {
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
                    console.log(node);
                    node && node
                        .append("text")
                        .attr("dx", 8)
                        .attr("dy", ".35em")
                        .text(function (d) {
                            return d.name
                        })
                        .style('font-size', '10px');
                },
                linkExtras: function (link) {
                    link && link
                        .style('stroke', function (l) {
                            return l.color
                        });
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
                callback: function (chart) {
                    chart.update();
                },
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
                useInteractiveGuideline: false,
                interactive: true,
                height: 400,
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

        $scope.ngGridFIx = function () {
            setTimeout(function () {
                $(window).resize();
                console.log("Test");
            }, 1000);
        };

        $scope.dtOptions = DTOptionsBuilder.newOptions()
            .withDOM('frtip')
            .withButtons([
                {
                    extend: 'csv',
                    text: 'Download as CSV'
                },
                {
                    extend: 'excel',
                    text: 'Download as XLS'
                }
        ]);
    }]
);
