import { ActorGroupOverview } from "./ActorGroupOverview";

export class ActorGroups {
    static hooks() {
        Hooks.once("init", async () => {
            game.settings.register("fatex", "actor-groups", {
                name: "Actor groups",
                config: false,
                type: Object,
                scope: "world",
                default: {},
            });
        });

        Hooks.once("ready", async () => {
            CONFIG.FateX.applications.actorGroups = new ActorGroupOverview();
            CONFIG.FateX.applications.actorGroups.render(true);
        });
    }

    static addGroup() {
        const groups = duplicate(game.settings.get("fatex", "actor-groups"));
        const newID = randomID();

        groups[newID] = {};

        game.settings.set("fatex", "actor-groups", groups);
    }
}

CONFIG.groups = ActorGroups;
