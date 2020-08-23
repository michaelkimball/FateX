import { ActorFate } from "../../actor/ActorFate";
import { SheetSetup } from "../sheet-setup/SheetSetup";

export class TemplateActorSettings extends FormApplication {
    static get defaultOptions() {
        const options = super.defaultOptions;

        mergeObject(options, {
            title: game.i18n.localize("FAx.Settings.Templates.App.Title"),
            template: "/systems/fatex/templates/apps/template-actors.html",
            id: "template-actors",
            resizable: true,
            classes: options.classes.concat(["fatex fatex__app_sheet"]),
            width: 920,
            height: 500,
        });

        return options;
    }

    getData() {
        let filteredActors = duplicate(game.actors.filter((actor) => actor.isTemplateActor));

        filteredActors.forEach((actor) => {
            actor.stress = actor.items.filter((item) => item.type === "stress");
            actor.aspects = actor.items.filter((item) => item.type === "aspect");
            actor.attributes = actor.items.filter((item) => item.type === "attribute");
            actor.resources = actor.items.filter((item) => item.type === "resource");
            actor.skills = actor.items.filter((item) => item.type === "skill");
            actor.consequences = actor.items.filter((item) => item.type === "consequence");
        });

        return {
            options: this.options,
            templateActors: filteredActors,
        };
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".fatex__template__create").click((e) => this._createTemplate.call(this, e));
        html.find(".fatex__template__delete").click((e) => this._deleteTemplate.call(this, e));
        html.find(".fatex__template__configure").click((e) => this._configureTemplate.call(this, e));
        html.find(".fatex__template__duplicate").click((e) => this._duplicateTemplate.call(this, e));
    }

    /*************************
     * EVENT HANDLER
     *************************/

    async _configureTemplate(e) {
        e.preventDefault();
        e.stopPropagation();

        const data = e.currentTarget.dataset;
        const template = game.actors.get(data.template);

        if (!template) {
            return;
        }

        template.sheet.render(true);
    }

    async _deleteTemplate(e) {
        e.preventDefault();
        e.stopPropagation();

        const data = e.currentTarget.dataset;
        const template = game.actors.get(data.template);

        if (!template) {
            return;
        }

        new Dialog(
            {
                title: `${game.i18n.format("FAx.Dialog.EntityDelete")} ${template.name}`,
                content: game.i18n.format("FAx.Dialog.EntityDeleteText"),
                default: "submit",
                buttons: {
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.localize("FAx.Dialog.Cancel"),
                        callback: () => null,
                    },
                    submit: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.localize("FAx.Dialog.Confirm"),
                        callback: async () => {
                            await template.delete();

                            // Re-render this settings window and the picker if open
                            this.render(true);
                            CONFIG.FateX.applications.templatePicker.render();
                        },
                    },
                },
            },
            {
                classes: ["fatex", "fatex__dialog"],
            }
        ).render(true);
    }

    async _createTemplate(e) {
        e.preventDefault();

        const createData = {
            name: game.i18n.localize("FAx.Settings.Templates.New"),
            type: "character",
            flags: {
                fatex: {
                    isTemplateActor: true,
                },
            },
        };

        const newTemplateActor = await ActorFate._create(createData, { renderSheet: true });

        // Open sheet setup by default for new templates
        const sheetSetup = new SheetSetup(newTemplateActor);
        sheetSetup.render(true);

        // Re-render this settings window and the picker if open
        this.render(true);
        CONFIG.FateX.applications.templatePicker.render();
    }

    async _duplicateTemplate(e) {
        e.preventDefault();
        e.stopPropagation();

        const data = e.currentTarget.dataset;
        const template = duplicate(game.actors.get(data.template));

        if (!template) {
            return;
        }

        // Delete id
        delete template._id;

        // Change name
        template.name = template.name + ` (${game.i18n.localize("FAx.Settings.Templates.Copy")})`;

        // Create new duplicate
        await Actor.create(template, { renderSheet: true });

        // Re-render this settings window and the picker if open
        this.render(true);
        CONFIG.FateX.applications.templatePicker.render();
    }

    async _updateObject() {}
}
