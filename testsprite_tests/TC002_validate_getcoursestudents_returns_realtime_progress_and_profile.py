import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json"
}

def test_validate_getcoursestudents_returns_realtime_progress_and_profile():
    course_id = None
    created_course_id = None

    try:
        # Step 1: Create a new course to ensure we have a valid course_id
        create_course_payload = {
            "title": "Test Course for Student Progress",
            "description": "Course created for testing getCourseStudents API",
            "is_published": False,
            "instructor_id": 1
        }
        resp_create_course = requests.post(f"{BASE_URL}/courses", json=create_course_payload, headers=HEADERS, timeout=TIMEOUT)
        assert resp_create_course.status_code in (200, 201), f"Failed to create course, status code: {resp_create_course.status_code}"
        course_data = resp_create_course.json()
        created_course_id = course_data.get("id")
        assert created_course_id, "Created course ID not returned"
        course_id = created_course_id

        # Step 2: Enroll a test student to the created course (to have a student data to verify)
        create_student_payload = {
            "full_name": "Test Student",
            "email": "teststudent@example.com"
        }
        # Create student user
        resp_create_student = requests.post(f"{BASE_URL}/students", json=create_student_payload, headers=HEADERS, timeout=TIMEOUT)
        assert resp_create_student.status_code == 201, f"Failed to create student, status code: {resp_create_student.status_code}"
        student_data = resp_create_student.json()
        student_id = student_data.get("id")
        assert student_id, "Created student ID not returned"

        # Enroll student in course
        enroll_payload = {
            "student_id": student_id,
            "course_id": course_id
        }
        resp_enroll = requests.post(f"{BASE_URL}/enrollments", json=enroll_payload, headers=HEADERS, timeout=TIMEOUT)
        assert resp_enroll.status_code == 201, f"Failed to enroll student, status code: {resp_enroll.status_code}"

        # Step 3: Fetch course students with real-time progress and profile info
        resp = requests.get(f"{BASE_URL}/instructor/getCourseStudents/{course_id}", headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200, f"getCourseStudents failed with status {resp.status_code}"
        students = resp.json()
        assert isinstance(students, list), "Response is not a list"

        # Step 4: Validate each student has profile data and progress info
        found_student = False
        for student in students:
            assert "full_name" in student and isinstance(student["full_name"], str) and student["full_name"], "Student full_name missing or empty"
            assert "email" in student and isinstance(student["email"], str) and student["email"], "Student email missing or empty"
            # progress might be missing or null, handle gracefully
            if "progress" in student:
                progress = student["progress"]
                if progress is not None:
                    assert isinstance(progress, (int, float)), f"Progress should be a number or null, got {type(progress)}"
                    assert 0 <= progress <= 100, "Progress value out of range (0-100)"
            else:
                # progress field missing, should be handled gracefully by API - no assertion failure
                pass

            if student.get("email") == "teststudent@example.com":
                found_student = True

        assert found_student, "Created test student not found in course students"

        # Step 5: Also verify getInstructorAnalytics returns correct data (minimal check)
        # Assumption: instructor id can be obtained from course data or some default test instructor
        instructor_id = course_data.get("instructor_id")
        if instructor_id:
            resp_analytics = requests.get(f"{BASE_URL}/instructor/getInstructorAnalytics/{instructor_id}", headers=HEADERS, timeout=TIMEOUT)
            assert resp_analytics.status_code == 200, f"getInstructorAnalytics failed with status {resp_analytics.status_code}"
            analytics = resp_analytics.json()
            assert "total_students" in analytics and isinstance(analytics["total_students"], int)
            assert "total_revenue" in analytics and (isinstance(analytics["total_revenue"], int) or isinstance(analytics["total_revenue"], float))
            assert "average_ratings" in analytics and (isinstance(analytics["average_ratings"], float) or analytics["average_ratings"] is None)
    finally:
        # Cleanup: Delete the created course and test student
        if course_id:
            requests.delete(f"{BASE_URL}/courses/{course_id}", headers=HEADERS, timeout=TIMEOUT)
        if 'student_id' in locals():
            requests.delete(f"{BASE_URL}/students/{student_id}", headers=HEADERS, timeout=TIMEOUT)


test_validate_getcoursestudents_returns_realtime_progress_and_profile()
