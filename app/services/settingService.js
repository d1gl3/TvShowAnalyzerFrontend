'use strict';

seriesAnalyzer.factory('SettingService',
    [
        function () {

            var service = {};

            var configuration;

            var isLocal = true;

            if (isLocal) {
                configuration = {
                    backend_url: "http://localhost:8080"
                }
            } else {
                configuration = {
                    backend_url: "http://85.214.56.43:8080"
                }
            }

            service.getBackendUrl = function () {
                return configuration.backend_url;
            };

            return service;
        }
    ]
);