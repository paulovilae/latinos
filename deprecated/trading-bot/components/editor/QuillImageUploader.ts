// Custom Quill plugin for image uploading
import Quill from 'react-quill';

// Declare global Quill on window
declare global {
  interface Window {
    Quill: any;
  }
}

// Get the Quill object
const QuillInstance = typeof window !== 'undefined' ? window.Quill || Quill : Quill;

// Create a custom blot for images
class ImageUploader {
  quill: any;
  options: any;
  
  constructor(quill: any, options: any) {
    this.quill = quill;
    this.options = options;
    
    // Listen for image toolbar click
    if (this.options.showMediaSelector) {
      this.quill.getModule('toolbar').addHandler('image', this.options.showMediaSelector);
    }
  }
}

// Register the module
if (QuillInstance) {
  try {
    QuillInstance.register('modules/imageUploader', ImageUploader);
  } catch (error) {
    console.warn('Could not register image uploader module:', error);
  }
}

export default ImageUploader;