/**
 * Debug Controls Module
 * Provides keyboard shortcuts and controls for debugging and testing
 */

import { runSceneTests } from './sceneTest.js';

// Flag to track if tests have been run
let testsRun = false;
let testsRunning = false;

/**
 * Initialize debug controls
 */
export function initDebugControls() {
    // Add event listener for keyboard shortcuts
    window.addEventListener('keydown', (event) => {
        // Run scene tests with L key
        if ((event.key === 'l' || event.key === 'L') && !testsRunning) {
            console.log('Debug shortcut activated: Running scene tests');
            testsRunning = true;
            
            // Run tests asynchronously
            runSceneTests().then(() => {
                testsRun = true;
                testsRunning = false;
            }).catch(err => {
                console.error('Error in scene tests:', err);
                testsRunning = false;
            });
            
            event.preventDefault();
        }
    });
    
    // Auto-run tests on startup if in test mode
    // This can be controlled via URL parameter: ?test=scene
    if (window.location.search.includes('test=scene') && !testsRun && !testsRunning) {
        console.log('Auto-running scene tests based on URL parameter');
        // Slight delay to ensure system is fully initialized
        setTimeout(() => {
            testsRunning = true;
            runSceneTests().then(() => {
                testsRun = true;
                testsRunning = false;
            }).catch(err => {
                console.error('Error in scene tests:', err);
                testsRunning = false;
            });
        }, 500);
    }
}
