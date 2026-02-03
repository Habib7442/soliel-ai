import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json",
    # Add authentication header if required, e.g.
    # "Authorization": "Bearer <token>",
}

def test_verify_getstudentenrollments_returns_recent_enrollments():
    instructor_id = None
    created_course_ids = []
    created_enrollment_ids = []
    try:
        # Step 1: Create a new instructor for testing (assuming API supports this)
        # If no instructor creation API, use a predefined test instructor ID here
        # For this example, we assume a test instructor already exists with ID 'test_instructor_1'
        instructor_id = "test_instructor_1"

        # Step 2: Get courses of the instructor via getInstructorCourses
        response = requests.get(f"{BASE_URL}/instructor/{instructor_id}/courses", headers=HEADERS, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        courses = response.json()
        assert isinstance(courses, list), "Courses response is not a list"

        # If no courses found, create one for testing
        if not courses:
            course_payload = {
                "title": "Test Course for Enrollment",
                "description": "Course created for testing student enrollments",
                "instructor_id": instructor_id
            }
            create_course_resp = requests.post(f"{BASE_URL}/courses", json=course_payload, headers=HEADERS, timeout=TIMEOUT)
            assert create_course_resp.status_code == 201, f"Expected 201, got {create_course_resp.status_code}"
            created_course = create_course_resp.json()
            course_id = created_course.get("id")
            assert course_id, "Created course ID missing"
            created_course_ids.append(course_id)
            courses = [created_course]
        else:
            course_id = courses[0].get("id")

        # Step 3: For the course(s), ensure there are at least some enrollments
        # Make enrollments for testing if needed
        # For simplicity, create up to 10 enrollments if less than 10
        response_enrollments = requests.get(f"{BASE_URL}/courses/{course_id}/enrollments", headers=HEADERS, timeout=TIMEOUT)
        assert response_enrollments.status_code == 200, "Failed to fetch enrollments"
        enrollments = response_enrollments.json()
        if not isinstance(enrollments, list):
            enrollments = []

        enrollments_needed = 10 - len(enrollments)
        for _ in range(enrollments_needed):
            enrollment_payload = {
                "course_id": course_id,
                "student_profile": {
                    "full_name": "Test Student",
                    "email": "teststudent@example.com"
                }
            }
            create_enrollment_resp = requests.post(f"{BASE_URL}/enrollments", json=enrollment_payload, headers=HEADERS, timeout=TIMEOUT)
            assert create_enrollment_resp.status_code == 201, f"Enrollment create failed with {create_enrollment_resp.status_code}"
            created_enrollment = create_enrollment_resp.json()
            enrollment_id = created_enrollment.get("id")
            assert enrollment_id, "Enrollment id missing in created enrollment"
            created_enrollment_ids.append(enrollment_id)

        # Step 4: Call getStudentEnrollments API for the instructor
        resp = requests.get(f"{BASE_URL}/instructor/{instructor_id}/studentEnrollments?limit=10", headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        student_enrollments = resp.json()
        assert isinstance(student_enrollments, list), "Response is not a list"

        # Validate number of enrollments returned is <= 10
        assert len(student_enrollments) <= 10, f"Returned more than 10 enrollments: {len(student_enrollments)}"

        # Validate each enrollment contains course info belonging to the instructor's courses
        instructor_course_ids = {c.get("id") for c in courses if c.get("id")}
        for enrollment in student_enrollments:
            # Validate course belongs to instructor courses
            course = enrollment.get("course")
            assert course and course.get("id") in instructor_course_ids, "Enrollment course not belonging to instructor"

            # Validate student profile data exists
            student = enrollment.get("student_profile")
            assert student, "Missing student_profile in enrollment"
            assert "full_name" in student and isinstance(student["full_name"], str) and student["full_name"], "Invalid or missing full_name"
            assert "email" in student and isinstance(student["email"], str) and student["email"], "Invalid or missing email"

            # Validate progress if present, or handle if missing
            progress = enrollment.get("progress")
            if progress is not None:
                assert isinstance(progress, (int, float)), "Progress should be a number if present"
                assert 0 <= progress <= 100, "Progress should be between 0 and 100"

    finally:
        # Cleanup created enrollments
        for eid in created_enrollment_ids:
            try:
                requests.delete(f"{BASE_URL}/enrollments/{eid}", headers=HEADERS, timeout=TIMEOUT)
            except Exception:
                pass
        # Cleanup created courses
        for cid in created_course_ids:
            try:
                requests.delete(f"{BASE_URL}/courses/{cid}", headers=HEADERS, timeout=TIMEOUT)
            except Exception:
                pass

test_verify_getstudentenrollments_returns_recent_enrollments()