import React, { useState, useEffect } from "react";

// Enhanced Local Storage Helper to merge with defaults
const useStickyState = (defaultValue, key) => {
  const [value, setValue] = useState(() => {
    const stickyValue = localStorage.getItem(key);
    if (stickyValue !== null) {
      try {
        const parsed = JSON.parse(stickyValue);
        // If it's an object (like prompts), merge with default to ensure new keys exist
        if (
          typeof defaultValue === "object" &&
          !Array.isArray(defaultValue) &&
          defaultValue !== null
        ) {
          return { ...defaultValue, ...parsed };
        }
        return parsed;
      } catch (e) {
        return defaultValue;
      }
    }
    return defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
};

export default useStickyState;
