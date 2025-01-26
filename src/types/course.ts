export interface CourseManifestData {
  scormVersion?: string;
  status?: 'pending_processing' | 'processed' | 'error';
  title?: string;
  description?: string;
  startingPage?: string;
  prerequisites?: string[];
  unzipped_path?: string;
  compiled_path?: string;
  index_path?: string;
  original_index_path?: string;
}