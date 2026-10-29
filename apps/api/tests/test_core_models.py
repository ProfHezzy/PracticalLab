from core.models import (
    AnalyticsEvent,
    Assignment,
    Attempt,
    AttemptEvent,
    BlockRecord,
    ClassInvite,
    ClassMember,
    ClassModel,
    Connection,
    ContentVersion,
    Course,
    Experiment,
    ExperimentAsset,
    Grade,
    Lab,
    Lesson,
    Level,
    Rubric,
    SchemeOfWork,
    Subject,
    Submission,
    Topic,
    UserProfile,
)
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase


class CoreModelTests(TestCase):
    def setUp(self):
        self.teacher = get_user_model().objects.create_user(
            username="teacher-one", password="secret"
        )
        self.student = get_user_model().objects.create_user(
            username="student-one", password="secret"
        )
        self.subject = Subject.objects.create(name="Chemistry", code="chem")
        self.level = Level.objects.create(stage="SS2")
        self.course = Course.objects.create(
            subject=self.subject, level=self.level, title="Separation techniques"
        )
        self.scheme = SchemeOfWork.objects.create(
            course=self.course, term="First", title="Practical skills"
        )
        self.topic = Topic.objects.create(scheme=self.scheme, title="Filtration", order=1)
        self.lesson = Lesson.objects.create(
            topic=self.topic,
            title="How filtration works",
            content="Filter a mixture to separate solids from liquids.",
            estimated_minutes=15,
            status="published",
        )
        self.experiment = Experiment.objects.create(
            subject=self.subject,
            topic=self.topic,
            title="Filtration experiment",
            slug="filtration-experiment",
            summary="Separate sand and water.",
            created_by=self.teacher,
        )
        self.version = ContentVersion.objects.create(
            experiment=self.experiment,
            version="1.0.0",
            status="published",
            changelog="Initial release",
            created_by=self.teacher,
        )
        self.asset = ExperimentAsset.objects.create(
            experiment=self.experiment,
            kind="image",
            file_url="https://example.com/filtration.png",
            mime_type="image/png",
            size_bytes=1234,
            checksum="abc123",
        )

    def test_user_profile_and_teacher_verification_are_recorded(self):
        profile = UserProfile.objects.create(
            user=self.student,
            account_type=UserProfile.ACCOUNT_TYPE_STUDENT,
            is_verified_teacher=False,
        )

        self.assertEqual(profile.user.username, "student-one")
        self.assertFalse(profile.is_verified_teacher)

    def test_connection_uniqueness_is_enforced(self):
        Connection.objects.create(
            requester=self.student,
            receiver=self.teacher,
            kind=Connection.KIND_FRIEND,
            status=Connection.STATUS_ACCEPTED,
        )

        with self.assertRaises(IntegrityError):
            Connection.objects.create(
                requester=self.student,
                receiver=self.teacher,
                kind=Connection.KIND_FRIEND,
                status=Connection.STATUS_PENDING,
            )

    def test_curriculum_and_content_can_be_linked(self):
        self.assertEqual(self.course.subject.name, "Chemistry")
        self.assertEqual(self.lesson.topic.title, "Filtration")
        self.assertEqual(self.version.experiment.title, "Filtration experiment")
        self.assertEqual(self.asset.experiment.slug, "filtration-experiment")

    def test_class_members_and_invites_follow_expected_constraints(self):
        school_class = ClassModel.objects.create(
            teacher=self.teacher,
            name="SS2 Chemistry",
            code="CHEM-101",
        )
        ClassMember.objects.create(school_class=school_class, student=self.student, status="active")
        invite = ClassInvite.objects.create(school_class=school_class, code="invite-abc-123")

        self.assertTrue(school_class.members.filter(student=self.student).exists())
        self.assertEqual(invite.school_class.name, "SS2 Chemistry")

    def test_assignment_submission_attempt_and_grade_flow(self):
        lab = Lab.objects.create(owner=self.student, title="Filtration lab", is_default=True)
        assignment = Assignment.objects.create(
            created_by=self.teacher,
            experiment=self.experiment,
            title="Filtration practical",
            instructions="Filter the sand-water mixture.",
            status="published",
        )
        Rubric.objects.create(
            assignment=assignment, total_points=100, description="60 points for correct steps"
        )

        submission = Submission.objects.create(
            assignment=assignment,
            student=self.student,
            lab=lab,
            status="submitted",
        )
        attempt = Attempt.objects.create(submission=submission, status="completed", score=88)
        AttemptEvent.objects.create(
            attempt=attempt, sequence=1, event_type="action", payload={"action": "pour"}
        )
        AttemptEvent.objects.create(
            attempt=attempt, sequence=2, event_type="outcome", payload={"result": "success"}
        )
        Grade.objects.create(
            submission=submission,
            points=88,
            grade="B",
            feedback="Good filtration setup.",
            awarded_by=self.teacher,
        )

        self.assertEqual(submission.grade.points, 88)
        self.assertEqual(attempt.events.count(), 2)
        self.assertEqual(attempt.events.first().sequence, 1)

    def test_moderation_and_metrics_events_are_storable(self):
        block = BlockRecord.objects.create(
            blocker=self.teacher,
            blocked_user=self.student,
            reason="Unsafe behavior",
        )
        moderation = self.student.moderation_cases.create(
            reported_by=self.teacher,
            reason="Harassment",
            details="Repeated unwanted contact",
        )
        event = AnalyticsEvent.objects.create(
            user=self.student, event_name="lesson_started", payload={"topic": "filtration"}
        )

        self.assertTrue(block.is_active)
        self.assertEqual(moderation.status, "open")
        self.assertEqual(event.event_name, "lesson_started")
