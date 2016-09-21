/**
 * Created by paullichtenberger on 03.08.16.
 */

'use strict';

seriesAnalyzer.factory('SpeakerService',
    ['$http', '$q', 'SeasonService', 'SettingService',
        function ($http, $q, SeasonService, SettingService) {
            var service = {},
                deferObject;

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