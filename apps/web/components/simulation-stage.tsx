"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type {
  ExperimentAction,
  ExperimentDefinition,
} from "@practicallab/experiment-schemas";
import type { EngineState } from "@practicallab/simulation-engine";
import { SimulationStage2D } from "./simulation-stage-2d";

const SimulationStage3D = dynamic(
  () => import("./simulation-stage-3d").then((mod) => mod.SimulationStage3D),
  {
    ssr: false,
    loading: () => (
      <div
        className="simulation-stage-loading"
        role="status"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "360px",
          background: "var(--pl-surface)",
          borderRadius: "16px",
          color: "var(--pl-muted)",
          fontWeight: 600,
        }}
      >
        <span>Loading 3D Workbench…</span>
      </div>
    ),
  },
);

type Props = {
  definition: ExperimentDefinition;
  state: EngineState;
  onAction: (action: ExperimentAction) => void;
};

function checkWebGL(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")),
    );
  } catch {
    return false;
  }
}

export function SimulationStage({ definition, state, onAction }: Props) {
  const [use3D, setUse3D] = useState(true);
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    const supported = checkWebGL();
    setWebGLSupported(supported);
    if (!supported) {
      setUse3D(false);
    }
  }, []);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* Mode Switcher: 3D Lab vs 2D Lite Fallback */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
          padding: "4px 8px",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--pl-muted)",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {use3D ? (
            <>
              <span
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#19D3C5",
                }}
              />
              Real-time 3D Workbench
            </>
          ) : (
            <>
              <span
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#FF8A3D",
                }}
              />
              2D Lite Fallback
            </>
          )}
        </span>

        {webGLSupported ? (
          <button
            type="button"
            onClick={() => setUse3D((prev) => !prev)}
            style={{
              padding: "4px 10px",
              fontSize: "12px",
              fontWeight: 700,
              borderRadius: "6px",
              border: "1px solid var(--pl-border)",
              background: "var(--pl-surface)",
              color: "var(--pl-text)",
              cursor: "pointer",
            }}
          >
            Switch to {use3D ? "2D Lite Mode" : "3D Mode"}
          </button>
        ) : (
          <span
            style={{
              fontSize: "11px",
              color: "var(--pl-warning)",
              fontWeight: 600,
            }}
          >
            2D Lite active (WebGL unavailable)
          </span>
        )}
      </div>

      {use3D ? (
        <SimulationStage3D
          definition={definition}
          state={state}
          onAction={onAction}
        />
      ) : (
        <SimulationStage2D
          definition={definition}
          state={state}
          onAction={onAction}
        />
      )}
    </div>
  );
}
