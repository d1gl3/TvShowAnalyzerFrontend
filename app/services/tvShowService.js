/**
 * Created by paullichtenberger on 03.08.16.
 */

'use strict';

seriesAnalyzer.factory('TvShowService',
    ['$http', '$q',
        function ($http, $q) {
            var service = {},
                deferObject;

            service.GetTvShow = function () {
                var tv_show_endpoint = 'http://localhost:8080/api/tv_show',

                    tv_show = $http.get(tv_show_endpoint),

                    deferObject = deferObject || $q.defer();

                tv_show.then(
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