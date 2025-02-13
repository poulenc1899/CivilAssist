import { useEffect, useState } from "react";

const ImageFunctionDescription = `
Call this function if a question is about a card or where to find a number outside of the form.  
Here is a list of the available images with their corresponding URLs and descriptions:

/assets/visual-examples/1.jpg | dutch ID card front
/assets/visual-examples/2.png | dutch ID card back
/assets/visual-examples/3.png | digiD logo
/assets/visual-examples/4.png | dutch form example front
/assets/visual-examples/5.png | dutch form example back
/assets/visual-examples/6.png | none of the above - basic logo

Choose the most relevant image to display with the user's question. for example, if the question asks about digital services, or digiD, you should show the URL /assets/visual-examples/3.png
`;

const sessionUpdate = {
  type: "session.update",
  session: {
    tools: [
      {
        type: "function",
        name: "display_image",
        description: ImageFunctionDescription,
        parameters: {
          type: "object",
          strict: true,
          properties: {
            imageName: {
              type: "string",
              description: "Official name of the document/image to display",
            },
            imageUrl: {
              type: "string",
              description: "Secure URL to the official documentation image",
            },
            description: {
              type: "string",
              description: "Brief explanation of what the image shows",
            },
          },
          required: ["imageName", "imageUrl", "description"],
        },
      },
      {
        type: "function",
        name: "highlight_form_fields",
        description: `Highlight form fields when user asks about where to enter information, for example if the user asks "where do i put my BSN number?" or "where should I write my BSN number?" then this function should be called to highlight the bsn field, while saying "i've highlighted it on the form for you"`,
        parameters: {
          type: "object",
          properties: {
            fieldsToHighlight: {
              type: "array",
              items: {
                type: "string",
                enum: ["vNumber", "bsn", "frontierWorker", "subsidiary"],
              },
            },
          },
          required: ["fieldsToHighlight"],
        },
      },
    ],
    tool_choice: "auto",
  },
};

function FunctionCallOutput({ functionCallOutput }) {
  const { imageName, imageUrl, description } = JSON.parse(functionCallOutput.arguments);
  const [isEnlarged, setIsEnlarged] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold">{imageName}</h3>
      <div className="relative group">
        <img
          src={imageUrl}
          alt={imageName}
          className="w-full max-w-md cursor-zoom-in rounded-lg border-2 border-gray-200"
          onClick={() => setIsEnlarged(true)}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200" />
      </div>
      <p className="text-sm">{description}</p>
      {isEnlarged && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setIsEnlarged(false)}
        >
          <img
            src={imageUrl}
            alt={imageName}
            className="max-h-screen max-w-full object-contain cursor-zoom-out"
          />
        </div>
      )}
    </div>
  );
}

export default function ToolPanel({ isSessionActive, sendClientEvent, events }) {
  const [functionAdded, setFunctionAdded] = useState(false);
  const [functionCallOutput, setFunctionCallOutput] = useState(null);
  // New state variable for the audio transcript text
  const [transcriptText, setTranscriptText] = useState("");

  useEffect(() => {
    if (!events || events.length === 0) return;

    const firstEvent = events[events.length - 1];
    if (!functionAdded && firstEvent.type === "session.created") {
      sendClientEvent(sessionUpdate);
      setFunctionAdded(true);
    }

    const mostRecentEvent = events[0];
    if (
      mostRecentEvent.type === "response.done" &&
      mostRecentEvent.response.output
    ) {
      mostRecentEvent.response.output.forEach((output) => {
        // Check for display_image function call
        if (
          output.type === "function_call" &&
          output.name === "display_image"
        ) {
          setFunctionCallOutput(output);
          setTimeout(() => {
            sendClientEvent({
              type: "response.create",
              response: {
                instructions: `
                Ask if the user can see the image on the right-hand side.
                `,
              },
            });
          }, 500);
        }
        // Check for highlight_form_fields function call
        else if (
          output.type === "function_call" &&
          output.name === "highlight_form_fields"
        ) {
          setFunctionCallOutput(output);
          setTimeout(() => {
            sendClientEvent({
              type: "response.create",
              response: {
                instructions: `
                Tell the user the field has been highlighted on the form.
                `,
              },
            });
          }, 500);
        }
        // Otherwise, assume it's the audio transcript
        else if (
          output.content &&
          output.content.length > 0 &&
          output.content[0].transcript
        ) {
          console.debug("Audio transcript received:", output.content[0].transcript);
          setTranscriptText(output.content[0].transcript);
        }
      });
    }
  }, [events, functionAdded, sendClientEvent]);

  useEffect(() => {
    if (!isSessionActive) {
      setFunctionAdded(false);
      setFunctionCallOutput(null);
      setTranscriptText("");
    }
  }, [isSessionActive]);

  return (
    <section className="h-full w-full flex flex-col gap-4">
      {/* Transcript section */}
      <div className="p-4 bg-gray-50 rounded-md">
        <h2 className="text-lg font-bold">Civil Assist</h2>
        <p className="text-base">
          {transcriptText || "Awaiting transcript..."}
        </p>
      </div>
      
      {/* Documentation viewer section */}
      <div className="h-full bg-gray-50 rounded-md p-4">
        <h2 className="text-lg font-bold">Image Viewer</h2>
        {isSessionActive ? (
          functionCallOutput ? (
            <FunctionCallOutput functionCallOutput={functionCallOutput} />
          ) : (
            <p>Ask about official documents or procedures...</p>
          )
        ) : (
          <p>Ask Civil Assist to show something visually...</p>
        )}
      </div>
    </section>
  );
}