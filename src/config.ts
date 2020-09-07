import { Automation } from "./module/components/Automation/Automation";
import { Configuration } from "./module/components/Configuration/Configuration";
import { Radio } from "./module/components/Radio/Radio";
import { RangeSlider } from "./module/components/RangeSlider/RangeSlider";
import { Sortable } from "./module/components/Sortable/Sortable";
import { AspectItem } from "./module/item/aspect/AspectItem";
import { ConsequenceItem } from "./module/item/consequence/ConsequenceItem";
import { ExtraItem } from "./module/item/extra/ExtraItem";
import { SkillItem } from "./module/item/skill/SkillItem";
import { StressItem } from "./module/item/stress/StressItem";
import { StuntItem } from "./module/item/stunt/StuntItem";
import { AttributeItem } from "./module/item/attribute/AttributeItem";
import { ResourceItem } from "./module/item/resource/ResourceItem";
import { BaseItem } from "./module/item/BaseItem";
import { BaseComponent } from "./module/components/BaseComponent";
import { v4 as uuid } from 'uuid';

export interface FatexConfig {
    itemClasses: {
        [key: string]: typeof BaseItem;
        [key: number]: typeof BaseItem;
    };

    sheetComponents: {
        actor: {
            [key: string]: typeof BaseComponent;
            [key: number]: typeof BaseComponent;
        };
        item: {
            [key: string]: typeof BaseComponent;
            [key: number]: typeof BaseComponent;
        };
    };

    applications: {
        [key: string]: typeof Application | null;
        [key: number]: typeof Application | null;
    };

    global: {
        useMarkdown: boolean;
    };

    utils?: {
        [key: string]: unknown;
    },
    sceneAspects?: {
        [key: string]: unknown;
    }
}

export const FateX: FatexConfig = {
    itemClasses: {
        stress: StressItem,
        aspect: AspectItem,
        consequence: ConsequenceItem,
        attribute: AttributeItem,
        resource: ResourceItem,
        skill: SkillItem,
        stunt: StuntItem,
        extra: ExtraItem,
    },
    sheetComponents: {
        actor: {
            sortable: Sortable,
            configuration: Configuration,
        },
        item: {
            radio: Radio,
            rangeSlider: RangeSlider,
            automation: Automation,
        },
    },
    applications: {
        templateSettings: null,
        templatePicker: null,
    },
    global: {
        useMarkdown: false,
    },
    utils: {
        newAspect: async (aspect, numBoxes, actor?) => {
            const template = `systems/fatex/templates/chat/chat-aspect.html`;
            let boxes: Array<unknown> = [];
            for(let i = 0; i < numBoxes; i++){
                boxes = [...boxes, { label: i + 1, checked: false, id: uuid() }];
            }
            const sceneAspect = {
                id: uuid(),
                ...aspect,
                boxes,
            };
            const templateData = {
                aspect: sceneAspect
            };
            CONFIG.FateX.sceneAspects[sceneAspect.id] = sceneAspect;
            const chatData = {
                user: game.user._id,
                speaker: actor ? ChatMessage.getSpeaker({ actor }) : undefined,
                sound: CONFIG.sounds.notification,
                flags: {
                    templateVariables: templateData,
                },
                content: {} as HTMLElement,
            };
            chatData.content = await renderTemplate(template, templateData);

            let message = await ChatMessage.create(chatData);
            const updateBox = (boxId) => {
                console.log('updateBox', boxId);
                const listener = document.querySelectorAll(`input[data-binding='${boxId}']`)[0];
                console.log('listener', listener);
                listener.addEventListener('change', async () => {
                    const box = CONFIG.FateX.sceneAspects[sceneAspect.id].boxes.filter((box) => box.id === boxId)[0];
                    box.checked = !box.checked;
                    const templateData = { aspect: CONFIG.FateX.sceneAspects[sceneAspect.id] };
                    const data = { flags: { templateVariables: templateData }, content: await renderTemplate(template, templateData) };
                    message = await message.update(data);
                    setTimeout(() => CONFIG.FateX.sceneAspects[sceneAspect.id].boxes.forEach((box) => updateBox(box.id)), 300);
                });
            }
            setTimeout(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                boxes.forEach((listBox: any) => updateBox(listBox.id));
            }, 100);
        },
    },
    sceneAspects: {},
};
