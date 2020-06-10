interface IGoogleCcSuggestionsScope extends ng.IScope {
  widgetConfig: any;
  suggestions: ISuggestion[];
  topics: string[];
  sentiments: ISentiment[];
  getSuggestions: () => void;
  getTopics: () => void;
  getSentimentAnalysis: () => void;
  testOnSelect: (index: number) => void;
  onTabChange: (index: number) => void;
  copyToClipboard: (text: string) => void;
}

enum googleAiSuggestionsEventType {
  INIT_WIDGET = "INIT_WIDGET",
  UPDATE_SUGGESTIONS = "UPDATE_SUGGESTIONS"
}
interface ISuggestion {
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

interface ISuggestionsResponse {
  suggestions: ISuggestion[];
  nextPageToken: string;
}

interface ISentiment {
  message: string;
  score: number;
}
interface ISentimentsResponse {
  analysis: ISentiment[];
}

const googleSuggestionsWidgetComponent = (
  WidgetAPI: any,
  $http: ng.IHttpService,
  $log: ng.ILogService,
  $mdDialog: ng.material.IDialogService
) => {
  const googleSuggestionsWidgetContainer = (
    scope: IGoogleCcSuggestionsScope,
    element: JQLite,
    params: ng.IAttributes
  ) => {
    const api = new WidgetAPI(params);
    // hold widget configuration
    scope.widgetConfig = null;
    scope.suggestions = [];
    scope.topics = [];
    scope.sentiments = [];

    // interaction card data
    api.onDataEvent("onInteractionEvent", function(data) {
      $log.info("AI-Suggestions:: onInteractionEvent:", data);
      scope.widgetConfig = JSON.parse(localStorage.getItem("widgetConfig"));
    });

    // media message data from chat, sms, email, social
    api.onDataEvent("onMediaMessageEvent", function(data) {
      $log.info("Google-Suggestions:: onMediaMessageEvent.", data);
    });

    // triggered when the widget receives a message from another widget
    api.onDataEvent("onMessageEvent", function(data) {
      $log.info("Google-Suggestions:: widget message:", data);
      if (data.eventType === googleAiSuggestionsEventType.INIT_WIDGET) {
        $log.debug("Configuration from widget:", data);
        scope.widgetConfig = data;
      } else if (
        data.eventType === googleAiSuggestionsEventType.UPDATE_SUGGESTIONS
      ) {
        scope.getSuggestions();
      }
    });

    // TODO: delete this method. (used for testing purpose)
    scope.testOnSelect = function(tabIndex: number) {
      $log.info(`Tab changed:${tabIndex}`);
      if (tabIndex == 0) {
        const suggestionResponse: ISuggestionsResponse = {
          suggestions: [
            {
              name:
                "projects/avaya-ept/conversations/JX9ETZjvS-GflZ_-Cc43IA/participants/HBqmFT9KQ5uzfZuVY2qrEQ/suggestions/WVPPoU9ERneFxA27rHteVA",
              faqAnswers: [
                {
                  answer:
                    "Read the Pricing page for detailed information on pricing, including how Cloud Storage calculates bandwidth and storage usage.",
                  confidence: 0.97313476,
                  question: "Where can I find pricing information?",
                  source:
                    "projects/avaya-ept/knowledgeBases/MTE5ODE4OTcxNzczNjMzODIyNzI/documents/NDQ3Mzk3NDM4NjA3MTY5OTQ1Ng",
                  metadata: {
                    document_display_name: "Google Cloud Storage FAQ"
                  }
                },
                {
                  answer:
                    "Okay. Read the Pricing page for detailed information on pricing, including how Cloud Storage calculates bandwidth and storage usage.",
                  confidence: 0.97313476,
                  question: "I am not happy with product support?",
                  source:
                    "projects/avaya-ept/knowledgeBases/MTE5ODE4OTcxNzczNjMzODIyNzI/documents/NDQ3Mzk3NDM4NjA3MTY5OTQ1Ng",
                  metadata: {
                    document_display_name: "Google Cloud Storage FAQ"
                  }
                }
              ],
              createTime: "2019-03-06T10:38:14.495455Z"
            }
          ],
          nextPageToken: "EgwImMb-4wUQoK3WwAE"
        };

        scope.suggestions = suggestionResponse.suggestions;
      } else if (tabIndex == 1) {
        scope.topics = [
          "projects/avaya-ept/locations/eptlocation/models/eptmodel/topics/00001",
          "projects/avaya-tmp/locations/eptlocation/models/eptmodel/topics/00002",
          "projects/avaya-pune/locations/eptlocation/models/eptmodel/topics/00003"
        ];
      } else if (tabIndex == 2) {
        const sentimentResponse: ISentimentsResponse = {
          analysis: [
            {
              message: "I am very happy with your service",
              score: 0.9
            },
            {
              message: "I'm not happy with the service",
              score: -0.7
            }
          ]
        };
        scope.sentiments = sentimentResponse.analysis;
      }
    };

    /**
     * Request and loads data based on tab selection
     */
    scope.onTabChange = function(tabIndex) {
      switch (tabIndex) {
        case 0:
          scope.getSuggestions();
          break;
        case 1:
          scope.getTopics();
          break;
        case 2:
          scope.getSentimentAnalysis();
          break;
        default:
          scope.getSuggestions();
      }
    };

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

    scope.getSentimentAnalysis = function() {
      $log.info(
        "Google-Suggestions:: Fetching sentiments from URL:",
        scope.widgetConfig.sentimentAnalysisUrl
      );
      const requestConfig: ng.IRequestConfig = {
        method: "GET",
        url: scope.widgetConfig.sentimentAnalysisUrl,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        transformResponse: function(data, headers) {
          let body: { analysis?: [] };
          try {
            body = angular.fromJson(data);
            if (
              body.analysis &&
              body.analysis instanceof Array &&
              body.analysis.length > 0
            ) {
              return body.analysis;
            } else {
              return [];
            }
          } catch (error) {
            $log.error("error parse Sentiments json", error);
            return data;
          }
        }
      };

      $http<[]>(requestConfig).then(
        function successCallback(response) {
          $log.info("getSentimentAnalysis.response: " + response.data);
          scope.sentiments = response.data;
        },
        function errorCallback(reason) {
          $log.error("Error! Couldn't load sentiments.", reason);
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
    element.on("$destroy", function() {
      api.unregister();
      scope.$destroy();
    });
  };
  return {
    scope: {},
    replace: true,
    template: template,
    link: googleSuggestionsWidgetContainer
  };
};

angular
  .module("b5793813-1195-4f00-8e3d-377e1d2e8940", ["core.services.WidgetAPI"])
  .directive("googleSuggestions", googleSuggestionsWidgetComponent);
