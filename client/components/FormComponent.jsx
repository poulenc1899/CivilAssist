import { useEffect, useState } from "react";

export default function FormComponent({ events, isSessionActive }) {
  const [formData, setFormData] = useState({
    frontierWorker: "",
    subsidiary: "",
    vNumber: "",
    bsn: ""
  });

 
  const [highlightedFields, setHighlightedFields] = useState(new Set());

  // Fixed event handling
  useEffect(() => {
    if (!events || !isSessionActive) return;

    // Find the latest response.done event
    const responseDoneEvent = events.find(e => e.type === "response.done");
    if (!responseDoneEvent?.response?.output) return;

    // Check all outputs in the response
    responseDoneEvent.response.output.forEach(output => {
      if (output.type === "function_call" && 
          output.name === "highlight_form_fields") {
        try {
          const { fieldsToHighlight } = JSON.parse(output.arguments);
          console.log('Highlighting fields:', fieldsToHighlight);
          setHighlightedFields(new Set(fieldsToHighlight));
        } catch (e) {
          console.error('Error parsing highlight arguments:', e);
        }
      }
    });

  }, [events, isSessionActive]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log("Form submitted:", formData);
  };

  const getFieldStyle = (fieldName) => (
    highlightedFields.has(fieldName) 
      ? { border: "2px solid #2563eb", backgroundColor: "#bfdbfe" }
      : {}
  );

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Tax Information Form</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Frontier Worker Section */}
        <div className="space-y-2">
          <label className="block font-medium">
            Have you worked as a frontier worker in the Netherlands in the past period?
          </label>
          <div className="flex gap-4">
            {["Yes", "No"].map((option) => (
              <label key={option} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="frontierWorker"
                  value={option}
                  checked={formData.frontierWorker === option}
                  onChange={handleChange}
                  className="h-4 w-4"
                />
                {option}
              </label>
            ))}
          </div>
        </div>

        {/* Subsidiary Section */}
        {formData.frontierWorker === "Yes" && (
          <div className="space-y-2">
            <label className="block font-medium">
              Is your company* a subsidiary of a parent company?
             
            </label>
            <div className="flex gap-4">
              {["Yes", "No"].map((option) => (
                <label key={option} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="subsidiary"
                    value={option}
                    checked={formData.subsidiary === option}
                    onChange={handleChange}
                    className="h-4 w-4"
                  />
                  {option}
                </label>
              ))}
              
            </div>
            <span className="text-sm text-gray-600 block">
                *If the company is a sole trader, choose 'No'
              </span>
          </div>
        )}

        {/* V-number Input */}
        <div className="space-y-2">
          <label className="block font-medium">V-number</label>
          <input
            type="text"
            name="vNumber"
            value={formData.vNumber}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            style={getFieldStyle("vNumber")}
          />
        </div>

        {/* BSN Input */}
        <div className="space-y-2">
          <label className="block font-medium">Citizen service number (BSN)</label>
          <input
            type="text"
            name="bsn"
            value={formData.bsn}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            style={getFieldStyle("bsn")}
          />
        </div>

        <div className="mt-8">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Submit Form
          </button>
        </div>

        <p className="text-sm text-gray-600 mt-4">
          Please note this form will not submit, and is only intended for demo purposes.
        </p>
      </form>
    </div>
  );
}