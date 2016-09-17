/**
 * Created by paullichtenberger on 31.07.16.
 */

angular
    .module('my-services')
    .factory('CurrentSelectedSpeakerService', function () {

        var current_selected_speaker_data = {},
            old_selected_speaker_data = {},
            current_selected_speaker_replic_lengths = {},
            old_selected_speaker_replic_lengths = {};

        return {
            current_selected_speaker_data: current_selected_speaker_data,
            old_selected_speaker_data: old_selected_speaker_data,
            current_selected_speaker_replic_lengths: current_selected_speaker_replic_lengths,
            old_selected_speaker_replic_lengths: old_selected_speaker_replic_lengths,

            set_current_selected_speaker: function (speaker) {
                if (current_selected_speaker_data != null) {
                    old_selected_speaker_data = current_selected_speaker_data
                }
                current_selected_speaker_data = speaker;
            },

            get_current_selected_speaker: function () {
                return current_selected_speaker_data;
            },

            get_old_selected_speaker: function () {
                return old_selected_speaker_data;
            },

            set_current_selected_speaker_replica_lengths: function (speaker_lengths) {
                if (current_selected_speaker_replic_lengths != null) {
                    old_selected_speaker_replic_lengths = current_selected_speaker_replic_lengths
                }
                current_selected_speaker_replic_lengths = speaker_lengths;
            },

            get_current_selected_speaker_replica_lengths: function () {
                return current_selected_speaker_replic_lengths;
            },

            get_old_selected_speaker_replica_lengths: function () {
                return old_selected_speaker_replic_lengths;
            }
        };
    });
