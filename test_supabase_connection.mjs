// Test Supabase connection
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wkqqxvogcirdpcoavcvh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrcXF4dm9nY2lyZHBjb2F2Y3ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MzU5NTgsImV4cCI6MjA3NDAxMTk1OH0.4qiM3bz6U_NAr6OxIw9rZuA2Uk7xF9tqPapruKV8dX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test 1: Check if we can connect
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Connection failed:', error);
      return;
    }
    
    console.log('✅ Database connection successful!');
    console.log('✅ Found', data.length, 'test(s)');
    
    // Test 2: Check subjects
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*')
      .limit(1);
    
    if (subjectsError) {
      console.error('Subjects query failed:', subjectsError);
      return;
    }
    
    console.log('✅ Found', subjects.length, 'subject(s)');
    console.log('🎉 Database setup is working correctly!');
    
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testConnection();
