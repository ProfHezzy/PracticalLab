from __future__ import annotations

from django.conf import settings
from django.db import models


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class UserProfile(TimestampedModel):
    ACCOUNT_TYPE_STUDENT = "student"
    ACCOUNT_TYPE_TEACHER = "teacher"
    ACCOUNT_TYPE_CHOICES = [
        (ACCOUNT_TYPE_STUDENT, "Student"),
        (ACCOUNT_TYPE_TEACHER, "Teacher"),
    ]

    MODE_STUDENT = "student"
    MODE_TEACHER = "teacher"
    MODE_CHOICES = [
        (MODE_STUDENT, "Student mode"),
        (MODE_TEACHER, "Teacher mode"),
    ]

    VERIFICATION_STATUS_UNVERIFIED = "unverified"
    VERIFICATION_STATUS_VERIFIED = "verified"
    VERIFICATION_STATUS_CHOICES = [
        (VERIFICATION_STATUS_UNVERIFIED, "Unverified"),
        (VERIFICATION_STATUS_VERIFIED, "Verified"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile"
    )
    account_type = models.CharField(
        max_length=20, choices=ACCOUNT_TYPE_CHOICES, default=ACCOUNT_TYPE_STUDENT
    )
    active_mode = models.CharField(max_length=20, choices=MODE_CHOICES, default=MODE_STUDENT)
    is_verified_teacher = models.BooleanField(default=False)
    country = models.CharField(max_length=64, default="Nigeria")
    bio = models.TextField(blank=True)
    avatar_url = models.URLField(blank=True)
    onboarding_completed = models.BooleanField(default=False)
    # M3 Gate: Email/phone verification
    email_verification_status = models.CharField(
        max_length=20, choices=VERIFICATION_STATUS_CHOICES, default=VERIFICATION_STATUS_UNVERIFIED
    )
    email_verified_at = models.DateTimeField(null=True, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    phone_verification_status = models.CharField(
        max_length=20, choices=VERIFICATION_STATUS_CHOICES, default=VERIFICATION_STATUS_UNVERIFIED
    )
    phone_verified_at = models.DateTimeField(null=True, blank=True)
    # M3 Gate: Age/notice handling for minors
    date_of_birth = models.DateField(null=True, blank=True)
    age_notice_sent_at = models.DateTimeField(null=True, blank=True)
    age_consent_recorded_at = models.DateTimeField(null=True, blank=True)
    # M3 Gate: Recovery contact for minors (guardian/alternative)
    recovery_contact_name = models.CharField(max_length=120, blank=True)
    recovery_contact_email = models.EmailField(blank=True)
    recovery_contact_phone = models.CharField(max_length=30, blank=True)
    recovery_contact_relationship = models.CharField(max_length=50, blank=True)

    class Meta:
        indexes = [models.Index(fields=["account_type", "is_verified_teacher"])]

    def __str__(self) -> str:
        return f"{self.user.username} ({self.account_type})"

    @property
    def is_minor(self) -> bool:
        """Check if user is under 18 based on date_of_birth."""
        if not self.date_of_birth:
            return False
        from datetime import date
        today = date.today()
        age = today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )
        return age < 18

    def has_recovery_contact(self) -> bool:
        """Check if minor has a recovery contact configured."""
        return bool(self.recovery_contact_email or self.recovery_contact_phone)


class StudentProfile(TimestampedModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="student_profile"
    )
    level = models.ForeignKey(
        "Level", on_delete=models.SET_NULL, null=True, blank=True, related_name="students"
    )
    subjects = models.ManyToManyField("Subject", related_name="student_profiles", blank=True)
    target_exam = models.CharField(max_length=50, default="WAEC", blank=True)
    avatar_preset = models.CharField(max_length=50, default="avatar_default", blank=True)
    is_private = models.BooleanField(default=True)

    def __str__(self) -> str:
        return f"Student: {self.user.username}"


class TeacherProfile(TimestampedModel):
    STATUS_UNVERIFIED = "unverified"
    STATUS_PENDING = "pending"
    STATUS_VERIFIED = "verified"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = [
        (STATUS_UNVERIFIED, "Unverified"),
        (STATUS_PENDING, "Pending verification"),
        (STATUS_VERIFIED, "Verified"),
        (STATUS_REJECTED, "Rejected"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="teacher_profile"
    )
    title = models.CharField(max_length=50, default="Teacher", blank=True)
    school_affiliation = models.CharField(max_length=200, blank=True)
    subject_specialization = models.CharField(max_length=200, blank=True)
    years_of_experience = models.PositiveIntegerField(default=0)
    verification_status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_UNVERIFIED
    )
    verified_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f"Teacher: {self.user.username} ({self.verification_status})"


class TeacherVerification(TimestampedModel):
    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]

    teacher = models.ForeignKey(
        TeacherProfile, on_delete=models.CASCADE, related_name="verification_applications"
    )
    id_document_type = models.CharField(max_length=80, blank=True)
    id_reference = models.CharField(max_length=120, blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    rejection_reason = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_verifications",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f"Verification for {self.teacher.user.username} ({self.status})"


class PolicyAcceptance(TimestampedModel):
    POLICY_TERMS = "terms"
    POLICY_PRIVACY = "privacy"
    POLICY_CHOICES = [
        (POLICY_TERMS, "Terms of Service"),
        (POLICY_PRIVACY, "Privacy Policy"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="policy_acceptances"
    )
    policy_type = models.CharField(max_length=50, choices=POLICY_CHOICES)
    version = models.CharField(max_length=20, default="1.0")
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "policy_type", "version"],
                name="uniq_user_policy_version",
            )
        ]

    def __str__(self) -> str:
        return f"{self.user.username} accepted {self.policy_type} v{self.version}"


class UserPreference(TimestampedModel):
    THEME_LIGHT = "light"
    THEME_DARK = "dark"
    THEME_SYSTEM = "system"
    THEME_CHOICES = [
        (THEME_LIGHT, "Light"),
        (THEME_DARK, "Dark"),
        (THEME_SYSTEM, "System"),
    ]

    VISIBILITY_PRIVATE = "private"
    VISIBILITY_CONNECTIONS = "connections"
    VISIBILITY_CHOICES = [
        (VISIBILITY_PRIVATE, "Private (Default)"),
        (VISIBILITY_CONNECTIONS, "Connections only"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="preferences"
    )
    theme = models.CharField(max_length=20, choices=THEME_CHOICES, default=THEME_SYSTEM)
    reduced_motion = models.BooleanField(default=False)
    high_contrast = models.BooleanField(default=False)
    email_notifications = models.BooleanField(default=True)
    profile_visibility = models.CharField(
        max_length=20, choices=VISIBILITY_CHOICES, default=VISIBILITY_PRIVATE
    )

    def __str__(self) -> str:
        return f"Preferences for {self.user.username}"


class Permission(TimestampedModel):
    code = models.SlugField(max_length=80, unique=True)
    description = models.TextField(blank=True)

    def __str__(self) -> str:
        return self.code


class StaffRole(TimestampedModel):
    name = models.CharField(max_length=80, unique=True)
    permissions = models.ManyToManyField(Permission, related_name="roles", blank=True)

    def __str__(self) -> str:
        return self.name


class StaffMember(TimestampedModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="staff_member"
    )
    role = models.ForeignKey(StaffRole, on_delete=models.PROTECT, related_name="members")
    is_active = models.BooleanField(default=True)
    mfa_secret = models.CharField(max_length=255, blank=True)
    mfa_enrolled_at = models.DateTimeField(null=True, blank=True)
    last_mfa_verified_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f"{self.user.username} ({self.role})"

    @property
    def mfa_is_enrolled(self) -> bool:
        return self.mfa_enrolled_at is not None


class StaffInvitation(TimestampedModel):
    username = models.CharField(max_length=150)
    role = models.ForeignKey(StaffRole, on_delete=models.PROTECT, related_name="invitations")
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="staff_invitations_sent",
    )
    token_hash = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f"Invite {self.username} ({self.role})"


class MFARecoveryCode(TimestampedModel):
    staff_member = models.ForeignKey(
        StaffMember, on_delete=models.CASCADE, related_name="recovery_codes"
    )
    code_hash = models.CharField(max_length=64)
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["staff_member", "code_hash"], name="uniq_staff_recovery_code"
            )
        ]


class ApprovalRequest(TimestampedModel):
    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]

    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="approval_requests_made",
    )
    action = models.CharField(max_length=80)
    target_model = models.CharField(max_length=120)
    target_id = models.BigIntegerField()
    payload = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    decided_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approval_requests_decided",
    )
    decided_at = models.DateTimeField(null=True, blank=True)
    reason = models.CharField(max_length=200, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["action", "target_model", "target_id"],
                condition=models.Q(status="pending"),
                name="uniq_pending_approval_target",
            )
        ]

    def __str__(self) -> str:
        return f"{self.action} #{self.id} ({self.status})"


class Subject(TimestampedModel):
    name = models.CharField(max_length=120, unique=True)
    code = models.SlugField(max_length=30, unique=True)
    description = models.TextField(blank=True)

    def __str__(self) -> str:
        return self.name


class Level(TimestampedModel):
    stage = models.CharField(max_length=80, unique=True)
    description = models.TextField(blank=True)

    def __str__(self) -> str:
        return self.stage


class Course(TimestampedModel):
    subject = models.ForeignKey(Subject, on_delete=models.PROTECT, related_name="courses")
    level = models.ForeignKey(Level, on_delete=models.PROTECT, related_name="courses")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["subject", "level", "title"], name="uniq_course_subject_level_title"
            )
        ]

    def __str__(self) -> str:
        return f"{self.subject.name} - {self.level.stage} - {self.title}"


class SchemeOfWork(TimestampedModel):
    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name="schemes")
    term = models.CharField(max_length=40)
    title = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["course", "term", "title"], name="uniq_scheme_term_title"
            )
        ]

    def __str__(self) -> str:
        return f"{self.course.title} ({self.term})"


class Topic(TimestampedModel):
    scheme = models.ForeignKey(SchemeOfWork, on_delete=models.PROTECT, related_name="topics")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=1)
    week = models.PositiveSmallIntegerField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["scheme", "title"], name="uniq_topic_title_per_scheme")
        ]
        ordering = ["order", "title"]

    def __str__(self) -> str:
        return f"{self.scheme.title} - {self.title}"


class Lesson(TimestampedModel):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name="lessons")
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True)
    estimated_minutes = models.PositiveIntegerField(default=10)
    status = models.CharField(
        max_length=20,
        choices=[("draft", "Draft"), ("published", "Published")],
        default="draft",
    )

    class Meta:
        ordering = ["title"]

    def __str__(self) -> str:
        return self.title


class LessonVersion(TimestampedModel):
    STATUS_DRAFT = "draft"
    STATUS_REVIEW = "review"
    STATUS_APPROVED = "approved"
    STATUS_PUBLISHED = "published"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_REVIEW, "In review"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_PUBLISHED, "Published"),
        (STATUS_REJECTED, "Rejected"),
    ]

    lesson = models.ForeignKey(Lesson, on_delete=models.PROTECT, related_name="versions")
    version = models.PositiveIntegerField()
    title = models.CharField(max_length=200)
    content = models.TextField()
    estimated_minutes = models.PositiveSmallIntegerField(default=10)
    safety_notes = models.TextField(blank=True)
    transcript = models.TextField(blank=True)
    captions = models.TextField(blank=True)
    changelog = models.CharField(max_length=500, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    content_hash = models.CharField(max_length=64, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_lesson_versions",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["lesson", "version"], name="uniq_lesson_version")
        ]
        ordering = ["-version"]

    def compute_content_hash(self) -> str:
        """Deterministic content hash for immutable versioned URLs.

        Hashes the canonical published fields so the asset and captions
        redirect URLs are stable for the lifetime of a published version.
        """
        import hashlib

        canonical = "\n".join(
            [
                self.title or "",
                self.content or "",
                str(self.estimated_minutes),
                self.safety_notes or "",
                self.transcript or "",
                self.captions or "",
                self.changelog or "",
            ]
        )
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    def save(self, *args, **kwargs):
        if (
            self.pk
            and LessonVersion.objects.filter(pk=self.pk, status=self.STATUS_PUBLISHED).exists()
        ):
            from django.core.exceptions import ValidationError

            raise ValidationError("Published lesson versions are immutable.")
        if not self.content_hash:
            self.content_hash = self.compute_content_hash()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.status == self.STATUS_PUBLISHED:
            from django.core.exceptions import ValidationError

            raise ValidationError("Published lesson versions cannot be deleted.")
        super().delete(*args, **kwargs)


class LessonAsset(TimestampedModel):
    KIND_CHOICES = [
        ("image", "Image"),
        ("audio", "Audio"),
        ("video", "Video"),
        ("document", "Document"),
    ]
    version = models.ForeignKey(LessonVersion, on_delete=models.PROTECT, related_name="assets")
    kind = models.CharField(max_length=20, choices=KIND_CHOICES)
    file_url = models.URLField(max_length=1000)
    mime_type = models.CharField(max_length=120)
    size_bytes = models.PositiveBigIntegerField()
    sha256 = models.CharField(max_length=64)
    attribution = models.CharField(max_length=300)
    license_name = models.CharField(max_length=120)
    license_url = models.URLField(max_length=1000, blank=True)

    def save(self, *args, **kwargs):
        if self.version_id and self.version.status == LessonVersion.STATUS_PUBLISHED:
            from django.core.exceptions import ValidationError

            raise ValidationError("Assets for published lesson versions are immutable.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.version.status == LessonVersion.STATUS_PUBLISHED:
            from django.core.exceptions import ValidationError

            raise ValidationError("Assets for published lesson versions are immutable.")
        super().delete(*args, **kwargs)


class Experiment(TimestampedModel):
    STATUS_DRAFT = "draft"
    STATUS_REVIEW = "in_review"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_REVIEW, "In review"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]

    subject = models.ForeignKey(Subject, on_delete=models.PROTECT, related_name="experiments")
    topic = models.ForeignKey(
        Topic, on_delete=models.PROTECT, related_name="experiments", null=True, blank=True
    )
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=120, unique=True)
    summary = models.TextField(blank=True)
    difficulty = models.CharField(max_length=30, default="beginner")
    engine_name = models.CharField(max_length=80, default="pixi")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_experiments",
    )

    class Meta:
        ordering = ["title"]

    def __str__(self) -> str:
        return self.title


class ContentVersion(TimestampedModel):
    STATUS_DRAFT = "draft"
    STATUS_REVIEW = "review"
    STATUS_PUBLISHED = "published"
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_REVIEW, "Review"),
        (STATUS_PUBLISHED, "Published"),
    ]

    experiment = models.ForeignKey(
        Experiment, on_delete=models.CASCADE, related_name="content_versions"
    )
    version = models.CharField(max_length=20, default="1.0.0")
    changelog = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    schema_version = models.CharField(max_length=20, default="1")
    definition = models.JSONField(default=dict, blank=True)
    definition_hash = models.CharField(max_length=64, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_versions",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["experiment", "version"], name="uniq_experiment_version"
            )
        ]

    def save(self, *args, **kwargs):
        if (
            self.pk
            and ContentVersion.objects.filter(pk=self.pk, status=self.STATUS_PUBLISHED).exists()
        ):
            from django.core.exceptions import ValidationError

            raise ValidationError("Published experiment definitions are immutable.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.status == self.STATUS_PUBLISHED:
            from django.core.exceptions import ValidationError

            raise ValidationError("Published experiment definitions cannot be deleted.")
        super().delete(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.experiment.title} v{self.version}"


class ExperimentSession(TimestampedModel):
    STATUS_ACTIVE = "active"
    STATUS_COMPLETED = "completed"
    STATUS_CHOICES = [(STATUS_ACTIVE, "Active"), (STATUS_COMPLETED, "Completed")]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="experiment_sessions"
    )
    experiment = models.ForeignKey(Experiment, on_delete=models.PROTECT, related_name="sessions")
    content_version = models.ForeignKey(
        ContentVersion, on_delete=models.PROTECT, related_name="sessions"
    )
    runtime_version = models.CharField(max_length=20)
    mode = models.CharField(
        max_length=12,
        choices=[("guided", "Guided"), ("free", "Free")],
        default="guided",
    )
    checkpoint = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    score = models.PositiveIntegerField(default=0)
    finished_at = models.DateTimeField(null=True, blank=True)


class ExperimentSessionEvent(TimestampedModel):
    session = models.ForeignKey(ExperimentSession, on_delete=models.CASCADE, related_name="events")
    sequence = models.PositiveIntegerField()
    event_type = models.CharField(max_length=20)
    payload = models.JSONField()

    class Meta:
        ordering = ["sequence"]
        constraints = [
            models.UniqueConstraint(
                fields=["session", "sequence"], name="uniq_experiment_session_event_sequence"
            )
        ]


class ExperimentAsset(TimestampedModel):
    experiment = models.ForeignKey(Experiment, on_delete=models.CASCADE, related_name="assets")
    kind = models.CharField(max_length=40, default="image")
    file_url = models.URLField(max_length=500)
    mime_type = models.CharField(max_length=120, blank=True)
    size_bytes = models.PositiveBigIntegerField(default=0)
    checksum = models.CharField(max_length=128, blank=True)

    def __str__(self) -> str:
        return f"{self.experiment.title} - {self.kind}"


class Lab(TimestampedModel):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="labs"
    )
    title = models.CharField(max_length=200, default="My Lab")
    notes = models.TextField(blank=True)
    is_default = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["owner", "title"], name="uniq_lab_owner_title")
        ]

    def __str__(self) -> str:
        return f"{self.owner.username} - {self.title}"


class ClassModel(TimestampedModel):
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="classes"
    )
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    is_archived = models.BooleanField(default=False)

    def clean(self):
        super().clean()
        teacher_profile = getattr(self.teacher, "teacher_profile", None)
        is_verified = (
            teacher_profile
            and teacher_profile.verification_status == TeacherProfile.STATUS_VERIFIED
        ) or getattr(getattr(self.teacher, "profile", None), "is_verified_teacher", False)
        if not is_verified:
            from django.core.exceptions import ValidationError

            raise ValidationError("Only verified teachers can create or own classes.")

    def __str__(self) -> str:
        return self.name


class ClassMember(TimestampedModel):
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["school_class", "student"], name="uniq_class_student")
        ]

    school_class = models.ForeignKey(ClassModel, on_delete=models.CASCADE, related_name="members")
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="class_memberships"
    )
    status = models.CharField(
        max_length=20,
        choices=[("pending", "Pending"), ("active", "Active"), ("left", "Left")],
        default="pending",
    )

    def __str__(self) -> str:
        return f"{self.student.username} in {self.school_class.name}"


class ClassInvite(TimestampedModel):
    school_class = models.ForeignKey(ClassModel, on_delete=models.CASCADE, related_name="invites")
    code = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.code


class Connection(TimestampedModel):
    KIND_FRIEND = "friend"
    KIND_FOLLOW = "follow"
    KIND_TEACHER_STUDENT = "teacher_student"
    STATUS_PENDING = "pending"
    STATUS_ACCEPTED = "accepted"
    STATUS_BLOCKED = "blocked"
    KIND_CHOICES = [
        (KIND_FRIEND, "Friend"),
        (KIND_FOLLOW, "Follow"),
        (KIND_TEACHER_STUDENT, "Teacher student"),
    ]
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_ACCEPTED, "Accepted"),
        (STATUS_BLOCKED, "Blocked"),
    ]

    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="outgoing_connections"
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="incoming_connections"
    )
    kind = models.CharField(max_length=30, choices=KIND_CHOICES, default=KIND_FRIEND)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["requester", "receiver", "kind"], name="uniq_connection_request"
            )
        ]

    def clean(self):
        super().clean()
        if self.requester_id and self.receiver_id and self.requester_id == self.receiver_id:
            from django.core.exceptions import ValidationError

            raise ValidationError("A user cannot connect with themselves.")

        if self.kind == self.KIND_TEACHER_STUDENT:
            from django.core.exceptions import ValidationError

            # The receiver is usually the teacher receiving the student connection
            teacher_candidate = self.receiver
            teacher_profile = getattr(teacher_candidate, "teacher_profile", None)
            is_verified = (
                teacher_profile
                and teacher_profile.verification_status == TeacherProfile.STATUS_VERIFIED
            ) or getattr(getattr(teacher_candidate, "profile", None), "is_verified_teacher", False)
            if not is_verified:
                raise ValidationError(
                    "Only verified teachers can receive teacher-student connections."
                )

    def __str__(self) -> str:
        return f"{self.requester.username} -> {self.receiver.username} ({self.kind})"


class Assignment(TimestampedModel):
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="created_assignments"
    )
    experiment = models.ForeignKey(Experiment, on_delete=models.PROTECT, related_name="assignments")
    title = models.CharField(max_length=200)
    instructions = models.TextField(blank=True)
    due_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[("draft", "Draft"), ("published", "Published"), ("closed", "Closed")],
        default="draft",
    )

    def __str__(self) -> str:
        return self.title


class Rubric(TimestampedModel):
    assignment = models.OneToOneField(Assignment, on_delete=models.CASCADE, related_name="rubric")
    total_points = models.PositiveIntegerField(default=100)
    description = models.TextField(blank=True)

    def __str__(self) -> str:
        return f"Rubric for {self.assignment.title}"


class Submission(TimestampedModel):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name="submissions")
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="submissions"
    )
    lab = models.ForeignKey(
        Lab, on_delete=models.SET_NULL, null=True, blank=True, related_name="submissions"
    )
    status = models.CharField(
        max_length=20,
        choices=[("draft", "Draft"), ("submitted", "Submitted"), ("graded", "Graded")],
        default="draft",
    )
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["assignment", "student"], name="uniq_assignment_student_submission"
            )
        ]

    def __str__(self) -> str:
        return f"{self.student.username} -> {self.assignment.title}"


class Attempt(TimestampedModel):
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name="attempts")
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ("in_progress", "In progress"),
            ("completed", "Completed"),
            ("abandoned", "Abandoned"),
        ],
        default="in_progress",
    )
    score = models.PositiveIntegerField(default=0)

    def __str__(self) -> str:
        return f"Attempt for {self.submission}"


class AttemptEvent(TimestampedModel):
    attempt = models.ForeignKey(Attempt, on_delete=models.CASCADE, related_name="events")
    sequence = models.PositiveIntegerField(default=1)
    event_type = models.CharField(max_length=40, default="action")
    payload = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["sequence"]
        constraints = [
            models.UniqueConstraint(
                fields=["attempt", "sequence"], name="uniq_attempt_event_sequence"
            )
        ]

    def __str__(self) -> str:
        return f"{self.attempt_id}:{self.sequence} {self.event_type}"


class Grade(TimestampedModel):
    submission = models.OneToOneField(Submission, on_delete=models.CASCADE, related_name="grade")
    points = models.PositiveIntegerField(default=0)
    grade = models.CharField(max_length=20, default="N/A")
    feedback = models.TextField(blank=True)
    awarded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="awarded_grades",
    )

    def __str__(self) -> str:
        return f"{self.submission} — {self.grade}"


class ModerationCase(TimestampedModel):
    STATUS_OPEN = "open"
    STATUS_RESOLVED = "resolved"
    STATUS_CHOICES = [
        (STATUS_OPEN, "Open"),
        (STATUS_RESOLVED, "Resolved"),
    ]

    subject_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="moderation_cases"
    )
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="submitted_reports",
    )
    reason = models.CharField(max_length=200)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_OPEN)

    def __str__(self) -> str:
        return f"{self.subject_user.username} - {self.reason}"


class BlockRecord(TimestampedModel):
    blocker = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="blocks_created"
    )
    blocked_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="blocks_received"
    )
    reason = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["blocker", "blocked_user"], name="uniq_block_user")
        ]

    def __str__(self) -> str:
        return f"{self.blocker.username} blocked {self.blocked_user.username}"


class Notification(TimestampedModel):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title


class AnalyticsEvent(TimestampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="events",
    )
    event_name = models.CharField(max_length=120)
    payload = models.JSONField(default=dict, blank=True)

    def __str__(self) -> str:
        return self.event_name


class Achievement(TimestampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="achievements"
    )
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)

    def __str__(self) -> str:
        return f"{self.user.username} - {self.name}"


class DeviceSyncQueue(TimestampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sync_queue"
    )
    item_type = models.CharField(max_length=80, default="attempt")
    payload = models.JSONField(default=dict, blank=True)
    is_synced = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"{self.user.username} - {self.item_type}"


class AuditLogQuerySet(models.QuerySet):
    def update(self, **kwargs):
        raise ValueError("Audit log entries cannot be changed.")

    def delete(self):
        raise ValueError("Audit log entries cannot be deleted.")


class AuditLog(TimestampedModel):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_entries",
    )
    action = models.CharField(max_length=120)
    target_model = models.CharField(max_length=120)
    target_id = models.BigIntegerField(null=True, blank=True)
    details = models.JSONField(default=dict, blank=True)

    objects = AuditLogQuerySet.as_manager()

    def save(self, *args, **kwargs):
        if self.pk is not None:
            raise ValueError("Audit log entries cannot be changed.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError("Audit log entries cannot be deleted.")

    def __str__(self) -> str:
        return f"{self.action} on {self.target_model}"


class FeatureFlag(TimestampedModel):
    name = models.CharField(max_length=120, unique=True)
    enabled = models.BooleanField(default=False)
    description = models.TextField(blank=True)

    def __str__(self) -> str:
        return self.name
