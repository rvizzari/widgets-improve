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

const TwidgetComponent = (
  $log: ng.ILogService,
) => {
  const widgetContainer = (
    scope: IGoogleCcAiScope,
    element: JQLite,
    params: ng.IAttributes
  ) => {

    addEventListener('onInteractionEvent',function(event:CustomEvent){
      console.log('Evento captado', event.detail);
    })

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
