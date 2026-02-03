import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json",
    # Include authentication token here if required, e.g.,
    # "Authorization": "Bearer <token>"
}

def test_check_getinstructorcourses_lists_all_courses_by_instructor():
    # Step 1: Create a new instructor (assuming API exists to create an instructor)
    # If no creation endpoint for instructor is provided, assuming instructor_id = 1 for test
    instructor_id = None
    created_course_ids = []

    try:
        # Create a test instructor - here we assume an endpoint /instructors POST to create instructor
        # If not specified, we use a hardcoded instructor_id or the first existing instructor
        resp = requests.get(f"{BASE_URL}/instructors", headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        instructors = resp.json()
        if not instructors or not isinstance(instructors, list):
            raise AssertionError("No instructors found to run test.")
        instructor_id = instructors[0]["id"]

        # Step 2: Create multiple courses for the instructor for the test
        # Assuming POST /courses to create course with payload including instructor_id
        course_payloads = [
            {"title": "Test Course 1", "description": "Desc 1", "instructor_id": instructor_id},
            {"title": "Test Course 2", "description": "Desc 2", "instructor_id": instructor_id},
        ]
        for course_payload in course_payloads:
            create_course_resp = requests.post(f"{BASE_URL}/courses", json=course_payload, headers=HEADERS, timeout=TIMEOUT)
            create_course_resp.raise_for_status()
            created_course = create_course_resp.json()
            created_course_ids.append(created_course["id"])

        # Step 3: Call getInstructorCourses API for this instructor
        # Assuming GET /instructors/{instructor_id}/courses
        response = requests.get(f"{BASE_URL}/instructors/{instructor_id}/courses", headers=HEADERS, timeout=TIMEOUT)
        response.raise_for_status()
        courses = response.json()

        assert isinstance(courses, list), "Response should be a list of courses"
        # Assert at least the created courses are present in the result
        returned_course_ids = {course.get("id") for course in courses}
        for created_id in created_course_ids:
            assert created_id in returned_course_ids, f"Course id {created_id} should be in instructor's courses list"

        # Additional: For each course, verify getCourseStudents returns profile data and progress
        for course in courses:
            course_id = course.get("id")
            if not course_id:
                continue
            students_resp = requests.get(f"{BASE_URL}/courses/{course_id}/students", headers=HEADERS, timeout=TIMEOUT)
            students_resp.raise_for_status()
            students = students_resp.json()
            assert isinstance(students, list), "Students response should be a list"
            for student in students:
                profile = student.get("profile") or student.get("student") or student.get("user") or student
                # Check for full_name and email in profile
                full_name = profile.get("full_name")
                email = profile.get("email")
                assert isinstance(full_name, str) and full_name.strip(), "Student full_name must be a non-empty string"
                assert isinstance(email, str) and "@" in email, "Student email must be a valid email string"

                # Progress may be missing; if present check its type
                progress = student.get("progress", None)
                if progress is not None:
                    assert isinstance(progress, (int, float)), "Progress should be numeric if present"

    finally:
        # Cleanup: delete created courses
        for course_id in created_course_ids:
            try:
                requests.delete(f"{BASE_URL}/courses/{course_id}", headers=HEADERS, timeout=TIMEOUT)
            except Exception:
                pass


test_check_getinstructorcourses_lists_all_courses_by_instructor()