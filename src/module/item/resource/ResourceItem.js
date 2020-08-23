import { BaseItem } from "../BaseItem";

export class ResourceItem extends BaseItem {
    static get entityName() {
        return "resource";
    }

    /**
     * Adds resource specifig actorsheet listeners.
     */
    static activateActorSheetListeners(html, sheet) {
        super.activateActorSheetListeners(html, sheet);

        // Check or uncheck a single box
        html.find(".fatex__resource").click((e) => this._onRollResource.call(this, e, sheet));
        html.find(".fatex__resource__increment").click((e) => this._onResourceChangeRank.call(this, e, sheet, true));
        html.find(".fatex__resource__decrement").click((e) => this._onResourceChangeRank.call(this, e, sheet, false));
    }

    /**
     * Adds resource specific actorsheet data
     * Determines if a filler-resource should be rendered.
     */
    static getActorSheetData(sheetData) {
        // Render resource in two columns if necessary
        sheetData.options.enableResourceColumns = sheetData.resources.length >= 8;

        return sheetData;
    }

    static prepareItemData(item) {
        item.data.isNegative = item.data.rank < 0;
        item.data.isPositive = item.data.rank >= 0;
        item.data.isNeutral = item.data.rank === 0;

        return item;
    }

    /**
     * Add a list of available ranks to the sheet
     */
    static getSheetData(sheetData) {
        sheetData.availableRanks = [];

        for (let i = 0; i <= 9; i++) {
            sheetData.availableRanks.push(i);
        }

        return sheetData;
    }

    /*************************
     * EVENT HANDLER
     *************************/

    static _onResourceChangeRank(e, sheet, doIncrement) {
        e.preventDefault();
        e.stopPropagation();

        const dataset = e.currentTarget.dataset;
        const resource = sheet.actor.getOwnedItem(dataset.item);

        if (resource) {
            const rank = resource.data.data.rank;
            let newRank = 0;

            if (doIncrement) {
                newRank = rank >= 9 ? 9 : rank + 1;
            } else {
                newRank = rank <= -9 ? -9 : rank - 1;
            }

            resource.update({
                "data.rank": newRank,
            });
        }
    }

    static _onRollResource(e, sheet) {
        e.preventDefault();

        const dataset = e.currentTarget.dataset;
        const resource = sheet.actor.getOwnedItem(dataset.itemId);

        if (resource) {
            this.rollResource(sheet, resource);
        }
    }

    static async rollResource(sheet, item) {
        const resource = this.prepareItemData(duplicate(item), item);
        const template = "systems/fatex/templates/chat/roll-resource.html";
        const rank = parseInt(resource.data.rank) || 0;
        const actor = sheet.actor;
        const roll = new Roll("4dF").roll();
        game.dice3d.showForRoll(roll);
        const dice = this.getDice(roll);
        const total = this.getTotalString(roll.total + rank);
        const ladder = this.getLadderLabel(roll.total + rank);

        // Prepare resource item
        let templateData = { resource: resource, rank, dice, total, ladder };
        console.log(templateData);
        let chatData = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            sound: CONFIG.sounds.dice,
            flags: {
                templateVariables: templateData,
            },
        };
        console.log(chatData);
        chatData.content = await renderTemplate(template, templateData);
        await ChatMessage.create(chatData);
    }

    static getDice(roll) {
        const dice = [];
        const useOldRollApi = isNewerVersion("0.7.0", game.data.version);

        if (useOldRollApi) {
            roll.parts[0].rolls.forEach((rolledDie) => {
                const die = {};
                die.value = rolledDie.roll;
                die.face = this.getDieFace(rolledDie.roll);

                dice.push(die);
            });
        } else {
            roll.terms[0].results.forEach((rolledDie) => {
                const die = {};
                die.value = rolledDie.result;
                die.face = this.getDieFace(rolledDie.result);

                dice.push(die);
            });
        }

        return dice;
    }

    static getDieFace(die) {
        if (die > 0) return "+";
        if (die < 0) return "-";

        return "0";
    }

    static getLadderLabel(value) {
        if (value > 8) value = 8;
        if (value < -4) value = -4;

        return game.i18n.localize("FAx.Global.Ladder." + this.getTotalString(value));
    }

    static getLadderPrefix(value) {
        if (value < 0) return "-";

        return "+";
    }

    static getTotalString(total) {
        return this.getLadderPrefix(total).concat(Math.abs(total).toString());
    }
}
