import React from "react";

export const Card = ({ classString, children }) => {
  return (
    <div
      className={`border-slate-800 bg-gray-900 border-2 w-1/2 rounded-md p-4 ${classString}`}
    >
      {children}
    </div>
  );
};
