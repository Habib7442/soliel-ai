import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_verify_getinstructoranalytics_returns_correct_metrics():
    # Step 1: Create an instructor to test with
    instructor_data = {
        "full_name": "Test Instructor",
        "email": "testinstructor@example.com",
        "password": "TestPass123!",
        "role": "instructor"
    }
    headers = {"Content-Type": "application/json"}
    instructor_id = None
    course_id = None
    try:
        # Create instructor user
        resp = requests.post(f"{BASE_URL}/users", json=instructor_data, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 201, f"Failed to create instructor: {resp.text}"
        instructor_id = resp.json().get("id")
        assert instructor_id, "Instructor ID is missing in create response"

        # Create a course for this instructor
        course_data = {
            "title": "Test Course",
            "description": "Course for analytics test",
            "instructor_id": instructor_id
        }
        resp = requests.post(f"{BASE_URL}/courses", json=course_data, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 201, f"Failed to create course: {resp.text}"
        course_id = resp.json().get("id")
        assert course_id, "Course ID is missing in create response"

        # Enroll some students (with real profile data and progress)
        students = [
            {"full_name": "Student One", "email": "student1@example.com", "password": "Pwd12345!"},
            {"full_name": "Student Two", "email": "student2@example.com", "password": "Pwd12345!"}
        ]
        student_ids = []
        for student in students:
            resp = requests.post(f"{BASE_URL}/students", json=student, headers=headers, timeout=TIMEOUT)
            assert resp.status_code == 201, f"Failed to create student: {resp.text}"
            student_id = resp.json().get("id")
            assert student_id, "Student ID missing in create response"
            student_ids.append(student_id)

            # Enroll student in course
            enroll_payload = {"course_id": course_id, "student_id": student_id}
            resp = requests.post(f"{BASE_URL}/enrollments", json=enroll_payload, headers=headers, timeout=TIMEOUT)
            assert resp.status_code == 201, f"Failed to enroll student: {resp.text}"

            # Submit progress data for student in course
            progress_payload = {"course_id": course_id, "student_id": student_id, "progress": 50 + 10*student_ids.index(student_id)}
            resp = requests.post(f"{BASE_URL}/progress", json=progress_payload, headers=headers, timeout=TIMEOUT)
            assert resp.status_code == 200, f"Failed to submit progress: {resp.text}"

            # Submit rating for course
            rating_payload = {"course_id": course_id, "student_id": student_id, "rating": 4.0 + student_ids.index(student_id)}
            resp = requests.post(f"{BASE_URL}/ratings", json=rating_payload, headers=headers, timeout=TIMEOUT)
            assert resp.status_code == 201, f"Failed to submit rating: {resp.text}"

        # Record payments - simulating succeeded payments for the instructor's course(s)
        payments = [
            {"instructor_id": instructor_id, "amount": 100.0, "status": "succeeded"},
            {"instructor_id": instructor_id, "amount": 150.0, "status": "succeeded"},
            {"instructor_id": instructor_id, "amount": 75.0, "status": "failed"}  # should not count
        ]
        for payment in payments:
            resp = requests.post(f"{BASE_URL}/payments", json=payment, headers=headers, timeout=TIMEOUT)
            assert resp.status_code == 201, f"Failed to record payment: {resp.text}"

        # Call getInstructorAnalytics API
        resp = requests.get(f"{BASE_URL}/instructors/{instructor_id}/analytics", timeout=TIMEOUT)
        assert resp.status_code == 200, f"Analytics API failed: {resp.text}"
        analytics_data = resp.json()

        # Validate total students count
        expected_total_students = len(student_ids)
        assert analytics_data.get("total_students") == expected_total_students, \
            f"Expected total_students={expected_total_students}, got {analytics_data.get('total_students')}"

        # Validate total revenue from succeeded payments
        expected_revenue = sum(p["amount"] for p in payments if p["status"] == "succeeded")
        assert abs(analytics_data.get("total_revenue", 0) - expected_revenue) < 0.01, \
            f"Expected total_revenue={expected_revenue}, got {analytics_data.get('total_revenue')}"

        # Validate average rating
        expected_avg_rating = sum(4.0 + idx for idx in range(len(student_ids))) / len(student_ids)
        avg_rating = analytics_data.get("average_rating")
        assert avg_rating is not None and abs(avg_rating - expected_avg_rating) < 0.01, \
            f"Expected average_rating={expected_avg_rating}, got {avg_rating}"

        # Now test getCourseStudents API for our course
        resp = requests.get(f"{BASE_URL}/courses/{course_id}/students", timeout=TIMEOUT)
        assert resp.status_code == 200, f"getCourseStudents API failed: {resp.text}"
        students_data = resp.json()
        assert isinstance(students_data, list) and len(students_data) == expected_total_students, \
            f"Expected {expected_total_students} students, got {len(students_data)}"

        # Validate each student's profile data and progress (graceful progress handling)
        for sdata in students_data:
            assert "full_name" in sdata and sdata["full_name"], "Missing full_name in student data"
            assert "email" in sdata and sdata["email"], "Missing email in student data"
            # progress may be missing or None, ensure no error
            progress = sdata.get("progress")
            assert (progress is None) or (0 <= progress <= 100), f"Invalid progress value: {progress}"

    finally:
        # Cleanup: delete created resources
        if course_id:
            requests.delete(f"{BASE_URL}/courses/{course_id}", timeout=TIMEOUT)
        if instructor_id:
            requests.delete(f"{BASE_URL}/users/{instructor_id}", timeout=TIMEOUT)
        # Deleting created students
        if 'student_ids' in locals():
            for sid in student_ids:
                requests.delete(f"{BASE_URL}/students/{sid}", timeout=TIMEOUT)

test_verify_getinstructoranalytics_returns_correct_metrics()
