import { Copy } from "lucide-react";

export function JsonBlock({ value, label = "Record" }) {
  const text = JSON.stringify(value, null, 2);
  return (
    <div className="json-block">
      <div className="json-toolbar">
        <span>{label}</span>
        <button className="icon-button" type="button" title={`Copy ${label}`} aria-label={`Copy ${label}`} onClick={() => navigator.clipboard?.writeText(text)}>
          <Copy size={16} />
        </button>
      </div>
      <pre>{text}</pre>
    </div>
  );
}
