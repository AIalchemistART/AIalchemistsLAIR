/**
 * TV Entity for AI Alchemist's Lair
 * Handles loading and rendering of television entities in the game world
 */

import { Entity } from './entity.js';
import assetLoader from './assetLoader.js';
import { debug } from './utils.js';
import { input } from './input.js';
import { getAssetPath } from './pathResolver.js';

class TVEntity extends Entity {
    /**
     * Create a new television entity
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position 
     * @param {number} width - Width in grid units
     * @param {number} height - Height in grid units
     * @param {string} tvKey - Key for the TV asset in the asset loader
     */
    constructor(x, y, width = 1, height = 1, tvKey = 'tv1') {
        super(x, y, width, height);
        
        console.log(`TVEntity: Creating new television at (${x}, ${y}) with key ${tvKey}`);
        
        // TV specific properties
        this.tvKey = tvKey;            // Key for the TV asset
        this.zHeight = 1.0;            // Taller height for TV
        this.z = 0;                    // Base z position (on the ground)
        this.tvImage = null;           // Will hold the loaded image
        this.loadAttempts = 0;         // Track loading attempts
        this.maxLoadAttempts = 3;      // Maximum loading attempts
        
        // Ensure TV has no velocity - it's a static object
        this.velocityX = 0;
        this.velocityY = 0;
        this.isStatic = true;          // Make TV static so it doesn't move
        
        // Apply a positional offset to fix grid alignment
        this.x += -1.5;
        this.y += -1.25;
        
        // Decorative glow effect state
        this.glowIntensity = 0;
        this.glowDirection = 1;
        this.glowSpeed = 0.02;
        this.baseGlowIntensity = 0.5;  // Base glow intensity for normal state
        this.maxGlowIntensity = 1.0;   // Maximum glow intensity
        this.proximityBoost = 0;       // Additional glow when player is nearby
        this.glowColor = '#3DF5FF';    // Cyan glow for TV
        
        // Interactive properties
        this.interactionDistance = 4;   // Distance within which player can interact with TV (increased for larger entity)
        this.isPlayerNearby = false;      // Tracks if player is close enough to interact
        this.isActive = false;            // Tracks if YouTube player is currently active
        this.wasEnterPressed = false;     // Tracks enter key state to detect press
        this.youtubePlayer = null;        // Will hold the YouTube player element
        this.interactionPromptAlpha = 0;  // Transparency for interaction prompt
        
        // Add a timeout to prevent rapid toggling
        this.lastToggleTime = 0;
        this.toggleCooldown = 500; // ms
        
        // Add a direct Enter key event listener
        this.handleKeyDown = (event) => {
            if (event.key === 'Enter' && this.isPlayerNearby && !this.isActive) {
                console.log('TVEntity: Direct Enter key event detected - toggling TV');
                this.toggleTV();
            }
        };
        
        // Register the event listener
        document.addEventListener('keydown', this.handleKeyDown);
        
        // Debug console log about TV placement
        console.log(`TVEntity: Final adjusted position: (${this.x}, ${this.y})`);
        
        // Check asset loader first
        const existingAsset = assetLoader.getAsset(tvKey);
        if (existingAsset) {
            console.log(`TVEntity: Found existing asset for ${tvKey} in asset loader`);
            this.tvImage = existingAsset;
        } else {
            console.log(`TVEntity: No existing asset found for ${tvKey}, will load directly`);
        }
        
        // Directly try to load the TV image
        this.directLoadTVImage();
        
        // Initialize the YouTube iframe HTML
        this.youtubeIframeHTML = `
            <iframe width="560" height="315" 
                src="https://www.youtube.com/embed/videoseries?si=-kSWh7yVU3WFZpJa&amp;list=PLOyT7JwO8QwNdoVK5YDi_tcJ010f7GQ2L" 
                title="YouTube video player" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerpolicy="strict-origin-when-cross-origin" 
                allowfullscreen>
            </iframe>
        `;
    }
    
    /**
     * Directly load the TV image without relying on asset loader
     */
    directLoadTVImage() {
        if (this.tvImage) {
            console.log(`TVEntity: TV image already loaded, skipping direct load`);
            return;
        }
        
        console.log(`TVEntity: Directly loading TV image (attempt ${this.loadAttempts + 1}/${this.maxLoadAttempts})`);
        
        // Create a new image directly
        const img = new Image();
        
        img.onload = () => {
            console.log(`TVEntity: Successfully loaded TV image directly (${img.width}x${img.height})`);
            this.tvImage = img;
            
            // Also store in asset loader for other components
            assetLoader.assets[this.tvKey] = img;
            console.log(`TVEntity: Stored TV image in asset loader with key ${this.tvKey}`);
        };
        
        img.onerror = (err) => {
            console.log(`TVEntity: Failed to load TV image directly`, err);
            console.log(`TVEntity: Failed path was: assets/decor/Television_1.png`);
            
            this.loadAttempts++;
            if (this.loadAttempts < this.maxLoadAttempts) {
                console.log(`TVEntity: Will try alternative path (attempt ${this.loadAttempts + 1})`);
                // Try again with a slightly different path
                setTimeout(() => this.tryAlternativePath(), 200);
            } else {
                console.log(`TVEntity: All ${this.maxLoadAttempts} attempts failed, creating fallback`);
                this.createFallbackImage();
            }
        };
        
        // Use exact path with proper path resolution for GitHub Pages compatibility
        const exactPath = 'assets/decor/Television_1.png';
        const resolvedPath = getAssetPath(exactPath);
        console.log(`TVEntity: Setting image src to resolved path: ${resolvedPath} (original: ${exactPath})`);
        img.src = resolvedPath;
    }
    
    /**
     * Try loading from alternative paths
     */
    tryAlternativePath() {
        console.log(`TVEntity: Trying alternative path (attempt ${this.loadAttempts + 1}/${this.maxLoadAttempts})`);
        
        const paths = [
            'assets/decor/Television1.png',
            './assets/decor/Television_1.png',
            './assets/decor/Television1.png'
        ];
        
        const pathIndex = (this.loadAttempts - 1) % paths.length;
        const path = paths[pathIndex];
        
        console.log(`TVEntity: Selected path ${pathIndex+1}/${paths.length}: ${path}`);
        
        const img = new Image();
        
        img.onload = () => {
            console.log(`TVEntity: Successfully loaded TV from alternative path: ${path} (${img.width}x${img.height})`);
            this.tvImage = img;
            assetLoader.assets[this.tvKey] = img;
        };
        
        img.onerror = (err) => {
            console.log(`TVEntity: Failed to load TV from alternative path: ${path}`, err);
            
            // Try next attempt if we haven't reached the maximum
            this.loadAttempts++;
            if (this.loadAttempts < this.maxLoadAttempts) {
                console.log(`TVEntity: Will try next alternative path (attempt ${this.loadAttempts + 1})`);
                setTimeout(() => this.tryAlternativePath(), 200);
            } else {
                console.log('TVEntity: All TV loading attempts failed. Using fallback.');
                // Create a fallback canvas-based image
                this.createFallbackImage();
            }
        };
        
        // Resolve path for GitHub Pages compatibility
        const resolvedPath = getAssetPath(path);
        console.log(`TVEntity: Setting alternative image src to resolved path: ${resolvedPath} (original: ${path})`);
        img.src = resolvedPath;
    }
    
    /**
     * Create a fallback canvas-based image for the TV
     */
    createFallbackImage() {
        console.log('TVEntity: Creating fallback canvas image');
        
        // Create a canvas to generate an image
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Draw a medieval-cyberpunk style TV
        
        // Base of the TV (dark metal)
        ctx.fillStyle = '#232323';
        ctx.fillRect(24, 40, 80, 80);
        
        // Screen area
        ctx.fillStyle = '#000000';
        ctx.fillRect(32, 48, 64, 48);
        
        // Screen glow
        ctx.fillStyle = '#3DF5FF';
        ctx.globalAlpha = 0.3;
        ctx.fillRect(32, 48, 64, 48);
        ctx.globalAlpha = 1.0;
        
        // TV stand
        ctx.fillStyle = '#303030';
        ctx.fillRect(54, 88, 20, 20);
        
        // TV buttons
        ctx.fillStyle = '#777777';
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(110, 50 + i * 10, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // TV static pattern
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.1;
        for (let i = 0; i < 100; i++) {
            const x = 32 + Math.random() * 64;
            const y = 48 + Math.random() * 48;
            const size = 1 + Math.random() * 2;
            ctx.fillRect(x, y, size, size);
        }
        ctx.globalAlpha = 1.0;
        
        // Generate an image from the canvas
        this.tvImage = new Image();
        this.tvImage.src = canvas.toDataURL();
        
        console.log('TVEntity: Created fallback TV image');
        
        // Also store in asset loader for other components
        assetLoader.assets[this.tvKey] = this.tvImage;
    }
    
    /**
     * Update TV state - called each frame
     * @param {number} deltaTime - Time since last update
     * @param {Player} player - The player entity
     */
    update(deltaTime, player) {
        // Skip physics updates for static TV
        if (this.isStatic) {
            // No need to update position/velocity for static objects
        }
        
        // Update base glow effect (oscillation)
        this.glowIntensity += this.glowDirection * this.glowSpeed;
        if (this.glowIntensity > this.maxGlowIntensity) {
            this.glowIntensity = this.maxGlowIntensity;
            this.glowDirection = -1;
        } else if (this.glowIntensity < this.baseGlowIntensity) {
            this.glowIntensity = this.baseGlowIntensity;
            this.glowDirection = 1;
        }
        
        // Update proximity boost (smoothly approach target)
        const targetProximityBoost = this.isPlayerNearby ? 1.5 : 0;
        this.proximityBoost += (targetProximityBoost - this.proximityBoost) * 0.1;
        
        // Check if player is nearby
        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const wasNearby = this.isPlayerNearby;
            this.isPlayerNearby = distance <= this.interactionDistance;
            
            // Player just entered interaction range
            if (!wasNearby && this.isPlayerNearby) {
                console.log(`TVEntity: Player entered interaction range (${distance.toFixed(2)} units)`);
            }
            
            // Player just left interaction range
            if (wasNearby && !this.isPlayerNearby) {
                console.log(`TVEntity: Player left interaction range (${distance.toFixed(2)} units)`);
            }
            
            // Handle interaction prompt fade
            if (this.isPlayerNearby) {
                // Only show prompt if TV is inactive
                if (!this.isActive) {
                    // Fade in prompt faster
                    this.interactionPromptAlpha = Math.min(1, this.interactionPromptAlpha + 0.05);
                } else {
                    // Keep prompt hidden while active
                    this.interactionPromptAlpha = 0;
                }
            } else {
                // Fade out prompt when player moves away
                this.interactionPromptAlpha = Math.max(0, this.interactionPromptAlpha - 0.05);
            }
            
            // Check for Enter key press - only toggle when player is nearby and Enter is newly pressed
            // We check Input.keys.Enter directly from the input system
            const isEnterPressed = window.input && window.input.keys && window.input.keys['Enter'];
            
            // Only detect a new press (not holding)
            if (isEnterPressed && !this.wasEnterPressed && this.isPlayerNearby && !this.isActive) {
                console.log('TVEntity: Enter key newly pressed, toggling TV ON');
                this.toggleTV();
            } 
            // Handle closing with Enter if already active
            else if (isEnterPressed && !this.wasEnterPressed && this.isActive) {
                console.log('TVEntity: Enter key newly pressed while active, toggling TV OFF');
                this.toggleTV();
            }
            
            // Update previous key state
            this.wasEnterPressed = isEnterPressed;
        }
    }
    
    /**
     * Draw the TV entity
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} screenX - Screen X position to draw at
     * @param {number} screenY - Screen Y position to draw at
     * @param {number} width - Width to draw
     * @param {number} height - Height to draw
     * @param {number} zOffset - Z-axis offset
     */
    draw(ctx, screenX, screenY, width, height, zOffset) {
        // Calculate adjusted position with grounding factor
        const groundingFactor = 0.8; // How much to "sink" the TV image down to align with the floor
        const adjustedScreenY = screenY - height * (1 - groundingFactor);
        
        // Apply vertical offset based on z position
        const drawY = adjustedScreenY - (this.z * 0.5);
        
        // Draw TV image if loaded
        if (this.tvImage) {
            // Apply glow effect - enhanced by proximity
            ctx.save();
            ctx.shadowColor = this.glowColor;
            ctx.shadowBlur = 15 * (this.glowIntensity + this.proximityBoost);
            
            // Scale the image to match the desired width/height
            const scaleFactor = 1.2; // Increased size factor to better match the larger collision bounds
            const drawWidth = width * scaleFactor;
            const drawHeight = height * scaleFactor;
            
            // Draw TV
            ctx.drawImage(
                this.tvImage,
                screenX - drawWidth / 2,
                drawY - drawHeight / 2,
                drawWidth,
                drawHeight
            );
            
            ctx.restore();
        } else {
            // Fallback if image not loaded: draw a colored rectangle
            ctx.save();
            ctx.fillStyle = '#555555';
            ctx.fillRect(
                screenX - width / 3,
                drawY - height / 3,
                width * 2/3,
                height * 2/3
            );
            
            // Draw TV label
            ctx.fillStyle = 'white';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('TV', screenX, drawY);
            ctx.restore();
        }
        
        // Draw interaction prompt if player is nearby
        if (this.interactionPromptAlpha > 0) {
            const promptY = drawY - height / 2 - 60; // Position the prompt higher above the TV
            
            this.drawInteractionPrompt(ctx, screenX, promptY);
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
            
            // Draw interaction radius with a clearer visualization
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)'; // More transparent
            ctx.setLineDash([5, 5]); // Dashed line
            ctx.beginPath();
            ctx.arc(screenX, drawY, this.interactionDistance * 20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]); // Reset dash
            
            // Draw TV info
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`TV(${this.x.toFixed(1)},${this.y.toFixed(1)})`, screenX, drawY - height / 2 - 10);
            
            // Interaction status
            const statusY = drawY + height / 2 + 15;
            ctx.fillStyle = this.isPlayerNearby ? 'lime' : 'red';
            ctx.fillText(this.isPlayerNearby ? 'IN RANGE' : 'OUT OF RANGE', screenX, statusY);
            
            ctx.restore();
        }
    }
    
    /**
     * Draw interaction prompt above the TV
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position for the prompt
     * @param {number} y - Y position for the prompt
     */
    drawInteractionPrompt(ctx, x, y) {
        ctx.save();
        
        // Set up text style with larger font
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Enhanced glow effect
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15;
        ctx.fillStyle = `rgba(0, 255, 255, ${this.interactionPromptAlpha})`;
        
        // Draw text with background for better visibility
        const text = 'Press ENTER to Watch TV';
        const textWidth = ctx.measureText(text).width;
        
        // Draw background
        ctx.fillStyle = `rgba(0, 0, 0, ${this.interactionPromptAlpha * 0.7})`;
        ctx.fillRect(x - textWidth/2 - 10, y - 30, textWidth + 20, 60);
        
        // Draw border
        ctx.strokeStyle = `rgba(0, 255, 255, ${this.interactionPromptAlpha})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - textWidth/2 - 10, y - 30, textWidth + 20, 60);
        
        // Draw text
        ctx.fillStyle = `rgba(255, 255, 255, ${this.interactionPromptAlpha})`;
        ctx.fillText(text, x, y - 10);
        
        // Draw key indicator
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = `rgba(0, 255, 255, ${this.interactionPromptAlpha})`;
        ctx.fillText('[ ENTER ]', x, y + 15);
        
        ctx.restore();
    }
    
    /**
     * Toggle the TV modal on/off
     */
    toggleTV() {
        // Check cooldown
        const now = Date.now();
        if (now - this.lastToggleTime < this.toggleCooldown) {
            console.log('TVEntity: Toggle on cooldown, ignoring request');
            return;
        }
        this.lastToggleTime = now;
        
        // Toggle active state
        this.isActive = !this.isActive;
        
        console.log(`TVEntity: Toggling TV state to ${this.isActive ? 'ACTIVE' : 'INACTIVE'}`);
        
        if (this.isActive) {
            console.log('TVEntity: Creating YouTube modal');
            this.createYoutubeModal();
            
            // Temporarily disable the direct Enter key event listener while player is active
            // This prevents it from immediately closing due to key repeat
            document.removeEventListener('keydown', this.handleKeyDown);
            
            // Reset the wasEnterPressed state to prevent immediate toggling
            this.wasEnterPressed = true;
            
            // Add a slight delay before accepting new Enter key presses
            setTimeout(() => {
                this.wasEnterPressed = false;
            }, 500);
        } else {
            console.log('TVEntity: Removing YouTube modal');
            this.removeYoutubeModal();
            
            // Re-enable the direct Enter key event listener after player is closed
            document.addEventListener('keydown', this.handleKeyDown);
            
            // Reset the wasEnterPressed state to prevent immediate toggling
            this.wasEnterPressed = true;
            
            // Add a slight delay before accepting new Enter key presses
            setTimeout(() => {
                this.wasEnterPressed = false;
            }, 500);
        }
    }
    
    /**
     * Create the YouTube modal
     */
    createYoutubeModal() {
        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.id = 'youtube-modal';
        modalContainer.style.position = 'fixed';
        modalContainer.style.left = '0';
        modalContainer.style.top = '0';
        modalContainer.style.width = '100%';
        modalContainer.style.height = '100%';
        modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        modalContainer.style.zIndex = '1000';
        modalContainer.style.display = 'flex';
        modalContainer.style.justifyContent = 'center';
        modalContainer.style.alignItems = 'center';
        modalContainer.style.flexDirection = 'column';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'youtube-content';
        modalContent.style.backgroundColor = '#111';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '5px';
        modalContent.style.position = 'relative';
        modalContent.style.maxWidth = '80%';
        modalContent.style.boxShadow = '0 0 20px #3DF5FF';
        modalContent.style.border = '2px solid #3DF5FF';
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;';
        closeButton.style.position = 'absolute';
        closeButton.style.right = '10px';
        closeButton.style.top = '10px';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.color = '#3DF5FF';
        closeButton.style.fontSize = '24px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.zIndex = '1001';
        closeButton.onclick = () => this.toggleTV();
        
        // Create title
        const title = document.createElement('h2');
        title.textContent = 'Vibeverse TV';
        title.style.color = '#3DF5FF';
        title.style.marginTop = '0';
        title.style.marginBottom = '15px';
        
        // Set the iframe content
        modalContent.innerHTML += this.youtubeIframeHTML;
        
        // Assemble the modal
        modalContent.appendChild(closeButton);
        modalContent.insertBefore(title, modalContent.firstChild);
        modalContainer.appendChild(modalContent);
        document.body.appendChild(modalContainer);
        
        // Store reference to the modal
        this.youtubePlayer = modalContainer;
        
        // Add ESC key listener
        this.handleEscapeKey = (event) => {
            if (event.key === 'Escape' && this.isActive) {
                console.log('TVEntity: ESC key pressed while TV modal is active, closing modal');
                this.toggleTV();
            }
        };
        document.addEventListener('keydown', this.handleEscapeKey);
        
        // Add Enter key listener for re-toggle
        this.handleEnterKeyInModal = (event) => {
            if (event.key === 'Enter' && this.isActive) {
                console.log('TVEntity: Enter key pressed while TV modal is active, closing modal');
                this.toggleTV();
            }
        };
        document.addEventListener('keydown', this.handleEnterKeyInModal);
    }
    
    /**
     * Remove the YouTube modal
     */
    removeYoutubeModal() {
        if (this.youtubePlayer) {
            document.body.removeChild(this.youtubePlayer);
            this.youtubePlayer = null;
            
            // Remove ESC key listener
            document.removeEventListener('keydown', this.handleEscapeKey);
            document.removeEventListener('keydown', this.handleEnterKeyInModal);
        }
    }
    
    /**
     * Clean up resources when entity is removed
     */
    cleanup() {
        console.log('TVEntity: Cleaning up resources');
        
        // Remove keydown event listener
        document.removeEventListener('keydown', this.handleKeyDown);
        
        // Remove modal and event listeners if active
        if (this.isActive) {
            this.removeYoutubeModal();
        }
    }
}

export { TVEntity };
