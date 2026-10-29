"use client";

import { useEffect, useRef, useState } from "react";
import {
  Application,
  Container,
  Graphics,
  Rectangle,
  Text,
  type FederatedPointerEvent,
} from "pixi.js";
import type {
  ExperimentAction,
  ExperimentDefinition,
} from "@practicallab/experiment-schemas";
import { createScene, type EngineState } from "@practicallab/simulation-engine";

type Props = {
  definition: ExperimentDefinition;
  state: EngineState;
  onAction: (action: ExperimentAction) => void;
};

type DragNode = {
  node: Container;
  startX: number;
  startY: number;
  pointerX: number;
  pointerY: number;
};

const colors = {
  ink: 0x2a2845,
  muted: 0x5b5878,
  border: 0x9a96ba,
  violet: 0x6c4df6,
  teal: 0x19d3c5,
  orange: 0xff8a3d,
  paper: 0xfff4ec,
  water: 0x8ceee7,
  grid: 0xdcd9f0,
};

function addLabel(
  parent: Container,
  value: string,
  y: number,
  color = colors.ink,
  x = 0,
) {
  const text = new Text({
    text: value,
    style: {
      fontFamily: "Arial, sans-serif",
      fontSize: 15,
      fontWeight: "600",
      fill: color,
      align: "center",
    },
    anchor: 0.5,
  });
  text.x = x;
  text.y = y;
  parent.addChild(text);
}

function makeGlass(
  kind: "beaker" | "funnel" | "flask",
  paperFitted: boolean,
  hasLiquid: boolean,
) {
  const group = new Container();
  group.eventMode = "static";
  group.cursor = "grab";
  group.hitArea = new Rectangle(-58, -64, 116, 128);
  const glass = new Graphics();
  if (kind === "beaker") {
    glass
      .roundRect(-34, -36, 68, 82, 8)
      .fill({ color: 0xffffff, alpha: 0.58 })
      .stroke({ color: colors.border, width: 3 });
    glass
      .rect(-30, 4, 60, 38)
      .fill({ color: hasLiquid ? colors.water : colors.violet, alpha: 0.7 });
    glass
      .moveTo(-39, -38)
      .lineTo(39, -38)
      .stroke({ color: colors.border, width: 4 });
  } else if (kind === "funnel") {
    glass
      .poly([-44, -42, 44, -42, 14, 2, 10, 48, -10, 48, -14, 2])
      .fill({ color: 0xffffff, alpha: 0.62 })
      .stroke({ color: colors.border, width: 3 });
    if (paperFitted)
      glass
        .poly([-35, -35, 35, -35, 0, -3])
        .fill({ color: colors.paper, alpha: 0.95 });
  } else {
    glass
      .roundRect(-36, -12, 72, 58, 23)
      .fill({ color: 0xffffff, alpha: 0.62 })
      .stroke({ color: colors.border, width: 3 });
    glass
      .roundRect(-13, -52, 26, 43, 5)
      .fill({ color: 0xffffff, alpha: 0.62 })
      .stroke({ color: colors.border, width: 3 });
    glass
      .roundRect(-29, 20, 58, 22, 12)
      .fill({ color: hasLiquid ? colors.teal : colors.water, alpha: 0.7 });
  }
  group.addChild(glass);
  addLabel(
    group,
    kind === "beaker" ? "Mixture" : kind === "funnel" ? "Funnel" : "Flask",
    70,
  );
  return group;
}

function makePaper() {
  const group = new Container();
  group.eventMode = "static";
  group.cursor = "grab";
  group.hitArea = new Rectangle(-54, -46, 108, 92);
  const graphic = new Graphics();
  graphic
    .poly([-36, -26, 36, -26, 0, 28])
    .fill({ color: colors.paper })
    .stroke({ color: colors.orange, width: 3 });
  group.addChild(graphic);
  addLabel(group, "Filter paper", 52);
  return group;
}

export function SimulationStage2D({ definition, state, onAction }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const drawSceneRef = useRef<(() => void) | null>(null);
  const actionRef = useRef(onAction);
  const stateRef = useRef(state);
  const [stageError, setStageError] = useState("");
  actionRef.current = onAction;
  stateRef.current = state;

  useEffect(() => {
    if (!hostRef.current) return;
    const hostElement = hostRef.current;
    let cancelled = false;
    let app: Application | null = null;
    let drag: DragNode | null = null;
    const scene = createScene(definition.id);

    async function mount() {
      try {
        const pixi = new Application();
        await pixi.init({
          width: Math.max(hostElement.clientWidth, 320),
          height: 360,
          resolution: Math.min(window.devicePixelRatio || 1, 1.5),
          autoDensity: true,
          antialias: false,
          background: 0xf7f6ff,
          preference: "webgl",
          powerPreference: "low-power",
          eventFeatures: { click: true, move: true, globalMove: true },
        });
        if (cancelled) {
          pixi.destroy({ removeView: true }, { children: true });
          return;
        }
        app = pixi;
        pixi.canvas.className = "pixi-workbench-canvas";
        pixi.canvas.setAttribute("aria-hidden", "true");
        pixi.canvas.style.touchAction = "none";
        hostElement.appendChild(pixi.canvas);
        const stage = new Container();
        pixi.stage.addChild(stage);

        const resize = () => {
          if (!app || !hostElement.clientWidth) return;
          app.renderer.resize(hostElement.clientWidth, 360);
          draw();
        };
        window.addEventListener("resize", resize);

        const draw = () => {
          if (!app) return;
          stage.removeChildren();
          const width = hostElement.clientWidth || 360;
          const bg = new Graphics();
          bg.rect(0, 0, width, 360).fill({ color: 0xf7f6ff });
          bg.roundRect(14, 18, width - 28, 220, 16)
            .fill({ color: 0xffffff })
            .stroke({ color: colors.grid, width: 2 });
          bg.roundRect(14, 248, width - 28, 96, 14)
            .fill({ color: 0xedebfa })
            .stroke({ color: colors.grid, width: 1.5 });
          bg.moveTo(24, 196)
            .lineTo(width - 24, 196)
            .stroke({ color: colors.grid, width: 3 });
          stage.addChild(bg);

          addLabel(stage, "Workbench Area", 36, colors.muted, width / 2);
          addLabel(stage, "Apparatus Tray", 264, colors.muted, width / 2);

          const flaskPlaced =
            stateRef.current.apparatusState["receiving-flask"]?.location ===
            "workbench-left";
          const funnelPlaced =
            stateRef.current.apparatusState.funnel?.location ===
            "receiving-flask";
          const paperFitted =
            stateRef.current.apparatusState["filter-paper"]?.location ===
            "funnel";
          const poured = stateRef.current.history.some(
            (action) => action.type === "pour",
          );

          const flaskSlot = new Graphics()
            .roundRect(width * 0.36 - 48, 86, 96, 108, 12)
            .stroke({ color: colors.teal, width: 2 });
          stage.addChild(flaskSlot);
          addLabel(stage, "Flask slot", 102, colors.teal, width * 0.36);

          const flaskNode = makeGlass("flask", false, poured);
          flaskNode.x = flaskPlaced ? width * 0.36 : width * 0.22;
          flaskNode.y = flaskPlaced ? 154 : 296;
          wire(
            flaskNode,
            () =>
              actionRef.current({
                type: "place",
                apparatus: "receiving-flask",
                slot: "workbench-left",
              }),
            (x, y) =>
              Math.hypot(x - width * 0.36, y - 154) < 70
                ? { x: width * 0.36, y: 154 }
                : null,
          );
          stage.addChild(flaskNode);

          const funnelNode = makeGlass("funnel", paperFitted, false);
          funnelNode.x = funnelPlaced ? width * 0.36 : width * 0.48;
          funnelNode.y = funnelPlaced ? 116 : 296;
          wire(
            funnelNode,
            () =>
              actionRef.current({
                type: "place",
                apparatus: "funnel",
                slot: "receiving-flask",
              }),
            (x, y) =>
              flaskPlaced && Math.hypot(x - width * 0.36, y - 116) < 70
                ? { x: width * 0.36, y: 116 }
                : null,
          );
          stage.addChild(funnelNode);

          if (!paperFitted) {
            const paperNode = makePaper();
            paperNode.x = width * 0.76;
            paperNode.y = 296;
            wire(
              paperNode,
              () =>
                actionRef.current({
                  type: "fit",
                  apparatus: "filter-paper",
                  target: "funnel",
                }),
              (x, y) =>
                funnelPlaced && Math.hypot(x - width * 0.36, y - 116) < 64
                  ? { x: width * 0.36, y: 116 }
                  : null,
            );
            stage.addChild(paperNode);
          }

          const mixtureNode = makeGlass("beaker", false, !poured);
          mixtureNode.x = poured ? width * 0.72 : width * 0.76;
          mixtureNode.y = poured ? 144 : 296;
          wire(
            mixtureNode,
            () =>
              actionRef.current({
                type: "pour",
                from: "beaker",
                to: "funnel",
              }),
            (x, y) =>
              funnelPlaced &&
              paperFitted &&
              Math.hypot(x - width * 0.36, y - 116) < 80
                ? { x: width * 0.48, y: 110 }
                : null,
          );
          stage.addChild(mixtureNode);

          if (poured) {
            const drip = new Graphics()
              .circle(width * 0.36, 172, 4)
              .fill({ color: colors.teal });
            stage.addChild(drip);
            addLabel(stage, "Liquid collected", 188, colors.teal, width * 0.36);
          }
        };

        function wire(
          node: Container,
          commit: () => void,
          snapper: (x: number, y: number) => { x: number; y: number } | null,
        ) {
          node.on("pointerdown", (event: FederatedPointerEvent) => {
            node.cursor = "grabbing";
            stage.addChild(node);
            drag = {
              node,
              startX: node.x,
              startY: node.y,
              pointerX: event.global.x,
              pointerY: event.global.y,
            };
          });

          node.on("pointerup", () => {
            node.cursor = "grab";
            if (!drag || drag.node !== node) return;
            const snap = snapper(node.x, node.y);
            if (snap) {
              node.x = snap.x;
              node.y = snap.y;
              commit();
            } else {
              node.x = drag.startX;
              node.y = drag.startY;
            }
            drag = null;
          });

          node.on("pointerupoutside", () => {
            node.cursor = "grab";
            if (drag && drag.node === node) {
              node.x = drag.startX;
              node.y = drag.startY;
              drag = null;
            }
          });
        }

        pixi.stage.eventMode = "static";
        pixi.stage.hitArea = pixi.screen;
        pixi.stage.on("pointermove", (event: FederatedPointerEvent) => {
          if (!drag) return;
          drag.node.x = drag.startX + (event.global.x - drag.pointerX);
          drag.node.y = drag.startY + (event.global.y - drag.pointerY);
        });

        drawSceneRef.current = draw;
        draw();
        scene.mount(() => {
          window.removeEventListener("resize", resize);
          pixi.destroy({ removeView: true }, { children: true });
        });
      } catch (error) {
        setStageError(
          error instanceof Error
            ? error.message
            : "Could not initialize interactive stage.",
        );
      }
    }

    mount();
    return () => {
      cancelled = true;
      scene.unmount();
      drawSceneRef.current = null;
    };
  }, [definition.id]);

  useEffect(() => {
    drawSceneRef.current?.();
  }, [state]);

  return (
    <div className="simulation-stage-host" ref={hostRef}>
      {stageError ? (
        <div className="simulation-stage-fallback" role="alert">
          <p>
            The interactive workbench could not start on this device. You can
            still complete the experiment using the accessible action buttons
            below.
          </p>
          <p className="caption-text">{stageError}</p>
        </div>
      ) : null}
    </div>
  );
}
