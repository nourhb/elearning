// Mock Firebase Admin SDK for static export
console.log('🔧 Using mock Firebase Admin SDK for static export');

const mockFirebaseAdmin = {
  initializeApp: () => {
    console.log('🔧 Mock Firebase Admin initialized');
    return {
      firestore: () => ({
        collection: () => ({
          doc: () => ({
            get: () => Promise.resolve({ data: () => ({}) }),
            set: () => Promise.resolve(),
            update: () => Promise.resolve(),
            delete: () => Promise.resolve()
          }),
          add: () => Promise.resolve({ id: 'mock-id' }),
          where: () => ({
            get: () => Promise.resolve({ docs: [] })
          }),
          get: () => Promise.resolve({ docs: [] })
        })
      }),
      auth: () => ({
        verifyIdToken: () => Promise.resolve({ uid: 'mock-uid' }),
        createCustomToken: () => Promise.resolve('mock-token'),
        setCustomUserClaims: () => Promise.resolve()
      }),
      storage: () => ({
        bucket: () => ({
          file: () => ({
            save: () => Promise.resolve(),
            getSignedUrl: () => Promise.resolve(['mock-url'])
          })
        })
      })
    };
  }
};

// Mock Firebase client SDK
const mockFirebase = {
  initializeApp: () => {
    console.log('🔧 Mock Firebase client initialized');
    return {
      auth: () => ({
        signInWithEmailAndPassword: () => Promise.resolve({ user: { uid: 'mock-uid' } }),
        createUserWithEmailAndPassword: () => Promise.resolve({ user: { uid: 'mock-uid' } }),
        signOut: () => Promise.resolve(),
        onAuthStateChanged: (callback) => {
          callback(null);
          return () => {};
        }
      }),
      firestore: () => ({
        collection: () => ({
          doc: () => ({
            get: () => Promise.resolve({ data: () => ({}) }),
            set: () => Promise.resolve(),
            update: () => Promise.resolve(),
            delete: () => Promise.resolve()
          }),
          add: () => Promise.resolve({ id: 'mock-id' }),
          where: () => ({
            get: () => Promise.resolve({ docs: [] })
          }),
          get: () => Promise.resolve({ docs: [] })
        })
      }),
      storage: () => ({
        ref: () => ({
          put: () => Promise.resolve({ ref: { getDownloadURL: () => Promise.resolve('mock-url') } })
        })
      })
    };
  }
};

module.exports = {
  mockFirebaseAdmin,
  mockFirebase
};
