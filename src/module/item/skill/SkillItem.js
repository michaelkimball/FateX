import { BaseItem } from "../BaseItem";

export class SkillItem extends BaseItem {
    static get entityName() {
        return "skill";
    }

    /**
     * Adds skill specifig actorsheet listeners.
     */
    static activateActorSheetListeners(html, sheet) {
        super.activateActorSheetListeners(html, sheet);

        // Check or uncheck a single box
        html.find(".fatex__skill").click((e) => this._onRollSkill.call(this, e, sheet));
        html.find(".fatex__skill__increment").click((e) => this._onSkillChangeRank.call(this, e, sheet, true));
        html.find(".fatex__skill__decrement").click((e) => this._onSkillChangeRank.call(this, e, sheet, false));
    }

    /**
     * Adds skill specific actorsheet data
     * Determines if a filler-skill should be rendered.
     */
    static getActorSheetData(sheetData) {
        // Render skill in two columns if necessary
        sheetData.options.enableSkillColumns = sheetData.skills.length >= 8;

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

    static _onSkillChangeRank(e, sheet, doIncrement) {
        e.preventDefault();
        e.stopPropagation();

        const dataset = e.currentTarget.dataset;
        const skill = sheet.actor.getOwnedItem(dataset.item);

        if (skill) {
            const rank = skill.data.data.rank;
            let newRank = 0;

            if (doIncrement) {
                newRank = rank >= 9 ? 9 : rank + 1;
            } else {
                newRank = rank <= -9 ? -9 : rank - 1;
            }

            skill.update({
                "data.rank": newRank,
            });
        }
    }

    static _onRollSkill(e, sheet) {
        e.preventDefault();

        const dataset = e.currentTarget.dataset;
        const skill = sheet.actor.getOwnedItem(dataset.itemId);

        if (skill) {
            this.rollSkill(sheet, skill);
        }
    }

    static async rollSkill(sheet, item) {
        const skill = this.prepareItemData(duplicate(item), item);
        const template = "systems/fatex/templates/chat/roll-skill.html";
        const rank = parseInt(skill.data.rank) || 0;
        const actor = sheet.actor;
        const roll = new Roll("4dF").roll();
        game.dice3d.showForRoll(roll);
        const dice = this.getDice(roll);
        const total = this.getTotalString(roll.total + rank);
        const ladder = this.getLadderLabel(roll.total + rank);

        // Prepare skill item
        let templateData = { skill, rank, dice, total, ladder };

        let chatData = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            sound: CONFIG.sounds.dice,
            flags: {
                templateVariables: templateData,
            },
        };

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
