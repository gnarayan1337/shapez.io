import { clamp } from "../core/utils";
import { SOUNDS } from "../platform/sound";
import { enumColors } from "./colors";
import { Entity } from "./entity";
import { BooleanItem, isTrueItem, isTruthyItem } from "./items/boolean_item";
import { ColorItem } from "./items/color_item";
import { ShapeItem } from "./items/shape_item";
import { GameRoot } from "./root";
import { enumSubShape, ShapeLayer } from "./shape_definition";

/** @enum {number} */
const enumColorToInt = {
    [enumColors.uncolored]: 0,
    [enumColors.red]: 1,
    [enumColors.yellow]: 2,
    [enumColors.green]: 3,
    [enumColors.cyan]: 4,
    [enumColors.blue]: 5,
    [enumColors.purple]: 6,
    [enumColors.white]: 7,
};

/** @enum {number} */
const enumColorToNote = {
    [enumColors.uncolored]: 0,
    [enumColors.red]: 2,
    [enumColors.yellow]: 4,
    [enumColors.green]: 5,
    [enumColors.cyan]: 7,
    [enumColors.blue]: 9,
    [enumColors.purple]: 11,
    [enumColors.white]: 12,
};

/** @enum {number} */
const enumSubShapeToInt = {
    [enumSubShape.circle]: 0,
    [enumSubShape.rect]: 1,
    [enumSubShape.star]: 2,
    [enumSubShape.windmill]: 3,
};

const instruments = [
    [SOUNDS.destroyBuilding, SOUNDS.placeBuilding, SOUNDS.uiClick, SOUNDS.placeBelt],
    [SOUNDS.dialogError, SOUNDS.uiError, SOUNDS.swishHide, SOUNDS.swishShow],
    [SOUNDS.levelComplete, SOUNDS.badgeNotification, SOUNDS.dialogOk, SOUNDS.copy],
];

/**
 * @param {Entity} entity
 * @param {GameRoot} root
 */
export function playNoteBlock(entity, root) {
    const network = entity.components.WiredPins.slots[0].linkedNetwork;
    const networkValue = network && network.hasValue() ? network.currentValue : null;

    let sound = null;
    let rate = 1;
    if (networkValue) {
        switch (networkValue.getItemType()) {
            case "boolean": {
                const item = /** @type {BooleanItem} */ (networkValue);
                sound = isTrueItem(item) ? SOUNDS.uiClick : SOUNDS.placeBuilding;
                break;
            }
            case "color": {
                const item = /** @type {ColorItem} */ (networkValue);
                sound = SOUNDS.badgeNotification;
                rate *= 2 ** (enumColorToNote[item.color] / 12);
                break;
            }
            case "shape": {
                const item = /** @type {ShapeItem} */ (networkValue);
                const bottomLayer = /** @type {ShapeLayer} */ (item.definition.layers[0]);
                if (!bottomLayer) {
                    break;
                }

                const set = bottomLayer[0] ? clamp(enumSubShapeToInt[bottomLayer[0].subShape], 0, 2) : 0;
                const instrument = bottomLayer[1] ? enumSubShapeToInt[bottomLayer[1].subShape] : 0;
                sound = instruments[set][instrument];

                const octave = bottomLayer[2]
                    ? clamp(enumSubShapeToInt[bottomLayer[2].subShape] - 1, -1, 1)
                    : 0;
                const pitch = bottomLayer[3]
                    ? clamp(
                          8 * enumSubShapeToInt[bottomLayer[3].subShape] +
                              enumColorToInt[bottomLayer[3].color],
                          0,
                          12
                      )
                    : 0;
                rate *= 2 ** (octave + pitch / 12);
            }
        }
    }

    if (sound) {
        const staticComp = entity.components.StaticMapEntity;
        root.soundProxy.play3D(
            sound,
            staticComp.origin.add(staticComp.getTileSize().divideScalar(2)),
            clamp(rate, 0.5, 4)
        );
    }
}
