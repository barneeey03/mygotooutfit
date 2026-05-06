import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';

/**
 * One-time setup function to create admin user
 * Run this once in the browser console or call it from a setup page
 */
export async function setupAdminUser() {
  try {
    const adminEmail = 'admin@mygotooutfit.com';
    const adminPassword = 'password123';

    console.log('Starting admin user creation...');
    console.log('Email:', adminEmail);
    console.log('Auth instance:', auth);

    // Create admin user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      adminEmail,
      adminPassword
    );

    console.log('User created, updating profile...');

    // Update profile with display name
    await updateProfile(userCredential.user, {
      displayName: 'Admin User',
    });

    console.log('Admin user created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('User ID:', userCredential.user.uid);

    return userCredential.user;
  } catch (error: any) {
    console.error('Full error object:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('Admin user already exists. You can now login with:');
      console.log('Email: admin@mygotooutfit.com');
      console.log('Password: password123');
    } else {
      console.error('Error creating admin user:', error.message);
      throw error;
    }
  }
}
