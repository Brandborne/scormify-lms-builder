import { useState } from "react";

export function useDocumentState() {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  return {
    title,
    setTitle,
    saving,
    setSaving
  };
}