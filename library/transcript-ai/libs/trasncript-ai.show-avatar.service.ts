class ShowAvatarService {
    constructor() {

    }

    showAvatar(item, index, list) {
        if (item.participantRole !== "HUMAN_AGENT") {
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
}

angular.module('b2343c5c-bada-494d-8fb5-be9fd20c292a')
    .service('showAvatarService', ShowAvatarService);

module.exports = ShowAvatarService