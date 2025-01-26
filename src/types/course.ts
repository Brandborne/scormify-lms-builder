export interface CourseManifestData {
  scormVersion?: string;
  status?: 'pending_processing' | 'processed' | 'error';
  unzipped_path?: string;
  index_path?: string;
}