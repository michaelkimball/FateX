export class ActorGroupOverview extends Application {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "actor_group_overview",
            template: "/systems/fatex/templates/apps/actor-group-overview.html",
            popOut: false,
            width: 150,
        });
    }
}
