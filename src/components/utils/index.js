import React from "react";

export { Spinner } from "./spinner";

export const IconButton = ({ icon, label, ...props }) => {
  return (
    <button {...props}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {icon}
        <span style={{ marginLeft: "0.7em" }}>{label}</span>
      </div>
    </button>
  );
};

export const GlyphIcon = ({ name }) => (
  <span className={`glyphicon glyphicon-${name}`} />
);
