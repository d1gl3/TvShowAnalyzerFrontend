angular.module('my-controllers').controller('navbarCtrl', function ($scope, $rootScope, $location, TabService) {

    TabService.Init();

    $scope.selectTab = function(tab) {
        TabService.SetSelectedTab(tab);
    };

    $scope.isSelected = function(tab) {
        return TabService.IsTabSelected(tab);
    };
});
