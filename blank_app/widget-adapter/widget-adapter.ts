enum adapterEventTypes {
  ON_INTERACTION_EVENT = "onInteractionEvent",
  ON_CONTEXT_DATA_EVENT = "onContextDataEvent",
  ON_MEDIA_EVENT = "onMediaEvent",
  ON_MEDIA_MESSAGE_EVENT = "onMediaMessageEvent",
  ON_MESSAGE_EVENT = "onMessageEvent" //triggered when the widget receives a message from another widget
}

angular.module('82bf38bc-86fc-45ef-af55-7b6037e0ecbc', [
  // "core.services.WidgetAPI"
]).run(runFunction)

// runFunction.$inject[
//   // 'WidgetAPI'
// ];
function runFunction (
  // WidgetAPI
) {

  // const api = new WidgetApi();
  // api.onDataEvent("onInteractionEvent", async function (data) {
  //   const onInteractionEvent = createEvent(adapterEventTypes.ON_INTERACTION_EVENT, 'Event Catched, do something...')
  //   dispatchEvent(onInteractionEvent)
  // });

  // api.onDataEvent("onContextDataEvent", function (data) {
  //   const onContextDataEvent = createEvent(adapterEventTypes.ON_CONTEXT_DATA_EVENT, 'Event Catched, do something...')
  //   dispatchEvent(onContextDataEvent)
  // });

  // api.onDataEvent("onMediaEvent", function (data) {
  //   const onMediaEvent = createEvent(adapterEventTypes.ON_MEDIA_EVENT, 'Event Catched, do something...')
  //   dispatchEvent(onMediaEvent)
  // });

  // api.onDataEvent("onMediaMessageEvent", function (data) {
  //   const onMediaMessageEvent = createEvent(adapterEventTypes.ON_MEDIA_MESSAGE_EVENT, 'Event Catched, do something...')
  //   dispatchEvent(onMediaMessageEvent)
  // });

  // api.onDataEvent("onMessageEvent", function (data) {
  //   const onMessageEvent = createEvent(adapterEventTypes.ON_MESSAGE_EVENT, 'Event Catched, do something...')
  //   dispatchEvent(onMessageEvent)
  // });

  setInterval(function () {
    const onInteractionEvent = createEvent(adapterEventTypes.ON_INTERACTION_EVENT, 'Event Catched, do something...')
    dispatchEvent(onInteractionEvent)
  }, 2000)

  function createEvent(eventType: adapterEventTypes, data: any) {
    return new CustomEvent(eventType, { 'detail': { data: data } })
  }
}