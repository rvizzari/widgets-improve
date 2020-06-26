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
  $http: ng.IHttpService,
  $log: ng.ILogService,
  $q: ng.IQService,
  $timeout: ng.ITimeoutService,
  dialogflowConfigUrl: any,
  moment: any
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
    let aysncCallPromise: ICancelablePromise;
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
      if (item.participantRole !== participantType.HUMAN_AGENT) {
        if (index === 0) {
          return true;
        } else if (
          index < list.length - 1 &&
          item.participantRole !== list[index - 1].participantRole
        ) {
          return true;
        } else if (
          index < list.length - 1 &&
          item.participantRole !== list[index + 1].participantRole &&
          item.participant !== list[index - 1].participant
        ) {
          return true;
        } else if (
          index === list.length - 1 &&
          item.participantRole !== list[index - 1].participantRole
        ) {
          return true;
        }
      }
      return false;
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
    api.onDataEvent("onInteractionEvent", function (data) {
      $log.info("GoogleCC-AI:: onInteractionEvent: ", data);
      if (data.channel == "VOICE" && data.state == "ALERTING") {
        //wait till ECC send configuration to chat engine
        $timeout(function () {
          $log.info(
            "GoogleCC-AI:: Timeout completed, fetching widget configuration for voice channel."
          );
          const workRequestId = data.workRequestId;
          const requestConfig: ng.IRequestConfig = scope.createHttpRequest(
            dialogflowConfigUrl + "?workRequestId=" + workRequestId,
            "GET"
          );
          $http(requestConfig).then(
            function successCallback(response: any) {
              // TODO: Are you sure response.data come as string ?!
              $log.info(
                "GoogleCC-AI:: Voice channel configuration: {}",
                response.data
              );
              scope.conversationConfig = JSON.parse(response.data);
              localStorage.setItem(
                "widgetConfig",
                JSON.stringify(scope.conversationConfig)
              );
              scope.loadConversation();
              //update another widget to update the suggestions
              scope.notifyToSuggestedResponseWidget(scope.conversationConfig);
            },
            function errorCallback(reason) {
              $log.error(
                "GoogleCC-AI:: Error! Couldn't load widget configuration for widget.",
                reason
              );
            }
          );
        }, 5000);
      } else if (data.channel == "WEBCHAT") {
        $log.info("GoogleCC-AI:: loading configuration for WEBCHAT channel.");
        scope.conversationConfig = JSON.parse(
          localStorage.getItem("widgetConfig")
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
        localStorage.setItem(
          "widgetConfig",
          JSON.stringify(scope.conversationConfig)
        );
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
    scope.subscribToAsyncCtx = function () {
      deferredAbort = $q.defer<any>();
      const requestConfig: ng.IRequestConfig = {
        method: "GET",
        url: scope.conversationConfig.asyncSubscriptionUrl,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        timeout: deferredAbort.promise,
        transformResponse: function (data, headers) {
          let body: { messages?: IMessage[] };
          try {
            body = angular.fromJson(data);
            if (body.messages && body.messages.length > 0) {
              body.messages = body.messages.slice().reverse();
              return body;
            } else {
              return { messages: [] };
            }
          } catch (error) {
            return data;
          }
        }
      };
      aysncCallPromise = $http<{ messages?: IMessage[] }>(requestConfig).then(
        function successCallback(response) {
          if (response.status == 200) {
            $log.info("GoogleCC-AI:: async chat messages received.");
            var data = response.data;
            if (data.messages && data.messages.length > 0) {
              scope.messages = data.messages;
            }
            scope.notifyUpdateSuggestions();
            scope.subscribToAsyncCtx();
          }
        },
        function errorCallback(reason) {
          if (reason.status === 410) {
            $log.info(
              "GoogleCC-AI:: subscribToAsyncCtx 410 Gone, client error response code indicates that access to the target resource is no longer available at the origin serve.",
              reason
            );
          } else if (
            reason.config &&
            reason.config.timeout &&
            reason.config.timeout.$$state &&
            reason.config.timeout.$$state.value &&
            reason.config.timeout.$$state.value ===
              "subscribToAsyncCtx Call Abort"
          ) {
            //TODO: Diego- why this check is needed?
            $log.info(
              "GoogleCC-AI:: Async Subscribing to async context aborted",
              reason
            );
            scope.subscribToAsyncCtx();
          } else {
            $log.error(
              "GoogleCC-AI:: Async context failed!, Subscribing to async context again.",
              reason
            );
            scope.subscribToAsyncCtx();
          }
        }
      );
      //augment promise to abort the Ajax call
      aysncCallPromise.abort = function () {
        deferredAbort.resolve("subscribToAsyncCtx Call Abort");
        $log.info("GoogleCC-AI::abort: polling stop");
      };
    };

    // complete dialogflow conversation when card destroyed
    scope.endConversation = function () {
      $log.info("GoogleCC-AI:: endConversation start.");

      const requestConfig: ng.IRequestConfig = {
        method: "POST",
        url: scope.conversationConfig.completeConversationUrl,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      };

      $http(requestConfig).then(
        function successCallback(response) {
          $log.info(
            "GoogleCC-AI:: Conversation completed, API response data:",
            response.data
          );
        },
        function errorCallback(reason) {
          $log.error(
            "GoogleCC-AI:: Error! Error while completing conversation.",
            reason
          );
        }
      );
      // Abort Ajax polling
      aysncCallPromise.abort();
    };

    //load conversation on escalation to agent
    scope.loadConversation = function () {
      $log.info(
        "GoogleCC-AI:: loadConversation: Fetching conversation from URL:",
        scope.conversationConfig.getConversationUrl
      );
      const requestConfig: ng.IRequestConfig = {
        method: "GET",
        url: scope.conversationConfig.getConversationUrl,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        transformResponse: function (data, headers) {
          let body: { messages?: IMessage[] };
          try {
            body = angular.fromJson(data);
            if (body.messages && body.messages.length > 0) {
              body.messages = body.messages.slice().reverse();
              return body;
            } else {
              return { messages: [] };
            }
          } catch (error) {
            return data;
          }
        }
      };

      $http<{ messages?: IMessage[] }>(requestConfig).then(
        function successCallback(
          response: ng.IHttpResponse<{ messages?: IMessage[] }>
        ) {
          $log.info(
            "GoogleCC-AI:: loadConversation response data:",
            response.data
          );
          const data = response.data;
          if (data.messages && data.messages.length > 0) {
            scope.messages = data.messages;
          }
          if (scope.isAysncRunning == 0) {
            scope.isAysncRunning++;
            scope.subscribToAsyncCtx();
          }
        },
        function errorCallback(reason) {
          $log.error("GoogleCC-AI:: Error! Couldn't load conversation", reason);
        }
      );
    };

    scope.formMessage = {
      value: ""
    };
    scope.submitFormData = function () {
      if (
        scope.formMessage.value !== "" &&
        scope.formMessage.value.length > 0
      ) {
        const requestConfig: ng.IRequestConfig = scope.createHttpRequest(
          scope.conversationConfig.sendMessageUrl + scope.formMessage.value,
          "POST"
        );
        scope.formMessage = {
          value: ""
        };
        $http(requestConfig).then(
          function successCallback(response) {
            $log.info(
              "GoogleCC-AI:: POST message 200, response data:",
              response.data
            );
          },
          function errorCallback(reason) {
            $log.error("GoogleCC-AI:: Error! Couldn't send message.", reason);
          }
        );
      }
    };

    scope.createHttpRequest = (URL: string, httpMethod: string) => {
      const requestConfig: ng.IRequestConfig = {
        method: httpMethod,
        url: URL,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        transformResponse: function (data, headers) {
          let body: { messages?: IMessage[] };
          try {
            body = angular.fromJson(data);
            if (body.messages && body.messages.length > 0) {
              body.messages = body.messages.slice().reverse();
              return body;
            } else {
              return data;
            }
          } catch (error) {
            return data;
          }
        }
      };
      return requestConfig;
    };

    // called when widget is destroyed
    element.on("$destroy", function () {
      $log.info("GoogleCC-AI:: widget destroyed");
      scope.endConversation();
      api.unregister();
      scope.$destroy();
      localStorage.removeItem("widgetConfig");
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
