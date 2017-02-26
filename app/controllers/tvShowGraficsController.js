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

        $scope.loading = true;

        $scope.checkboxModel = {
            dominating: true,
            concomidant: true,
            independent: true
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
        };

        function get_tv_show_data() {
            TvShowService.GetTvShow().then(function (result) {
                $scope.tv_show = result.data;
                $scope.tv_show_config_matrix = _.sortBy($scope.tv_show.configuration_matrix, function (array) {
                    var sum = 0;

                    for (var el in array) {
                        if (array.hasOwnProperty(el)) {
                            if (array[el] == 1) sum++;
                        }
                    }

                    return sum;
                }).reverse();


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

                length_list.sort(util.sort_by_key(0));

                $scope.tvShowReplicaLengths = [{
                    key: "Quantity",
                    bar: true,
                    values: length_list.slice(0, 50)
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
                number_of_speakers = [],
                config_densities = [];

            for (var season in $scope.all_seasons) {
                if ($scope.all_seasons.hasOwnProperty(season)) {
                    var season_obj = $scope.all_seasons[season];
                    replik_percentage.push([season_obj.season_number, season_obj.number_of_replicas]);
                    word_percentage.push([season_obj.season_number, season_obj.replicas_length_total]);
                    number_of_speakers.push([season_obj.season_number, season_obj.speakers.length]);
                    config_densities.push([season_obj.season_number, season_obj.configuration_density.toFixed(2)]);
                }
            }

            $scope.replicaNumberDistribution = [util.barChartObject("Quantity", replik_percentage.sort(util.sort_by_key(0)))];

            $scope.replicaWordDistribution = [util.barChartObject("Quantity", word_percentage.sort(util.sort_by_key(0)))];

            $scope.numberOfSpeakersDistribution = [util.barChartObject("Quantity", number_of_speakers.sort(util.sort_by_key(0)))];

            $scope.configuration_densities = [util.barChartObject("Density", config_densities.sort(util.sort_by_key(0)))];

            console.log($scope.numberOfSpeakersDistribution);
            console.log($scope.configuration_densities);

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


        $scope.downloadReplicaCSV = function () {
            console.log("CLICK");
            var replica_lengths = $scope.tvShowReplicaLengths[0].values;
            var csvContent = "SpeachLength, Value\n";
            var max_length = $scope.tvShowReplicaLengths[0].values[$scope.tvShowReplicaLengths[0].values.length - 1];
            console.log(max_length);
            replica_lengths.forEach(function (lengthArray, index) {

                var dataString = lengthArray.join(",");
                csvContent += index < replica_lengths.length ? dataString + "\n" : dataString;

            });

            var hiddenElement = document.createElement('a');

            hiddenElement.href = 'data:attachment/csv,' + encodeURI(csvContent);
            hiddenElement.target = '_blank';
            hiddenElement.download = 'SpeachLengths_Total.csv';
            hiddenElement.click();
        };

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

        function drawForceGraph(force_data) {

            if (typeof force_data == "undefined") return;

            d3.select("#force-graph").select("svg").remove();

            var links = force_data.force_directed_data.links;

            var nodes = {};

            // Compute the distinct nodes from the links.
            links.forEach(function (link) {
                link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
                link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
            });

            console.log(nodes);

            var width = 1400,
                height = 1000;

            var force = d3.layout.force()
                .nodes(d3.values(nodes))
                .links(links)
                .size([width, height])
                .linkDistance(function (n, i) {
                    return (1 / n.weight) * 600 + 100;
                })
                .charge(-120)
                .friction(0.9)
                .linkStrength(0.4)
                .on("tick", tick)
                .start();

            var drag = force.drag()
                .on('dragstart', function (d) {
                    d3.select(this).classed('fixed', d.fixed = true);
                    force.stop();
                })
                .on('dragend', function () {
                    force.stop();
                });

            var svg = d3.select("#force-graph").append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("id", "svg_character_network");

            // Per-type markers, as they don't inherit styles.
            svg.append("defs").selectAll("marker")
                .data(["dominating"])
                .enter().append("marker")
                .attr("id", function (d) {
                    return d;
                })
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 0)
                .attr("refY", 0)
                .attr("markerWidth", 12)
                .attr("markerHeight", 12)
                .attr("orient", "auto")
                .append("path")
                .attr("d", "M0,-5L10,0L0,5");

            svg.append("defs").selectAll("marker")
                .data(["concomidant"])
                .enter().append("marker")
                .attr("id", function (d) {
                    return d;
                })
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 0)
                .attr("refY", 0)
                .attr("markerWidth", 12)
                .attr("markerHeight", 12)
                .attr("orient", "auto-start-reverse")
                .append("path")
                .attr("d", "M0,-5L10,0L0,5");

            svg.append("defs").selectAll("marker")
                .data(["subordinating"])
                .enter().append("marker")
                .attr("id", function (d) {
                    return d;
                })
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 0)
                .attr("refY", 0)
                .attr("markerWidth", 12)
                .attr("markerHeight", 12)
                .attr("orient", "auto-start-reverse")
                .append("path")
                .attr("d", "M0,-5L10,0L0,5");

            var div = d3.select("#force-graph").append("div")
                .attr("class", "tooltip")
                .style("position", "absolute")
                .style('padding', '0 10px')
                .style('opacity', 0);

            var path = svg.append("g").selectAll("path")
                .data(force.links())
                .enter().append("path")
                .attr("class", function (d) {
                    return "link " + d.type;
                })
                .attr("marker-end", function (d) {
                    if (d.type != "subordinating") {
                        return "url(#" + d.type + ")";
                    }
                })
                .attr("marker-start", function (d) {
                    if (d.type == "concomidant" || d.type == "subordinating") {
                        return "url(#" + d.type + ")";
                    }
                })
                .on("mouseover", mouseover)
                .on("mouseout", mouseout);


            var circle = svg.append("g").selectAll("circle")
                .data(force.nodes())
                .enter().append("circle")
                .attr("r", function (d) {
                    return 20;
                })
                .call(drag)
                .on('dblclick', function (d) {
                    d3.select(this).classed('fixed', d.fixed = false);
                    force.start();
                });

            var text = svg.append("g").selectAll("text")
                .data(force.nodes())
                .enter().append("text")
                .attr("x", 8)
                .attr("y", ".31em")
                .text(function (d) {
                    return d.name;
                });

            function mouseover(d) {
                console.log(d3.event);
                div.transition()
                    .style('opacity', .9)
                    .style('background', 'lightsteelblue');
                div.html(d.weight)
                    .style('left', (d3.event.clientX - 20) + 'px')
                    .style('top', (d3.event.clientY) + 'px')
            }

            function mouseout() {
                setTimeout(function () {
                    div.transition()
                        .style('opacity', 0)
                }, 2000);
            }

            // Use elliptical arc path segments to doubly-encode directionality.
            function tick() {
                path.attr("d", initial_path);
                path.attr("d", corrected_path);
                circle.attr("transform", transform);
                text.attr("transform", transform);
            }

            function corrected_path(d) {

                if (d.type == "alternative") return;

                if (d.type == "dominating") {
                    var pl = this.getTotalLength(),
                        // radius of circle plus marker head
                        r = (d.target.weight) + 16.97, //16.97 is the "size" of the marker Math.sqrt(12**2 + 12 **2)
                        // position close to where path intercepts circle
                        m = this.getPointAtLength(pl - r);

                    return "M" + d.source.x + "," + d.source.y + "L" + m.x + "," + m.y;
                } else {
                    if (d.type == "concomidant") {
                        var pl = this.getTotalLength(),
                            // radius of circle plus marker head
                            r = (d.target.weight) + 16.97, //16.97 is the "size" of the marker Math.sqrt(12**2 + 12 **2)
                            // position close to where path intercepts circle
                            l = this.getPointAtLength(pl - r);

                        var x_start = d.source.x + (r / this.getTotalLength()) * (d.target.x - d.source.x),
                            y_start = d.source.y + (r / this.getTotalLength()) * (d.target.y - d.source.y);

                        return "M" + x_start + "," + y_start + "L" + l.x + "," + l.y;
                    } else {
                        return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
                    }
                }
            }

            function initial_path(d) {
                return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
            }

            function transform(d) {
                return "translate(" + d.x + "," + d.y + ")";
            }
        }

        $scope.$watch('tv_show', drawForceGraph);

        $scope.$watch('checkboxModel.concomidant', function (checkboxSettings) {
            hide_show_elements_by_class("concomidant", checkboxSettings);
        });

        $scope.$watch('checkboxModel.independent', function (checkboxSettings) {
            hide_show_elements_by_class("independent", checkboxSettings)
        });

        $scope.$watch('checkboxModel.dominating', function (checkboxSettings) {
            hide_show_elements_by_class("dominating", checkboxSettings)
            hide_show_elements_by_class("subordinating", checkboxSettings);
        });

        function hide_show_elements_by_class(classname, setVisible) {
            [].forEach.call(document.querySelectorAll('.' + classname), function (el) {
                if (!setVisible) {
                    el.style.visibility = 'hidden';
                } else {
                    el.style.visibility = 'visible';
                }
            });
        }

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
                    return d3.format('.0f')(d);
                },
                transitionDuration: 500,
                xAxis: {
                    axisLabel: 'Season'
                }
            }
        };

        $scope.barOptionsConfigDensities = {
            chart: {
                type: 'discreteBarChart',
                useInteractiveGuideline: false,
                interactive: false,
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
                    return d3.format('.2f')(d);
                },
                transitionDuration: 500,
                xAxis: {
                    axisLabel: 'Season'
                },
                yAxis: {
                    tickFormat: function (d) {
                        return d3.format('.2f')(d);
                    }
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
            .withOption('order', [])
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
