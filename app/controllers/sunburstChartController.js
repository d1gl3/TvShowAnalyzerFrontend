/**
 * Created by paullichtenberger on 03.08.16.
 */

angular.module('my-controllers').controller('sunburstChartController', ['$scope', function ($scope) {

        $scope.options = {
            chart: {
                type: 'sunburstChart',
                width: 450,
                height: 450,
                noData: "No Data",
                color: d3.scale.category20c(),
                duration: 250
            }
        };

        console.log($scope.options);


        $scope.burstdata = [{
            'name': 'Season_1',
            'children': [{
                'name': 'Episode_11',
                'children': [
                    {'name': 'Scene_1', 'size': 32},
                    {'name': 'Scene_2', 'size': 19},
                    {'name': 'Scene_3', 'size': 27},
                    {'name': 'Scene_4', 'size': 31},
                    {'name': 'Scene_5', 'size': 16},
                    {'name': 'Scene_6', 'size': 15},
                    {'name': 'Scene_7', 'size': 23},
                    {'name': 'Scene_8', 'size': 14},
                    {'name': 'Scene_9', 'size': 17},
                    {'name': 'Scene_10', 'size': 50}]
            }, {
                'name': 'Episode_1',
                'children': [{'name': 'Scene_1', 'size': 29}, {'name': 'Scene_2', 'size': 64}, {
                    'name': 'Scene_3',
                    'size': 129
                }, {'name': 'Scene_4', 'size': 11}, {'name': 'Scene_5', 'size': 17}, {
                    'name': 'Scene_6',
                    'size': 5
                }, {'name': 'Scene_7', 'size': 14}, {'name': 'Scene_8', 'size': 7}, {
                    'name': 'Scene_9',
                    'size': 5
                }, {'name': 'Scene_10', 'size': 8}, {'name': 'Scene_11', 'size': 18}, {'name': 'Scene_12', 'size': 12}]
            }, {
                'name': 'Episode_2',
                'children': [{'name': 'Scene_1', 'size': 56}, {'name': 'Scene_2', 'size': 20}, {
                    'name': 'Scene_3',
                    'size': 34
                }, {'name': 'Scene_4', 'size': 1}, {'name': 'Scene_5', 'size': 1}, {
                    'name': 'Scene_6',
                    'size': 19
                }, {'name': 'Scene_7', 'size': 43}, {'name': 'Scene_8', 'size': 8}, {
                    'name': 'Scene_9',
                    'size': 12
                }, {'name': 'Scene_10', 'size': 7}, {'name': 'Scene_11', 'size': 32}]
            }, {
                'name': 'Episode_12',
                'children': [{'name': 'Scene_1', 'size': 27}, {'name': 'Scene_2', 'size': 31}, {
                    'name': 'Scene_3',
                    'size': 21
                }, {'name': 'Scene_4', 'size': 21}, {'name': 'Scene_5', 'size': 22}, {
                    'name': 'Scene_23',
                    'size': 2
                }, {'name': 'Scene_7', 'size': 22}, {'name': 'Scene_8', 'size': 5}, {
                    'name': 'Scene_9',
                    'size': 13
                }, {'name': 'Scene_10', 'size': 60}, {'name': 'Scene_11', 'size': 7}]
            }, {
                'name': 'Episode_15',
                'children': [{'name': 'Scene_1', 'size': 33}, {'name': 'Scene_2', 'size': 20}, {
                    'name': 'Scene_3',
                    'size': 20
                }, {'name': 'Scene_4', 'size': 46}, {'name': 'Scene_5', 'size': 18}, {
                    'name': 'Scene_6',
                    'size': 26
                }, {'name': 'Scene_7', 'size': 16}, {'name': 'Scene_8', 'size': 1}, {
                    'name': 'Scene_9',
                    'size': 41
                }, {'name': 'Scene_10', 'size': 14}]
            }, {
                'name': 'Episode_14',
                'children': [{'name': 'Scene_1', 'size': 40}, {'name': 'Scene_2', 'size': 1}, {
                    'name': 'Scene_3',
                    'size': 10
                }, {'name': 'Scene_4', 'size': 23}, {'name': 'Scene_5', 'size': 46}, {
                    'name': 'Scene_6',
                    'size': 25
                }, {'name': 'Scene_7', 'size': 13}, {'name': 'Scene_8', 'size': 65}, {'name': 'Scene_9', 'size': 7}]
            }, {
                'name': 'Episode_17',
                'children': [{'name': 'Scene_1', 'size': 24}, {'name': 'Scene_2', 'size': 22}, {
                    'name': 'Scene_3',
                    'size': 39
                }, {'name': 'Scene_4', 'size': 14}, {'name': 'Scene_5', 'size': 29}, {
                    'name': 'Scene_6',
                    'size': 51
                }, {'name': 'Scene_7', 'size': 23}, {'name': 'Scene_8', 'size': 11}, {'name': 'Scene_9', 'size': 5}]
            }, {
                'name': 'Episode_16',
                'children': [{'name': 'Scene_1', 'size': 36}, {'name': 'Scene_2', 'size': 25}, {
                    'name': 'Scene_3',
                    'size': 35
                }, {'name': 'Scene_4', 'size': 15}, {'name': 'Scene_5', 'size': 10}, {
                    'name': 'Scene_6',
                    'size': 12
                }, {'name': 'Scene_7', 'size': 32}, {'name': 'Scene_8', 'size': 33}, {
                    'name': 'Scene_9',
                    'size': 9
                }, {'name': 'Scene_10', 'size': 7}, {'name': 'Scene_11', 'size': 19}]
            }, {
                'name': 'Episode_8',
                'children': [{'name': 'Scene_1', 'size': 74}, {'name': 'Scene_2', 'size': 32}, {
                    'name': 'Scene_3',
                    'size': 41
                }, {'name': 'Scene_4', 'size': 68}, {'name': 'Scene_5', 'size': 44}, {'name': 'Scene_6', 'size': 4}]
            }, {
                'name': 'Episode_9',
                'children': [{'name': 'Scene_1', 'size': 28}, {'name': 'Scene_2', 'size': 36}, {
                    'name': 'Scene_3',
                    'size': 41
                }, {'name': 'Scene_4', 'size': 35}, {'name': 'Scene_5', 'size': 15}, {
                    'name': 'Scene_6',
                    'size': 15
                }, {'name': 'Scene_7', 'size': 31}, {'name': 'Scene_8', 'size': 16}, {'name': 'Scene_9', 'size': 1}]
            }, {
                'name': 'Episode_7',
                'children': [{'name': 'Scene_1', 'size': 28}, {'name': 'Scene_2', 'size': 86}, {
                    'name': 'Scene_3',
                    'size': 56
                }, {'name': 'Scene_4', 'size': 36}, {'name': 'Scene_5', 'size': 34}, {
                    'name': 'Scene_6',
                    'size': 20
                }, {'name': 'Scene_7', 'size': 19}]
            }, {
                'name': 'Episode_13',
                'children': [{'name': 'Scene_1', 'size': 30}, {'name': 'Scene_2', 'size': 16}, {
                    'name': 'Scene_3',
                    'size': 39
                }, {'name': 'Scene_4', 'size': 25}, {'name': 'Scene_5', 'size': 39}, {
                    'name': 'Scene_6',
                    'size': 82
                }, {'name': 'Scene_7', 'size': 27}]
            }, {
                'name': 'Episode_10',
                'children': [{'name': 'Scene_1', 'size': 38}, {'name': 'Scene_2', 'size': 29}, {
                    'name': 'Scene_3',
                    'size': 6
                }, {'name': 'Scene_4', 'size': 11}, {'name': 'Scene_5', 'size': 30}, {
                    'name': 'Scene_6',
                    'size': 45
                }, {'name': 'Scene_7', 'size': 13}, {'name': 'Scene_8', 'size': 47}, {'name': 'Scene_9', 'size': 5}]
            }, {
                'name': 'Episode_3',
                'children': [{'name': 'Scene_1', 'size': 28}, {'name': 'Scene_2', 'size': 40}, {
                    'name': 'Scene_3',
                    'size': 28
                }, {'name': 'Scene_4', 'size': 18}, {'name': 'Scene_5', 'size': 1}, {
                    'name': 'Scene_6',
                    'size': 15
                }, {'name': 'Scene_7', 'size': 22}, {'name': 'Scene_8', 'size': 41}, {
                    'name': 'Scene_9',
                    'size': 35
                }, {'name': 'Scene_10', 'size': 14}, {'name': 'Scene_11', 'size': 3}]
            }, {
                'name': 'Episode_4',
                'children': [{'name': 'Scene_1', 'size': 20}, {'name': 'Scene_2', 'size': 14}, {
                    'name': 'Scene_3',
                    'size': 3
                }, {'name': 'Scene_4', 'size': 23}, {'name': 'Scene_5', 'size': 20}, {
                    'name': 'Scene_6',
                    'size': 15
                }, {'name': 'Scene_7', 'size': 9}, {'name': 'Scene_8', 'size': 16}, {
                    'name': 'Scene_9',
                    'size': 27
                }, {'name': 'Scene_10', 'size': 29}, {'name': 'Scene_11', 'size': 18}, {
                    'name': 'Scene_12',
                    'size': 3
                }, {'name': 'Scene_13', 'size': 20}, {'name': 'Scene_14', 'size': 5}]
            }, {
                'name': 'Episode_6',
                'children': [{'name': 'Scene_1', 'size': 44}, {'name': 'Scene_2', 'size': 12}, {
                    'name': 'Scene_3',
                    'size': 14
                }, {'name': 'Scene_4', 'size': 136}, {'name': 'Scene_5', 'size': 34}, {
                    'name': 'Scene_6',
                    'size': 7
                }, {'name': 'Scene_7', 'size': 1}]
            }, {
                'name': 'Episode_5',
                'children': [{'name': 'Scene_1', 'size': 58}, {'name': 'Scene_2', 'size': 8}, {
                    'name': 'Scene_3',
                    'size': 31
                }, {'name': 'Scene_4', 'size': 29}, {'name': 'Scene_5', 'size': 0}, {
                    'name': 'Scene_6',
                    'size': 22
                }, {'name': 'Scene_7', 'size': 27}, {'name': 'Scene_8', 'size': 27}, {'name': 'Scene_9', 'size': 19}]
            }]
        }
        ]
    }]
);