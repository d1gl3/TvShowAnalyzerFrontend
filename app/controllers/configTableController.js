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
            console.log(results);
        });

        var filter_by_weight = function(link) {
            return link.weight >= 2;
        };

        var color = d3.scale.category20();
        $scope.options = {
            chart: {
                type: 'forceDirectedGraph',
                height: 500,
                linkStrength:   function(d) { return (1/(1+d.weight)) },
                friction: 0.9,
                linkDist: function(d){
                    return 3*(100 - d.weight*d.weight);
                },
                charge: -120,
                gravity: 0.3,
                width: (function () {
                    return nv.utils.windowSize().width
                })(),
                radius: function(d) { return d.weight * 3; },
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

        $scope.$watch("selectedSeason", function (new_season, old) {
            var force_data_all = new_season.force_directed_data,
                nodes = force_data_all.nodes,
                links = force_data_all.links;
            $scope.max_weight = Math.max.apply(Math,links.map(function(o){return o.weight;}));
            $scope.forceDirectedData = {
                links: links.filter(filter_by_weight),
                nodes: nodes
            };
        });

        $scope.forceDirectedOptionsSeasons = {
            chart: {
                type: 'forceDirectedGraph',
                height: 500,
                linkStrength:   function(d) { return (1/(1+d.weight)) },
                friction: 0.6,
                linkDist: function(d){
                    return ($scope.max_weight + 50) - d.weight;
                },
                charge: -240,
                gravity: 0.3,
                width: (function () {
                    return nv.utils.windowSize().width
                })(),
                radius: function(d) { return d.weight; },
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
