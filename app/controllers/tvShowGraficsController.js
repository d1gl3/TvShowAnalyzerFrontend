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
        $scope.forceDirectedData = null;

        $scope.checkboxModel = {
            dominating: true,
            concomidant: true,
            independent: true
        };
        $scope.setColor = util.setColor;


        // Get Season and TV Show Data before initializing views
        $q.all([
            SeasonService.GetSeasons(),
            TvShowService.GetTvShow()
        ]).then(function (results) {
            $scope.all_seasons = results[0].data;
            $scope.tv_show = results[1].data;

            set_season_data();
            set_tv_show_data();

            window.onresize = null;
        });

        // Set Season Data for Graphs
        function set_season_data() {

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
        }

        // Set TV Show Data for Views
        function set_tv_show_data() {
            $scope.tv_show_config_matrix = util.sort_and_reverse_config_matrix($scope.tv_show.configuration_matrix);
            $scope.forceDirectedData = util.get_formated_force_data($scope.tv_show);
            $scope.tvShowReplicaLengths = util.get_formated_length_list($scope.tv_show.replicas_length_list);
            $scope.tvShowReplicaLengthsSlice = [{
                key: "Quantity",
                bar: true,
                values: util.get_formated_length_list($scope.tv_show.replicas_length_list).slice(1, 50)
            }];
        }

        // Draw the Force directed Graph for Speakers
        function drawForceGraph(force_data) {

            if (typeof force_data == "undefined") return;

            d3.select("#force-graph").select("svg").remove();

            var links = force_data.links;

            var nodes = {};

            // Compute the distinct nodes from the links.
            links.forEach(function (link) {
                link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
                link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
            });

            var width = 1400,
                height = 1000;

            var force = d3.layout.force()
                .nodes(d3.values(nodes))
                .links(links)
                .size([width, height])
                .linkDistance(function (n) {
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
                .attr("r", function () {
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
                        var pl2 = this.getTotalLength(),
                            // radius of circle plus marker head
                            r2 = (d.target.weight) + 16.97, //16.97 is the "size" of the marker Math.sqrt(12**2 + 12 **2)
                            // position close to where path intercepts circle
                            l = this.getPointAtLength(pl2 - r2);

                        var x_start = d.source.x + (r2 / this.getTotalLength()) * (d.target.x - d.source.x),
                            y_start = d.source.y + (r2 / this.getTotalLength()) * (d.target.y - d.source.y);

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

        // Show hidden, hide visible objects by classname
        function hide_show_elements_by_class(classname, setVisible) {
            [].forEach.call(document.querySelectorAll('.' + classname), function (el) {
                if (!setVisible) {
                    el.style.visibility = 'hidden';
                } else {
                    el.style.visibility = 'visible';
                }
            });
        }

        // Download function for the speech length distribution
        $scope.downloadReplicaCSV = function () {
            var replica_lengths = $scope.tvShowReplicaLengths;
            var length_dict = {};
            var csvContent = "SpeachLength, Value\n";
            var maxLength = replica_lengths[replica_lengths.length - 1][0];

            console.log(replica_lengths);
            console.log(maxLength);

            replica_lengths.forEach(function (lengthArray, index) {

               length_dict[lengthArray[0]] = lengthArray[1];
            });


            console.log(length_dict);
            var lines = [];
            for (var i = 1; i <= maxLength; i++) {
                if (i in length_dict){
                    lines.push(i + "," + length_dict[i])
                } else {

                    lines.push(i + ",0")
                }
            }

            console.log(lines);
            csvContent += lines.join("\n");

            var hiddenElement = document.createElement('a');

            hiddenElement.href = 'data:attachment/csv,' + encodeURI(csvContent);
            hiddenElement.target = '_blank';
            hiddenElement.download = 'SpeachLengths_Total.csv';
            hiddenElement.click();
        };

        $scope.$watch('forceDirectedData', function (new_data) {
            if (new_data != null) drawForceGraph(new_data);
        });

        // Watches for Force Graph sliders to filter relation edges
        $scope.$watch('checkboxModel.concomidant', function (checkboxSettings) {
            hide_show_elements_by_class("concomidant", checkboxSettings);
        });
        $scope.$watch('checkboxModel.independent', function (checkboxSettings) {
            hide_show_elements_by_class("independent", checkboxSettings);
        });
        $scope.$watch('checkboxModel.dominating', function (checkboxSettings) {
            hide_show_elements_by_class("dominating", checkboxSettings);
            hide_show_elements_by_class("subordinating", checkboxSettings);
        });

        $scope.basicBarOptions = {
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
                    axisLabel: 'Length'
                }
            }
        };

        $scope.basicBarOptionsInteractiveFalse = {
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
