// This file is kept for reference but we're using Firebase directly in the server.js file
// The user schema in Firebase will have the following structure:

/*
users/
  {userId}/
    fullName: string
    email: string
    phone: string
    password: string (hashed)
    role: string (user, police, admin)
    createdAt: timestamp
    documents/
      aadhar/
        name: string
        dob: string
        gender: string
        aadharNumber: string
        vid: string
        issueDate: string
        verified: boolean
        verificationDate: timestamp
*/

// Firebase functions for user operations
export const createUser = async (userData) => {
  const db = admin.firestore();
  const userRef = db.collection('users').doc();
  await userRef.set({
    ...userData,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return userRef.id;
};

export const getUserById = async (userId) => {
  const db = admin.firestore();
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    return null;
  }
  return { id: userDoc.id, ...userDoc.data() };
};

export const updateUser = async (userId, userData) => {
  const db = admin.firestore();
  await db.collection('users').doc(userId).update(userData);
  return true;
};

export const deleteUser = async (userId) => {
  const db = admin.firestore();
  await db.collection('users').doc(userId).delete();
  return true;
}; 