/**
 * Created by paullichtenberger on 16.12.16.
 */

seriesAnalyzer.controller('speakerOverviewController', ['$scope', 'SpeakerService', 'DTOptionsBuilder', 'UtilityService',
    function ($scope, SpeakerService, DTOptionsBuilder, UtilityService) {
        var vm = this;
        vm.speakers = [];
        SpeakerService.GetSpeakers().then(function (spkrs) {
            vm.speakers = spkrs.data;
        });

        $scope.sort_numbers = UtilityService.compareNumbers;

        vm.dtOptions = DTOptionsBuilder.newOptions().withOption('order', [1, 'desc'])
            .withDOM('frtip')
            .withButtons([
                {
                    extend: 'csv',
                    text: 'Download as CSV'
                },
                {
                    extend: 'excel',
                    text: 'Download as XLS'
                }
            ]);
    }
]);