import { useDocumentState } from "./documents/useDocumentState";
import { useDocumentSave } from "./documents/useDocumentSave";
import { useDocumentOperations } from "./documents/useDocumentOperations";
import { useEffect } from "react";

export function useDocument(id: string | undefined) {
  const { title, setTitle, saving, setSaving } = useDocumentState();
  const { debouncedSave } = useDocumentSave(id, title, setSaving);
  const { createNewDocument, loadDocument } = useDocumentOperations(id, setTitle);

  useEffect(() => {
    if (id === "new") {
      createNewDocument();
    }
  }, [id]);

  return {
    title,
    saving,
    setTitle,
    loadDocument,
    debouncedSave
  };
}