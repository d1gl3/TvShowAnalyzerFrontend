/**
 * Created by paullichtenberger on 03.08.16.
 */

'use strict';

seriesAnalyzer.factory('SeasonService',
    ['$http', '$q',
        function ($http, $q) {
            var service = {},
                deferObject;

            service.GetSeasons = function () {
                var season_endpoint = 'http://85.214.56.43:8080/api/seasons',

                    seasons = $http.get(season_endpoint),

                    deferObject = deferObject || $q.defer();

                seasons.then(
                    function (answer) {
                        deferObject.resolve(answer);
                    },
                    function (reason) {
                        deferObject.reject(reason);
                    }
                );

                return deferObject.promise;
            };

            return service;
        }]);