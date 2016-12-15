/**
 * Created by paullichtenberger on 28.07.16.
 */
seriesAnalyzer.controller('speakerTableController', ['$scope', '$http', 'SettingService', 'TvShowService', function ($scope, $http, SettingService, TvShowService) {

    TvShowService.GetTvShow().then(function (tv_show) {
       $scope.speakers = tv_show.data.speakers;
    });
}]);
