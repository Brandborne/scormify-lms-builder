export interface CourseManifestData {
  scormVersion?: string;
  status?: 'pending_processing' | 'processed' | 'error';
  unzipped_path?: string;
  compiled_path?: string;
  index_path?: string;
  original_index_path?: string;
  startingPage?: string;
}