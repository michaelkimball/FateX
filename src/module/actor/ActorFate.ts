/**
 * ActorFate is the default entity class for actors inside the FateX system.
 * Adds custom features based on the system.
 */
import { TemplateActorSheetFate } from "./template/TemplateActorSheetFate";

export class ActorFate extends Actor {
    /**
     * Open template picker instead of directly creating a new actor
     */
    static async create(data, options = {}) {
        // Fallback for manual actor duplication
        if (data._id || Object.prototype.hasOwnProperty.call(data, "data")) {
            return super.create(data, options);
        }

        return CONFIG.FateX.applications.templatePicker.render(true);
    }

    /**
     * Provide basic token configuration for newly created actors.
     * Automatically links new tokens to the actor.
     */
    static async _create(data, options = {}) {
        data.token = data.token || {};

        // Set basic token data for newly created actors.
        mergeObject(
            data.token,
            {
                vision: true,
                dimSight: 30,
                brightSight: 0,
                actorLink: true,
                disposition: 1,
            },
            { overwrite: false }
        );

        // Overwrite specific token data (used for template actors)
        mergeObject(
            data.token,
            {
                img: CONST.DEFAULT_TOKEN,
            },
            { overwrite: true }
        );

        return super.create(data, options);
    }

    render(force = false, options = {}) {
        super.render(force, options);

        for (const app in CONFIG.FateX.applications) {
            CONFIG.FateX.applications[app].render();
        }
    }

    get _sheetClass() {
        if (this.isTemplateActor) {
            return TemplateActorSheetFate;
        }

        return super._sheetClass;
    }

    get isTemplateActor() {
        return !!this.getFlag("fatex", "isTemplateActor");
    }

    get visible() {
        if (this.isTemplateActor) {
            return false;
        }

        return super.visible;
    }

    async roll(name, modifier){
        const item = this.items.filter(item => item.data.name === name)[0];
        const itemType = item.type;
        const rollable = CONFIG.FateX.itemClasses[itemType].prepareItemData(duplicate(item), item);
        const template = `systems/fatex/templates/chat/roll-${itemType}.html`;
        const rank = parseInt(rollable.data.rank) || 0;
        let roll;
        if(modifier){
            roll = new Roll("4dF + @mod", { mod: modifier }).roll();
        } else {
            roll = new Roll("4dF").roll();
        }
        game.dice3d.showForRoll(roll);
        const dice = CONFIG.FateX.itemClasses[itemType].getDice(roll);
        const total = CONFIG.FateX.itemClasses[itemType].getTotalString(roll.total + rank);
        const ladder = CONFIG.FateX.itemClasses[itemType].getLadderLabel(roll.total + rank);

        const templateData = { rank: (rank + modifier), dice, total, ladder, [itemType]: rollable };
        const chatData = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({ actor: this as unknown as Actor}),
            sound: CONFIG.sounds.dice,
            flags: {
                templateVariables: templateData,
            },
            content: {},
        };
        chatData.content = await renderTemplate(template, templateData);
        await ChatMessage.create(chatData);
    }

    /**
     * Re-prepare the data for all owned items when owned items are deleted.
     * This ensures, that items that reference the deleted item get updated.
     */
    //@ts-ignore
    _onModifyEmbeddedEntity(embeddedName, changes, options, userId, context = {}) {
        //@ts-ignore
        super._onModifyEmbeddedEntity(embeddedName, changes, options, userId, context);

        if (embeddedName === "OwnedItem") {
            this.items.forEach((item) => item.prepareData());
        }
    }
}
