/**
 * Created by paullichtenberger on 03.08.16.
 */

'use strict';

seriesAnalyzer.factory('EpisodeService',
    ['$http', '$q','SettingService',
        function ($http, $q, SettingService) {
            var service = {},
                deferObject;

            service.GetEpisodes = function () {
                var episode_endpoint = SettingService.getBackendUrl() + '/api/episodes',

                    episodes = $http.get(episode_endpoint),

                    deferObject = deferObject || $q.defer();

                episodes.then(
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