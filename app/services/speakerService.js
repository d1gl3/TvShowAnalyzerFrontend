/**
 * Created by paullichtenberger on 03.08.16.
 */

'use strict';

seriesAnalyzer.factory('SpeakerService',
    ['$http', '$q', 'SeasonService', 'SettingService',
        function ($http, $q, SeasonService, SettingService) {
            var service = {},
                deferObject;

            service.GetSpeakerSpeeches = function (speaker, season_number, episode_number) {
                var speeches_endpoint = SettingService.getBackendUrl() + '/api/speeches?speaker=' + speaker;
                if (season_number != null) speeches_endpoint += "&season=" + season_number;
                if (episode_number != null) speeches_endpoint += "&episode=" + episode_number;

                var speeches = $http.get(speeches_endpoint),
                    deferObject = deferObject || $q.defer();

                speeches.then(
                    function (answer) {
                        deferObject.resolve(answer);
                    },
                    function (reason) {
                        deferObject.reject(reason);
                    }
                );

                return deferObject.promise;
            };

            service.GetSpeakers = function () {
                var speaker_endpoint = SettingService.getBackendUrl() + '/api/speakers',

                    speakers = $http.get(speaker_endpoint),

                    deferObject = deferObject || $q.defer();

                speakers.then(
                    function (answer) {
                        deferObject.resolve(answer);
                    },
                    function (reason) {
                        deferObject.reject(reason);
                    }
                );

                return deferObject.promise;
            };

            service.GetSpeakerByName = function (name) {
                var speaker_endpoint = SettingService.getBackendUrl() + '/api/speakers/' + name.toString(),

                    speakers = $http.get(speaker_endpoint),

                    deferObject = deferObject || $q.defer();

                speakers.then(
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