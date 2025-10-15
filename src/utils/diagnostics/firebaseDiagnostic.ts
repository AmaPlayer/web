/**
 * Firebase Diagnostic Utility
 * 
 * Helps diagnose Firebase configuration and connection issues
 */

import { auth } from '../../lib/firebase';
import { signInAnonymously, signOut } from 'firebase/auth';

export interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export class FirebaseDiagnostic {
  static async runAllTests(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    // Test 1: Configuration Check
    results.push(this.testConfiguration());

    // Test 2: Network Connectivity
    results.push(await this.testNetworkConnectivity());

    // Test 3: Anonymous Authentication
    results.push(await this.testAnonymousAuth());

    // Test 4: Email/Password Method Availability
    results.push(await this.testEmailPasswordMethod());

    return results;
  }

  static testConfiguration(): DiagnosticResult {
    try {
      const config = auth.app.options;
      
      const requiredFields = ['apiKey', 'authDomain', 'projectId'];
      const missingFields = requiredFields.filter(field => !config[field]);

      if (missingFields.length > 0) {
        return {
          test: 'Configuration Check',
          status: 'fail',
          message: `Missing required configuration: ${missingFields.join(', ')}`,
          details: config
        };
      }

      // Check if API key looks valid
      if (!config.apiKey?.startsWith('AIza')) {
        return {
          test: 'Configuration Check',
          status: 'warning',
          message: 'API key format may be incorrect',
          details: { apiKeyPrefix: config.apiKey?.substring(0, 4) }
        };
      }

      return {
        test: 'Configuration Check',
        status: 'pass',
        message: 'Firebase configuration is valid',
        details: {
          projectId: config.projectId,
          authDomain: config.authDomain,
          hasApiKey: !!config.apiKey
        }
      };
    } catch (error) {
      return {
        test: 'Configuration Check',
        status: 'fail',
        message: 'Failed to read Firebase configuration',
        details: error
      };
    }
  }

  static async testNetworkConnectivity(): Promise<DiagnosticResult> {
    try {
      const response = await fetch('https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=' + auth.app.options.apiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        return {
          test: 'Network Connectivity',
          status: 'pass',
          message: 'Successfully connected to Firebase Auth API'
        };
      } else {
        return {
          test: 'Network Connectivity',
          status: 'fail',
          message: `Firebase API returned ${response.status}: ${response.statusText}`,
          details: { status: response.status, statusText: response.statusText }
        };
      }
    } catch (error: any) {
      return {
        test: 'Network Connectivity',
        status: 'fail',
        message: 'Failed to connect to Firebase Auth API',
        details: error.message
      };
    }
  }

  static async testAnonymousAuth(): Promise<DiagnosticResult> {
    try {
      const userCredential = await signInAnonymously(auth);
      
      // Clean up - sign out the anonymous user
      await signOut(auth);

      return {
        test: 'Anonymous Authentication',
        status: 'pass',
        message: 'Anonymous authentication is working',
        details: { uid: userCredential.user.uid }
      };
    } catch (error: any) {
      return {
        test: 'Anonymous Authentication',
        status: 'fail',
        message: 'Anonymous authentication failed',
        details: { code: error.code, message: error.message }
      };
    }
  }

  static async testEmailPasswordMethod(): Promise<DiagnosticResult> {
    try {
      // Try to get the sign-in methods for a test email
      // This will fail if email/password is not enabled
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${auth.app.options.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: 'test@example.com',
          continueUri: window.location.origin
        })
      });

      const data = await response.json();

      if (response.ok) {
        return {
          test: 'Email/Password Method',
          status: 'pass',
          message: 'Email/password authentication is available',
          details: data
        };
      } else {
        return {
          test: 'Email/Password Method',
          status: 'fail',
          message: 'Email/password authentication may not be enabled',
          details: data
        };
      }
    } catch (error: any) {
      return {
        test: 'Email/Password Method',
        status: 'warning',
        message: 'Could not verify email/password method availability',
        details: error.message
      };
    }
  }

  static logResults(results: DiagnosticResult[]): void {
    console.log('🔥 Firebase Diagnostic Results:');
    console.log('================================');
    
    results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      console.log(`${icon} ${result.test}: ${result.message}`);
      
      if (result.details) {
        console.log('   Details:', result.details);
      }
    });
    
    const failedTests = results.filter(r => r.status === 'fail');
    if (failedTests.length > 0) {
      console.log(`\n❌ ${failedTests.length} test(s) failed. Please check your Firebase configuration.`);
    } else {
      console.log('\n✅ All diagnostic tests passed!');
    }
  }
}

// Export a simple function to run diagnostics
export const runFirebaseDiagnostics = async (): Promise<void> => {
  const results = await FirebaseDiagnostic.runAllTests();
  FirebaseDiagnostic.logResults(results);
};