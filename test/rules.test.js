import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testEnv;

beforeAll(async () => {
  // Load the rules file
  const rules = readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8');
  
  testEnv = await initializeTestEnvironment({
    projectId: 'ticketz-test',
    firestore: {
      rules,
      host: '127.0.0.1',
      port: 8080
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Venue Rules', () => {
  it('allows create if ownerUid matches auth uid', async () => {
    const db = testEnv.authenticatedContext('user1').firestore();
    const venueRef = db.collection('venues').doc('v1');
    
    await assertSucceeds(venueRef.set({
      name: 'Test Venue',
      ownerUid: 'user1'
    }));
  });

  it('denies create if ownerUid does not match auth uid', async () => {
    const db = testEnv.authenticatedContext('user1').firestore();
    const venueRef = db.collection('venues').doc('v2');
    
    await assertFails(venueRef.set({
      name: 'Test Venue',
      ownerUid: 'user2'
    }));
  });

  it('allows owner to update venue', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection('venues').doc('v3').set({ ownerUid: 'owner1', name: 'Original Name' });
    });

    const db = testEnv.authenticatedContext('owner1').firestore();
    const venueRef = db.collection('venues').doc('v3');
    
    await assertSucceeds(venueRef.update({
      name: 'Updated Name'
    }));
  });

  it('denies non-owner to update venue configuration', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection('venues').doc('v4').set({ ownerUid: 'owner1', name: 'Original Name' });
    });

    const db = testEnv.authenticatedContext('user1').firestore();
    const venueRef = db.collection('venues').doc('v4');
    
    await assertFails(venueRef.update({
      name: 'Hacked Name'
    }));
  });

  it('allows any authenticated user to update counter fields', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection('venues').doc('v5').set({ ownerUid: 'owner1', lastNumber: 1 });
    });

    const db = testEnv.authenticatedContext('user1').firestore();
    const venueRef = db.collection('venues').doc('v5');
    
    await assertSucceeds(venueRef.update({
      lastNumber: 2
    }));
  });
});
