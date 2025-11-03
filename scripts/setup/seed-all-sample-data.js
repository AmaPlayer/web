/**
 * Seed All Sample Data Script
 *
 * This script seeds both sample events and leaderboard data in the correct order.
 * This is the easiest way to populate your database with demo data.
 *
 * Usage: node scripts/setup/seed-all-sample-data.js [--events=10] [--users=20] [--clear]
 *
 * Options:
 *   --events     Number of sample events to create (default: 10)
 *   --users      Number of sample users for leaderboard (default: 20)
 *   --clear      Clear existing sample data before seeding
 */

const { spawn } = require('child_process');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const eventsArg = args.find(arg => arg.startsWith('--events='));
const usersArg = args.find(arg => arg.startsWith('--users='));
const eventCount = eventsArg ? eventsArg.split('=')[1] : '10';
const userCount = usersArg ? usersArg.split('=')[1] : '20';
const shouldClear = args.includes('--clear');

console.log('🚀 Starting Full Sample Data Seeding\n');
console.log('='.repeat(60));
console.log(`Configuration:`);
console.log(`  Events to create: ${eventCount}`);
console.log(`  Users to create: ${userCount}`);
console.log(`  Clear existing data: ${shouldClear ? 'Yes' : 'No'}`);
console.log('='.repeat(60) + '\n');

// Run a script and return a promise
function runScript(scriptName, args) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, scriptName);
    const child = spawn('node', [scriptPath, ...args], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '../..')
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Script ${scriptName} failed with code ${code}`));
      } else {
        resolve();
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Main execution
async function seedAll() {
  try {
    // Step 1: Seed events
    console.log('📅 Step 1/2: Seeding sample events...\n');
    const eventArgs = [`--count=${eventCount}`];
    if (shouldClear) eventArgs.push('--clear');
    await runScript('seed-sample-events.js', eventArgs);

    console.log('\n');

    // Step 2: Seed leaderboard
    console.log('🏆 Step 2/2: Seeding leaderboard data...\n');
    const leaderboardArgs = [`--count=${userCount}`];
    if (shouldClear) leaderboardArgs.push('--clear');
    await runScript('seed-sample-leaderboard.js', leaderboardArgs);

    console.log('\n');
    console.log('='.repeat(60));
    console.log('\n✅ All sample data seeded successfully!\n');
    console.log('🎉 Your database is now populated with:');
    console.log(`   • ${eventCount} sample events`);
    console.log(`   • ${userCount} sample users with rankings`);
    console.log(`   • Multiple leaderboards (engagement, participation, achievements)`);
    console.log('\n📝 What to do next:');
    console.log('1. Open your application and navigate to the Events page');
    console.log('2. You should see sample events in the list');
    console.log('3. Leaderboard should show top performers');
    console.log('4. Explore different event categories and filters\n');
    console.log('💡 Tip: You can run this script again with --clear to refresh all data');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error('\nPlease check the error above and try again.');
    process.exit(1);
  }
}

// Run
seedAll();
