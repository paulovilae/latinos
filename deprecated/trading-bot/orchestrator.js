/**
 * Backward compatibility script for orchestrator.js
 * This file forwards to the new location of orchestrator.js in the startup directory
 * to maintain backward compatibility while following organization principles.
 */

// Simply require and execute the orchestrator from its new location
require('./startup/orchestrator.js');

// This forwarding file ensures that any scripts still pointing to the root
// orchestrator.js will continue to work as expected.