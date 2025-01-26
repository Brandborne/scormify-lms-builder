import { ScormError } from '../errors/ScormError';
import ManifestParser, { ScormManifest } from '../ManifestParser';

export class PackageValidator {
  static async validatePackageStructure(zip: any): Promise<{
    isValid: boolean;
    manifest?: ScormManifest;
    errors: string[];
  }> {
    const errors: string[] = [];
    let manifest: ScormManifest | undefined;

    try {
      // Check for imsmanifest.xml
      const manifestFile = zip.files['imsmanifest.xml'];
      if (!manifestFile) {
        errors.push('Missing required imsmanifest.xml file');
        return { isValid: false, errors };
      }

      // Validate manifest content
      const manifestContent = await manifestFile.async('text');
      manifest = await ManifestParser.parse(manifestContent);

      if (!manifest.startingPage) {
        errors.push('Missing starting page in manifest');
      }

      // Check if starting page exists in package
      if (manifest.startingPage && !zip.files[manifest.startingPage]) {
        errors.push(`Starting page ${manifest.startingPage} not found in package`);
      }

      // Check for common required directories/files
      const requiredPaths = ['common', 'scripts'];
      requiredPaths.forEach(path => {
        const hasPath = Object.keys(zip.files).some(file => 
          file.toLowerCase().startsWith(path.toLowerCase() + '/')
        );
        if (!hasPath) {
          errors.push(`Missing recommended ${path} directory`);
        }
      });

      // Validate file extensions
      const allowedExtensions = ['.html', '.htm', '.js', '.css', '.jpg', '.jpeg', '.png', '.gif', '.xml', '.xsd'];
      Object.keys(zip.files).forEach(file => {
        if (!file.endsWith('/')) { // Skip directories
          const ext = '.' + file.split('.').pop()?.toLowerCase();
          if (!allowedExtensions.includes(ext)) {
            errors.push(`Unsupported file type: ${file}`);
          }
        }
      });

      return {
        isValid: errors.length === 0,
        manifest: manifest,
        errors
      };
    } catch (error: any) {
      console.error('Package validation error:', error);
      errors.push(`Validation error: ${error.message}`);
      return { isValid: false, errors };
    }
  }
}