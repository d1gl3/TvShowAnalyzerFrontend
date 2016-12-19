/**
 * Created by paullichtenberger on 16.12.16.
 */

seriesAnalyzer.controller('speakerOverviewController', ['SpeakerService', 'DTOptionsBuilder',
    function (SpeakerService, DTOptionsBuilder) {
        var vm = this;
        vm.speakers = [];
        SpeakerService.GetSpeakers().then(function (spkrs) {
            vm.speakers = spkrs.data;
        });

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