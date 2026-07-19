import { useState } from "react";
import type { Api, Model } from "@earendil-works/pi-ai";
import { Onboarding } from "./onboarding";
import { Session } from "./session/session";

export function App() {
  const [model, setModel] = useState<Model<Api>>();

  if (model) {
    return <Session model={model} onBack={() => setModel(undefined)} />;
  }

  return <Onboarding onComplete={setModel} />;
}
