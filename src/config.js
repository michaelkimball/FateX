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

export const FateX = {
    itemTypes: {
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
};
