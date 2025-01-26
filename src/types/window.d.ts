import ScormAPI from "@/lib/scorm/ScormAPI";

declare global {
  interface Window {
    API?: ScormAPI;
    API_1484_11?: ScormAPI;
  }
}

export {};