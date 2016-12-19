angular.module('my-controllers').controller("configTableController", ["$scope", "$http", "$q", "EpisodeService", "SeasonService", "TvShowService", "UtilityService",
    function ($scope, $http, $q, EpisodeService, SeasonService, TvShowService, UtilityService) {

        var util = UtilityService;
        // Get All Data For Config Tables

        $scope.checkboxModel = {
            dominating: true,
            concomidant: true,
            independent: true
        };

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
            $scope.episode_titles = get_titles_from_episodes(episodes)
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
                },
                linkExtras: function (link) {
                    link && link
                        .style('stroke', function (l) {
                            return l.color
                        });
                }
            }
        };

        $scope.$watch('selectedEpisode', function (force_data) {

            if (typeof force_data == "undefined") return;

            var links = force_data.force_directed_data.links;

            var nodes = {};

            // Compute the distinct nodes from the links.
            links.forEach(function (link) {
                link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
                link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
            });

            console.log(nodes);

            var width = 700,
                height = 700;

            var force = d3.layout.force()
                .nodes(d3.values(nodes))
                .links(links)
                .size([width, height])
                .linkDistance(300)
                .charge(-120)
                .friction(0.9)
                .on("tick", tick)
                .start();

            var svg = d3.select("#force-graph").append("svg")
                .attr("width", width)
                .attr("height", height);

            // Per-type markers, as they don't inherit styles.
            svg.append("defs").selectAll("marker")
                .data(["dominating"])
                .enter().append("marker")
                .attr("id", function (d) {
                    return d;
                })
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 20)
                .attr("refY", 0)
                .attr("markerWidth", 12)
                .attr("markerHeight", 12)
                .attr("orient", "auto")
                .append("path")
                .attr("d", "M0,-5L10,0L0,5");

            svg.append("defs").selectAll("marker")
                .data(["sdfsdf"])
                .enter().append("marker")
                .attr("id", function (d) {
                    return d;
                })
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 20)
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
                    return d.weight * 2;
                })
                .call(force.drag);

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
                path.attr("d", linkArc);
                circle.attr("transform", transform);
                text.attr("transform", transform);
            }

            function linkArc(d) {
                var dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    dr = Math.sqrt(dx * dx + dy * dy);

                var offsetX = (dx * d.target.weight) / dr,
                    offsetY = (dy * d.target.weight) / dr;

                return "M" + d.source.x + "," + d.source.y + "L" + (d.target.x) + "," + (d.target.y);
            }

            function transform(d) {
                return "translate(" + d.x + "," + d.y + ")";
            }
        });


        $scope.$watch('checkboxModel.concomidant', function (checkboxSettings) {
            hide_show_elements_by_class("concomidant", checkboxSettings)
        });

        $scope.$watch('checkboxModel.independent', function (checkboxSettings) {
            hide_show_elements_by_class("independent", checkboxSettings)
        });

        $scope.$watch('checkboxModel.dominating', function (checkboxSettings) {
            hide_show_elements_by_class("dominating", checkboxSettings)
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
