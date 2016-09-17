'use strict';

seriesAnalyzer.factory('TabService',
    ['$cookieStore', '$rootScope',
        function ($cookieStore, $rootScope) {

            var service = {};

            service.Init = function() {
                if($cookieStore.get('selectedTab'))
                    $rootScope.selectedTab = $cookieStore.get('selectedTab');
                else
                    $rootScope.selectedTab = 0;
            };

            service.SetSelectedTab = function(tab) {
                $rootScope.selectedTab = tab;
                $cookieStore.put('selectedTab', $rootScope.selectedTab);
            };

            /**
             * @return {boolean}
             */
            service.IsTabSelected = function(tab) {
                return $rootScope.selectedTab === tab;
            };

            service.ClearSelectedTab = function() {
                $rootScope.selectedTab = 0;
                $cookieStore.remove('selectedTab');
            };

            return service;
        }]);