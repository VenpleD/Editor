import React from "react";

const loadingStyle: React.CSSProperties = {
  position: "fixed",
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  background: "rgba(255,255,255,0.7)",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 20,
  color: "#333",
};

const GlobalLoading: React.FC<{ visible: boolean; text?: string }> = ({ visible, text }) => {
  if (!visible) return null;
  return (
    <div style={loadingStyle}>
      {text || "加载中..."}
    </div>
  );
};

export default GlobalLoading;