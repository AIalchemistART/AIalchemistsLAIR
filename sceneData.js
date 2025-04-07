/**
 * Scene Data Module
 * Contains data structures for all game scenes
 */

import { InteractiveObject } from './interactiveObjects.js';

export const scenes = {
    'startRoom': {
        id: 'startRoom',
        name: 'Start Room',
        description: 'The starting point of the portfolio journey.',
        width: 400, // Canvas units
        height: 300,
        exits: [
            { 
                direction: 'north', 
                to: 'https://aialchemistart.github.io/Circuit-Sanctum-Arcade/', // Updated to allow transition to Vibeverse Arcade
                position: { x: 200, y: 0 },
                gridX: 8,  // Center of north wall
                gridY: 0   // Top of the room (exit)
                // comingSoon flag removed as this area is now implemented
            },
            { 
                direction: 'east', 
                to: 'comingSoon', // Changed to prevent actual transition
                position: { x: 400, y: 150 },
                gridX: 0,    // Changed from 14 to 0 - west wall
                gridY: 5.3,   // Positioning at exactly (0.0, 5.3)
                comingSoon: true // Flag to indicate this is a coming soon door
            }
        ],
        objects: [
            new InteractiveObject('startPortal', 'portal', { x: 180, y: 100 })
        ],
        logic: {
            onEnter: () => {
                console.log('Entered start room');
                // Placeholder for future actions (e.g., play sound)
            },
            onExit: () => {
                console.log('Exited start room');
                // Placeholder for future actions (e.g., stop sound)
            }
        }
    },
    'circuitSanctum': {
        id: 'circuitSanctum',
        name: 'Circuit Sanctum',
        width: 800,
        height: 600,
        exits: [
            { 
                direction: 'south', 
                to: 'startRoom', 
                position: { x: 400, y: 600 },
                gridX: 8,    // Center of south wall
                gridY: 14    // Bottom of the room (exit)
            }
        ],
        objects: [
            // Room-specific objects will go here
        ],
        logic: {
            onEnter: () => {
                console.log('Entered circuit sanctum');
                // Placeholder for future actions (e.g., play sound)
            },
            onExit: () => {
                console.log('Exited circuit sanctum');
                // Placeholder for future actions (e.g., stop sound)
            }
        }
    },
    'neonPhylactery': {
        id: 'neonPhylactery',
        name: 'Neon Phylactery',
        width: 800,
        height: 600,
        exits: [
            { 
                direction: 'west', 
                to: 'startRoom', 
                position: { x: 0, y: 300 },
                gridX: 14,  // East wall - positioned at (14.0, 6.3) as requested
                gridY: 6.3   // Positioned on east wall at 6.3
            }
        ],
        objects: [
            // Room-specific objects will go here
        ],
        logic: {
            onEnter: () => {
                console.log('Entered neon phylactery');
                // Placeholder for future actions (e.g., play sound, show welcome animation)
            },
            onExit: () => {
                console.log('Exited neon phylactery');
                // Placeholder for future actions (e.g., stop sound, save state)
            }
        }
    }
};
