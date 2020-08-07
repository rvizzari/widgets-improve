enum participantType {
  HUMAN_AGENT = "HUMAN_AGENT",
  AUTOMATED_AGENT = "AUTOMATED_AGENT",
  END_USER = "END_USER",
  UPDATE_SUGGESTIONS = "UPDATE_SUGGESTIONS"
}
interface IMessage {
  content: string;
  createTime: string;
  participant: string; // this have the ID
  participantRole: participantType;
}
enum googleAiEventType {
  INIT_WIDGET = "INIT_WIDGET",
  UPDATE_SUGGESTIONS = "UPDATE_SUGGESTIONS"
}

interface ISendMessageData {
  eventType: googleAiEventType;
}
 
interface IGoogleCcAiScope extends ng.IScope {
  isAysncRunning: number;
  conversationConfig: any;
  workRequestId: any;
  messages: IMessage[];
  showAvatar: (item: IMessage, index: number, list: IMessage[]) => boolean;
  rowColumnHeight: number;
  message: {
    value: string;
  };
  notifyUpdateSuggestions: () => void;
  notifyToSuggestedResponseWidget: (data: ISendMessageData) => void;
  createHttpRequest: (url: string, method: string) => ng.IRequestConfig;
  loadConversation: () => void;
  subscribToAsyncCtx: () => void;
  endConversation: () => void;
  formMessage: { value: string };
  submitFormData: () => void;
  moment: any;
  customerImageUrl: string;
  automatedBotImageUrl: string;
}

interface ICancelablePromise extends ng.IPromise<void> {
  abort?: () => void;
}

const widgetComponent = (
  WidgetAPI: any,
  $log: ng.ILogService,
  $timeout: ng.ITimeoutService,
  dialogflowConfigUrl: any,
  moment: any,
  transcriptAiService: any,
  showAvatarService: any
) => {
  const widgetContainer = (
    scope: IGoogleCcAiScope,
    element: JQLite,
    params: ng.IAttributes
  ) => {
    const api = new WidgetAPI(params);
    // TODO: need to remove this login
    scope.isAysncRunning = 0;
    // hold current conversation configuration
    scope.conversationConfig = null;
    //promise for message polling
    // let aysncCallPromise: ICancelablePromise;
    // to pass promise to Ajax
    let deferredAbort: ng.IDeferred<any>;
    scope.moment = moment;
    scope.messages = [];
    scope.$watch("messages", function (value) {
      angular.element("#chat-container").scrollTop(10000);
    });
    scope.customerImageUrl = `https://192.168.2.1/widget/googlecc-ai/assets/juani.png`;
    scope.automatedBotImageUrl = `https://192.168.2.1/widget/googlecc-ai/assets/bot.png`;
    scope.showAvatar = function (item, index, list) {
      return showAvatarService.showAvatar(item, index, list);
    };

    // notify to other widget
    scope.notifyToSuggestedResponseWidget = (data: ISendMessageData) => {
      data.eventType = googleAiEventType.INIT_WIDGET;
      api.sendMessage(data);
    };

    scope.notifyUpdateSuggestions = () => {
      const data = { eventType: googleAiEventType.UPDATE_SUGGESTIONS };
      api.sendMessage(data);
    };

    // interaction card data
    api.onDataEvent("onInteractionEvent", async function (data) {
      $log.info("GoogleCC-AI:: onInteractionEvent: ", data);
      if (data.channel == "VOICE" && data.state == "ALERTING") {
        await $timeout(function () {}, 5000);
        $log.info(
          "GoogleCC-AI:: Timeout completed, fetching widget configuration for voice channel."
        );
        scope.conversationConfig = await transcriptAiService.getConversationConfig(dialogflowConfigUrl, scope.workRequestId);
        transcriptAiService.setWidgetConfig(scope.workRequestId, scope.conversationConfig)
        scope.loadConversation();
        scope.notifyToSuggestedResponseWidget(scope.conversationConfig);
      } else if (data.channel == "WEBCHAT") {
        $log.info("GoogleCC-AI:: loading configuration for WEBCHAT channel.");
        scope.conversationConfig = JSON.parse(
          transcriptAiService.getWidgetConfig(scope.workRequestId)
        );
      }
      // load conversation on browser refresh
      if (
        !(
          scope.conversationConfig == null ||
          scope.conversationConfig == undefined ||
          scope.conversationConfig == ""
        )
      ) {
        scope.loadConversation();
      }
    });

    // interaction context data
    api.onDataEvent("onContextDataEvent", function (data) {
      $log.debug("GoogleCC-AI:: onContextDataEvent:", data);
    });

    // media data from chat, sms, email, social
    api.onDataEvent("onMediaEvent", function (data) {
      $log.debug("GoogleCC-AI:: onMediaEvent:", data);
    });

    // media message data from chat, sms, email, social
    api.onDataEvent("onMediaMessageEvent", function (data) {
      $log.debug("GoogleCC-AI:: onMediaMessageEvent:", data);
      if (data.body == "INIT_AGENT_HANDOFF") {
        $log.info(
          "GoogleCC-AI:: INIT_AGENT_HANDOFF, Initialized conversation configuration."
        );
        scope.conversationConfig = JSON.parse(data.customData);
        transcriptAiService.setWidgetConfig(scope.workRequestId, scope.conversationConfig)
        scope.loadConversation();
        scope.notifyToSuggestedResponseWidget(scope.conversationConfig);
      }
    });

    // triggered when the widget receives a message from another widget
    api.onDataEvent("onMessageEvent", function (data) {
      $log.debug("GoogleCC-AI:: onMessageEvent:", data);
      scope.message = data;
    });

    // start polling conversation messages
    scope.subscribToAsyncCtx = async function () {
      await setTimeout(() => {
        
      }, 1000);
      const response = await transcriptAiService.getMessages(scope.conversationConfig.asyncSubscriptionUrl);
      $log.info("GoogleCC-AI:: async chat messages received.");
      if (response.messages && response.messages.length > 0) {
        scope.messages = response.messages;
      }
      scope.notifyUpdateSuggestions();
      // await scope.subscribToAsyncCtx();
    }

    // complete dialogflow conversation when card destroyed
    scope.endConversation = async function () {
      $log.info("GoogleCC-AI:: endConversation start.");
      await transcriptAiService.endConversation(scope.conversationConfig.completeConversationUrl);
      // Abort Ajax polling
      // aysncCallPromise.abort();
    };

    //load conversation on escalation to agent
    scope.loadConversation = async function () {
      const response = await transcriptAiService.loadConversation(scope.conversationConfig.getConversationUrl);
      if (response.messages && response.messages.length > 0) {
        scope.messages = response.messages;
      }
      if (scope.isAysncRunning == 0) {
        scope.isAysncRunning++;
        await scope.subscribToAsyncCtx();
      }
    };

    scope.formMessage = {
      value: ""
    };

    // called when widget is destroyed
    element.on("$destroy", function () {
      $log.info("GoogleCC-AI:: widget destroyed");
      transcriptAiService.removeWidgetConfig(scope.workRequestId);
      scope.endConversation();
      api.unregister();
      scope.$destroy();
    });
  };

  return {
    scope: {},
    replace: true,
    template: template,
    link: widgetContainer
  };
};

const chatModule = angular
  .module("b2343c5c-bada-494d-8fb5-be9fd20c292a", ["core.services.WidgetAPI"])
  .directive("transcriptAi", widgetComponent);

chatModule.constant(
  "dialogflowConfigUrl",
  "https://192.168.3.4:8088/dialogflowconnector/conversation/gcp/v1/widget/conversation-details"
);

chatModule.constant("moment", moment);
