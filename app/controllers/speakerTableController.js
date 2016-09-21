/**
 * Created by paullichtenberger on 28.07.16.
 */
seriesAnalyzer.controller('speakerTableController', ['$scope', '$http', 'SettingService', function ($scope, $http, SettingService) {

    console.log(SettingService);

    function compareNumbers(a, b) {
        return a - b;
    }

    $http.get(SettingService.getBackendUrl() + '/api/tv_show')
        .success(function (data) {
            $scope.speakers = data.speakers;
        })
        .error(function (data) {
            console.log('Error: ' + data);
        });

    $scope.sort_int_array = function(array){
        return array.sort(compareNumbers)
    };
}]);
