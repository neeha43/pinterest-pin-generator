import { User, PinResult, GeneratedImage } from '../types';

const STORAGE_KEYS = {
  USER: 'pingenie_user',
  PINS: 'pingenie_pins',
  IMAGES: 'pingenie_images'
};

export const storageService = {
  // Mock Auth
  login: (email: string): User => {
    // Simulate finding or creating a user
    const user: User = {
      id: btoa(email), // Simple ID generation
      email,
      name: email.split('@')[0]
    };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return user;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  },

  // Pin Storage
  savePins: (userId: string, pins: PinResult[]) => {
    const existingPins = storageService.getPins(userId);
    const pinsToSave = pins.map(p => ({ ...p, createdAt: Date.now() }));
    const updatedPins = [...pinsToSave, ...existingPins];
    
    localStorage.setItem(`${STORAGE_KEYS.PINS}_${userId}`, JSON.stringify(updatedPins));
  },

  getPins: (userId: string): PinResult[] => {
    const stored = localStorage.getItem(`${STORAGE_KEYS.PINS}_${userId}`);
    return stored ? JSON.parse(stored) : [];
  },

  updatePinImage: (userId: string, pinId: string, base64Image: string) => {
    const pins = storageService.getPins(userId);
    const updated = pins.map(p => p.id === pinId ? { ...p, base64Image, isGeneratingImage: false } : p);
    localStorage.setItem(`${STORAGE_KEYS.PINS}_${userId}`, JSON.stringify(updated));
  },

  // Standalone Image Storage
  saveImage: (userId: string, image: GeneratedImage) => {
    const existingImages = storageService.getImages(userId);
    const updatedImages = [image, ...existingImages];
    localStorage.setItem(`${STORAGE_KEYS.IMAGES}_${userId}`, JSON.stringify(updatedImages));
  },

  getImages: (userId: string): GeneratedImage[] => {
    const stored = localStorage.getItem(`${STORAGE_KEYS.IMAGES}_${userId}`);
    return stored ? JSON.parse(stored) : [];
  }
};