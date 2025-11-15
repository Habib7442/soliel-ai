import { getCourseAssignments } from './server/actions/instructor.actions';

// Test with the course ID we found in the database
const courseId = 'a15f1434-9cfd-42c4-bdf2-7c0515b8d67b';

async function test() {
  console.log('Testing getCourseAssignments with course ID:', courseId);
  const result = await getCourseAssignments(courseId);
  console.log('Result:', JSON.stringify(result, null, 2));
}

test();