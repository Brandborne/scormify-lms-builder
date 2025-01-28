import { ScormError } from '../errors/ScormError';
import { XsdValidator } from './XsdValidator';
import ManifestParser from '../ManifestParser';

export class PackageValidator {
  static async validatePackageStructure(zip: any): Promise<{
    isValid: boolean;
    manifest?: any;
    errors: string[];
  }> {
    const errors: string[] = [];
    let manifest;

    try {
      // Check for imsmanifest.xml
      let manifestFile = zip.files['imsmanifest.xml'];
      if (!manifestFile) {
        // Look for manifest in nested directories
        const manifestPath = Object.keys(zip.files).find(path => 
          path.toLowerCase().endsWith('imsmanifest.xml')
        );
        if (manifestPath) {
          manifestFile = zip.files[manifestPath];
        }
      }

      if (!manifestFile) {
        errors.push('Missing required imsmanifest.xml file');
        return { isValid: false, errors };
      }

      // Get manifest content
      const manifestContent = await manifestFile.async('text');
      console.log('Manifest content:', manifestContent);

      // Detect SCORM version from manifest content
      const scormVersion = manifestContent.includes('2004') ? 'SCORM 2004' : 'SCORM 1.2';
      console.log('Detected SCORM version:', scormVersion);

      // Validate manifest against XSD
      const validationResult = XsdValidator.validateManifest(manifestContent, scormVersion);
      if (!validationResult.isValid) {
        console.error('XSD validation failed:', validationResult.errors);
        return {
          isValid: false,
          errors: validationResult.errors
        };
      }

      // If validation passes, parse the manifest
      manifest = await ManifestParser.parse(manifestContent);
      console.log('Parsed manifest:', manifest);

      // Additional package structure validation
      if (manifest.resources) {
        for (const resource of manifest.resources) {
          if (resource.href) {
            const hasResource = Object.keys(zip.files).some(path => 
              path.endsWith(resource.href)
            );
            if (!hasResource) {
              errors.push(`Missing resource file: ${resource.href}`);
            }
          }
        }
      }

      return {
        isValid: errors.length === 0,
        manifest,
        errors
      };
    } catch (error) {
      console.error('Package validation error:', error);
      errors.push(`Validation error: ${error.message}`);
      return { isValid: false, errors };
    }
  }
}