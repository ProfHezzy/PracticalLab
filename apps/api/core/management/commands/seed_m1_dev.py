from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import BaseCommand

from core.models import Course, Level, SchemeOfWork, Subject, Topic


class Command(BaseCommand):
    help = "Load the M1 starter curriculum and seed the default staff test identities."

    def handle(self, *args, **options):
        call_command("loaddata", "m1_seed")

        User = get_user_model()
        teacher, _ = User.objects.get_or_create(username="m1-teacher", defaults={"is_staff": True})
        teacher.set_password("Password123!")
        teacher.save(update_fields=["password", "is_staff", "is_active"])

        student, _ = User.objects.get_or_create(username="m1-student", defaults={"is_active": True})
        student.set_password("Password123!")
        student.save(update_fields=["password", "is_active"])

        subject = Subject.objects.filter(code="chem").first()
        level = Level.objects.filter(stage="SS2").first()
        course = Course.objects.filter(subject=subject, level=level).first()
        scheme = SchemeOfWork.objects.filter(course=course, term="First").first()
        if subject and level and course and scheme:
            Topic.objects.get_or_create(
                scheme=scheme,
                title="Filtration",
                defaults={"description": "Separate an insoluble solid from a liquid.", "order": 1},
            )
            Topic.objects.get_or_create(
                scheme=scheme,
                title="Evaporation",
                defaults={"description": "Recover a dissolved solute by evaporation.", "order": 2},
            )

        self.stdout.write(self.style.SUCCESS("M1 development seed complete."))
