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

interface ITopicModelingScope extends ng.IScope {
  widgetConfig: any;
  topics: string[];
  getTopics: () => void;
}

enum TopicModelingEventType {
  INIT_WIDGET = "INIT_WIDGET",
  UPDATE_SUGGESTIONS = "UPDATE_SUGGESTIONS"
}

const TopicModelingWidgetComponent = (
  WidgetAPI: any,
  $http: ng.IHttpService,
  $log: ng.ILogService,
  $mdDialog: ng.material.IDialogService
) => {
  const TopicModelingWidgetContainer = (
    scope: ITopicModelingScope,
    element: JQLite,
    params: ng.IAttributes
  ) => {
    const api = new WidgetAPI(params);
    // hold widget configuration
    scope.widgetConfig = null;
    scope.topics = [];

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
      if (data.eventType === TopicModelingEventType.INIT_WIDGET) {
        $log.debug("Configuration from widget:", data);
        scope.widgetConfig = data;
      }
    });

    scope.getTopics = function() {
      $log.info(
        "Google-Suggestions:: fetching topics from URL {} ",
        scope.widgetConfig.listTopicsUrl
      );
      const requestConfig: ng.IRequestConfig = {
        method: "GET",
        url: scope.widgetConfig.listTopicsUrl,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        transformResponse: function(data, headers) {
          // TODO: Tanaji: response comes from backend as Object { topics:[]} or as Array []  ?
          let body: [];
          try {
            body = angular.fromJson(data);
            if (body instanceof Array && body.length > 0) {
              return body;
            } else {
              return [];
            }
          } catch (error) {
            return data;
          }
        }
      };
      $http<[]>(requestConfig).then(
        function successCallback(response) {
          $log.info(
            "Google-Suggestions:: GET Topics response data:",
            response.data
          );
          scope.topics = response.data;
        },
        function errorCallback(reason) {
          $log.error("Error! Couldn't load topics.", reason);
        }
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
    link: TopicModelingWidgetContainer
  };
};

angular.module('56662337-767f-4852-ae64-70b4594b2384', [
  'core.services.WidgetAPI'
]).directive('kbFaq', TopicModelingWidgetComponent);