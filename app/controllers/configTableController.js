
angular.module('my-controllers').filter('range', function () {
    return function (input, total) {
        total = parseInt(total);

        for (var i = 1; i < total; i++) {
            input.push(i);
        }

        return input;
    };
});

angular.module('my-controllers').controller("configTableController", ["$scope", "$http", "$q", "EpisodeService", "SeasonService", "TvShowService", "UtilityService", "DTOptionsBuilder",
    function ($scope, $http, $q, EpisodeService, SeasonService, TvShowService, UtilityService, DTOptionsBuilder) {

        var util = UtilityService;
        // Get All Data For Config Tables

        $scope.checkboxModel = {
            dominating: true,
            concomidant: true,
            independent: true,
            alternative: true
        };

        $scope.loading = false;

        $scope.show_loading = function () {
            console.log("test");
            $scope.loading = true;
        };

        $scope.sort_numbers = UtilityService.compareNumbers;

        var lang = {
            "decimal":        ".",
            "emptyTable":     "No data available in table",
            "info":           "Showing _START_ to _END_ of _TOTAL_ entries",
            "infoEmpty":      "Showing 0 to 0 of 0 entries",
            "infoFiltered":   "(filtered from _MAX_ total entries)",
            "infoPostFix":    "",
            "thousands":      "",
            "lengthMenu":     "Show _MENU_ entries",
            "loadingRecords": "Loading...",
            "processing":     "Processing...",
            "search":         "Search:",
            "zeroRecords":    "No matching records found",
            "paginate": {
                "first":      "First",
                "last":       "Last",
                "next":       "Next",
                "previous":   "Previous"
            },
            "aria": {
                "sortAscending":  ": activate to sort column ascending",
                "sortDescending": ": activate to sort column descending"
            }
        };

        $scope.dtOptions = DTOptionsBuilder.newOptions()
            .withDOM('frtip')
            .withOption('language', lang)
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

        $scope.dtConfigOptions = DTOptionsBuilder.newOptions().withOption('order', [1, 'desc'])
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

        $scope.downloadReplicaCSV = function () {
            console.log("CLICK");
            var replica_lengths = $scope.replica_length_list[0].values;
            var csvContent = "SpeachLength, Value\n";
            var max_length = $scope.replica_length_list[0].values[$scope.replica_length_list[0].values.length - 1];
            var length_dict = {};
            replica_lengths.forEach(function (lengthArray, index) {
                length_dict[lengthArray[0]] = lengthArray[1];
            });

            console.log(length_dict);
            var value_to_add = null;

            for(var i = 1; i<max_length; i++){
                if (i in length_dict){
                    value_to_add = i < max_length ? String.valueOf(i) + ',' + String.valueOf(length_dict[i]) + "\n" : String.valueOf(i) + ',' + String.valueOf(length_dict[i]);
                    console.log(value_to_add);
                    csvContent += value_to_add;
                } else {
                    csvContent += i < max_length ? String.valueOf(i) + ',0\n' : String.valueOf(i) + ',0';
                }
            }

            console.log(csvContent);

            var hiddenElement = document.createElement('a');

            hiddenElement.href = 'data:attachment/csv,' + encodeURI(csvContent);
            hiddenElement.target = '_blank';
            hiddenElement.download = 'SpeachLengths.csv';
            hiddenElement.click();
        };

        // Sets the configuration table cell classes to set the color
        $scope.setColor = util.setColor;
        $scope.setProbabilityColor = util.setProbabilityColor;

        function get_titles_from_episodes(episodes) {
            var titles = [];

            for (var el in episodes) {
                if (episodes.hasOwnProperty(el)) {
                    titles.push(episodes[el].title);
                }
            }

            return titles;
        }

        // Prepares all data for Season Config Table View
        $scope.$watch("selectedSeason", function (new_season) {
            if (typeof new_season == "undefined") return;

            $scope.loading = true;

            var force_data_all = new_season.force_directed_data,
                nodes = force_data_all.nodes,
                links = force_data_all.links;

            console.log(nodes);
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
            $scope.episode_titles = get_titles_from_episodes(episodes);

            $scope.config_matrix = _.sortBy($scope.selectedSeason.configuration_matrix, function (array) {
                var sum = 0;

                for (var el in array) {
                    if (array.hasOwnProperty(el)) {
                        if (array[el] == 1) sum++;
                    }
                }

                return sum;
            }).reverse();

            $scope.config_probability_header = new_season.probability_matrix[0];

            $scope.config_probability = _.sortBy(new_season.probability_matrix.slice(1, new_season.probability_matrix.length), function (array) {
                var max = 0;

                for (var el in array) {
                    if (array.hasOwnProperty(el)) {
                        if (typeof array[el] === 'number'){
                            if(array[el] > max){
                                max = array[el];
                            }
                        }
                    }
                }

                return max;
            }).reverse();
            $scope.loading = false;
        });

        // Prepares the data when viewing an Episode
        $scope.$watch("selectedEpisode", function (new_episode) {
            if (typeof new_episode === 'undefined') return;
            $scope.loading = true;
            $scope.replica_length_list = getFormatedLengthList(new_episode.replicas_length_list);

            $scope.config_probability_header = new_episode.probability_matrix[0];
            $scope.config_probability = new_episode.probability_matrix.slice(1, new_episode.probability_matrix.length);
            console.log($scope.config_probability);
            console.log($scope.config_probability_header);
            $scope.loading = false;
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
                },
                nodeExtras: function (node) {
                    node && node
                        .append("text")
                        .attr("dx", 8)
                        .attr("dy", ".35em")
                        .text(function (d) {
                            return d.name;
                        })
                        .style("font-size", "10px");
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
                interactive: true,
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
                    contentGenerator: function (key) {
                        return '<h3>' + $scope.episode_titles[key.pointIndex] + '</h3>';
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
                height = 900;

            var force = d3.layout.force()
                .nodes(d3.values(nodes))
                .links(links)
                .size([width, height])
                .linkDistance(300)
                .charge(-120)
                .friction(0.9)
                .on("tick", tick)
                .start();

            var drag = force.drag()
                .on('dragstart', function(d) {
                    d3.select(this).classed('fixed', d.fixed = true);
                    force.stop();
                })
                .on('dragend', function() {
                    force.stop();
                });

            var svg = d3.select("#force-graph").append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("id", "svg_character_network");;

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

            var path = svg.append("g").selectAll("path")
                .data(force.links())
                .enter().append("path")
                .attr("class", function (d) {
                    return "link " + d.type;
                })
                .attr("marker-end", function (d) {
                    return "url(#" + d.type + ")";
                })
                .attr("marker-start", function (d) {
                    if (d.type == "concomidant") {
                        return "url(#" + d.type + ")";
                    }
                });


            var circle = svg.append("g").selectAll("circle")
                .data(force.nodes())
                .enter().append("circle")
                .attr("r", function (d) {
                    return d.weight * 4;
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

            // Use elliptical arc path segments to doubly-encode directionality.
            function tick() {
                path.attr("d", initial_path);
                path.attr("d", corrected_path);
                circle.attr("transform", transform);
                text.attr("transform", transform);
            }

            function corrected_path(d) {
                if (d.type == "dominating") {
                    var pl = this.getTotalLength(),
                        // radius of circle plus marker head
                        r = (d.target.weight) * 4 + 16.97, //16.97 is the "size" of the marker Math.sqrt(12**2 + 12 **2)
                        // position close to where path intercepts circle
                        m = this.getPointAtLength(pl - r);

                    return "M" + d.source.x + "," + d.source.y + "L" + m.x + "," + m.y;
                } else {
                    if (d.type == "concomidant") {
                        var pl = this.getTotalLength(),
                            // radius of circle plus marker head
                            r = (d.target.weight) * 4 + 16.97, //16.97 is the "size" of the marker Math.sqrt(12**2 + 12 **2)
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

        $scope.$watch('selectedEpisode', drawForceGraph);
        $scope.$watch('selectedSeason', drawForceGraph);

        $scope.$watch('checkboxModel.concomidant', function (checkboxSettings) {
            hide_show_elements_by_class("concomidant", checkboxSettings)
        });

        $scope.$watch('checkboxModel.independent', function (checkboxSettings) {
            hide_show_elements_by_class("independent", checkboxSettings)
        });

        $scope.$watch('checkboxModel.dominating', function (checkboxSettings) {
            hide_show_elements_by_class("dominating", checkboxSettings)
        });

        $scope.$watch('checkboxModel.alternative', function (checkboxSettings) {
            hide_show_elements_by_class("alternative", checkboxSettings)
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
    }]);
