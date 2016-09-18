seriesAnalyzer.controller('navbarCtrl', function ($scope, $rootScope, $location, TabService) {

    TabService.Init();

    $scope.selectTab = function(tab) {
        TabService.SetSelectedTab(tab);
    };

    //test

    $scope.isSelected = function(tab) {
        return TabService.IsTabSelected(tab);
    };
});
