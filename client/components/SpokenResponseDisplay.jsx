import { useEffect, useState } from "react";

export default function SpokenResponseDisplay({ events }) {
  const [spokenResponse, setSpokenResponse] = useState("");
  const [waveformActive, setWaveformActive] = useState(false);
  const [waveformColor, setWaveformColor] = useState("#ccc");

  useEffect(() => {
    if (!events || events.length === 0) return;

    events.forEach((event, index) => {
      //console.debug(`Processing event #${index + 1}:`, event);

      if (event.type === "speech") {
        console.debug(`Speech event detected:`, event);

        switch (event.status) {
          case "start":
            console.debug("Speech started", event.text);
            setWaveformActive(true);
            setWaveformColor(event.speaker === "agent" ? "#3b82f6" : "#ef4444");
            setSpokenResponse(typeof event.text === "string" ? event.text : JSON.stringify(event.text));
            break;

          case "update":
            console.debug("Speech updated", event.text);
            setSpokenResponse(typeof event.text === "string" ? event.text : JSON.stringify(event.text));
            break;

          case "end":
            console.debug("Speech ended", event.text);
            setWaveformActive(false);
            setSpokenResponse(typeof event.text === "string" ? event.text : JSON.stringify(event.text));
            break;

          default:
            console.warn("Unknown speech status:", event.status);
        }
      }
    });
  }, [events]);

  return (
    <div className="p-4 bg-gray-50 rounded-md shadow">
      <h2 className="text-lg font-bold">Spoken Response Debugger</h2>
      <div className="flex items-center gap-2 mt-2">
        <div
          style={{ backgroundColor: waveformActive ? waveformColor : "#ccc" }}
          className={`w-8 h-2 rounded ${waveformActive ? "animate-pulse" : ""}`}
        />
        <p className="text-base">
          {spokenResponse || "Awaiting spoken response..."}
        </p>
      </div>
    </div>
  );
}