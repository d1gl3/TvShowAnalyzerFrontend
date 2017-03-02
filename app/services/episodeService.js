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

            service.GetTranscript = function (season_number, episode_number) {
                var transcript_endpoint = SettingService.getBackendUrl() + '/api/transcripts?season=' + season_number + "&episode=" + episode_number,

                    transcript = $http.get(transcript_endpoint),

                    deferObject = deferObject || $q.defer();

                transcript.then(
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