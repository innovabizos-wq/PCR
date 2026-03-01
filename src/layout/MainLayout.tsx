import React from "react";

interface Props {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
}

export default function MainLayout({ left, center, right }: Props) {
  return (
    <div style={layout}>

      {/* IZQUIERDA */}
      <aside style={leftColumn}>
        {left}
      </aside>


      {/* CENTRO (SCROLL) */}
      <main style={centerColumn}>
        <div style={centerInner}>
          {center}
        </div>
      </main>


      {/* DERECHA */}
      <aside style={rightColumn}>
        {right}
      </aside>

    </div>
  );
}


const layout: React.CSSProperties = {

  display: "grid",

  gridTemplateColumns: "260px minmax(0,1fr) 340px",

  height: "100vh",

  overflow: "hidden",

  background: "#f8fafc"

};


const leftColumn: React.CSSProperties = {

  height: "100vh",

  overflow: "hidden",

  borderRight: "1px solid rgba(0,0,0,0.06)",

  background: "#ffffff",

  padding: "20px",

  boxSizing: "border-box"

};


const centerColumn: React.CSSProperties = {

  height: "100vh",

  overflowY: "auto",

  overflowX: "hidden",

  display: "flex",

  justifyContent: "center"

};


const centerInner: React.CSSProperties = {

  width: "100%",

  maxWidth: "1100px",

  padding: "20px",

  boxSizing: "border-box"

};


const rightColumn: React.CSSProperties = {

  height: "100vh",

  overflow: "hidden",

  borderLeft: "1px solid rgba(0,0,0,0.06)",

  background: "#ffffff",

  padding: "20px",

  boxSizing: "border-box"

};
