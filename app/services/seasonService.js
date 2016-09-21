/**
 * Created by paullichtenberger on 03.08.16.
 */

'use strict';

seriesAnalyzer.factory('SeasonService',
    ['$http', '$q', 'SettingService',
        function ($http, $q, SettingService) {
            var service = {},
                deferObject;

            service.GetSeasons = function () {
                var season_endpoint = SettingService.getBackendUrl() + '/api/seasons',

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