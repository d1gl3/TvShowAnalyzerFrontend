'use strict';

seriesAnalyzer.factory('UtilityService',
    ['$cookieStore', '$rootScope',
        function ($cookieStore, $rootScope) {

            var service = {};

            service.get_formated_length_list = function(old_length_list){
                var length_list = [];

                for (var len in old_length_list) {
                    if (old_length_list.hasOwnProperty(len)) {
                        length_list.push([+len.substring(1), old_length_list[len]])
                    }
                }

                return length_list.sort(service.sort_by_key(0));
            };

            service.sort_and_reverse_config_matrix = function (mtx) {
                return _.sortBy(mtx, function (array) {
                    var sum = 0;

                    for (var el in array) {
                        if (array.hasOwnProperty(el)) {
                            if (array[el] == 1) sum++;
                        }
                    }

                    return sum;
                }).reverse();
            };

            service.get_formated_force_data = function(obj){
                var force_data_all = obj.force_directed_data,
                    nodes = force_data_all.nodes,
                    links = force_data_all.links;

                links = links.filter(service.filter_by_weight);

                return {
                    links: links,
                    nodes: nodes
                };
            };

            // Filters Force Directed Graph Links by weight >= 2
            service.filter_by_weight = function (link) {
                return link.weight >= 2;
            };

            // Returns a 4th degree polynomial regression
            service.getPolynomialRegressionCurve = function (value_array) {
                return regression("polynomial", value_array, 4).points;
            };

            // Sorts a list of objects by key
            service.sort_by_key = function (key) {
                return function (a, b) {
                    return a[key] - b[key];
                }
            };

            service.compareNumbers = function (a, b) {
                return a - b;
            };

            service.fieldSorter = function (fields) {
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
            };

            // Sets the configuration table cell classes to set the color
            service.setColor = function (value) {
                if (value == 1) {
                    return "info";
                }
                if (value == 0) {
                    return "warning";
                }
                return "active";
            };

            // Sets the configuration table cell classes to set the color
            service.setProbabilityColor = function (value) {
                if (typeof value === 'number') {
                    if (value > 1) {
                        return "prob-plus";
                    }
                    if (value < 1) {
                        return "prob-minus";
                    }
                }
                return "prob-equal";
            };

            service.barChartObject = function (name, values) {
                return {
                    key: name,
                    bar: true,
                    values: values
                }
            };

            service.lineChartObject = function (name, values) {
                return {
                    key: name,
                    values: values
                }
            };

            service.calculate_configuration_densities = function (elements) {

                var config_densities = [];

                for (var el in elements) {
                    if (elements.hasOwnProperty(el)) {
                        var element = elements[el];
                        if (typeof element.episode_number !== "undefined") {
                            config_densities.push([+element.episode_number, element.configuration_density]);
                        } else {
                            if (typeof element.season_number !== "undefined") {
                                config_densities.push([+element.season_number, element.configuration_density]);
                            }
                        }
                    }
                }

                config_densities.sort(service.sort_by_key(0));

                return [
                    service.barChartObject("Quantity", config_densities),
                    service.lineChartObject("Regression", service.getPolynomialRegressionCurve(config_densities))
                ];
            };

            service.format_replica_length_list = function (replica_lengths) {
                var length_list = [];

                for (var len in replica_lengths) {
                    if (replica_lengths.hasOwnProperty(len)) {
                        length_list.push([len.substring(1), replica_lengths[len]])
                    }
                }

                length_list.sort(function (a, b) {
                    return a[0] - b[0]
                });
                return length_list;
            };

            service.calc_hamm = function (str1, str2) {
                var dist = 0;

                var str1 = str1.toLowerCase();
                var str2 = str2.toLowerCase();

                for (var i = 0; i < str1.length; i++) {

                    if (str2[i] && str2[i] !== str1[i]) {
                        dist += 1;
                    }
                    else if (!str2[i]) {
                        //  If there's no letter in the comparing string
                        dist += dist;
                    }
                }

                return dist;
            };

            return service;
        }]);