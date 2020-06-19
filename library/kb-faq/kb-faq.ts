/*
 *
 * Copyright Avaya Inc., All Rights Reserved.
 *
 * THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE OF Avaya Inc.
 *
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 *
 * Some third-party source code components may have  been modified from their
 * original versions by Avaya Inc.
 *
 * The modifications are Copyright Avaya Inc., All Rights Reserved.
 *
 */

interface IKbFaqScope extends ng.IScope {
  widgetConfig: any;
  suggestions: IKbFaqSuggestion[];
  getSuggestions: () => void;
  copyToClipboard: (text: string) => void;
}

enum kbFaqEventType {
  INIT_WIDGET = "INIT_WIDGET",
  UPDATE_SUGGESTIONS = "UPDATE_SUGGESTIONS"
}
interface IKbFaqSuggestion {
  name: string;
  articles?: {
    title: string;
    metadata: any;
  }[],
  faqAnswers?: {
    answer: string;
    confidence: number;
    question: string;
    source: string;
    metadata: any;
  }[];
  createTime: string;
}

const kbFaqWidgetComponent = (
  WidgetAPI: any,
  $http: ng.IHttpService,
  $log: ng.ILogService,
  $mdDialog: ng.material.IDialogService
) => {
  const kbFaqWidgetContainer = (
    scope: IKbFaqScope,
    element: JQLite,
    params: ng.IAttributes
  ) => {
    const api = new WidgetAPI(params);
    // hold widget configuration
    scope.widgetConfig = null;
    scope.suggestions = [];

    // interaction card data
    api.onDataEvent("onInteractionEvent", function (data) {
      $log.info("AI-Suggestions:: onInteractionEvent:", data);
      scope.widgetConfig = JSON.parse(localStorage.getItem("widgetConfig"));
    });

    // media message data from chat, sms, email, social
    api.onDataEvent("onMediaMessageEvent", function (data) {
      $log.info("Google-Suggestions:: onMediaMessageEvent.", data);
    });

    // triggered when the widget receives a message from another widget
    api.onDataEvent("onMessageEvent", function (data) {
      $log.info("Google-Suggestions:: widget message:", data);
      if (data.eventType === kbFaqEventType.INIT_WIDGET) {
        $log.debug("Configuration from widget:", data);
        scope.widgetConfig = data;
      } else if (
        data.eventType === kbFaqEventType.UPDATE_SUGGESTIONS
      ) {
        scope.getSuggestions();
      }
    });

    scope.getSuggestions = function() {
      if (
        scope.widgetConfig === null ||
        scope.widgetConfig.listSuggestionsUrl === null ||
        scope.widgetConfig.listSuggestionsUrl === undefined
      ) {
        return;
      }
      $log.info(
        "Google-Suggestions:: updating suggestions: {}",
        scope.widgetConfig.listSuggestionsUrl
      );
      const requestConfig: ng.IRequestConfig = {
        method: "GET",
        url: scope.widgetConfig.listSuggestionsUrl,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        transformResponse: function(data, headers) {
          let body: { suggestions?: IMessage[] };
          try {
            let body = angular.fromJson(data);
              body.suggestions = body;
              return body;
          } catch (error) {
            return data;
          }
        }
      };

      $http<{ suggestions: [] }>(requestConfig).then(
        function successCallback(response) {
          $log.info(
            "Google-Suggestions:: GET Suggestions: response data:",
            response.data
          );
          scope.suggestions = response.data.suggestions;
        },
        function errorCallback(reason) {
          $log.error("Error! Couldn't load suggestions.", reason);
        }
      );
    };

        /**
     * Helper function to copy DOM element text to variable
     * @param {*} text
     */
    scope.copyToClipboard = function(text) {
      // create temp dom object to copy text
      const copyElement = document.createElement("textarea");
      copyElement.style.position = "fixed";
      copyElement.style.opacity = "0";
      copyElement.textContent = text;
      const body = document.getElementsByTagName("body")[0];
      body.appendChild(copyElement);
      copyElement.select();
      const successful = document.execCommand("copy");
      const msg = successful ? "successful" : "unsuccessful";
      $log.info("message copied on clipboard:", msg);
      body.removeChild(copyElement);

      var confirm = $mdDialog
        .confirm()
        .title("Would you like to send this response to the customer?")
        .parent(element.parent()) 
        .textContent(`${text}`)
        .ok("Please do it!")
        .cancel("Cancel");

      $mdDialog.show(confirm).then(
        function() {
          const requestConfig: ng.IRequestConfig = {
            method: "POST",
            url: scope.widgetConfig.sendMessageUrl + text,
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json"
            },
            transformResponse: function(data, headers) {
              return data;
            }
          };
          $http(requestConfig).then(
            function successCallback(response) {
              $log.info("suggestion message sent successfully.");
            },
            function errorCallback(reason) {
              $log.error(
                "copyToClipboard:: Error! Couldn't send suggestion message.",
                reason
              );
            }
          );
        },
        function() {}
      );
    };

    // called when widget is destroyed
    element.on("$destroy", function () {
      api.unregister();
      scope.$destroy();
    });
  };
  return {
    scope: {},
    replace: true,
    template: template,
    link: kbFaqWidgetContainer
  };
};

angular.module('7f70d5ad-a992-4106-80eb-c2a9e66eb8df', [
  'core.services.WidgetAPI'
]).directive('kbFaq', kbFaqWidgetComponent);