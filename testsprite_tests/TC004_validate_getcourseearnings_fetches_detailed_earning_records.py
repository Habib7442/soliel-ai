import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json"
}

# Use placeholder existing IDs for testing
INSTRUCTOR_ID = "existing-instructor-id"
COURSE_ID = "existing-course-id"


def test_validate_getcourseearnings_fetches_detailed_earning_records():
    """
    Test the getCourseEarnings API to ensure it fetches detailed earning records
    accurately for all courses associated with an instructor.
    Also verify getInstructorAnalytics and getCourseStudents results as per instructions.
    """

    # Step 1: Call getCourseEarnings for the instructor
    r = requests.get(f"{BASE_URL}/instructor/{INSTRUCTOR_ID}/course-earnings", headers=HEADERS, timeout=TIMEOUT)
    r.raise_for_status()
    earnings_data = r.json()
    assert isinstance(earnings_data, dict), "getCourseEarnings response not a dict"
    assert "courses" in earnings_data, "No 'courses' key in getCourseEarnings response"
    # Check structure of each course earning
    for course in earnings_data["courses"]:
        assert "course_id" in course, "course missing course_id"
        assert "earnings" in course and isinstance(course["earnings"], (int, float)), "course earnings missing or invalid"

    # Step 2: Call getInstructorAnalytics to validate totals & revenue
    r = requests.get(f"{BASE_URL}/instructor/{INSTRUCTOR_ID}/analytics", headers=HEADERS, timeout=TIMEOUT)
    r.raise_for_status()
    analytics_data = r.json()
    assert isinstance(analytics_data, dict), "getInstructorAnalytics response not a dict"
    assert "total_students" in analytics_data and isinstance(analytics_data["total_students"], int)
    assert "total_revenue" in analytics_data and (isinstance(analytics_data["total_revenue"], (int, float)))
    assert "average_ratings" in analytics_data and (isinstance(analytics_data["average_ratings"], (int, float)) or analytics_data["average_ratings"] is None)

    # Step 3: Call getCourseStudents for the created course
    r = requests.get(f"{BASE_URL}/course/{COURSE_ID}/students", headers=HEADERS, timeout=TIMEOUT)
    r.raise_for_status()
    students_data = r.json()
    assert isinstance(students_data, list), "getCourseStudents response not a list"
    for student in students_data:
        assert "full_name" in student and isinstance(student["full_name"], str) and student["full_name"], "Student missing full_name"
        assert "email" in student and isinstance(student["email"], str) and student["email"], "Student missing email"
        # progress is optional but if present must be int or float or None
        if "progress" in student:
            assert (isinstance(student["progress"], (int, float)) or student["progress"] is None), "Invalid progress value"


test_validate_getcourseearnings_fetches_detailed_earning_records()
