seriesAnalyzer.config(function($routeProvider) {
    $routeProvider
        .when('/', { templateUrl: 'assets/templates/tv_show_grafics.html' })
        .when('/episode-config-tables', { templateUrl: 'assets/templates/episode_config_tables.html' })
        .when('/season-config-tables', { templateUrl: 'assets/templates/season_config_tables.html' })
        .when('/tv-show-grafics', { templateUrl: 'assets/templates/tv_show_grafics.html' })
        .when('/speaker-single-view', { templateUrl: 'assets/templates/single_speaker_statistics.html' })
        .when('/speaker-comparison', { templateUrl: 'assets/templates/speaker-comparison.html' })
        .when('/download-view', {templateUrl: 'assets/templates/download_view.html'})
        .otherwise({ redirectTo: '/' });
});
