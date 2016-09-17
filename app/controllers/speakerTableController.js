/**
 * Created by paullichtenberger on 28.07.16.
 */
seriesAnalyzer.controller('speakerTableController', function ($scope, $http) {

    function compareNumbers(a, b) {
        return a - b;
    };

    $http.get('http://85.214.56.43:8080/api/tv_show')
        .success(function (data) {
            $scope.speakers = data.speakers;
        })
        .error(function (data) {
            console.log('Error: ' + data);
        });

    $scope.sort_int_array = function(array){
        return array.sort(compareNumbers)
    };
});
