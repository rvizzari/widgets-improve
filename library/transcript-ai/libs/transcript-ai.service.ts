class TranscriptAiService {
    private http: ng.IHttpService;
    private log: ng.ILogService;
    private widgetConfigConstant: string = 'widgetConfig_';
    constructor($http: ng.IHttpService, $log: ng.ILogService) {
        this.http = $http;
        this.log = $log;
    }

    async getConversationConfig(url, workRequestId) {
        const conversationConfig = await this.http.get(
            url,
            {
                params: {
                    workRequestId: workRequestId
                },
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
            }
        ).catch((err) => {
            this.log.error(
                "GoogleCC-AI:: Error! Couldn't load widget configuration for widget.",
                err
            );
        });
        return conversationConfig;
    }

    async loadConversation(url) {
        return this.getMessages(url)
    }

    async getMessages(asyncSubscriptionUrl) {
        const response = await this.http.get(
            asyncSubscriptionUrl,
            {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
            }
        );

        try {
            let body: any = response.data ? response.data : response;
            if (body.messages && body.messages.length > 0) {
                body.messages = body.messages.slice().reverse();
                return body;
            } else {
                return { messages: [] };
            }
        } catch (error) {
            return response;
        }
        // {
        //     messages:[
        //         {
        //             participantRole:'AUTOMATED_AGENT',
        //             content:'Hola! lo transferire con un agente',
        //             createTime:'2020-07-27T19:04:47.569Z'
        //         },
        //         {
        //             participantRole:'HUMAN_AGENT',
        //             content:'Hola, en que puedo ayudarle?',
        //             createTime:'2020-07-27T19:04:47.569Z'
        //         }, {
        //             participantRole:'END_USER',
        //             content:'Hola! estoy teniendo algunos problemas con mi wifi',
        //             createTime:'2020-07-27T19:04:47.569Z'
        //         }, {
        //             participantRole:'HUMAN_AGENT',
        //             content:'Ok! suerte! jeje salu2',
        //             createTime:'2020-07-27T19:04:47.569Z'
        //         },
        //     ]
        // }
    }

    async endConversation(completeConversationUrl) {
        this.log.info("GoogleCC-AI:: endConversation start.");
        const response = await this.http.post(
            completeConversationUrl,
            {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                }
            },
        );
        this.log.info(
            "GoogleCC-AI:: Conversation completed, API response data:",
            response.data ? response.data : response
        );
        return response;
    }

    getWidgetConfig(workRequestId) {
        return localStorage.getItem(`${this.widgetConfigConstant}${workRequestId}`)
    }

    setWidgetConfig(workRequestId, data) {
        return localStorage.setItem(`${this.widgetConfigConstant}${workRequestId}`, data)
    }

    removeWidgetConfig(workRequestId) {
        localStorage.removeItem(`${this.widgetConfigConstant}${workRequestId}`);
    }

}

angular.module('b2343c5c-bada-494d-8fb5-be9fd20c292a')
    .service('transcriptAiService', TranscriptAiService);
