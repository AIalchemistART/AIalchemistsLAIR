/**
 * CouchEntity.js - Decorative couch entity for AI Alchemist's Lair
 * A non-interactive decorative element that adds to the scene ambiance
 */

import { Entity } from './entity.js';
import assetLoader from './assetLoader.js';
import { debug } from './utils.js';

export class CouchEntity extends Entity {
    /**
     * Create a new couch entity
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} z - Z position
     */
    constructor(x, y, z = 0) {
        super(x, y, z);
        
        // Set static properties (non-moving decorative element)
        this.isStatic = true;
        this.velocityX = 0;
        this.velocityY = 0;
        
        // Set collision properties
        this.width = 1.6875;  // Wider than normal entities
        this.height = 2.8125; // Deeper than normal entities
        this.zHeight = 1.0; // Standard height
        this.collidable = true;
        
        // Set appearance properties
        this.couchKey = 'couch1';
        this.couchImage = null;
        this.loadAttempts = 0;
        this.maxLoadAttempts = 3;
        
        // Try loading the couch image
        this.directLoadCouchImage();
        
        debug('CouchEntity: Created new couch at', { x, y, z });
    }
    
    /**
     * Directly load the couch image
     * Tries to load from asset folder with fallback
     */
    directLoadCouchImage() {
        this.loadAttempts++;
        
        try {
            // Try to get the image from the asset loader first
            this.couchImage = assetLoader.getAsset(this.couchKey);
            
            // If not already loaded, try loading it directly
            if (!this.couchImage) {
                debug('CouchEntity: Image not in asset loader, loading directly');
                this.couchImage = new Image();
                this.couchImage.src = './assets/decor/Couch_1.png';
                
                // Add to asset loader for future use
                assetLoader.assets[this.couchKey] = this.couchImage;
            }
        } catch (err) {
            console.error('CouchEntity: Failed to load couch image:', err);
            // Will use fallback rendering in draw() method
        }
    }
    
    /**
     * Create a fallback couch image
     * Used when the real image fails to load
     */
    createFallbackCouch() {
        debug('CouchEntity: Creating fallback couch image');
        
        // Create a canvas for the fallback image
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Draw a simple couch shape
        ctx.fillStyle = '#8B4513'; // Brown color for couch
        ctx.fillRect(10, 20, 108, 40); // Main body
        
        // Draw couch back
        ctx.fillStyle = '#A0522D'; // Lighter brown
        ctx.fillRect(10, 10, 108, 20); // Back rest
        
        // Draw couch arms
        ctx.fillRect(10, 20, 10, 40); // Left arm
        ctx.fillRect(108, 20, 10, 40); // Right arm
        
        // Add some texture
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(25 + i * 20, 25, 10, 30); // Cushion divisions
        }
        
        // Generate an image from the canvas
        this.couchImage = new Image();
        this.couchImage.src = canvas.toDataURL();
        
        // Also store in asset loader for other components
        assetLoader.assets[this.couchKey] = this.couchImage;
    }
    
    /**
     * Update couch state - called each frame
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        // Skip physics updates for static couch
        if (this.isStatic) {
            // No need to update position/velocity for static objects
        }
    }
    
    /**
     * Draw the couch entity
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} screenX - Screen X position to draw at
     * @param {number} screenY - Screen Y position to draw at
     * @param {number} width - Width to draw
     * @param {number} height - Height to draw
     * @param {number} zOffset - Z-axis offset
     */
    draw(ctx, screenX, screenY, width, height, zOffset) {
        // Calculate adjusted position with grounding factor
        const groundingFactor = 0.7; // How much to "sink" the couch image down to align with the floor
        const adjustedScreenY = screenY - height * (1 - groundingFactor);
        
        // Apply vertical offset based on z position
        const drawY = adjustedScreenY - (this.z * 0.5);
        
        // Draw couch image if loaded
        if (this.couchImage) {
            // Save context for transformations
            ctx.save();
            
            // Scale the image to match the desired width/height
            const scaleFactor = 1.2; // Adjust scale factor as needed
            const drawWidth = width * scaleFactor;
            const drawHeight = height * scaleFactor;
            
            // Draw couch
            ctx.drawImage(
                this.couchImage,
                screenX - drawWidth / 2,
                drawY - drawHeight / 2,
                drawWidth,
                drawHeight
            );
            
            ctx.restore();
        } else {
            // Fallback if image not loaded: create one
            if (this.loadAttempts < this.maxLoadAttempts) {
                this.directLoadCouchImage();
            } else {
                // If we've tried loading too many times, use fallback
                this.createFallbackCouch();
            }
            
            // Draw a temporary rectangle
            ctx.save();
            ctx.fillStyle = '#8B4513'; // Brown color
            ctx.fillRect(
                screenX - width / 2,
                drawY - height / 2,
                width,
                height
            );
            ctx.restore();
        }
        
        // Draw debug info
        if (window.DEBUG_MODE) {
            ctx.save();
            
            // Draw collision box
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                screenX - width / 2,
                drawY - height / 2,
                width,
                height
            );
            
            // Draw couch info
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Couch(${this.x.toFixed(1)},${this.y.toFixed(1)})`, screenX, drawY - height / 2 - 10);
            
            ctx.restore();
        }
    }
}
