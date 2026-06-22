/**
 * Utility to load all media files (images and videos) from public/photos directory
 */

export interface MediaFile {
  url: string;
  type: 'image' | 'video';
  filename: string;
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm', 'avi', 'mkv', 'm4v'];

/**
 * Determines if a file is an image or video based on extension
 */
function getMediaType(filename: string): 'image' | 'video' | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return null;
  
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video';
  return null;
}

/**
 * Load all media files from public/photos directory
 * Since we can't dynamically read directory in browser, we'll use a manifest approach
 * or try to load files by attempting known filenames
 */
export async function loadMediaFiles(): Promise<MediaFile[]> {
  const mediaFiles: MediaFile[] = [];
  
  // Common filenames to check (you can expand this list or use a manifest file)
  const possibleFiles = [
    '1.mp4', '2.mp4', '3.png', '4.png', '5.mp4', '6.png', '7.png', '8.png',
    '9.JPG', '10.JPG', '11.JPG', '12.MOV', '13.MOV', '14.MOV', '15.JPG',
    'image.png'
  ];
  
  // Try to load each file
  for (const filename of possibleFiles) {
    const url = `/photos/${filename}`;
    const type = getMediaType(filename);
    
    if (!type) continue;
    
    try {
      // Check if file exists by attempting a HEAD request
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        mediaFiles.push({ url, type, filename });
      }
    } catch (error) {
      // File doesn't exist, skip
      continue;
    }
  }
  
  return mediaFiles;
}

/**
 * Alternative approach: Use a manifest file
 * Create a manifest.json in public/photos with list of files
 */
export async function loadMediaFilesFromManifest(): Promise<MediaFile[]> {
  try {
    const response = await fetch('/photos/manifest.json');
    if (!response.ok) {
      console.warn('No manifest.json found, using auto-detection');
      return loadMediaFiles();
    }
    
    const manifest: string[] = await response.json();
    const mediaFiles: MediaFile[] = [];
    
    for (const filename of manifest) {
      const type = getMediaType(filename);
      if (type) {
        // verify file exists
        try {
          const head = await fetch(`/photos/${filename}`, { method: 'HEAD' });
          if (!head.ok) {
            console.error(`Missing file in manifest: /photos/${filename}`);
            continue;
          }
        } catch (err) {
          console.error(`Error checking file /photos/${filename}:`, err);
          continue;
        }

        mediaFiles.push({
          url: `/photos/${filename}`,
          type,
          filename
        });
      }
    }
    
    return mediaFiles;
  } catch (error) {
    console.error('Error loading manifest:', error);
    return loadMediaFiles();
  }
}
