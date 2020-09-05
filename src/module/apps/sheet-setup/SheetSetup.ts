import { DataManager } from "./DataManager";

const CLEAR = {
    EVERYTHING: 0,
    ASPECTS: 1,
    CONSEQUENCES: 2,
    ATTRIBUTES: 3,
    RESOURCES: 4,
    SKILLS: 5,
    STRESS: 6,
};

const TYPES = {
    1: "aspect",
    2: "consequence",
    3: "attribute",
    4: "resource",
    5: "skill",
    6: "stress",
};

export class SheetSetup extends FormApplication {
    constructor(object, options) {
        super(object, options);

        this.actor.apps[this.appId] = this;
    }

    get actor() {
        return this.object;
    }

    static get defaultOptions() {
        const options = super.defaultOptions;

        if (!options.classes) {
            options.classes = [];
        }

        mergeObject(options, {
            title: game.i18n.localize("FAx.Apps.Setup.Title"),
            template: "/systems/fatex/templates/apps/sheet-setup.html",
            resizable: true,
            classes: options.classes.concat(["fatex fatex__app_sheet"]),
            width: 600,
            height: 700,
            scrollY: [".desk__content"],
            tabs: [
                {
                    navSelector: ".fatex__vertical_tabs__navigation",
                    contentSelector: ".fatex__vertical_tabs__content",
                },
            ],
        });

        return options;
    }

    async getData() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = {
            options: this.options,
            isOwnedBy: this.actor ? this.actor.name : false,

            hasAspects: !!this.actor.items.filter((i) => i.type === "aspect").length,
            hasAttributes: !!this.actor.items.filter((i) => i.type === "attribute").length,
            hasResources: !!this.actor.items.filter((i) => i.type === "resource").length,
            hasSkills: !!this.actor.items.filter((i) => i.type === "skill").length,
            hasConsequences: !!this.actor.items.filter((i) => i.type === "consequence").length,
            hasStress: !!this.actor.items.filter((i) => i.type === "stress").length,
            hasAny: !!this.actor.items.entries.length,
        };

        const dataManager = new DataManager();
        data.systems = await dataManager.getSystems();

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Clear actions
        html.find(".setup_action--clear").click((e) => this._onClear.call(this, e, CLEAR.EVERYTHING));
        html.find(".setup_action--clear-stress").click((e) => this._onClear.call(this, e, CLEAR.STRESS));
        html.find(".setup_action--clear-attributes").click((e) => this._onClear.call(this, e, CLEAR.ATTRIBUTES));
        html.find(".setup_action--clear-resources").click((e) => this._onClear.call(this, e, CLEAR.RESOURCES));
        html.find(".setup_action--clear-skills").click((e) => this._onClear.call(this, e, CLEAR.SKILLS));
        html.find(".setup_action--clear-consequences").click((e) => this._onClear.call(this, e, CLEAR.CONSEQUENCES));
        html.find(".setup_action--clear-aspects").click((e) => this._onClear.call(this, e, CLEAR.ASPECTS));

        // Setup actions
        html.find(".setup_action--setup-type").click((e) => this._onSetupType.call(this, e));
        html.find(".setup_action--toggle-type").click((e) => this._onToggleType.call(this, e));
    }

    /*************************
     * EVENT HANDLER
     *************************/

    async _onSetupType(event) {
        event.preventDefault();

        const button = $(event.currentTarget);
        const type = button.parents(".fatex__sheet_setup__type").first();
        const entries = type.find("input:checked");

        if (!entries.length) {
            return;
        }

        const itemData = entries.toArray().map((item) => {
            if (!item.dataset.entity) {
                return {};
            }

            return JSON.parse(item.dataset.entity);
        });

        await this.actor.createOwnedItem(itemData);
        this.render(true);
    }

    async _onToggleType(event) {
        event.preventDefault();

        const button = $(event.currentTarget);
        const type = button.parents(".fatex__sheet_setup__type, .fatex__sheet_setup__group").first();
        const entries = type.find("input");

        entries.prop("checked", !entries.first().prop("checked"));
    }

    async _onClear(event, type) {
        event.preventDefault();

        // Return early to not lose items by any chance
        if (type === undefined) {
            return;
        }

        new Dialog(
            {
                title: game.i18n.localize("FAx.Dialog.ActorClear"),
                content: game.i18n.localize("FAx.Dialog.ActorClearText"),
                default: "cancel",
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
                            await this._doClear(type);
                        },
                    },
                },
            },
            {
                classes: ["fatex", "fatex__dialog"],
            }
        ).render(true);
    }

    async _doClear(type) {
        let items = this.actor.data.items;

        if (type > 0) {
            items = items.filter((i) => i.type === TYPES[type]);
        }

        const deletions = items.map((i) => i._id);
        await this.actor.deleteOwnedItem(deletions);

        this.render(true);
    }

    async _updateObject() {
        // No update necessary.
    }
}
