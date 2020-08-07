var participantType;
(function (participantType) {
    participantType["HUMAN_AGENT"] = "HUMAN_AGENT";
    participantType["AUTOMATED_AGENT"] = "AUTOMATED_AGENT";
    participantType["END_USER"] = "END_USER";
    participantType["UPDATE_SUGGESTIONS"] = "UPDATE_SUGGESTIONS";
})(participantType || (participantType = {}));
var googleAiEventType;
(function (googleAiEventType) {
    googleAiEventType["INIT_WIDGET"] = "INIT_WIDGET";
    googleAiEventType["UPDATE_SUGGESTIONS"] = "UPDATE_SUGGESTIONS";
})(googleAiEventType || (googleAiEventType = {}));
var TwidgetComponent = function ($log) {
    var widgetContainer = function (scope, element, params) {
        addEventListener('onInteractionEvent', function (event) {
            console.log('Evento captado', event.detail);
        });
        // called when widget is destroyed
        element.on("$destroy", function () {
            scope.$destroy();
        });
    };
    return {
        scope: {},
        replace: true,
        templateUrl: './transcript-ai/transcript-ai.html',
        link: widgetContainer
    };
};
angular
    .module("b2343c5c-bada-494d-8fb5-be9fd20c292a", ['82bf38bc-86fc-45ef-af55-7b6037e0ecbc'])
    .directive("transcriptAi", TwidgetComponent);
// chatModule.constant(
//   "dialogflowConfigUrl",
//   "https://192.168.3.4:8088/dialogflowconnector/conversation/gcp/v1/widget/conversation-details"
// );
// chatModule.constant("moment", moment);
